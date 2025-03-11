// 处理内容
import { getBase64IconURL } from "./icons";
import type { SafeComponentProps } from "./params";
import type { componentBaseProps, LinePart, TextPart } from "~/types/preset";
// 单个文字块类型
/**
 * 处理内容（根据特定格式, 格式不同需要先转换）
 * @param content 内容
 * @param splitSymbol 分隔符
 * @returns 带有处理好的字号、对齐方式、背景图等信息的内容数组
 */
export async function getParsedContent(content: string, safeProps: SafeComponentProps, splitSymbol: string = '+'): Promise<componentBaseProps> {
  if (!content) return { content: [] };
  const contents = content.split(splitSymbol);
  if (contents.length) {
    const colors = adjustedAttrs(contents, safeProps.color as string[]).map( color => `#${color}`)
    const accentColors = adjustedAttrs(contents, safeProps.accentColor as string[]).map( color => `#${color}`)
    const fontSizes = adjustedAttrs(contents, safeProps.fontSize as number[]).map( size => `${size}px`)
    const iconSizes = adjustedAttrs(contents, safeProps.iconSize as number[])
    const aligns = adjustedAttrs(contents, safeProps.align as string[])
    const parsedContentPromises = contents.map( async (text, index) => {
      const content = await getParsedText(text)
      return content
    })
    const parsedContent = await Promise.all(parsedContentPromises)
    return {
      content: parsedContent,
      ...safeProps,
      colors,
      accentColors,
      fontSizes,
      iconSizes,
      aligns
    }
  }

  return { content: [] }
}


/**
 * 解析单行文本，提取出强调、emoji、普通文本
 * @param content 单行文本
 * @returns 文本块数组
 */
export async function getParsedText(content: string): Promise<LinePart> {
  const parts: LinePart = []
  let lastIndex = 0
  const regex = /\[(.*?)\]|\*(.*?)\*/g

  let match
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        text: content.slice(lastIndex, match.index),
        type: 'text'
      })
    }

    if (match[1] !== undefined) {
      // [] 标记的内容 表情
      const base64URL = await getBase64IconURL(match[1], 30)
      parts.push({
        text: match[1],
        type: base64URL && 'emoji' || 'text',
        base64URL
      })
    } else if (match[2] !== undefined) {
      // ** 标记的内容 强调
      parts.push({
        text: match[2],
        type: 'accent',
      })
    }

    lastIndex = regex.lastIndex
  }

  // 添加剩余的文本
  if (lastIndex < content.length) {
    parts.push({
      text: content.slice(lastIndex),
      type: 'text'
    })
  }

  return parts
}

// 根据内容数组的长度，补全或删除属性数组
export function adjustedAttrs(contents: string[], attrs: string[] | number[]) {
  return attrs.length < contents.length
  ? [...attrs, ...Array(contents.length - attrs.length).fill(attrs[attrs.length - 1])]
  : attrs.slice(0, contents.length);
}