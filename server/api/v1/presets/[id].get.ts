export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'id is required'
    })
  }
  const templateInfo = await prisma.preset.findFirst({
    where: {
      id
    }
  })

  return templateInfo
})