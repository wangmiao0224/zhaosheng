<script setup lang="ts">
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'

const route = useRoute()
const router = useRouter()

const menus = [
  { path: '/admin', label: '仪表盘', icon: '📊' },
  { path: '/admin/applications', label: '报名记录', icon: '📝' },
  { path: '/admin/form', label: '表单设计', icon: '📋' },
  { path: '/admin/majors', label: '专业管理', icon: '🎓' },
  { path: '/admin/slots', label: '测试时段', icon: '🗓' },
  { path: '/admin/settings', label: '站点配置', icon: '⚙️' }
]

async function logout() {
  await $fetch('/api/admin/logout', { method: 'POST' })
  ElMessage.success('已退出登录')
  router.push('/admin/login')
}
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-side">
      <div class="brand">
        <div class="brand-logo">招</div>
        <div>
          <div class="brand-title">招生管理后台</div>
          <div class="brand-sub">桂林电子科技大学</div>
        </div>
      </div>
      <nav class="menu">
        <NuxtLink
          v-for="m in menus" :key="m.path" :to="m.path"
          class="menu-item" :class="{ active: route.path === m.path || (m.path !== '/admin' && route.path.startsWith(m.path)) }"
        >
          <span class="menu-icon">{{ m.icon }}</span>
          <span>{{ m.label }}</span>
        </NuxtLink>
      </nav>
      <div class="side-foot">
        <button class="logout" @click="logout">退出登录</button>
      </div>
    </aside>
    <main class="admin-main">
      <ClientOnly>
        <slot />
        <template #fallback>
          <div class="loading-fallback">加载中…</div>
        </template>
      </ClientOnly>
    </main>
  </div>
</template>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
  background: #f5f7fb;
}
.admin-side {
  width: 240px;
  background: linear-gradient(180deg, #1d4f8b 0%, #133764 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.brand-logo {
  width: 40px; height: 40px; border-radius: 10px;
  background: rgba(255,255,255,0.15);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 18px;
}
.brand-title { font-weight: 600; font-size: 15px; }
.brand-sub { font-size: 12px; opacity: 0.7; margin-top: 2px; }
.menu { flex: 1; padding: 12px 10px; }
.menu-item {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; margin-bottom: 4px;
  border-radius: 10px;
  color: rgba(255,255,255,0.85);
  text-decoration: none;
  font-size: 14px;
  transition: background .15s;
}
.menu-item:hover { background: rgba(255,255,255,0.08); }
.menu-item.active { background: rgba(255,255,255,0.18); color: #fff; font-weight: 600; }
.menu-icon { font-size: 16px; }
.side-foot { padding: 16px; }
.logout {
  width: 100%; padding: 10px;
  background: rgba(255,255,255,0.1);
  color: #fff; border: 0; border-radius: 8px;
  cursor: pointer;
}
.logout:hover { background: rgba(255,255,255,0.18); }
.admin-main { flex: 1; padding: 24px 28px; overflow-x: auto; }
</style>
