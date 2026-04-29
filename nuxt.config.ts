// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  modules: ['@vant/nuxt', '@pinia/nuxt', '@vueuse/nuxt'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '桂林电子科技大学应用职业本科 · 报名',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { name: 'theme-color', content: '#1d4f8b' }
      ]
    }
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
    adminUsername: process.env.ADMIN_USERNAME || 'admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
    storageDir: process.env.STORAGE_DIR || './storage',
    public: {
      siteName: process.env.NUXT_PUBLIC_SITE_NAME || '招生报名'
    }
  },
  nitro: {
    // /files/* 由 server/routes/files/[...path].ts 处理（支持运行时上传的文件）
    // 把 Prisma 查询引擎二进制 + schema 打进 .output/，否则线上报 "could not locate Query Engine"
    moduleSideEffects: ['@prisma/client'],
    externals: {
      // 不要把 prisma 打到一个文件里，保留 node_modules 结构
      external: ['@prisma/client', '.prisma/client']
    }
  },
  vant: {
    lazyload: true
  }
})
