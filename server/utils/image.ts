import { Resvg } from '@resvg/resvg-js'
import { renderErrorSvg, vueTemplateToSatori, renderSVGBySatori } from './satori'
import { log } from 'console'

interface GenerateImageOptions {
  preset: any
  customContentProps?: Record<string, any>
  customStyleProps?: Record<string, any>
  format?: 'svg' | 'png'
}

export async function generateImage({ 
  preset, 
  customContentProps = {}, 
  customStyleProps = {}, 
  format = 'png' 
}: GenerateImageOptions) {
  if (!preset) {
    return await renderErrorSvg('不存在的预设码', {width: 300, height: 100})
  }

  const { width, height, contentProps, styleProps } = preset
  const { template } = preset.templateInfo

  // 处理自定义内容props
  const contentFinalProps = {
    ...(contentProps as Record<string, any>),
    ...customContentProps
  }
  
  // 处理自定义样式
  const styleFinalProps = {
    ...(styleProps as Record<string, any>),
    ...customStyleProps
  }

  const vNode = await vueTemplateToSatori(template, {
    ...contentFinalProps,
    ...styleFinalProps
  })
  
  const svg = await renderSVGBySatori(vNode, width, height)

  if (format === 'svg') {
    return svg
  }

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'original',
    },
  })

  return resvg.render().asPng()
} 