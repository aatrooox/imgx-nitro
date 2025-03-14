export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const templateInfo = await prisma.template.delete({
    where: {
      id
    }
  })

  return { data: { name: templateInfo.name }, msg: 'ok'}
})