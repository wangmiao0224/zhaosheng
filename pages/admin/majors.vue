<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import 'element-plus/dist/index.css'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useHead({ title: '专业管理' })

const { data: list, refresh } = useLazyFetch('/api/admin/majors', { server: false, default: () => [] as any[] })
const dlg = reactive({ show: false, edit: false, id: 0, name: '', code: '', sort: 0, enabled: true, remark: '' })

function openCreate() {
  Object.assign(dlg, { show: true, edit: false, id: 0, name: '', code: '', sort: (list.value?.length || 0) * 10, enabled: true, remark: '' })
}
function openEdit(m: any) {
  Object.assign(dlg, { show: true, edit: true, id: m.id, name: m.name, code: m.code || '', sort: m.sort, enabled: m.enabled, remark: m.remark || '' })
}
async function save() {
  if (!dlg.name.trim()) return ElMessage.warning('请输入专业名称')
  const { error } = await apiCall(
    () => dlg.edit
      ? $fetch(`/api/admin/majors/${dlg.id}`, { method: 'PATCH', body: dlg })
      : $fetch('/api/admin/majors', { method: 'POST', body: dlg }),
    { successMsg: '已保存', errorFallback: '保存失败' }
  )
  if (!error) { dlg.show = false; refresh() }
}
async function remove(m: any) {
  try {
    await ElMessageBox.confirm(`删除专业「${m.name}」？`, '确认', { type: 'warning' })
  } catch { return }
  const { error } = await apiCall(
    () => $fetch(`/api/admin/majors/${m.id}`, { method: 'DELETE' }),
    { successMsg: '已删除', errorFallback: '删除失败' }
  )
  if (!error) refresh()
}
async function toggleEnabled(m: any) {
  const { error } = await apiCall(
    () => $fetch(`/api/admin/majors/${m.id}`, { method: 'PATCH', body: { enabled: !m.enabled } }),
    { errorFallback: '操作失败' }
  )
  refresh()
}
</script>

<template>
  <div class="page-wrap">
    <header class="page-head">
      <div>
        <h1>专业管理</h1>
        <p class="muted">维护可报读专业列表（前台报名页实时同步）</p>
      </div>
      <el-button type="primary" @click="openCreate">新增专业</el-button>
    </header>

    <div class="table-card">
      <el-table :data="list" style="width:100%">
        <el-table-column prop="id" label="#" width="70" />
        <el-table-column prop="name" label="专业名称" />
        <el-table-column prop="code" label="代码" width="120" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch :model-value="row.enabled" @change="toggleEnabled(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" />
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dlg.show" :title="dlg.edit ? '编辑专业' : '新增专业'" width="480px">
      <el-form label-width="80px">
        <el-form-item label="名称" required><el-input v-model="dlg.name" /></el-form-item>
        <el-form-item label="代码"><el-input v-model="dlg.code" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="dlg.sort" :min="0" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="dlg.enabled" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="dlg.remark" type="textarea" :rows="2" /></el-form-item>
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
