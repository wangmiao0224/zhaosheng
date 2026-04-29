// 后台：新增扩展字段（核心字段不允许通过此接口创建）
const ALLOW_TYPES = ['text', 'textarea', 'number', 'date', 'radio', 'checkbox', 'select']
const KEY_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,40}$/

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const key = String(body?.key || '').trim()
  const label = String(body?.label || '').trim()
  const type = String(body?.type || '').trim()

  if (!KEY_RE.test(key)) {
    throw createError({ statusCode: 400, statusMessage: '字段标识 key 必须为字母开头，只允许字母数字下划线（最长 40）' })
  }
  if (!label) throw createError({ statusCode: 400, statusMessage: '字段名称必填' })
  if (!ALLOW_TYPES.includes(type)) {
    throw createError({ statusCode: 400, statusMessage: '字段类型不合法，可选：' + ALLOW_TYPES.join(', ') })
  }

  // 校验 options（radio / checkbox / select 必填）
  let options: any = null
  if (['radio', 'checkbox', 'select'].includes(type)) {
    if (!Array.isArray(body?.options) || body.options.length === 0) {
      throw createError({ statusCode: 400, statusMessage: '该类型字段需提供至少一个选项' })
    }
    options = body.options.map((o: any) => ({
      label: String(o.label || '').trim(),
      value: String(o.value ?? o.label ?? '').trim()
    })).filter((o: any) => o.label && o.value)
    if (options.length === 0) {
      throw createError({ statusCode: 400, statusMessage: '选项不能为空' })
    }
  }

  // 不允许与已有 key 冲突
  const dup = await prisma.formFieldConfig.findUnique({ where: { key } })
  if (dup) throw createError({ statusCode: 409, statusMessage: '该字段标识已存在' })

  // 排序：默认放到最后
  const max = await prisma.formFieldConfig.aggregate({ _max: { sort: true } })
  const sort = (max._max.sort ?? 0) + 10

  return prisma.formFieldConfig.create({
    data: {
      key, label, type,
      required: !!body?.required,
      enabled: body?.enabled !== false,
      isCore: false,
      sort,
      placeholder: body?.placeholder ? String(body.placeholder) : null,
      options,
      helpText: body?.helpText ? String(body.helpText) : null
    }
  })
})
