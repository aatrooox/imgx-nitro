export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const body = await useSafeValidatedBody(event, z.object({
    name: z.string(),
    template: z.string(),
    props: z.record(z.string(), z.any()),
    userId: z.string(),
    propsSchema: templatePropsSchame
  }))

  if (!body.success || !id) {
    throw createError({
      statusCode: 400,
      message: body.error ? JSON.stringify(body.error) : 'id is required'
    })
  }

  const template = await prisma.template.update({
    where: {
      id
    },
    data: {
      name: body.data.name,
      template: body.data.template,
      props: body.data.props,
      userId: body.data.userId,
      propsSchema: body.data.propsSchema
    }
  })

  return {
    data: template,
    msg: 'ok'
  }
})