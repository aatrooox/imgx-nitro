export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const presetInfo = await prisma.preset.delete({
    where: {
      id
    }
  })

  return { data: { name: presetInfo.name }, msg: 'ok'}
})