<script setup lang="ts">
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const id = computed(() => Number(route.params.id))

const { data, refresh } = useLazyFetch(() => `/api/admin/applications/${id.value}`, { server: false })
const { data: fieldsCfg } = useLazyFetch<any[]>('/api/admin/form-config', { server: false, default: () => [] })
useHead({ title: () => '报名详情 #' + id.value })

const remark = ref('')
watch(data, (v) => { if (v) remark.value = v.remark || '' }, { immediate: true })

// 扩展字段（仅展示有定义的；如已删除则不显示）
const extraEntries = computed(() => {
  const ed = (data.value as any)?.extraData
  if (!ed || typeof ed !== 'object') return []
  const out: Array<{ key: string; label: string; display: string }> = []
  for (const f of fieldsCfg.value || []) {
    if (f.isCore) continue
    const raw = ed[f.key]
    if (raw === undefined || raw === null || raw === '' || (Array.isArray(raw) && raw.length === 0)) continue
    let display = ''
    const opts: any[] = Array.isArray(f.options) ? f.options : []
    if (f.type === 'radio' || f.type === 'select') {
      display = opts.find(o => String(o.value) === String(raw))?.label || String(raw)
    } else if (f.type === 'checkbox') {
      const arr = Array.isArray(raw) ? raw : [raw]
      display = arr.map(v => opts.find(o => String(o.value) === String(v))?.label || v).join('、')
    } else {
      display = String(raw)
    }
    out.push({ key: f.key, label: f.label, display })
  }
  return out
})

async function saveRemark() {
  const { error } = await apiCall(
    () => $fetch(`/api/admin/applications/${id.value}`, {
      method: 'PATCH', body: { remark: remark.value }
    }),
    { successMsg: '备注已保存', errorFallback: '保存失败' }
  )
  if (!error) refresh()
}
async function changeStatus(s: string) {
  const { error } = await apiCall(
    () => $fetch(`/api/admin/applications/${id.value}`, { method: 'PATCH', body: { status: s } }),
    { successMsg: '状态已更新', errorFallback: '更新失败' }
  )
  if (!error) refresh()
}

const STATUS_LABEL: Record<string, string> = {
  pending: '待处理', contacted: '已联系', admitted: '已录取', rejected: '已拒绝'
}
</script>

<template>
  <div class="page-wrap" v-if="data">
    <header class="page-head">
      <div>
        <NuxtLink to="/admin/applications" class="back-link">← 返回列表</NuxtLink>
        <h1>{{ data.name }} <span class="id">#{{ data.id }}</span></h1>
        <p class="muted">提交于 {{ new Date(data.createdAt).toLocaleString('zh-CN') }}</p>
      </div>
      <el-tag size="large">{{ STATUS_LABEL[data.status] }}</el-tag>
    </header>

    <div class="grid">
      <div class="card-block info">
        <h3>基本信息</h3>
        <dl>
          <dt>姓名</dt><dd>{{ data.name }}</dd>
          <dt>性别</dt><dd>{{ data.gender === 'male' ? '男' : '女' }}</dd>
          <dt>身份证号</dt><dd>{{ data.idCard }}</dd>
          <dt>手机号</dt><dd>{{ data.phone }}</dd>
          <dt>高考报名号</dt><dd>{{ data.gaokaoNo || '—' }}</dd>
          <dt>民族</dt><dd>{{ data.ethnicity }}</dd>
          <dt>籍贯</dt><dd>{{ data.hometown }}</dd>
          <dt>毕业学校</dt><dd>{{ data.graduateSchool }}</dd>
          <dt>报读专业一</dt><dd>{{ data.major1?.name }}</dd>
          <dt>报读专业二</dt><dd>{{ data.major2?.name || '—' }}</dd>
          <dt>预约测试</dt><dd>{{ data.testSlot?.label || '—' }}</dd>
          <dt>奖项/特长</dt><dd class="multiline">{{ data.awards || '—' }}</dd>
          <dt>收件地址</dt><dd class="multiline">{{ data.address }}</dd>
          <dt>提交 IP</dt><dd>{{ data.ip || '—' }}</dd>
        </dl>

        <template v-if="extraEntries.length">
          <h3 style="margin-top:24px">扩展字段</h3>
          <dl>
            <template v-for="e in extraEntries" :key="e.key">
              <dt>{{ e.label }}</dt><dd class="multiline">{{ e.display }}</dd>
            </template>
          </dl>
        </template>
      </div>

      <div class="card-block side">
        <h3>状态管理</h3>
        <div class="status-btns">
          <el-button :type="data.status === 'pending' ? 'warning' : ''" @click="changeStatus('pending')">待处理</el-button>
          <el-button :type="data.status === 'contacted' ? 'primary' : ''" @click="changeStatus('contacted')">已联系</el-button>
          <el-button :type="data.status === 'admitted' ? 'success' : ''" @click="changeStatus('admitted')">已录取</el-button>
          <el-button :type="data.status === 'rejected' ? 'danger' : ''" @click="changeStatus('rejected')">已拒绝</el-button>
        </div>
        <h3 style="margin-top:24px">内部备注</h3>
        <el-input v-model="remark" type="textarea" :rows="6" placeholder="仅管理员可见" />
        <el-button type="primary" style="margin-top:12px;width:100%" @click="saveRemark">保存备注</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-wrap { max-width: 1200px; margin: 0 auto; }
.page-head { display: flex; justify-content: space-between; align-items: start; margin-bottom: 18px; }
.back-link { color: #6b7280; font-size: 13px; text-decoration: none; }
.back-link:hover { color: #1d4f8b; }
.page-head h1 { margin: 6px 0 0; font-size: 24px; }
.id { font-size: 14px; color: #6b7280; font-weight: 400; }
.muted { color: #6b7280; font-size: 13px; margin: 4px 0 0; }
.grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
.card-block { background: #fff; border-radius: 14px; padding: 22px 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.card-block h3 { margin: 0 0 14px; font-size: 15px; color: #1f2937; }
dl { display: grid; grid-template-columns: 110px 1fr; gap: 10px 16px; margin: 0; font-size: 14px; }
dt { color: #6b7280; }
dd { margin: 0; color: #1f2937; }
dd.multiline { white-space: pre-wrap; word-break: break-all; }
.status-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
</style>
