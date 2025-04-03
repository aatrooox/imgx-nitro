import { generateImage } from '~/utils/image'

export default defineEventHandler(async (event) => {
  const body = await useSafeValidatedBody(event, z.object({
    code: z.string(),
    contentProps: z.record(z.string(), z.any()),
    styleProps: z.record(z.string(), z.any()),
    format: z.enum(['svg', 'png']).optional().default('png'),
  }));

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: (body as any).message ?? '参数错误'
    })
  }

  const preset = await prisma.preset.findUnique({
    where: {
      code: body.data.code
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
    customContentProps: body.data.contentProps,
    customStyleProps: body.data.styleProps,
    format: body.data.format
  })

  setHeader(event, 'Content-Type', body.data.format === 'svg' ? 'image/svg+xml' : 'image/png')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, immutable')
  
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