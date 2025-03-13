import * as jose from 'jose'
import type { JWTPayload, CryptoKey } from 'jose'
import useNanoId from './nanoid'
// export async function generateAccessToken({ payload, secret, expiresIn = '1h' }) {
//   const token = await new jose.SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('1h').sign(secret)
//   return token
// }

/**
 *  为用户生成 access token
 * @param userId 用户id
 * @returns token
 */
export async function generateAccessToken(userId: string): Promise<[string, Date]> {
  const token = useNanoId()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  await useStorage('redis').setItem(`accessToken:${token}`, {
    userId,
    expiresAt,
    isRevoked: false,
  }, { ttl: 60 * 60 * 24 } )
  return [token, expiresAt]
}

export async function useCachedToken(token: string) {
  const storage = useStorage('redis')
  const cachedToken = await storage.getItem<{userId: string, expiresAt: Date, isRevoked: boolean}>(`accessToken:${token}`)
  return cachedToken
}

/**
 *  在 redis 里撤销 token
 * @param token 被校验的 token
 * @param userId userId
 */
export async function revokeCachedToken(token: string, userId?: string) {
  await useStorage('redis').setItem(`accessToken:${token}`, {
    userId: userId,
    isRevoked: true,
  }, { ttl: 60 * 60 * 24 })
}
/**
 *  检测 token 是否有效 （从 redis 和 mysql 校验）
 * @param token 被校验的 token
 * @returns boolean
 */
export async function verifyAccessToken(token: string, payload) {
  const cachedToken = await useCachedToken(token)
  // 如果命中缓存 则不查库
  if (cachedToken) {
    if (cachedToken.isRevoked || new Date(cachedToken.expiresAt) < new Date())  {
      return false
    }

    return true
  }

  const tokenData = await prisma.accessToken.findUnique({
    where: {
      token,
    },
  })
  // 已经无效了了, 写入到缓存中避免多次去查库
  if (tokenData.isRevoked || new Date(tokenData.expiresAt) < new Date())  {
    revokeCachedToken(token, payload.userId || tokenData.userId)
    return false
  }

  return true

}
/**
 * 撤销 token
 * @param param0 { token, userId }
 */
export async function revokeAccessToken({ token, userId }: { token?: string, userId?: string }) {
  const revokeToken = async () => {
    await prisma.accessToken.update({
      where: {
        token,
      },
      data: {
        isRevoked: true,
      },
    })
    revokeCachedToken(token)
  }

  // 如果只传了 userId 则撤销此人所有的 token
  if (userId) {
    if ( !token ) {
      const tokens = await prisma.accessToken.findMany({
        where: {
          userId,
        },
      })

      tokens.forEach(async (tokenInfo) => {
        await revokeCachedToken(tokenInfo.token)
      })

      await prisma.accessToken.updateMany({
        where: {
          userId,
        },
        data: {
          isRevoked: true,
        },
      })

    } else {
      await revokeToken()
    }
  } else {
    await revokeToken()
  }
}