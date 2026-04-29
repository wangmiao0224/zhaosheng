import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (!rateLimit('login:' + ip, 10, 60_000)) {
    throw createError({ statusCode: 429, statusMessage: '尝试过于频繁' })
  }

  const { username, password } = await readBody<{ username: string; password: string }>(event)
  if (!username || !password) throw createError({ statusCode: 400, statusMessage: '请输入账号和密码' })

  const admin = await prisma.admin.findUnique({ where: { username } })
  if (!admin) throw createError({ statusCode: 401, statusMessage: '账号或密码错误' })

  const ok = await bcrypt.compare(password, admin.password)
  if (!ok) throw createError({ statusCode: 401, statusMessage: '账号或密码错误' })

  const token = signAdminToken({ id: admin.id, username: admin.username })
  setCookie(event, 'admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60
  })
  return { ok: true, username: admin.username }
})
