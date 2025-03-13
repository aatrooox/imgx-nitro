// 登录接口, 获取jwt token
export default defineEventHandler(async (event) => {
  const body = await useSafeValidatedBody(event, z.object({
    username: z.string(),
    password: z.string()
  }))

  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: JSON.stringify(body.error)
    })
  }
  const { username, password } = body.data
  const user = await prisma.user.findUnique({
    where: {
      username
    }
  })

  if (!user) {
    throw createError({
      statusCode: 400,
      message: '用户不存在'
    })
  }

  if (user.password !== password) {
    throw createError({
      status: 400,
      statusText: '账号或密码错误'
    })
  }

  // 生成 token ，保存到 redis
  const [token, expiresAt] = await generateAccessToken(user.id)
  const data = {
    token,
    expiresAt,
    userId: user.id,
    roles: 'user',
    isRevoked: false,
  }
  const tokenInfo = await prisma.accessToken.create({ data })
  // setCookie(event, 'token', token, {
  //   httpOnly: true,
  //   sameSite: 'none', // strict lax none
  //   maxAge: 2592000, // maxAge 优先级高， expires 受客户端时间的影响
  //   secure: true,
  //   domain: isProd ? '.zzao.club' : 'localhost',
  // })
  
  return {
    data: {
      token,
      user
    },
    msg: '登录成功'
  }
})