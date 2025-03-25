import { Resvg } from '@resvg/resvg-js'
import type { Component } from 'vue';
import satori from 'satori';
export default defineEventHandler(async (event) => {
  const text = decodeURI(getRouterParam(event, 'text') || '')
  const presetCode = getRouterParam(event, 'presetCode');
  
  const query = await useSafeValidatedQuery(event, z.object({}).catchall(z.string()));

  if (!query.success) {
      throw createError({
        statusCode: 400,
        statusMessage: (query as any).message ?? '参数错误'
      })
    }
  
  const contents = text.split('/')

  const customStyleProps: Record<string, any> = query.data;
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
    throw createError({
      statusCode: 404,
      statusMessage: '预设不存在'
    })
  }
  
  const { width, height, contentProps, styleProps } = preset;

  const { contentKeys, propsSchema, template } = preset.templateInfo;

  // 处理自定义内容props
  let customContentProps =  {}
  const contentKeysArray = contentKeys.split(',')
  contents.forEach((value:string, index: number) => {
    customContentProps[contentKeysArray[index]] = value
  });
  
  // 处理自定义样式
  for (const key in customStyleProps) {
    const schemItem = (propsSchema as any[]).find((item: any) => item.key === key);

    if (customStyleProps[key]) {
      customStyleProps[key] = schemItem.type === 'size' ? parseInt(customStyleProps[key]) : customStyleProps[key]
    }
  }
  
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

  const YouSheBiaoTi = await useStorage('local').getItemRaw(`SourceHanSerifCN-Regular-1.otf`)

  // console.log(`vNode`, JSON.stringify(vNode, null, 2) )
  const svg = await satori(
    vNode
    ,
    {
      width,
      height,
      fonts: [
        {
          name: 'YouSheBiaoTiHei',
          data: YouSheBiaoTi,
          weight: 400,
          style: 'normal',
        }
      ],
    }
  )


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