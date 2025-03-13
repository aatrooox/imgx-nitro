export default defineEventHandler(async (event) => {
  const body = await useSafeValidatedBody(event, z.object({
    name: z.string(),
    template: z.string(),
    props: z.record(z.string(), z.any()),
    userId: z.string(),
    // 创建模板时编写的 props 会自动生成 schema，当在 preset 中选择了模板后，需要按 schema 的格式来填写数据
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
      propsSchema: body.data.propsSchema
    }
  })
})