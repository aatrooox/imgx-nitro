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
  // console.log(`获取预览html`,)
  try {
    // 处理 props
    const processedProps = { ...props }
    const iconProps = {}
    // 循环所有key，找出 image 类型的value
    Object.keys(processedProps).forEach(key => {
      const value = processedProps[key]
      if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        iconProps[key] = value
      }
    })
    // 把 icon 解析出来 getBase64IconURL
    for (const key in iconProps) {
      const iconStr = iconProps[key]

      const iconInfo = iconStr.slice(1, -1).split(':')
      if (iconInfo.length < 2) {
        console.log(`icon ${iconStr} 不合规`)
        continue
      }
      const iconPrefix = iconInfo[0]
      const iconName = iconInfo[1]
      const iconSize = iconInfo[2] || 50
      const base64IconURL = await getBase64IconURL(`${iconPrefix}:${iconName}`, iconSize)
      
      if (!base64IconURL) {
        console.log(`icon ${iconStr} 解析失败`)
        processedProps[key] = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAmdJREFUeF7tmQtuwyAMhsPJtp5s28nWnYzVU4gcYoNNWHGKI01aVajNx+8HJCyTP2Hy9S8OwBUwOQEPgckF4EnQQ8BDYHICHgKTC8CrgIeAh8DkBDwESgKIMb6HEO4SkWjGpt+DOfC/1AaeJ5kj8YlVQIzxe1mWPwcfPn6FED4pEOsiPiRjYX6MEX7nDY3HP8vaQXPBVnpuHAip/ySA1UlsCAySxqix4UErh0WA4oRVgh2zSfcQwo2wBZBF/msAcMZyp0hY8UFKEkppTA5xBQiq3D0MbAoA6T8HAMs/GWwGwCiqxmNnTwlA7P+/A2hc/CHGXxHAFusFSJsKrgyAkuMh0WVZ+xB2VwZAJT8KAJRcNsm9GoBDSa0tsPY9zqg1NeGxz0iC0jJpXgEAjmqLU7eIwW47zNT/bgpQ+KTqA8jdqBVuqkXtBWBthVXNlKRr5ELAKgCqokj3Ra4A5uAhNbRrhTsr4MzG6ACchNA9ByT6JzpLPYDMKHyEY2z+PCUJEic+sAt/Up/aAZS0X5N47XsEuVgGNfF3ug9QGivWeQdA3wNQfQB1hofrMvW9pTUFiM7mTHIj47am0CsAgDVIjsPFO0IOhDUAZ2r39QGs/URLB9e0+IK9MWUQlTlVH9+S/JAt0SUMjFdnWKIhORjjnBd2cXDihN0XvZCh8gBzd0AqqgeAPMa1LzfSGmDBP9wLmFrmJzYGl1W2mpwGgDs57a61vhrTwKi9HusGQOOUpbEOwNJujPDFFTCCuiWbrgBLuzHCF1fACOqWbLoCLO3GCF9cASOoW7LpCrC0GyN8cQWMoG7J5vQK+AVP7kZf9uNYzQAAAABJRU5ErkJggg=='
        continue
      }

      processedProps[key] = base64IconURL
    }


    // 创建一个简单的组件，使用传入的模板和props
    const component = {
      template,
      props: Object.keys(props),
      setup() {
        
        const componentProps = { ...processedProps}
        return componentProps;
      }
    };

    // 创建 Vue 应用 （Vue实例）
    const app = createSSRApp(component, processedProps);
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

  const fonts = await $fetch<any[]>('/api/v1/fonts/list', { method: 'POST' })


  const svg = await _satori(
    vNode
    ,
    {
      width,
      height,
      fonts,
    }
  ) 
  return svg
}

export async function renderSVGBySatori(vNode: SatoriNode, width: number, height: number) {
  console.time('加载字体')
  const YouSheBiaoTiHei = await useStorage('assets:server').getItemRaw(`YouSheBiaoTiHei-2.ttf`)
  const DouyinSansBold = await useStorage('assets:server').getItemRaw(`DouyinSansBold.otf`)
  console.timeEnd('加载字体')
  
  const fonts: any[] = [
    {
      name: 'YouSheBiaoTiHei',
      data: YouSheBiaoTiHei,
      weight: 400,
      style: 'normal',
    },
    { 
      name: 'DouyinSansBold',
      data: DouyinSansBold,
      weight: 400,
      style: 'normal'
    }
  ]

  const svg = await _satori(
    vNode
    ,
    {
      width,
      height,
      fonts,
    }
  )

  return svg
}