export default defineEventHandler(async (event) => {
  
  const templateList = await prisma.template.findMany()

  return {
    data: templateList,
    msg: 'ok'
  }
})