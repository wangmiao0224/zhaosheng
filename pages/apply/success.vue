<script setup lang="ts">
const route = useRoute()
const id = route.query.id
const name = (route.query.name as string) || ''

const { data: cfg } = await useFetch('/api/public/config')
useHead({ title: '提交成功' })

const submitTime = ref('')
onMounted(() => {
  submitTime.value = new Date().toLocaleString('zh-CN', { hour12: false })
})
</script>

<template>
  <div class="success-page">
    <div class="brand-bar">报名成功</div>

    <div class="card">
      <div class="check-wrap">
        <div class="check">✓</div>
      </div>

      <h2>报名提交成功</h2>
      <p class="hi" v-if="name">{{ name }} 同学，您好！</p>
      <p class="muted">您的报名编号</p>
      <div class="no">#{{ id }}</div>

      <div class="info">
        <div class="row"><span>报名时间</span><b>{{ submitTime }}</b></div>
        <div class="row" v-if="cfg?.officePhone"><span>招生办电话</span><b>{{ cfg.officePhone }}</b></div>
        <div class="row" v-if="cfg?.contactPhone"><span>联系手机</span><b>{{ cfg.contactPhone }}</b></div>
      </div>

      <p class="tip">
        我们已收到您的报名信息，招生办公室会在 1–3 个工作日内与您电话联系，
        请保持电话畅通，并留意来电。
      </p>

      <div class="actions">
        <NuxtLink to="/brochure" class="btn-outline">查看招生简章</NuxtLink>
        <NuxtLink to="/" class="btn-primary">返回首页</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.success-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #eaf3ff 0%, #ffffff 240px);
  padding-bottom: 32px;
}
.card {
  margin: 16px;
  background: #fff;
  border-radius: 16px;
  padding: 8px 20px 28px;
  box-shadow: 0 6px 24px rgba(29, 79, 139, 0.08);
  text-align: center;
}
.check-wrap { padding-top: 12px; }
.check {
  width: 88px; height: 88px; border-radius: 50%;
  background: var(--accent, #22c55e); color: #fff;
  font-size: 48px; line-height: 88px;
  margin: 16px auto 8px;
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.35);
  font-weight: 700;
}
h2 { color: var(--text, #1f2937); margin: 8px 0 4px; font-size: 20px; }
.hi { color: var(--brand, #1d4f8b); font-size: 15px; margin: 6px 0 0; font-weight: 500; }
.muted { color: var(--text-muted, #6b7280); margin: 18px 0 4px; font-size: 13px; }
.no {
  font-size: 26px; font-weight: 700;
  color: var(--brand, #1d4f8b);
  letter-spacing: 2px;
}
.info {
  margin: 24px 4px 8px;
  border-top: 1px dashed #e5e7eb;
  border-bottom: 1px dashed #e5e7eb;
  padding: 12px 0;
  text-align: left;
}
.row { display: flex; justify-content: space-between; padding: 6px 4px; font-size: 14px; }
.row span { color: #6b7280; }
.row b { color: #1f2937; font-weight: 600; }
.tip {
  color: var(--text-muted, #6b7280);
  font-size: 13px; line-height: 1.7;
  margin: 18px 6px 4px; text-align: left;
}
.actions {
  display: flex; gap: 12px; margin-top: 22px;
}
.btn-outline, .btn-primary {
  flex: 1; padding: 12px 0; border-radius: 999px;
  text-decoration: none; font-size: 14px; font-weight: 500;
  display: inline-flex; align-items: center; justify-content: center;
}
.btn-outline {
  border: 1px solid var(--brand, #1d4f8b);
  color: var(--brand, #1d4f8b);
  background: #fff;
}
.btn-primary {
  background: var(--brand, #1d4f8b);
  color: #fff;
  border: 1px solid var(--brand, #1d4f8b);
}
</style>
