import { Resvg } from '@resvg/resvg-js'
import satori from 'satori';
import { renderErrorSvg } from '~/utils/satori';
export default defineEventHandler(async (event) => {
  const presetCode = getRouterParam(event, 'presetCode');
  
  const query = await useSafeValidatedQuery(event, z.object({}).catchall(z.string()));

  if (!query.success) {
      throw createError({
        statusCode: 400,
        statusMessage: (query as any).message ?? '参数错误'
      })
    }
  
  const preset = await prisma.preset.findUnique({
    where: {
      code: presetCode
    },
    include: {
      templateInfo: {
        select: {
          contentKeys: true,
          propsSchema: true,
          template: true
        }
      }
    }
  })

  if (!preset) {
    setHeader(event, 'Content-Type', 'image/svg+xml')
    setHeader(event, 'Cache-Control', 'public, max-age=3600, immutable')
    
    const svg = await renderErrorSvg('不存在的预设码', {width: 300, height: 100})

    return svg
  }
  
  const { width, height, contentProps, styleProps } = preset;

  const { template } = preset.templateInfo;

  const props = { 
    ...(contentProps as Record<string, any>),
    ...(styleProps as Record<string, any>)
  }
  
  const vNode = await vueTemplateToSatori(template, props)
  
  const svg = await renderSVGBySatori(vNode, width, height)


  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'original',
    },
  })

  const png = resvg.render()

  setHeader(event, 'Content-Type', 'image/png')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, immutable')
  // 生成强验证器
  const etag = `"${Buffer.from(JSON.stringify(getQuery(event))).toString('base64')}"` 
  setHeader(event, 'ETag', etag);
  setHeader(event, 'Last-Modified', new Date().toUTCString());

  // 检查客户端缓存
  const ifNoneMatch = getRequestHeader(event, 'if-none-match')
  if (ifNoneMatch === etag) {
    event.node.res.statusCode = 304
    return null
  }

  return png.asPng()

});