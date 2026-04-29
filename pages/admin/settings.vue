<script setup lang="ts">
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useHead({ title: '站点配置' })

const { data: cfg, refresh } = useLazyFetch('/api/admin/config', { server: false, default: () => ({} as any) })

const form = reactive({
  schoolName: '', collegeName: '', officePhone: '', mobilePhone: '', primaryColor: '#1d4f8b',
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
</style>
