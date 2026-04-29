export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/admin/login') return
  // 仅在客户端做鉴权检查（admin 路由禁用了 SSR）
  if (import.meta.server) return
  try {
    await $fetch('/api/admin/me')
  } catch {
    return navigateTo('/admin/login')
  }
})
