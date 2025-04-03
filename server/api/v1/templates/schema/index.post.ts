export default defineEventHandler(async (event) => {
  const body = await useSafeValidatedBody(event, z.object({
    props: z.union([z.record(z.string(), z.any()), z.string()]),
  }))

  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: JSON.stringify(body.error)
    })
  }

  let props = body.data.props
  console.log(`typeof props`, typeof props)
  if (typeof props === 'string') {
    try {
      props = JSON.parse(props)
    } catch( err) {
      throw createError({
        status: 500,
        message: 'Props参数解析错误：' + JSON.stringify(err),
      })
    }
  }

  const schema = convertPropsToSchame(props as Record<string, any>)

  return {
    data: schema,
    msg: 'ok'
  }
})