export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const templateInfo = await prisma.preset.findFirst({
    where: {
      id
    }
  })

  return templateInfo
})