// import { defineAsyncComponent, type Component } from 'vue';
import { getBase64IconURL } from './icons';
import { defineComponent, type Component, type VNode } from 'vue'

// export const templates = {
//   '001': defineAsyncComponent(() => import('~/components/template/Base.vue')),
//   // '002': defineAsyncComponent(() => import('~/components/ImgTemplate2.vue')),
//   // '003': defineAsyncComponent(() => import('~/components/ImgTemplate3.vue'))
// }

// export const serverTemplates = {
//   '001': () => import('~/components/template/Base.vue'),
//   // '002': () => import('~/components/ImgTemplate2.vue'),
//   // '003': () => import('~/components/ImgTemplate3.vue')
// }

// export type TemplateCode = keyof typeof templates;

export function getParsedBgColor(color: string) {
  const colors = color.split('-');
  function getSingleColor(color: string) {
    return color.includes('#') ? color : `#${color}`
  }
  if (colors.length === 1) {
    return {
      bgColor: colors[0].includes(',') ? colors[0] : getSingleColor(colors[0])
    }
  }

  if (colors.length >= 2) {
    return {
      bgImage: `linear-gradient(to right, ${getSingleColor(colors[0])}, ${getSingleColor(colors[1])})`
    }
  }

  return {
    bgColor: `rgba(243,244,212)`
  }
}

async function renderTemplateToVNode(templateConfig: any, props: unknown): Promise<Component> {
  // 替换模板中的动态属性
  const processedTemplate = templateConfig.template.replace(
    /:style="([^"]+)"/g,
    (_, styleExpr) => {
      try {
        const style = new Function('props', `return ${styleExpr}`)(props)
        return `style="${Object.entries(style).map(([k, v]) => `${k}:${v}`).join(';')}"`
      } catch {
        return ''
      }
    }
  )

  // 直接返回 VNode 结构
  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(props as Record<string, any>).style
      },
      children: processedTemplate
    }
  }
}

export async function getComponent(id: string): Promise<Component> {
  const stored = await prisma.template.findFirst({
    where: { id }
  })
  if (!stored) {
    throw new Error('Template not found')
  }
  
  return renderTemplateToVNode(stored, stored.props)
}