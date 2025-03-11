export interface TextPart {
  text: string
  type: 'text' | 'emoji' | 'accent' // 正常文字 ｜ Emoji ｜ 强调文字
  base64URL?: string | null // 以base64编码的 dataURL 作为背景图加载。如 svg emoji icon、背景图等
}

export type LinePart = TextPart[]

export type ParsedContent = LinePart[]

export interface componentBaseProps {
  content: ParsedContent
  bgColor?: string | null
  bgImage?: string | null

  colors?: string[]
  accentColors?: string[]
  aligns?: string[]
  fontSizes?: string[]
  iconSizes?: number[]

  fontFamily?: string
  padding?: string
  textWrapBgColor?: string
  textWrapShadow?: string
  textWrapPadding?: string
  textWrapRounded?: string
}

interface IMGXPresetConfig {
  

}