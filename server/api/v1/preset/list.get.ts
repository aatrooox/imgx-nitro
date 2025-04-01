export default defineEventHandler(async (event) => {
  
  const presetList = await prisma.preset.findMany()

  return {
    data: presetList,
    msg: 'ok'
  }
})