<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import 'element-plus/dist/index.css'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useHead({ title: '报名记录' })

const filter = reactive({
  keyword: '',
  status: '',
  major: '' as number | '',
  from: '',
  to: ''
})
const page = ref(1)
const size = ref(20)

const { data: majors } = useLazyFetch('/api/admin/majors', { server: false, default: () => [] as any[] })

const queryParams = computed(() => ({
  ...filter,
  page: page.value,
  size: size.value
}))

const { data, refresh, pending } = useLazyFetch('/api/admin/applications', {
  query: queryParams,
  watch: [queryParams],
  server: false
})

const STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '待处理', value: 'pending' },
  { label: '已联系', value: 'contacted' },
  { label: '已录取', value: 'admitted' },
  { label: '已拒绝', value: 'rejected' }
]
function statusLabel(s: string) {
  return STATUS_OPTIONS.find(o => o.value === s)?.label || s
}
function statusTagType(s: string) {
  return ({ pending: 'warning', contacted: '', admitted: 'success', rejected: 'danger' } as any)[s] || ''
}

function exportExcel() {
  const qs = new URLSearchParams()
  Object.entries(filter).forEach(([k, v]) => { if (v) qs.set(k, String(v)) })
  window.open('/api/admin/applications/export?' + qs.toString(), '_blank')
}

async function changeStatus(row: any, status: string) {
  const { error } = await apiCall(
    () => $fetch(`/api/admin/applications/${row.id}`, { method: 'PATCH', body: { status } }),
    { successMsg: '状态已更新', errorFallback: '更新失败' }
  )
  if (!error) refresh()
}

async function removeRow(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.name} 的报名记录吗？此操作不可恢复。`, '确认', { type: 'warning' })
  } catch { return }
  const { error } = await apiCall(
    () => $fetch(`/api/admin/applications/${row.id}`, { method: 'DELETE' }),
    { successMsg: '已删除', errorFallback: '删除失败' }
  )
  if (!error) refresh()
}

const router = useRouter()
function viewDetail(row: any) {
  router.push(`/admin/applications/${row.id}`)
}
</script>

<template>
  <div class="page-wrap">
    <header class="page-head">
      <div>
        <h1>报名记录</h1>
        <p class="muted">共 {{ data?.total || 0 }} 条记录</p>
      </div>
      <el-button type="success" @click="exportExcel">导出 Excel</el-button>
    </header>

    <div class="filter-bar">
      <el-input v-model="filter.keyword" placeholder="姓名 / 手机 / 身份证" clearable style="width:220px" />
      <el-select v-model="filter.status" placeholder="状态" clearable style="width:140px">
        <el-option v-for="o in STATUS_OPTIONS.slice(1)" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
      <el-select v-model="filter.major" placeholder="报读专业" clearable filterable style="width:200px">
        <el-option v-for="m in majors" :key="m.id" :label="m.name" :value="m.id" />
      </el-select>
      <el-date-picker v-model="filter.from" type="date" placeholder="起始日期" value-format="YYYY-MM-DD" style="width:160px" />
      <el-date-picker v-model="filter.to" type="date" placeholder="截止日期" value-format="YYYY-MM-DD" style="width:160px" />
      <el-button @click="page = 1; refresh()">查询</el-button>
    </div>

    <div class="table-card">
      <el-table :data="data?.list" stripe v-loading="pending" style="width:100%">
        <el-table-column prop="id" label="#" width="70" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column label="性别" width="70">
          <template #default="{ row }">{{ row.gender === 'male' ? '男' : '女' }}</template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="idCard" label="身份证" width="180" />
        <el-table-column label="报读专业一" width="150">
          <template #default="{ row }">{{ row.major1?.name }}</template>
        </el-table-column>
        <el-table-column label="测试时段" width="180">
          <template #default="{ row }">{{ row.testSlot?.label || '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="170">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">查看</el-button>
            <el-dropdown @command="(c: string) => changeStatus(row, c)">
              <el-button link type="primary">改状态</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="o in STATUS_OPTIONS.slice(1)" :key="o.value" :command="o.value">{{ o.label }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button link type="danger" @click="removeRow(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          background layout="total, sizes, prev, pager, next, jumper"
          :total="data?.total || 0"
          v-model:current-page="page"
          v-model:page-size="size"
          :page-sizes="[10, 20, 50, 100]"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-wrap { max-width: 1400px; margin: 0 auto; }
.page-head { display: flex; justify-content: space-between; align-items: end; margin-bottom: 16px; }
.page-head h1 { margin: 0; font-size: 22px; color: #1f2937; }
.muted { color: #6b7280; font-size: 13px; margin: 4px 0 0; }
.filter-bar {
  display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px;
  background: #fff; padding: 14px; border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.table-card { background: #fff; border-radius: 12px; padding: 8px 16px 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.pager { display: flex; justify-content: flex-end; padding: 16px 0 4px; }
</style>
