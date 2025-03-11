import { Resvg } from '@resvg/resvg-js'
import satori from 'satori';
// import BiaoTiHei from '/YouSheBiaoTiHei-2.ttf';
// import DouyinBold from '/DouyinSansBold.otf';


export default defineEventHandler(async (event) => {
  const text = decodeURI(getRouterParam(event, 'text') || '')
  const size = getRouterParam(event, 'size') as SizeCode;
  const template = getRouterParam(event, 'template')

  const query = await useSafeValidatedQuery(event, imgGenerateSchame)
  if (!!!text) {
    throw createError({
      statusCode: 400,
      message: '文本为空',
    })
  }

  if(text.length > 200) {
    throw createError({
      statusCode: 400,
      message: '文本过长',
    })
  }

  const parsedText = text.replace(/\//g, '')

  if (!sizes[size]) {
    throw createError({
      statusCode: 400,
      message: '不存在的尺寸',
    })
  }


  
  if (!query.success) {
      throw createError({
        statusCode: 400,
        message: (query as any).message ?? '参数错误'
      })
    }
  
  const params = query.data;
  const safeProps = getSafeComponentProps(params)
  const props = getParsedContent(parsedText, safeProps)
  // const component = await getComponent(template)
  // const svg = await satori(component, {
  //   props,
  //   width: sizes[size].width * (safeProps.ratio as number),
  //   height: sizes[size].height * (safeProps.ratio as number),
  //   fonts: [
  //     {
  //       name: 'YouSheBiaoTiHei',
  //       data: BiaoTiHei,
  //       weight: 400,
  //       style: 'normal',
  //     },
  //     {
  //       name: 'DouyinSansBold',
  //       data: DouyinBold,
  //       weight: 400,
  //       style: 'normal',
  //     }
  //   ]
  // })
  
  // const resvg = new Resvg(svg, {
  //   fitTo: {
  //     mode: 'original',
  //   },
  // })

  // const png = resvg.render()

  // setHeader(event, 'Content-Type', 'image/png')
  // setHeader(event, 'Cache-Control', 'public, max-age=3600, immutable')
  // // 生成强验证器
  // const etag = `"${Buffer.from(JSON.stringify(getQuery(event))).toString('base64')}"` 
  // setHeader(event, 'ETag', etag);
  // setHeader(event, 'Last-Modified', new Date().toUTCString());

  // // 检查客户端缓存
  // const ifNoneMatch = getRequestHeader(event, 'if-none-match')
  // if (ifNoneMatch === etag) {
  //   event.node.res.statusCode = 304
  //   return null
  // }

  // return png.asPng()
  return 'ok'

});