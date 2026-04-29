<script setup lang="ts">
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'

definePageMeta({ layout: false })
useHead({ title: '后台登录' })

const router = useRouter()
const username = ref('admin')
const password = ref('')
const loading = ref(false)

async function submit() {
  if (!username.value || !password.value) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: { username: username.value, password: password.value }
    })
    ElMessage.success('登录成功')
    router.push('/admin')
  } catch (e: any) {
    ElMessage.error(e?.statusMessage || e?.data?.statusMessage || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <div class="brand-icon">招</div>
        <h1>招生管理后台</h1>
        <p>桂林电子科技大学应用职业本科</p>
      </div>
      <form class="form" @submit.prevent="submit">
        <label>
          <span>账号</span>
          <input v-model="username" autocomplete="username" placeholder="请输入账号" />
        </label>
        <label>
          <span>密码</span>
          <input v-model="password" type="password" autocomplete="current-password" placeholder="请输入密码" @keyup.enter="submit" />
        </label>
        <button type="submit" :disabled="loading">{{ loading ? '登录中…' : '登 录' }}</button>
      </form>
    </div>
    <div class="bg-deco" />
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #1d4f8b 0%, #133764 60%, #0a2347 100%);
  position: relative; overflow: hidden;
}
.bg-deco {
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(34,197,94,0.12), transparent 40%);
  pointer-events: none;
}
.login-card {
  position: relative; z-index: 1;
  width: 400px; max-width: 92vw;
  background: #fff;
  border-radius: 20px;
  padding: 40px 36px 32px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
}
.brand { text-align: center; margin-bottom: 28px; }
.brand-icon {
  width: 56px; height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #1d4f8b, #2e6cb6);
  color: #fff; font-size: 24px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
  margin-bottom: 14px;
}
.brand h1 { font-size: 20px; margin: 0 0 6px; color: #1f2937; }
.brand p { font-size: 13px; color: #6b7280; margin: 0; }

.form { display: flex; flex-direction: column; gap: 16px; }
.form label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: #374151; }
.form input {
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.form input:focus {
  border-color: #1d4f8b;
  box-shadow: 0 0 0 3px rgba(29,79,139,0.12);
}
.form button {
  margin-top: 8px;
  padding: 13px;
  background: linear-gradient(135deg, #1d4f8b, #2e6cb6);
  color: #fff; border: 0; border-radius: 10px;
  font-size: 15px; font-weight: 600;
  cursor: pointer;
  transition: transform .12s, box-shadow .12s;
}
.form button:hover { box-shadow: 0 8px 20px rgba(29,79,139,0.35); }
.form button:active { transform: scale(0.98); }
.form button:disabled { opacity: 0.7; cursor: not-allowed; }
</style>
