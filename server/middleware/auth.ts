// 仅拦截 /api/admin/* 中需要鉴权的路由（登录除外）
export default defineEventHandler((event) => {
  const url = event.node.req.url || ''
  if (!url.startsWith('/api/admin')) return
  if (url.startsWith('/api/admin/login')) return

  const admin = getAdminFromEvent(event)
  if (!admin) {
    throw createError({ statusCode: 401, statusMessage: '未登录' })
  }
  event.context.admin = admin
})
