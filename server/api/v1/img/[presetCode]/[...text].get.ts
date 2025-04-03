import { generateImage } from '~/utils/image'

export default defineEventHandler(async (event) => {
  const text = decodeURI(getRouterParam(event, 'text') || '')
  const presetCode = getRouterParam(event, 'presetCode')
  
  const query = await useSafeValidatedQuery(event, z.object({}).catchall(z.string()))
  const format = query.data.format as 'svg' | 'png' || 'png'
  const download = query.data.download === '1'
  
  if (!query.success) {
    throw createError({
      statusCode: 400,
      statusMessage: (query as any).message ?? '参数错误'
    })
  }
  
  const contents = text.split('/')
  const customStyleProps: Record<string, any> = query.data

  const preset = await prisma.preset.findUnique({
    where: {
      code: presetCode
    },
    include: {
      templateInfo: {
        select: {
          contentKeys: true,
          propsSchema: true,
          template: true
        }
      }
    }
  })

  if (!preset) {
    setHeader(event, 'Content-Type', 'image/svg+xml')
    setHeader(event, 'Cache-Control', 'public, max-age=3600, immutable')
    
    const svg = await renderErrorSvg('不存在的预设码', {width: 300, height: 100})

    return svg
  }
  
  const { width, height, contentProps, styleProps } = preset;

  const { contentKeys, propsSchema, template } = preset.templateInfo;

  // 处理自定义内容props
  let customContentProps = {}
  const contentKeysArray = contentKeys.split(',')
  contents.forEach((value: string, index: number) => {
    customContentProps[contentKeysArray[index]] = value
  })
  
  // 处理自定义样式
  for (const key in customStyleProps) {
    const schemItem = (propsSchema as any[]).find((item: any) => item.key === key)
    if (customStyleProps[key]) {
      customStyleProps[key] = schemItem?.type === 'size' ? parseInt(customStyleProps[key]) : customStyleProps[key]
    }
  }

  const image = await generateImage({
    preset,
    customContentProps,
    customStyleProps,
    format
  })

  setHeader(event, 'Content-Type', format === 'svg' ? 'image/svg+xml' : 'image/png')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, immutable')
  if (download) {
    setHeader(event, 'Content-Disposition', `attachment; filename="imgx-${presetCode}-${new Date().getTime()}.${format}"`)
  }
  // 生成强验证器
  const etag = `"${Buffer.from(JSON.stringify(getQuery(event))).toString('base64')}"` 
  setHeader(event, 'ETag', etag)
  setHeader(event, 'Last-Modified', new Date().toUTCString())

  // 检查客户端缓存
  const ifNoneMatch = getRequestHeader(event, 'if-none-match')
  if (ifNoneMatch === etag) {
    event.node.res.statusCode = 304
    return null
  }

  return image
})