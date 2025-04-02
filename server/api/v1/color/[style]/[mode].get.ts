export default defineEventHandler(async (event) => {
  const query = await useSafeValidatedQuery(event, z.object({
     count: z.string().optional().default('1')
  }))

  const style = getRouterParam(event, 'style');
  const mode = getRouterParam(event, 'mode')
  
  const styleMap = {
    '1': 'adjacent',
    '2': 'monochromatic',
    '3': 'complementary'
  }

  const modeMap = {
    '1': 'light',
    '2': 'dark',
    '3': 'pure'
  }

  if (!query.success) {
      throw createError({
        statusCode: 400,
        message: (query as any).message ?? '参数错误'
      })
  }
  
  if (!['adjacent', 'monochromatic', 'complementary'].includes(style as string) && !styleMap[style as string]) {
    throw createError({
      statusCode: 400,
      message: '不存在的style'
    })
  }

  if (!['light', 'dark', 'pure'].includes(mode as string) && !modeMap[mode as string]) {
    throw createError({
      statusCode: 400,
      message: '不存在的mode'
    })
  }
  
  const _style = styleMap[style as string] || style as 'adjacent' | 'monochromatic' | 'complementary'
  const _mode = modeMap[mode as string] || mode as 'light' | 'dark' | 'pure'
  
  return {
    colors: randomGradientColors(_style, Number(query.data.count), _mode)
  } 

});