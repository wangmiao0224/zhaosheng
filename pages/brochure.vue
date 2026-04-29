<script setup lang="ts">
const { data: cfg } = await useFetch('/api/public/config')
useHead({ title: '招生简章' })

const pages = computed(() => cfg.value?.brochurePages || 0)
const version = computed(() => cfg.value?.brochureVersion || 0)

function pageUrl(n: number) {
  return `/files/brochure/${version.value}/page.${n}.jpg`
}
</script>

<template>
  <div class="brochure">
    <div class="brand-bar">招生简章</div>
    <div v-if="pages === 0" class="empty">
      <p>📄</p>
      <p>简章尚未上传</p>
    </div>
    <div v-else class="pages">
      <van-image
        v-for="n in pages" :key="n"
        :src="pageUrl(n)"
        lazy-load fit="contain"
        class="page-img"
      />
    </div>
  </div>
</template>

<style scoped>
.brochure { min-height: 100vh; background: #1a1a1a; padding-bottom: 24px; }
.empty {
  color: #fff; text-align: center;
  padding: 80px 0; font-size: 16px; opacity: 0.7;
}
.empty p:first-child { font-size: 60px; margin-bottom: 12px; }
.pages { display: flex; flex-direction: column; gap: 6px; padding: 6px 0; }
.page-img { width: 100%; display: block; }
:deep(.page-img img) { width: 100%; display: block; }
</style>
