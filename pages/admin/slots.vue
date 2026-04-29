<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import 'element-plus/dist/index.css'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useHead({ title: '测试时段' })

const { data: list, refresh } = useLazyFetch('/api/admin/slots', { server: false, default: () => [] as any[] })
const dlg = reactive({
  show: false, edit: false, id: 0,
  label: '', startAt: '', endAt: '', capacity: 0, enabled: true
})

function openCreate() {
  Object.assign(dlg, { show: true, edit: false, id: 0, label: '', startAt: '', endAt: '', capacity: 0, enabled: true })
}
function openEdit(s: any) {
  Object.assign(dlg, { show: true, edit: true, id: s.id, label: s.label, startAt: s.startAt, endAt: s.endAt, capacity: s.capacity, enabled: s.enabled })
}
async function save() {
  if (!dlg.label || !dlg.startAt || !dlg.endAt) return ElMessage.warning('请完整填写')
  const { error } = await apiCall(
    () => dlg.edit
      ? $fetch(`/api/admin/slots/${dlg.id}`, { method: 'PATCH', body: dlg })
      : $fetch('/api/admin/slots', { method: 'POST', body: dlg }),
    { successMsg: '已保存', errorFallback: '保存失败' }
  )
  if (!error) { dlg.show = false; refresh() }
}
async function remove(s: any) {
  try {
    await ElMessageBox.confirm(`删除时段「${s.label}」？`, '确认', { type: 'warning' })
  } catch { return }
  const { error } = await apiCall(
    () => $fetch(`/api/admin/slots/${s.id}`, { method: 'DELETE' }),
    { successMsg: '已删除', errorFallback: '删除失败' }
  )
  if (!error) refresh()
}
async function toggleEnabled(s: any) {
  const { error } = await apiCall(
    () => $fetch(`/api/admin/slots/${s.id}`, { method: 'PATCH', body: { enabled: !s.enabled } }),
    { errorFallback: '操作失败' }
  )
  refresh()
}
</script>

<template>
  <div class="page-wrap">
    <header class="page-head">
      <div>
        <h1>测试时段</h1>
        <p class="muted">面试/笔试时段维护，0 容量代表不限</p>
      </div>
      <el-button type="primary" @click="openCreate">新增时段</el-button>
    </header>

    <div class="table-card">
      <el-table :data="list" style="width:100%">
        <el-table-column prop="id" label="#" width="70" />
        <el-table-column prop="label" label="名称" />
        <el-table-column label="开始时间" width="180">
          <template #default="{ row }">{{ new Date(row.startAt).toLocaleString('zh-CN') }}</template>
        </el-table-column>
        <el-table-column label="结束时间" width="180">
          <template #default="{ row }">{{ new Date(row.endAt).toLocaleString('zh-CN') }}</template>
        </el-table-column>
        <el-table-column prop="capacity" label="容量" width="100" />
        <el-table-column label="启用" width="100">
          <template #default="{ row }">
            <el-switch :model-value="row.enabled" @change="toggleEnabled(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dlg.show" :title="dlg.edit ? '编辑时段' : '新增时段'" width="500px">
      <el-form label-width="100px">
        <el-form-item label="名称" required><el-input v-model="dlg.label" placeholder="如：5月10日上午面试" /></el-form-item>
        <el-form-item label="开始时间" required>
          <el-date-picker v-model="dlg.startAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width:100%" />
        </el-form-item>
        <el-form-item label="结束时间" required>
          <el-date-picker v-model="dlg.endAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width:100%" />
        </el-form-item>
        <el-form-item label="容量"><el-input-number v-model="dlg.capacity" :min="0" /> <span style="margin-left:8px;color:#9ca3af;font-size:12px">0 代表不限</span></el-form-item>
        <el-form-item label="启用"><el-switch v-model="dlg.enabled" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlg.show = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-wrap { max-width: 1200px; margin: 0 auto; }
.page-head { display: flex; justify-content: space-between; align-items: end; margin-bottom: 16px; }
.page-head h1 { margin: 0; font-size: 22px; }
.muted { color: #6b7280; font-size: 13px; margin: 4px 0 0; }
.table-card { background: #fff; border-radius: 12px; padding: 8px 16px 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
</style>
