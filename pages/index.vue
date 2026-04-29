<script setup lang="ts">
const { data: cfg } = await useFetch('/api/public/config')
useHead({ title: () => cfg.value?.schoolName || '招生报名' })
</script>

<template>
  <div class="home">
    <!-- 有 banner 图片时只显示图片，无图片时回退到原 logo+学校名样式 -->
    <div v-if="cfg?.bannerImage" class="banner">
      <img :src="cfg.bannerImage" alt="" />
    </div>
    <div v-else class="header">
      <div class="header-bg" />
      <div class="header-content">
        <div class="logo">
          <div class="logo-circle">桂</div>
        </div>
        <div class="school-name">{{ cfg?.schoolName || '桂林电子科技大学' }}</div>
        <div class="college-name">— {{ cfg?.collegeName || '继续教育学院' }} —</div>
      </div>
    </div>

    <div class="entries">
      <NuxtLink
        v-for="(e, i) in (cfg?.homeEntries || [])"
        :key="i"
        :to="e.link"
        class="entry-card card"
      >
        <div class="entry-cover" :style="e.cover ? `background-image:url(${e.cover})` : ''">
          <span v-if="!e.cover">{{ i === 0 ? '📝' : '📘' }}</span>
        </div>
        <div class="entry-text">
          <div class="entry-title">{{ e.title }}</div>
          <div class="entry-sub">{{ e.subtitle }}</div>
        </div>
        <div class="entry-arrow">›</div>
      </NuxtLink>
    </div>

    <div class="contact card">
      <div class="contact-row">招生办公室电话：<span>{{ cfg?.officePhone }}</span></div>
      <div class="contact-row">手机联系：<span>{{ cfg?.mobilePhone }}</span></div>
    </div>

    <div class="more">
      <span>≡ 更多</span>
    </div>
  </div>
</template>

<style scoped>
.home { padding-bottom: 40px; min-height: 100vh; background: #fff; }
.banner { width: 100%; background: #1d4f8b; }
.banner img { display: block; width: 100%; height: auto; }
.header {
  position: relative;
  padding: 28px 20px 32px;
  text-align: center;
  background: linear-gradient(135deg, #1d4f8b 0%, #2e6cb6 100%);
  color: #fff;
}
.header-content { position: relative; z-index: 1; }
.logo-circle {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  border: 2px solid rgba(255,255,255,0.5);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 30px; font-weight: 700;
  margin-bottom: 14px;
}
.school-name { font-size: 22px; font-weight: 700; letter-spacing: 2px; }
.college-name { font-size: 14px; opacity: 0.85; margin-top: 8px; letter-spacing: 4px; }

.entries { padding: 20px 16px 8px; display: flex; flex-direction: column; gap: 14px; }
.entry-card {
  display: flex; align-items: center; gap: 14px;
  padding: 14px;
  text-decoration: none; color: inherit;
  transition: transform .15s ease, box-shadow .15s ease;
}
.entry-card:active { transform: scale(0.98); }
.entry-cover {
  width: 56px; height: 56px; border-radius: 50%;
  background-color: var(--brand-soft);
  background-size: cover; background-position: center;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; flex-shrink: 0;
}
.entry-text { flex: 1; }
.entry-title { font-size: 16px; font-weight: 600; color: var(--text); }
.entry-sub { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
.entry-arrow { color: #c0c4cc; font-size: 24px; line-height: 1; }

.contact {
  margin: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #1d4f8b 0%, #2e6cb6 100%);
  color: #fff;
  text-align: center;
  font-size: 14px;
  line-height: 1.9;
}
.contact-row span { font-weight: 600; }

.more {
  text-align: center; color: var(--text-muted);
  font-size: 13px; padding: 24px 0;
}
</style>
