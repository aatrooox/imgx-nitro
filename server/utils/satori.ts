// 取消注释以下导入
import { renderToString } from 'vue/server-renderer'
import type { AllowedComponentProps, VNodeProps } from 'vue'
import { createSSRApp, h } from 'vue'
import { html as _html } from 'satori-html'
import _satori from 'satori'

// ... 保留现有的接口定义 ...
// 完善 SatoriNode 接口定义
export interface SatoriNode {
  type: string;
  props: {
    tw?: string;
    style?: Record<string, any>;
    children?: string | SatoriNode | SatoriNode[];
    [key: string]: any;
  };
}

// 其他接口定义保持不变
export type ExtractComponentProps<TComponent> =
  TComponent extends new () => {
    $props: infer P
  }
    ? Omit<P, keyof VNodeProps | keyof AllowedComponentProps>
    : never

export interface VNode {
  type: string
  props: {
    style?: Record<string, any>
    children?: string | VNode | VNode[]
    [prop: string]: any
  }
}

/**
 * 获取完全渲染后的 html 字符串（同 md 文章复制到公众号原理）
 * @param template vue 中的 template 字符串
 * @param props  根据 vue 中的 props 规则生成的键值对
 * @returns 完全渲染后的 html 字符串
 */
export async function getPreviewHtml(template: string, props: Record<string, any>):Promise<string> {
  try {
     // 创建一个简单的组件，使用传入的模板和props
     const component = {
      template,
      props: Object.keys(props),
      setup() {
        return props;
      }
    };

    // 创建 Vue 应用 （Vue实例）
    const app = createSSRApp(component, props);
    // 渲染为 HTML 字符串
    const html = await renderToString(app);

    return html
  } catch (err) {
    return ''
  }
}
export async function vueTemplateToSatori(template: string, props: Record<string, any>): Promise<SatoriNode> {
  try {
    // 完全渲染后的 html 字符串
    const html = await getPreviewHtml(template, props)
    // 使用 satori-html 将 HTML 转换为 Satori 节点
    const satoriNode = _html(html);
    // console.log(`satoriNode`, satoriNode)
    // 处理 Tailwind 类名转换为样式
    const processTailwindClasses = (twClasses: string): { tw: string, styles: Record<string, string> } => {
      const styles: Record<string, string> = {};
      const remainingClasses: string[] = [];
      
      twClasses.split(' ').forEach(cls => {
        let matched = false;
        
        // 处理间距类名 (gap, space-x, space-y 等)
        for (const [prefix, config] of Object.entries(spacingClassMap)) {
          if (cls.startsWith(`${prefix}-`)) {
            const size = cls.substring(prefix.length + 1);
            if (gapSizeMap[size]) {
              styles[config.property] = gapSizeMap[size];
              matched = true;
              break;
            }
          }
        }
        
        if (!matched) {
          remainingClasses.push(cls);
        }
      });
      
      return { 
        tw: remainingClasses.join(' '), 
        styles 
      };
    };

    // 处理 Satori 节点
    const processNode = (node: any): SatoriNode => {
      if (typeof node === 'string') {
        return {
          type: 'span',
          props: { children: node }
        };
      }

      if (!node || typeof node !== 'object') {
        return {
          type: 'div',
          props: { children: '' }
        };
      }

      // 创建新的 props 对象
      const newProps: any = { ...node.props };
      
      // 收集所有类名
      let allClasses = '';
      
      // 处理 class 属性
      if (newProps.class) {
        allClasses += newProps.class + ' ';
        delete newProps.class;
      }
      
      // 处理 className 属性
      if (newProps.className) {
        allClasses += newProps.className + ' ';
        delete newProps.className;
      }
      
      // 确保非 span 元素有 flex 类名
      if (node.type !== 'span' && !allClasses.includes('flex')) {
        allClasses = `flex ${allClasses}`;
      }
      
      // 处理 Tailwind 类名
      if (allClasses.trim()) {
        const { tw, styles } = processTailwindClasses(allClasses.trim());
        
        // 设置 tw 属性
        if (tw) {
          newProps.tw = tw;
        }
        
        // 合并样式
        if (Object.keys(styles).length > 0) {
          newProps.style = { ...newProps.style || {}, ...styles };
        }
      }
      
      // 处理子节点
      if (newProps.children) {
        if (Array.isArray(newProps.children)) {
          newProps.children = newProps.children
            .map((child: any) => child ? processNode(child) : null)
            .filter(Boolean);
        } else if (typeof newProps.children === 'object') {
          newProps.children = processNode(newProps.children);
        }
      }

      return {
        type: node.type,
        props: newProps
      };
    };

    return processNode(satoriNode);
  } catch (error) {
    console.error('Error in vueTemplateToSatori:', error);
    return {
      type: 'div',
      props: {
        style: { color: 'red', padding: '20px' },
        children: `Error converting template: ${error.message}`
      }
    };
  }
}

// 返回一个错误的svg图，以便在img标签中正常展示
export async function renderErrorSvg(errMsg: string, options: { width: number, height: number }) {
  const width = options.width || 300
  const height = options.height || 100
  const vNode = {
    type: 'div',
    props: {
      style: { color: 'red', padding: '20px', textAlign: 'center', fontSize: '26px', fontFamily: 'YouSheBiaoTiHei' },
      children: `${errMsg}`
    }
  };
  const YouSheBiaoTiHei = await useStorage('assets:server').getItemRaw(`YouSheBiaoTiHei-2.ttf`)

  const svg = await _satori(
    vNode
    ,
    {
      width,
      height,
      fonts: [
        {
          name: 'YouSheBiaoTiHei',
          data: YouSheBiaoTiHei,
          weight: 400,
          style: 'normal',
        }
      ],
    }
  ) 
  return svg
}