<script setup lang="ts">
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useHead({ title: '站点配置' })

const { data: cfg, refresh } = useLazyFetch('/api/admin/config', { server: false, default: () => ({} as any) })

const form = reactive({
  schoolName: '', collegeName: '', officePhone: '', mobilePhone: '', primaryColor: '#1d4f8b',
  bannerImage: '' as string | null,
  faviconImage: '' as string | null,
  siteDescription: '' as string | null,
  homeEntries: [] as any[]
})

watch(cfg, (v) => {
  if (!v) return
  Object.assign(form, {
    schoolName: v.schoolName,
    collegeName: v.collegeName,
    officePhone: v.officePhone,
    mobilePhone: v.mobilePhone,
    primaryColor: v.primaryColor,
    bannerImage: v.bannerImage || '',
    faviconImage: v.faviconImage || '',
    siteDescription: v.siteDescription || '',
    homeEntries: Array.isArray(v.homeEntries) ? JSON.parse(JSON.stringify(v.homeEntries)) : []
  })
}, { immediate: true })

async function save() {
  const { error } = await apiCall(
    () => $fetch('/api/admin/config', { method: 'PUT', body: form }),
    { successMsg: '已保存', errorFallback: '保存失败' }
  )
  if (!error) refresh()
}

function addEntry() {
  form.homeEntries.push({ title: '新入口', subtitle: '', link: '/', cover: '' })
}
function removeEntry(i: number) {
  form.homeEntries.splice(i, 1)
}
function moveEntry(i: number, dir: number) {
  const j = i + dir
  if (j < 0 || j >= form.homeEntries.length) return
  const [it] = form.homeEntries.splice(i, 1)
  form.homeEntries.splice(j, 0, it)
}

const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
function pickFile() { fileInput.value?.click() }
async function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  if (!/\.pdf$/i.test(f.name)) return ElMessage.warning('请选择 PDF 文件')
  uploading.value = true
  const { data: r, error } = await apiCall<any>(
    () => {
      const fd = new FormData()
      fd.append('file', f)
      return $fetch('/api/admin/brochure', { method: 'POST', body: fd })
    },
    { errorFallback: '上传失败' }
  )
  if (!error && r) {
    const { ElMessage } = await import('element-plus')
    ElMessage.success(`上传成功，已切片 ${r.pages} 页（v${r.version}）`)
    refresh()
  }
  uploading.value = false
  if (fileInput.value) fileInput.value.value = ''
}

// ===== 顶部 Banner 图片上传 =====
const bannerUploading = ref(false)
const bannerInput = ref<HTMLInputElement | null>(null)
function pickBanner() { bannerInput.value?.click() }
async function onBannerChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  if (!/\.(png|jpe?g|webp|gif)$/i.test(f.name)) return ElMessage.warning('仅支持 png/jpg/webp/gif')
  if (f.size > 5 * 1024 * 1024) return ElMessage.warning('图片过大（最大 5MB）')
  bannerUploading.value = true
  const { data: r, error } = await apiCall<any>(
    () => {
      const fd = new FormData()
      fd.append('file', f)
      return $fetch('/api/admin/banner', { method: 'POST', body: fd })
    },
    { successMsg: '上传成功', errorFallback: '上传失败' }
  )
  if (!error && r?.url) {
    form.bannerImage = r.url
    refresh()
  }
  bannerUploading.value = false
  if (bannerInput.value) bannerInput.value.value = ''
}
function clearBanner() {
  form.bannerImage = ''
}

// ===== 网站图标 (favicon) 上传 =====
const faviconUploading = ref(false)
const faviconInput = ref<HTMLInputElement | null>(null)
function pickFavicon() { faviconInput.value?.click() }
async function onFaviconChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  if (!/\.(ico|png|jpe?g|svg|webp)$/i.test(f.name)) return ElMessage.warning('仅支持 ico/png/jpg/svg/webp')
  if (f.size > 1 * 1024 * 1024) return ElMessage.warning('图标过大（最大 1MB）')
  faviconUploading.value = true
  const { data: r, error } = await apiCall<any>(
    () => {
      const fd = new FormData()
      fd.append('file', f)
      return $fetch('/api/admin/favicon', { method: 'POST', body: fd })
    },
    { successMsg: '上传成功', errorFallback: '上传失败' }
  )
  if (!error && r?.url) {
    form.faviconImage = r.url
    refresh()
  }
  faviconUploading.value = false
  if (faviconInput.value) faviconInput.value.value = ''
}
function clearFavicon() {
  form.faviconImage = ''
}
</script>

<template>
  <div class="page-wrap" v-if="cfg">
    <header class="page-head">
      <h1>站点配置</h1>
      <el-button type="primary" @click="save">保存全部</el-button>
    </header>

    <div class="grid">
      <div class="card-block">
        <h3>基础信息</h3>
        <el-form label-width="100px">
          <el-form-item label="学校名称"><el-input v-model="form.schoolName" /></el-form-item>
          <el-form-item label="学院名称"><el-input v-model="form.collegeName" /></el-form-item>
          <el-form-item label="办公电话"><el-input v-model="form.officePhone" /></el-form-item>
          <el-form-item label="手机联系"><el-input v-model="form.mobilePhone" /></el-form-item>
          <el-form-item label="主题色"><el-color-picker v-model="form.primaryColor" /></el-form-item>
          <el-form-item label="网站描述">
            <el-input
              v-model="form.siteDescription"
              type="textarea"
              :rows="2"
              maxlength="200"
              show-word-limit
              placeholder="用于浏览器和分享卡片的描述（≤200 字）"
            />
          </el-form-item>
        </el-form>
      </div>

      <div class="card-block">
        <h3>招生简章 PDF</h3>
        <p class="muted">
          当前版本：v{{ cfg.brochureVersion }}，共 {{ cfg.brochurePages }} 页
        </p>
        <p class="muted" v-if="cfg.brochurePdf">
          <a :href="cfg.brochurePdf" target="_blank">查看原 PDF</a>
        </p>
        <input ref="fileInput" type="file" accept="application/pdf" hidden @change="onFileChange" />
        <el-button type="success" :loading="uploading" @click="pickFile">
          {{ uploading ? '上传并切片中…' : '上传新简章 PDF' }}
        </el-button>
        <p class="warn">⚠️ 服务器需安装 graphicsmagick 与 ghostscript 才能切片</p>
      </div>
    </div>

    <div class="card-block banner-block">
      <h3>首页顶部图片（Banner）</h3>
      <p class="muted">上传后会替换首页顶部的"学校名称 / 学院名称 / 头像圆圈"区域。建议尺寸 750×420 或更宽，文件 ≤ 5MB。</p>
      <div class="banner-preview" v-if="form.bannerImage">
        <img :src="form.bannerImage" alt="banner" />
      </div>
      <div v-else class="banner-empty">尚未上传，将使用默认顶部样式</div>
      <input ref="bannerInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden @change="onBannerChange" />
      <div class="banner-actions">
        <el-button type="primary" :loading="bannerUploading" @click="pickBanner">
          {{ bannerUploading ? '上传中…' : (form.bannerImage ? '更换图片' : '上传图片') }}
        </el-button>
        <el-button v-if="form.bannerImage" @click="clearBanner">移除图片</el-button>
      </div>
      <p class="muted">提示：移除后需点击右上角【保存全部】才会生效。</p>
    </div>

    <div class="card-block favicon-block">
      <h3>网站图标 (Favicon)</h3>
      <p class="muted">显示在浏览器标签页、收藏夹、以及部分分享场景。建议使用 32×32 或 64×64 的 .ico / .png，文件 ≤ 1MB。</p>
      <div class="favicon-row">
        <div class="favicon-preview" v-if="form.faviconImage">
          <img :src="form.faviconImage" alt="favicon" />
        </div>
        <div v-else class="favicon-empty">未上传</div>
        <input ref="faviconInput" type="file" accept=".ico,image/x-icon,image/png,image/jpeg,image/svg+xml,image/webp" hidden @change="onFaviconChange" />
        <div class="favicon-actions">
          <el-button type="primary" :loading="faviconUploading" @click="pickFavicon">
            {{ faviconUploading ? '上传中…' : (form.faviconImage ? '更换图标' : '上传图标') }}
          </el-button>
          <el-button v-if="form.faviconImage" @click="clearFavicon">移除</el-button>
        </div>
      </div>
      <p class="muted">提示：分享给微信/QQ/浏览器时显示的缩略图来自上方"首页 Banner"，标题与描述来自基础信息。修改后请点击【保存全部】。</p>
    </div>

    <div class="card-block">
      <h3>首页入口卡片</h3>
      <table class="entries-table">
        <thead><tr><th>标题</th><th>副标题</th><th>跳转链接</th><th>封面 URL</th><th width="160">操作</th></tr></thead>
        <tbody>
          <tr v-for="(e, i) in form.homeEntries" :key="i">
            <td><el-input v-model="e.title" /></td>
            <td><el-input v-model="e.subtitle" /></td>
            <td><el-input v-model="e.link" /></td>
            <td><el-input v-model="e.cover" placeholder="可留空" /></td>
            <td>
              <el-button link @click="moveEntry(i, -1)">↑</el-button>
              <el-button link @click="moveEntry(i, 1)">↓</el-button>
              <el-button link type="danger" @click="removeEntry(i)">删除</el-button>
            </td>
          </tr>
        </tbody>
      </table>
      <el-button @click="addEntry" style="margin-top:10px">+ 新增入口</el-button>
    </div>
  </div>
.favicon-block { margin-bottom: 16px; }
.favicon-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin: 10px 0 6px; }
.favicon-preview { width: 64px; height: 64px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.favicon-preview img { max-width: 100%; max-height: 100%; }
.favicon-empty { width: 64px; height: 64px; border-radius: 10px; background: #f8fafc; border: 1px dashed #cbd5e1; color: #94a3b8; font-size: 12px; display: flex; align-items: center; justify-content: center; }
.favicon-actions { display: flex; gap: 10px; }
</template>

<style scoped>
.page-wrap { max-width: 1200px; margin: 0 auto; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-head h1 { margin: 0; font-size: 22px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.card-block { background: #fff; border-radius: 14px; padding: 22px 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.card-block h3 { margin: 0 0 14px; font-size: 15px; color: #1f2937; }
.muted { color: #6b7280; font-size: 13px; margin: 6px 0; }
.warn { color: #d97706; font-size: 12px; margin-top: 10px; }
.entries-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.entries-table th, .entries-table td { padding: 8px 6px; border-bottom: 1px solid #f1f5f9; text-align: left; }
.entries-table th { color: #6b7280; font-weight: 500; }
.banner-block { margin-bottom: 16px; }
.banner-preview { margin: 10px 0 14px; border-radius: 10px; overflow: hidden; background: #f1f5f9; }
.banner-preview img { display: block; width: 100%; max-height: 280px; object-fit: cover; }
.banner-empty { margin: 10px 0 14px; padding: 28px; text-align: center; color: #94a3b8; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; }
.banner-actions { display: flex; gap: 10px; }
</style>
