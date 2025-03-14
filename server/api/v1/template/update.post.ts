export default defineEventHandler(async (event) => {
  const body = await useSafeValidatedBody(event, z.object({
    id: z.string(),
    name: z.string(),
    template: z.string(),
    props: z.record(z.string(), z.any()),
    userId: z.string(),
    propsSchema: templatePropsSchame
  }))

  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: JSON.stringify(body.error)
    })
  }

  const template = await prisma.template.update({
    where: {
      id: body.data.id
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