// 请求参数 做一些基础的类型转换 - 生成图片
export const imgGenerateSchame = z.object({
  // 整体配置
  bgColor: z.string().optional(),
  ratio: z.string().optional().transform((str) => isNaN(Number(str)) ? 1 : Number(str)),
  padding: z.string().optional().default('30px'),
  fontFamily: z.string().optional().default('YouSheBiaoTiHei'),
  closeColorRandom: z.string().optional().transform( (str) => str === '0'),

  // 内容区域
  textWrapBgColor: z.string().optional(),
  textWrapShadow: z.string().optional(),
  textWrapPadding: z.string().optional(),
  textWrapRounded: z.string().optional(),

  // 可应用于每一行的配置 通常为多个 用逗号分割
  color: z.string().optional(),
  accentColor: z.string().optional(),
  iconSize: z.string().optional(),
  fontSize: z.string().optional(),
  align: z.string().optional(),
})

// props schame
// style: 'adjacent' | 'monochromatic' | 'complementary' = 'adjacent',
// count: number = 1,
// mode: 'light' | 'dark' | 'pure' = 'light'
export const templatePropsSchame = z.array(z.object({
  // 对应不同的属性配置，如颜色间距等
  type: z.enum(['color', 'content', 'size']), // 类型 样式、内容
  key: z.string(), // props 中的 key值
  name: z.string().default('名称'), // 表单项名称
  default: z.any().optional(), // 默认值
  options: z.array(z.any()).optional(), // 多选
  required: z.boolean().optional().default(false), // 是否必填
  description: z.string().optional(), // 备注信息
  min: z.number().optional(), // 最小值
  max: z.number().optional(), // 最大值
  randomColor: z.boolean().optional().default(false),
  color: z.enum(['adjacent', 'monochromatic', 'complementary']).optional(), // 随机颜色选项
  colorMode: z.enum(['light', 'dark', 'pure']).optional(), // 随机颜色风格 亮色系、暗色系、黑白灰
})).optional().default([{
  type: 'content',
  key: 'key',
  name: '名称',
  default: '',
  required: false,
  description: '',
  min: 0,
  max: 0,
}])