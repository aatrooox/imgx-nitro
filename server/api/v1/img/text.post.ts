import { Resvg } from '@resvg/resvg-js'
import satori from 'satori';
import { renderErrorSvg } from '~/utils/satori';
export default defineEventHandler(async (event) => {
  
  const body = await useSafeValidatedBody(event, z.object({
    code: z.string(),
    contentProps: z.record(z.string(), z.any()),
    styleProps: z.record(z.string(), z.any()),
  }));

  if (!body.success) {
      throw createError({
        statusCode: 400,
        statusMessage: (body as any).message ?? '参数错误'
      })
    }
  

  const preset = await prisma.preset.findUnique({
    where: {
      code: body.data.code
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

  // 处理自定义内容props
  let customContentProps =  {}

  // 必须是 contentProps 里存在的key 才合并进去
  Object.keys(body.data.contentProps).forEach((key:string, index: number) => {
    if (contentProps[key]) {
        customContentProps[key] = body.data.contentProps[key]
    }
  });
  
  // 必须是 styleProps 里存在的key 才合并进去
  let customStyleProps = {}
  Object.keys(body.data.styleProps).forEach((key:string, index: number) => {
    if (styleProps[key]) {
      customStyleProps[key] = body.data.styleProps[key]
    }
  });
  
  const contentFinalProps = {
    ...(contentProps as Record<string, any>),
    ...customContentProps
  }
  
  const styleFinalProps = {
    ...(styleProps as Record<string, any>),
    ...customStyleProps
  }
  console.log(`contentFinalProps`, contentFinalProps)
  const vNode = await vueTemplateToSatori(template, {
    ...contentFinalProps,
    ...styleFinalProps
  })
  
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