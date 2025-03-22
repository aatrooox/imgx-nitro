export default defineEventHandler(async (event) => {
  const query = await useSafeValidatedQuery(event, z.object({
     count: z.string().optional().default('1')
  }))

  const style = getRouterParam(event, 'style');
  const mode = getRouterParam(event, 'mode')
  
  if (!query.success) {
      throw createError({
        statusCode: 400,
        message: (query as any).message ?? '参数错误'
      })
  }
  
  if (!['adjacent', 'monochromatic', 'complementary'].includes(style as string)) {
    throw createError({
      statusCode: 400,
      message: '不存在的style'
    })
  }

  if (!['light', 'dark', 'pure'].includes(mode as string)) {
    throw createError({
      statusCode: 400,
      message: '不存在的mode'
    })
  }
  
  return {
    colors: randomGradientColors(style as 'adjacent' | 'monochromatic' | 'complementary', Number(query.data.count), mode as 'light' | 'dark' | 'pure')
  }

});