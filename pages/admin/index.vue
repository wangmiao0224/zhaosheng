<script setup lang="ts">
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'

use([CanvasRenderer, PieChart, BarChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useHead({ title: '仪表盘' })

const { data: stats, refresh } = useLazyFetch('/api/admin/stats', { server: false })

const STATUS_LABEL: Record<string, string> = {
  pending: '待处理', contacted: '已联系', admitted: '已录取', rejected: '已拒绝'
}

const statusOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [{
    type: 'pie',
    radius: ['50%', '72%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
    label: { show: true, formatter: '{b}\n{c}' },
    data: (stats.value?.byStatus || []).map(s => ({
      name: STATUS_LABEL[s.status] || s.status, value: s.count
    }))
  }]
}))

const genderOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  color: ['#1d4f8b', '#f472b6'],
  series: [{
    type: 'pie', radius: '70%',
    data: (stats.value?.byGender || []).map(g => ({
      name: g.gender === 'male' ? '男生' : '女生', value: g.count
    }))
  }]
}))

const majorOption = computed(() => ({
  grid: { left: 10, right: 30, top: 20, bottom: 10, containLabel: true },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'value' },
  yAxis: { type: 'category', data: (stats.value?.topMajors || []).map(m => m.name).reverse() },
  series: [{
    type: 'bar',
    data: (stats.value?.topMajors || []).map(m => m.count).reverse(),
    itemStyle: { color: '#1d4f8b', borderRadius: [0, 6, 6, 0] }
  }]
}))

const trendOption = computed(() => ({
  grid: { left: 30, right: 20, top: 30, bottom: 30 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: (stats.value?.trend || []).map(t => t.date.slice(5)) },
  yAxis: { type: 'value' },
  series: [{
    type: 'line', smooth: true, symbol: 'circle',
    areaStyle: { color: 'rgba(29,79,139,0.12)' },
    lineStyle: { color: '#1d4f8b', width: 2 },
    itemStyle: { color: '#1d4f8b' },
    data: (stats.value?.trend || []).map(t => t.count)
  }]
}))
</script>

<template>
  <div class="dashboard">
    <header class="page-head">
      <div>
        <h1>数据概览</h1>
        <p class="muted">招生报名实时统计</p>
      </div>
      <button class="refresh" @click="refresh()">刷新</button>
    </header>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">累计报名</div>
        <div class="kpi-value">{{ stats?.total || 0 }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">今日新增</div>
        <div class="kpi-value">{{ stats?.todayCount || 0 }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">本周新增</div>
        <div class="kpi-value">{{ stats?.weekCount || 0 }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">报读专业 Top1</div>
        <div class="kpi-value-sm">{{ stats?.topMajors?.[0]?.name || '—' }}</div>
        <div class="muted">{{ stats?.topMajors?.[0]?.count || 0 }} 人</div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card span-2">
        <h3>近 30 天报名趋势</h3>
        <VChart class="chart" :option="trendOption" autoresize />
      </div>
      <div class="chart-card">
        <h3>状态分布</h3>
        <VChart class="chart" :option="statusOption" autoresize />
      </div>
      <div class="chart-card">
        <h3>性别比例</h3>
        <VChart class="chart" :option="genderOption" autoresize />
      </div>
      <div class="chart-card span-2">
        <h3>报读专业 Top10</h3>
        <VChart class="chart" :option="majorOption" autoresize />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard { max-width: 1280px; margin: 0 auto; }
.page-head { display: flex; justify-content: space-between; align-items: end; margin-bottom: 20px; }
.page-head h1 { margin: 0; font-size: 22px; color: #1f2937; }
.muted { color: #6b7280; font-size: 13px; margin: 4px 0 0; }
.refresh {
  padding: 8px 16px; background: #fff; border: 1px solid #e5e7eb;
  border-radius: 8px; cursor: pointer; font-size: 13px;
}
.refresh:hover { border-color: #1d4f8b; color: #1d4f8b; }

.kpi-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 16px; margin-bottom: 20px;
}
.kpi-card {
  background: #fff; border-radius: 14px; padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.kpi-label { color: #6b7280; font-size: 13px; }
.kpi-value { font-size: 32px; font-weight: 700; color: #1d4f8b; margin-top: 6px; }
.kpi-value-sm { font-size: 20px; font-weight: 700; color: #1f2937; margin-top: 6px; }

.charts-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
}
.chart-card {
  background: #fff; border-radius: 14px; padding: 18px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.chart-card.span-2 { grid-column: span 2; }
.chart-card h3 { margin: 0 0 12px; font-size: 15px; color: #1f2937; }
.chart { height: 280px; }
</style>
