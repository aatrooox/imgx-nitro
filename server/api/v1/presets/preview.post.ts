import satori from "satori"
import loginPost from "../user/login.post"

export default defineEventHandler(async (event) => {
  const body = await useSafeValidatedBody(event, z.object({
    id: z.string().optional(),
    templateStr: z.string().optional(),
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

  let templateStr = ''
  if (body.data.id) {
     // 查询当前模板
    const template = await prisma.template.findFirst({ 
      where: { id: body.data.id },
    })

    templateStr = template?.template || ''

    body.data.width =  body.data.width || template?.width
    body.data.height = body.data.height || template?.height
  } else {
    templateStr = body.data.templateStr || ''
    if (!templateStr) {
      throw createError({
        statusCode: 400,
        message: '模板字符串不能为空'
      })
    }
  }
 

  const vNode = await vueTemplateToSatori(templateStr, body.data.props)

  // console.log(`vNode`, JSON.stringify(vNode, null, 2) )
  const svg = await renderSVGBySatori(vNode, body.data.width, body.data.height)

  return {
    data: svg
  }
})