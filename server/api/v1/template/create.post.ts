export default defineEventHandler(async (event) => {
  const body = await useSafeValidatedBody(event, z.object({
    name: z.string(),
    template: z.string(),
    props: z.string(),
    // 创建模板时编写的 props 会自动生成 schema，当在 preset 中选择了模板后，需要按 schema 的格式来填写数据
    propsSchame: templatePropsSchame
  }))

  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: JSON.stringify(body.error)
    })
  }
})