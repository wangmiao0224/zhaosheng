import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'

export interface AdminPayload {
  id: number
  username: string
}

export function signAdminToken(payload: AdminPayload) {
  const config = useRuntimeConfig()
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' })
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    const config = useRuntimeConfig()
    return jwt.verify(token, config.jwtSecret) as AdminPayload
  } catch {
    return null
  }
}

export function getAdminFromEvent(event: H3Event): AdminPayload | null {
  const token = getCookie(event, 'admin_token')
  if (!token) return null
  return verifyAdminToken(token)
}

export function requireAdmin(event: H3Event): AdminPayload {
  const admin = getAdminFromEvent(event)
  if (!admin) {
    throw createError({ statusCode: 401, statusMessage: '未登录或登录已过期' })
  }
  return admin
}
