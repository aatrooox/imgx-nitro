import { User } from "@prisma/client";

export default defineEventHandler(async (event) => {
  const body = await useSafeValidatedBody(event, z.object({
    name: z.string(),
    templateId: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
    styleProps: z.record(z.string(), z.any()),
    userId: z.string(),
    code: z.string().optional(),
    description: z.string().optional(),
    // 创建模板时编写的 props 会自动生成 schema，当在 preset 中选择了模板后，需要按 schema 的格式来填写数据
    contentProps: z.record(z.string(), z.any()),
  }))

  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: JSON.stringify(body.error)
    })
  }

  const user = await prisma.user.findFirst({ where: { id: body.data.userId }})
  // 生成3位数的code, 其中第一位为特殊类型 0,后三位为随机数
  // 0xx superAdmin 建的都用这个
  // 其余数字随机即可
  let code = await generatePresetCode(user, body.data.code)
  
  const preset = await prisma.preset.create({
    data: {
      name: body.data.name,
      templateId: body.data.templateId,
      styleProps: body.data.styleProps,
      width: body.data.width,
      height: body.data.height,
      code,
      userId: body.data.userId,
      description: body.data.description,
      contentProps: body.data.contentProps
    }
  })

  return {
    data: preset,
    msg: 'ok'
  }
})

export const generatePresetCode = async (user: User, customCode?: string) => {
  let code = '';
  if (user.role === 'superAdmin') {
    if (customCode) return customCode
    code = '0' + generateRandomCode(2)
  } else {
    code = generateRandomCode(3)
  }

  const preset = await prisma.preset.findUnique({where: { code }})
  if (preset) {
    return await generatePresetCode(user)
  } else {
    return code 
  }
}

export const generateRandomCode = (length: number): string => {
  const isThreeDigits = length === 3
  if (isThreeDigits) {
    // 3位数：100-999
    const num = Math.floor(Math.random() * 900) + 100
    return num.toString()
  } else {
    // 2位数：00-99
    const num = Math.floor(Math.random() * 100)
    return num.toString().padStart(2, '0')
  }
}