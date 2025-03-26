import satori from "satori"

export default defineEventHandler(async (event) => {
  const body = await useSafeValidatedBody(event, z.object({
    id: z.string(),
    props: z.record(z.string(), z.any()),
    width: z.number(),
    height: z.number(),
  }))
 
  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: JSON.stringify(body.error)
    })
  }

  const YouSheBiaoTi = await useStorage('assets:server').getItemRaw(`SourceHanSerifCN-Regular-1.otf`)

  // 查询当前预设的模板
  const template = await prisma.template.findFirst({ 
    where: { id: body.data.id },
   
  })

  const templateStr = template?.template || ''

  const vNode = await vueTemplateToSatori(templateStr, body.data.props)

  // console.log(`vNode`, JSON.stringify(vNode, null, 2) )
  const svg = await satori(
    vNode
    ,
    {
      width: body.data.width || template.width,
      height: body.data.height || template.height,
      fonts: [
        {
          name: 'YouSheBiaoTi',
          data: YouSheBiaoTi,
          weight: 400,
          style: 'normal',
        }
      ],
    }
  )

  // console.log(`svg`, svg)
  // setHeader(event, 'Content-Type', 'image/svg+xml')
  // setHeader(event, 'Cache-Control', 'public, max-age=3600, immutable')

  return {
    data: svg
  }
})