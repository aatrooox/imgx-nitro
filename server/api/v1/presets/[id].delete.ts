export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'id is required'
    })
  }
  const presetInfo = await prisma.preset.delete({
    where: {
      id
    }
  })

  return { data: { name: presetInfo.name }, msg: 'ok'}
})