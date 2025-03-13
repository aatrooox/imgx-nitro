export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const templateInfo = await prisma.template.findFirst({
    where: {
      id
    }
  })

  return templateInfo
})