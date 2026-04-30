<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import 'element-plus/dist/index.css'
import Sortable from 'sortablejs'

definePageMeta({ layout: 'admin' })

const { data: fields, refresh, pending } = useLazyFetch<any[]>('/api/admin/form-config', {
  server: false, default: () => []
})

const tableRef = ref<any>(null)
let sortableInstance: Sortable | null = null

// 类型→中文
const TYPE_LABEL: Record<string, string> = {
  text: '单行文本', textarea: '多行文本', number: '数字', date: '日期',
  radio: '单选', checkbox: '多选', select: '下拉',
  gender: '性别（核心）', major: '专业一（核心）', major2: '专业二（核心）', slot: '测试时段（核心）'
}
const HAS_OPTIONS = ['radio', 'checkbox', 'select']

// 行内编辑：派生字段（不直接改 props）
const editing = ref<Record<number, any>>({})
function startEdit(row: any) {
  editing.value[row.id] = { ...row }
}
function cancelEdit(id: number) {
  delete editing.value[id]
}
async function saveRow(id: number) {
  const e = editing.value[id]
  const { error } = await apiCall(
    () => $fetch(`/api/admin/form-config/${id}`, {
      method: 'PATCH',
      body: {
        label: e.label, required: e.required, enabled: e.enabled,
        placeholder: e.placeholder, helpText: e.helpText
      }
    }),
    { successMsg: '已保存', errorFallback: '保存失败' }
  )
  if (!error) {
    delete editing.value[id]
    refresh()
  }
}

async function toggleEnabled(row: any) {
  const { error } = await apiCall(
    () => $fetch(`/api/admin/form-config/${row.id}`, {
      method: 'PATCH', body: { enabled: !row.enabled }
    }),
    { successMsg: row.enabled ? '已停用' : '已启用', errorFallback: '操作失败' }
  )
  if (!error) refresh()
  else refresh() // 失败时也刷新，让 switch 还原到真实状态
}

async function removeField(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定删除字段「${row.label}」吗？已收集的数据将不再展示。`,
      '删除确认', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch { return }
  const { error } = await apiCall(
    () => $fetch(`/api/admin/form-config/${row.id}`, { method: 'DELETE' }),
    { successMsg: '已删除', errorFallback: '删除失败' }
  )
  if (!error) refresh()
}

async function persistOrder(ids: number[]) {
  const { error } = await apiCall(
    () => $fetch('/api/admin/form-config/reorder', { method: 'POST', body: { ids } }),
    { successMsg: '排序已保存', errorFallback: '排序保存失败' }
  )
  if (!error) refresh()
  else refresh()
}

// === 新增字段弹窗 ===
const dialogVisible = ref(false)
const newField = ref<{
  key: string; label: string; type: string;
  required: boolean; enabled: boolean;
  placeholder: string; helpText: string;
  options: { label: string; value: string }[]
}>({
  key: '', label: '', type: 'text',
  required: false, enabled: true,
  placeholder: '', helpText: '',
  options: [{ label: '', value: '' }]
})
function openCreate() {
  newField.value = {
    key: '', label: '', type: 'text',
    required: false, enabled: true,
    placeholder: '', helpText: '',
    options: [{ label: '', value: '' }]
  }
  dialogVisible.value = true
}
function addOption() {
  newField.value.options.push({ label: '', value: '' })
}
function removeOption(idx: number) {
  newField.value.options.splice(idx, 1)
}
// 输入「选项名」时自动同步到「存储值」（用户基本不需要单独填）
function onOptionLabelInput(idx: number, val: string) {
  const opt = newField.value.options[idx]
  opt.label = val
  opt.value = val
}
async function submitCreate() {
  const f = newField.value
  if (!f.key || !f.label) {
    const { ElMessage } = await import('element-plus')
    ElMessage.warning('请填写字段标识与名称'); return
  }
  const body: any = {
    key: f.key.trim(), label: f.label.trim(), type: f.type,
    required: f.required, enabled: f.enabled,
    placeholder: f.placeholder, helpText: f.helpText
  }
  if (HAS_OPTIONS.includes(f.type)) {
    // value 留空时回退用 label，避免用户漏填
    body.options = f.options
      .map(o => ({ label: (o.label || '').trim(), value: (o.value || o.label || '').trim() }))
      .filter(o => o.label)
    if (body.options.length === 0) {
      const { ElMessage } = await import('element-plus')
      ElMessage.warning('请至少填写一个选项'); return
    }
  }
  const { error } = await apiCall(
    () => $fetch('/api/admin/form-config', { method: 'POST', body }),
    { successMsg: '已创建', errorFallback: '创建失败' }
  )
  if (!error) {
    dialogVisible.value = false
    refresh()
  }
}

// === 拖拽排序 ===
function initSortable() {
  if (sortableInstance) { sortableInstance.destroy(); sortableInstance = null }
  const el = tableRef.value?.$el?.querySelector('.el-table__body tbody') as HTMLElement | null
  if (!el) return
  sortableInstance = Sortable.create(el, {
    animation: 180,
    handle: '.drag-handle',
    ghostClass: 'drag-ghost',
    onEnd: async (evt) => {
      if (evt.oldIndex == null || evt.newIndex == null || evt.oldIndex === evt.newIndex) return
      const list = [...(fields.value || [])]
      const [moved] = list.splice(evt.oldIndex, 1)
      list.splice(evt.newIndex, 0, moved)
      await persistOrder(list.map(f => f.id))
    }
  })
}

onMounted(() => {
  // 等 el-table 首次渲染后初始化
  watch(fields, async () => {
    await nextTick()
    initSortable()
  }, { immediate: true })
})

onBeforeUnmount(() => {
  if (sortableInstance) { sortableInstance.destroy(); sortableInstance = null }
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>表单设计</h2>
        <p class="subtitle">配置 H5 报名页表单字段。核心字段不可删除，但可调整名称、是否必填、占位提示等。</p>
      </div>
      <el-button type="primary" @click="openCreate">+ 新增扩展字段</el-button>
    </div>

    <el-card shadow="never" class="card">
      <el-table ref="tableRef" :data="fields || []" v-loading="pending" stripe row-key="id">
        <el-table-column label="" width="50" align="center">
          <template #default>
            <span class="drag-handle" title="拖拽排序">⋮⋮</span>
          </template>
        </el-table-column>

        <el-table-column label="字段标识 / 类型" width="220">
          <template #default="{ row }">
            <div style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">{{ row.key }}</div>
            <div class="meta">
              <el-tag size="small" :type="row.isCore ? 'warning' : 'success'">
                {{ row.isCore ? '核心' : '扩展' }}
              </el-tag>
              <span class="type-text">{{ TYPE_LABEL[row.type] || row.type }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="字段名称" min-width="180">
          <template #default="{ row }">
            <el-input
              v-if="editing[row.id]" v-model="editing[row.id].label" size="small" />
            <span v-else>{{ row.label }}</span>
          </template>
        </el-table-column>

        <el-table-column label="占位提示" min-width="200">
          <template #default="{ row }">
            <el-input
              v-if="editing[row.id]" v-model="editing[row.id].placeholder" size="small" placeholder="可选" />
            <span v-else class="muted">{{ row.placeholder || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="必填" width="80">
          <template #default="{ row }">
            <el-switch
              v-if="editing[row.id]" v-model="editing[row.id].required" />
            <el-tag v-else-if="row.required" type="danger" size="small">必填</el-tag>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>

        <el-table-column label="启用" width="80">
          <template #default="{ row }">
            <el-switch
              v-if="editing[row.id]" v-model="editing[row.id].enabled" />
            <el-switch v-else :model-value="row.enabled" @change="toggleEnabled(row)" />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="editing[row.id]">
              <el-button size="small" type="primary" @click="saveRow(row.id)">保存</el-button>
              <el-button size="small" @click="cancelEdit(row.id)">取消</el-button>
            </template>
            <template v-else>
              <el-button size="small" @click="startEdit(row)">编辑</el-button>
              <el-button v-if="!row.isCore" size="small" type="danger" @click="removeField(row)">删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增弹窗 -->
    <el-dialog v-model="dialogVisible" title="新增扩展字段" width="560px">
      <el-form label-width="100px" label-position="right">
        <el-form-item label="字段标识" required>
          <el-input v-model="newField.key" placeholder="字母开头，如 parentName" />
          <div class="form-tip">用于数据库存储，提交后不可修改</div>
        </el-form-item>
        <el-form-item label="字段名称" required>
          <el-input v-model="newField.label" placeholder="如 家长姓名" />
        </el-form-item>
        <el-form-item label="字段类型">
          <el-select v-model="newField.type" style="width: 100%">
            <el-option label="单行文本" value="text" />
            <el-option label="多行文本" value="textarea" />
            <el-option label="数字" value="number" />
            <el-option label="日期" value="date" />
            <el-option label="单选" value="radio" />
            <el-option label="多选" value="checkbox" />
            <el-option label="下拉" value="select" />
          </el-select>
        </el-form-item>
        <el-form-item label="占位提示">
          <el-input v-model="newField.placeholder" placeholder="可选" />
        </el-form-item>
        <el-form-item label="必填">
          <el-switch v-model="newField.required" />
        </el-form-item>
        <el-form-item v-if="HAS_OPTIONS.includes(newField.type)" label="选项">
          <div style="width: 100%">
            <div v-for="(opt, i) in newField.options" :key="i" class="opt-row">
              <el-input
                :model-value="opt.label"
                @update:model-value="(v: string) => onOptionLabelInput(i, v)"
                :placeholder="`选项 ${i + 1}，例如：是 / 否`"
                size="small" style="flex:1" />
              <el-button size="small" :disabled="newField.options.length <= 1" @click="removeOption(i)">删</el-button>
            </div>
            <el-button size="small" @click="addOption">+ 添加选项</el-button>
            <div class="form-tip">用户在表单上看到、提交后保存到数据库的都是这个文本</div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; gap: 16px; }
.page-header h2 { margin: 0 0 4px; font-size: 20px; }
.subtitle { color: #6b7280; font-size: 13px; margin: 0; max-width: 700px; }
.card { border-radius: 12px; }
.meta { display: flex; gap: 6px; align-items: center; margin-top: 4px; }
.type-text { color: #6b7280; font-size: 12px; }
.muted { color: #9ca3af; }
.form-tip { color: #9ca3af; font-size: 12px; margin-top: 4px; }
.opt-row { display: flex; gap: 8px; margin-bottom: 6px; align-items: center; }

/* 拖拽柄 + 拖拽样式 */
.drag-handle {
  cursor: grab;
  color: #c0c4cc;
  font-size: 18px;
  letter-spacing: -3px;
  user-select: none;
  display: inline-block;
  padding: 4px 6px;
  border-radius: 4px;
  transition: color .15s, background .15s;
}
.drag-handle:hover { color: #1d4f8b; background: #f0f4fb; }
.drag-handle:active { cursor: grabbing; }
:deep(.drag-ghost) { opacity: 0.4; background: #ecf5ff !important; }
</style>
