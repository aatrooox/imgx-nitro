import { generateImage } from '~/utils/image'

export default defineEventHandler(async (event) => {
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

  const image = await generateImage({
    preset,
    format
  })

  setHeader(event, 'Content-Type', format === 'svg' ? 'image/svg+xml' : 'image/png')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, immutable')
  
  // 生成强验证器
  const etag = `"${Buffer.from(JSON.stringify(getQuery(event))).toString('base64')}"` 
  setHeader(event, 'ETag', etag)
  setHeader(event, 'Last-Modified', new Date().toUTCString())
  if (download) {
    setHeader(event, 'Content-Disposition', `attachment; filename="imgx-${presetCode}-${new Date().getTime()}.${format}"`)
  }
  // 检查客户端缓存
  const ifNoneMatch = getRequestHeader(event, 'if-none-match')
  if (ifNoneMatch === etag) {
    event.node.res.statusCode = 304
    return null
  }

  return image
})