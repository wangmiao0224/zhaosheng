interface ApplyBody {
  gaokaoNo?: string
  name: string
  idCard: string
  gender: 'male' | 'female'
  phone: string
  ethnicity: string
  hometown: string
  graduateSchool: string
  major1Id: number
  major2Id?: number
  testSlotId?: number
  awards?: string
  address: string
  extraData?: Record<string, any>
}

const ID_RE = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
const PHONE_RE = /^1[3-9]\d{9}$/

// 业务必须的核心字段（无论配置如何都必填）
const ALWAYS_REQUIRED = ['name', 'idCard', 'phone', 'major1Id']

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (!rateLimit('apply:' + ip, 3, 60_000)) {
    throw createError({ statusCode: 429, statusMessage: '提交过于频繁，请稍后再试' })
  }

  const body = await readBody<ApplyBody>(event)

  // 读取启用的字段配置
  const fieldsCfg = await prisma.formFieldConfig.findMany({ where: { enabled: true } })
  const cfgMap = new Map(fieldsCfg.map(f => [f.key, f]))

  // 必填校验：业务必须 + 核心字段中配置为 required 的
  const coreRequired = new Set<string>(ALWAYS_REQUIRED)
  for (const f of fieldsCfg) {
    if (f.isCore && f.required) coreRequired.add(f.key)
  }
  for (const k of coreRequired) {
    const v = (body as any)?.[k]
    if (v === undefined || v === null || v === '') {
      const label = cfgMap.get(k)?.label || k
      throw createError({ statusCode: 400, statusMessage: `请填写「${label}」` })
    }
  }

  if (!ID_RE.test(body.idCard)) throw createError({ statusCode: 400, statusMessage: '身份证号格式不正确' })
  if (!PHONE_RE.test(body.phone)) throw createError({ statusCode: 400, statusMessage: '手机号格式不正确' })
  if (!['male', 'female'].includes(body.gender)) throw createError({ statusCode: 400, statusMessage: '性别参数不合法' })

  // 防重复
  const dup = await prisma.application.findUnique({ where: { idCard: body.idCard } })
  if (dup) throw createError({ statusCode: 409, statusMessage: '该身份证号已提交报名，无需重复提交' })

  // 测试时段容量校验
  if (body.testSlotId) {
    const slot = await prisma.testSlot.findUnique({ where: { id: body.testSlotId } })
    if (!slot || !slot.enabled) throw createError({ statusCode: 400, statusMessage: '所选测试时段不可用' })
    if (slot.capacity > 0) {
      const used = await prisma.application.count({ where: { testSlotId: slot.id } })
      if (used >= slot.capacity) throw createError({ statusCode: 400, statusMessage: '所选测试时段已满' })
    }
  }

  // 扩展字段处理：仅保留启用的扩展字段，校验必填，并按类型规范化值
  const extraOut: Record<string, any> = {}
  const incomingExtra = body.extraData && typeof body.extraData === 'object' ? body.extraData : {}
  for (const f of fieldsCfg) {
    if (f.isCore) continue
    const raw = (incomingExtra as any)[f.key]
    const isEmpty = raw === undefined || raw === null || raw === '' || (Array.isArray(raw) && raw.length === 0)
    if (f.required && isEmpty) {
      throw createError({ statusCode: 400, statusMessage: `请填写「${f.label}」` })
    }
    if (isEmpty) continue

    let val: any = raw
    const opts = Array.isArray(f.options) ? (f.options as any[]) : []
    const allowedValues = opts.map(o => String(o.value))

    switch (f.type) {
      case 'text':
      case 'textarea':
      case 'date':
        val = String(val).trim().slice(0, 2000)
        break
      case 'number':
        val = Number(val)
        if (Number.isNaN(val)) {
          throw createError({ statusCode: 400, statusMessage: `「${f.label}」必须为数字` })
        }
        break
      case 'radio':
      case 'select':
        val = String(val)
        if (allowedValues.length && !allowedValues.includes(val)) {
          throw createError({ statusCode: 400, statusMessage: `「${f.label}」选项不合法` })
        }
        break
      case 'checkbox':
        if (!Array.isArray(val)) val = [val]
        val = val.map((x: any) => String(x))
        if (allowedValues.length) val = val.filter((x: string) => allowedValues.includes(x))
        break
      default:
        val = String(val)
    }
    extraOut[f.key] = val
  }

  const created = await prisma.application.create({
    data: {
      gaokaoNo: body.gaokaoNo?.trim() || null,
      name: body.name.trim(),
      idCard: body.idCard.trim().toUpperCase(),
      gender: body.gender,
      phone: body.phone.trim(),
      ethnicity: body.ethnicity.trim(),
      hometown: body.hometown.trim(),
      graduateSchool: body.graduateSchool.trim(),
      major1Id: Number(body.major1Id),
      major2Id: body.major2Id ? Number(body.major2Id) : null,
      testSlotId: body.testSlotId ? Number(body.testSlotId) : null,
      awards: body.awards?.trim() || null,
      address: body.address.trim(),
      extraData: Object.keys(extraOut).length ? extraOut : undefined,
      ip
    },
    select: { id: true, createdAt: true }
  })
  return { ok: true, id: created.id, createdAt: created.createdAt }
})
