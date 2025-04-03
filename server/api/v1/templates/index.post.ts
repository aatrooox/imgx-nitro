export default defineEventHandler(async (event) => {
  const body = await useSafeValidatedBody(event, z.object({
    name: z.string(),
    template: z.string(),
    width: z.number(),
    height: z.number(),
    props: z.record(z.string(), z.any()),
    contentKeys: z.array(z.string()),
    userId: z.string(),
    // 创建模板时编写的 props 会自动生成 schema，生成schema需要自己填写一组默认内容, 用于展示自己的模板以及确认schema解析勘误
    // 当在 preset 中选择了模板后，需要按 schema 的格式来填写数据
    propsSchema: templatePropsSchame
  }))

  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: JSON.stringify(body.error)
    })
  }

  const template = await prisma.template.create({
    data: {
      name: body.data.name,
      template: body.data.template,
      props: body.data.props,
      userId: body.data.userId,
      width: body.data.width,
      height: body.data.height,
      propsSchema: body.data.propsSchema,
      contentKeys: body.data.contentKeys.join(',')
    }
  })

  return {
    data: template,
    msg: 'ok'
  }
})