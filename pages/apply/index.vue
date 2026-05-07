<script setup lang="ts">
import { showSuccessToast, showDialog } from 'vant'

const router = useRouter()

const { data: cfg } = await useFetch('/api/public/config')
const { data: majors } = await useFetch('/api/public/majors')
const { data: slots } = await useFetch('/api/public/slots')
const { data: fieldsCfg } = await useFetch<any[]>('/api/public/form-config')

// 浏览器标签 + 分享卡片（微信/QQ 等聊天里贴链接显示的标题/描述/缩略图）
// 优先使用后台「分享卡片」单独配置（shareTitle / shareDescription / shareImage），
// 缺省时回落到学校名称 / 网站描述 / 首页 banner。
const shareTitle = computed(() => {
  const cfgAny = cfg.value as any
  if (cfgAny?.shareTitle) return cfgAny.shareTitle
  const s = cfg.value?.schoolName || '招生'
  const c = cfg.value?.collegeName ? ' · ' + cfg.value.collegeName : ''
  return `${s}${c} 在线报名`
})
const shareDesc = computed(() => {
  const cfgAny = cfg.value as any
  return cfgAny?.shareDescription
    || cfg.value?.siteDescription
    || `${cfg.value?.schoolName || ''} 在线报名通道，点击进入填写报名信息。`
})
const shareImg = computed(() => {
  const cfgAny = cfg.value as any
  return cfgAny?.shareImage || cfg.value?.bannerImage || ''
})

// 把相对路径转成绝对 URL（社交平台抓取需要绝对地址）
const reqUrl = useRequestURL()
const origin = reqUrl?.origin || ''
const absShareImg = computed(() => {
  const p = shareImg.value
  if (!p) return ''
  if (/^https?:\/\//i.test(p)) return p
  return origin + p
})

useHead({
  title: () => shareTitle.value,
  meta: [
    { name: 'description', content: () => shareDesc.value },
    { property: 'og:title', content: () => shareTitle.value },
    { property: 'og:description', content: () => shareDesc.value },
    { property: 'og:image', content: () => absShareImg.value },
    { name: 'twitter:title', content: () => shareTitle.value },
    { name: 'twitter:description', content: () => shareDesc.value },
    { name: 'twitter:image', content: () => absShareImg.value },
  ]
})

const form = reactive({
  gaokaoNo: '',
  name: '',
  idCard: '',
  gender: 'male',
  phone: '',
  ethnicity: '',
  hometown: '',
  graduateSchool: '',
  major1Id: null as number | null,
  major2Id: null as number | null,
  testSlotId: null as number | null,
  awards: '',
  address: ''
})

const extraFields = computed(() => (fieldsCfg.value || []).filter(f => !f.isCore && f.enabled))const extraData = reactive<Record<string, any>>({})
watchEffect(() => {
  for (const f of extraFields.value) {
    if (!(f.key in extraData)) extraData[f.key] = f.type === 'checkbox' ? [] : ''
  }
})

const pickerVisible = ref<Record<string, boolean>>({})
function openPicker(key: string) { pickerVisible.value[key] = true }
function closePicker(key: string) { pickerVisible.value[key] = false }
function pickerColumns(opts: any[]) { return (opts || []).map(o => ({ text: o.label, value: o.value })) }
function pickerDisplay(key: string, opts: any[]) {
  const v = extraData[key]
  return opts?.find(o => o.value === v)?.label || ''
}

const showMajor1 = ref(false)
const showMajor2 = ref(false)
const showSlot = ref(false)

const majorColumns = computed(() => (majors.value || []).map(m => ({ text: m.name, value: m.id })))
const slotColumns = computed(() =>
  (slots.value || []).map(s => ({
    text: s.label + (s.capacity > 0 ? ` (${s.used}/${s.capacity})` : ''),
    value: s.id,
    disabled: s.capacity > 0 && s.used >= s.capacity
  }))
)

const major1Name = computed(() => majors.value?.find(m => m.id === form.major1Id)?.name || '')
const major2Name = computed(() => majors.value?.find(m => m.id === form.major2Id)?.name || '')
const slotName = computed(() => slots.value?.find(s => s.id === form.testSlotId)?.label || '')

const submitting = ref(false)

async function submit() {
  if (submitting.value) return
  for (const f of extraFields.value) {
    if (!f.required) continue
    const v = extraData[f.key]
    const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
    if (empty) {
      showDialog({
        title: '提交失败', message: `请填写「${f.label}」`,
        theme: 'round-button', confirmButtonColor: '#1d4f8b'
      })
      return
    }
  }

  submitting.value = true
  try {
    const res = await $fetch<{ id: number }>('/api/public/apply', {
      method: 'POST',
      body: { ...form, extraData: { ...extraData } }
    })
    showSuccessToast({ message: '提交成功', duration: 800 })
    router.replace(`/apply/success?id=${res.id}&name=${encodeURIComponent(form.name)}`)
  } catch (e: any) {
    const msg =
      e?.data?.statusMessage || e?.data?.message ||
      e?.statusMessage || e?.message || '提交失败，请稍后重试'
    showDialog({
      title: '提交失败', message: msg,
      theme: 'round-button', confirmButtonText: '我知道了',
      confirmButtonColor: '#1d4f8b'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="apply">
    <div class="brand-bar">{{ cfg?.schoolName || '报名' }}</div>

    <!-- 有 banner 图就只显示图片；否则回退到默认渐变 + 文字 -->
    <div v-if="cfg?.bannerImage" class="banner-img">
      <img :src="cfg.bannerImage" alt="" />
    </div>
    <div v-else class="banner">
      <div class="banner-mask">
        <div class="banner-title">{{ cfg?.schoolName }}报名系统</div>
      </div>
    </div>

    <van-form class="form" @submit="submit">
      <van-cell-group inset>
        <!-- 所有字段统一按后台 sort 顺序渲染 -->
        <template v-for="f in (fieldsCfg || [])" :key="f.id">
          <!-- ===== 核心字段 ===== -->
          <van-field v-if="f.key === 'gaokaoNo'"
            v-model="form.gaokaoNo"
            :label="f.label" :placeholder="f.placeholder"
            :required="f.required"
            :rules="f.required ? [{ required: true }] : []" />

          <van-field v-else-if="f.key === 'name'"
            v-model="form.name"
            :label="f.label" :placeholder="f.placeholder"
            :required="f.required"
            :rules="f.required ? [{ required: true }] : []" />

          <van-field v-else-if="f.key === 'idCard'"
            v-model="form.idCard"
            :label="f.label" :placeholder="f.placeholder"
            :required="f.required"
            :rules="f.required ? [{ required: true }] : []" />

          <van-field v-else-if="f.key === 'gender'" name="gender"
            :label="f.label" :required="f.required">
            <template #input>
              <van-radio-group v-model="form.gender" direction="horizontal">
                <van-radio name="male" icon-size="18px">男生</van-radio>
                <van-radio name="female" icon-size="18px">女生</van-radio>
              </van-radio-group>
            </template>
          </van-field>

          <van-field v-else-if="f.key === 'phone'"
            v-model="form.phone" type="tel"
            :label="f.label" :placeholder="f.placeholder"
            :required="f.required"
            :rules="f.required ? [{ required: true }] : []" />

          <van-field v-else-if="f.key === 'ethnicity'"
            v-model="form.ethnicity"
            :label="f.label" :placeholder="f.placeholder"
            :required="f.required"
            :rules="f.required ? [{ required: true }] : []" />

          <van-field v-else-if="f.key === 'hometown'"
            v-model="form.hometown"
            :label="f.label" :placeholder="f.placeholder"
            :required="f.required"
            :rules="f.required ? [{ required: true }] : []" />

          <van-field v-else-if="f.key === 'graduateSchool'"
            v-model="form.graduateSchool" input-align="right"
            :label="f.label" :placeholder="f.placeholder"
            :required="f.required"
            :rules="f.required ? [{ required: true }] : []" />

          <van-field v-else-if="f.key === 'major1Id'"
            readonly clickable
            :label="f.label" :required="f.required"
            :model-value="major1Name"
            :placeholder="f.placeholder || '请选择报读专业'"
            input-align="right" right-icon="arrow"
            @click="showMajor1 = true" />

          <van-field v-else-if="f.key === 'major2Id'"
            readonly clickable
            :label="f.label" :required="f.required"
            :model-value="major2Name"
            :placeholder="f.placeholder || '请选择报读专业'"
            input-align="right" right-icon="arrow"
            @click="showMajor2 = true" />

          <van-field v-else-if="f.key === 'testSlotId'"
            readonly clickable
            :label="f.label" :required="f.required"
            :model-value="slotName"
            :placeholder="f.placeholder || '请选择面试或笔试时间'"
            input-align="right" right-icon="arrow"
            @click="showSlot = true" />

          <van-field v-else-if="f.key === 'awards'"
            v-model="form.awards"
            :label="f.label" :placeholder="f.placeholder"
            :required="f.required"
            type="textarea" rows="3" autosize maxlength="500" label-align="top"
            :rules="f.required ? [{ required: true }] : []" />

          <van-field v-else-if="f.key === 'address'"
            v-model="form.address"
            :label="f.label" :placeholder="f.placeholder"
            :required="f.required"
            type="textarea" rows="2" autosize label-align="top"
            :rules="f.required ? [{ required: true }] : []" />

          <!-- ===== 扩展字段（按 type 渲染）===== -->
          <van-field v-else-if="f.type === 'text'"
            v-model="extraData[f.key]"
            :label="f.label" :placeholder="f.placeholder" :required="f.required"
            :rules="f.required ? [{ required: true }] : []" />

          <van-field v-else-if="f.type === 'number'"
            v-model="extraData[f.key]" type="number"
            :label="f.label" :placeholder="f.placeholder" :required="f.required"
            :rules="f.required ? [{ required: true }] : []" />

          <van-field v-else-if="f.type === 'date'"
            v-model="extraData[f.key]" type="date"
            :label="f.label" :placeholder="f.placeholder || 'YYYY-MM-DD'" :required="f.required"
            :rules="f.required ? [{ required: true }] : []" />

          <van-field v-else-if="f.type === 'textarea'"
            v-model="extraData[f.key]" type="textarea" rows="2" autosize
            :label="f.label" :placeholder="f.placeholder" :required="f.required" label-align="top"
            :rules="f.required ? [{ required: true }] : []" />

          <van-field v-else-if="f.type === 'radio'"
            :name="f.key" :label="f.label" :required="f.required"
            :label-align="(f.options?.length || 0) >= 4 ? 'top' : undefined">
            <template #input>
              <van-radio-group v-model="extraData[f.key]" direction="horizontal" class="wrap-radio">
                <van-radio v-for="o in f.options" :key="o.value" :name="o.value" icon-size="18px">
                  {{ o.label }}
                </van-radio>
              </van-radio-group>
            </template>
          </van-field>

          <van-field v-else-if="f.type === 'checkbox'"
            :name="f.key" :label="f.label" :required="f.required" label-align="top">
            <template #input>
              <van-checkbox-group v-model="extraData[f.key]" direction="horizontal">
                <van-checkbox v-for="o in f.options" :key="o.value" :name="o.value" shape="square" icon-size="18px">
                  {{ o.label }}
                </van-checkbox>
              </van-checkbox-group>
            </template>
          </van-field>

          <van-field v-else-if="f.type === 'select'"
            readonly clickable
            :label="f.label" :required="f.required"
            :model-value="pickerDisplay(f.key, f.options)"
            :placeholder="f.placeholder || '请选择'"
            input-align="right" right-icon="arrow"
            @click="openPicker(f.key)" />
        </template>
      </van-cell-group>

      <div class="submit-wrap">
        <button type="submit" class="btn-primary" :disabled="submitting">
          {{ submitting ? '提交中…' : '提交报名' }}
        </button>
      </div>
    </van-form>

    <van-popup v-model:show="showMajor1" position="bottom" round>
      <van-picker title="报读专业一" :columns="majorColumns"
        @cancel="showMajor1 = false"
        @confirm="(v: any) => { form.major1Id = v.selectedValues[0]; showMajor1 = false }" />
    </van-popup>
    <van-popup v-model:show="showMajor2" position="bottom" round>
      <van-picker title="报读专业二" :columns="majorColumns"
        @cancel="showMajor2 = false"
        @confirm="(v: any) => { form.major2Id = v.selectedValues[0]; showMajor2 = false }" />
    </van-popup>
    <van-popup v-model:show="showSlot" position="bottom" round>
      <van-picker title="预约测试时间" :columns="slotColumns"
        @cancel="showSlot = false"
        @confirm="(v: any) => { form.testSlotId = v.selectedValues[0]; showSlot = false }" />
    </van-popup>

    <template v-for="f in extraFields" :key="'p-' + f.id">
      <van-popup v-if="f.type === 'select'"
        v-model:show="pickerVisible[f.key]" position="bottom" round>
        <van-picker :title="f.label" :columns="pickerColumns(f.options)"
          @cancel="closePicker(f.key)"
          @confirm="(v: any) => { extraData[f.key] = v.selectedValues[0]; closePicker(f.key) }" />
      </van-popup>
    </template>
  </div>
</template>

<style scoped>
.apply { min-height: 100vh; background: var(--bg); padding-bottom: 32px; }
.banner-img { margin: 12px; border-radius: 14px; overflow: hidden; background: #1d4f8b; }
.banner-img img { display: block; width: 100%; height: auto; }
.banner {
  margin: 12px; height: 130px; border-radius: 14px;
  background-image: linear-gradient(135deg, rgba(29,79,139,0.7), rgba(46,108,182,0.7)),
                    url('https://images.unsplash.com/photo-1562774053-701939374585?w=900');
  background-size: cover; background-position: center;
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.banner-title { color: #fff; font-size: 17px; font-weight: 700; letter-spacing: 1px; padding: 0 16px; }
.form { margin-top: 6px; }
.submit-wrap { padding: 24px 16px 16px; }
:deep(.van-cell-group--inset) { margin: 12px; border-radius: 14px; overflow: hidden; }
:deep(.van-field__label) { font-size: 14px; color: var(--text); }
:deep(.van-radio-group--horizontal) { gap: 24px; }
:deep(.van-checkbox-group--horizontal) { gap: 18px; }
</style>
/* 选项较多时允许横向换行，避免挤成竖排或溢出 */
:deep(.wrap-radio) { display: flex; flex-wrap: wrap; row-gap: 10px; column-gap: 24px; width: 100%; }
