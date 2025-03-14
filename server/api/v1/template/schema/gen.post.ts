export default defineEventHandler(async (event) => {
  const body = await useSafeValidatedBody(event, z.object({
    props: z.record(z.string(), z.any()),
  }))

  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: JSON.stringify(body.error)
    })
  }

  const schema = convertPropsToSchame(body.data.props)

  return schema
})