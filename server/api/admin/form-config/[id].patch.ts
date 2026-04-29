// 后台：更新字段
// 核心字段：仅可改 label / required / enabled / placeholder / helpText / sort（key 与 type 不可改）
// 扩展字段：上述均可改，且可改 options
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id 不合法' })

  const exist = await prisma.formFieldConfig.findUnique({ where: { id } })
  if (!exist) throw createError({ statusCode: 404, statusMessage: '字段不存在' })

  const body = await readBody(event)

  const data: any = {}
  if (body?.label !== undefined) {
    const v = String(body.label).trim()
    if (!v) throw createError({ statusCode: 400, statusMessage: '字段名称不能为空' })
    data.label = v
  }
  if (body?.required !== undefined) data.required = !!body.required
  if (body?.enabled !== undefined) {
    // 核心字段中 name / idCard / phone / major1Id 不允许停用（业务必须）
    const lockEnabled = ['name', 'idCard', 'phone', 'major1Id']
    if (exist.isCore && lockEnabled.includes(exist.key) && body.enabled === false) {
      throw createError({ statusCode: 400, statusMessage: `核心字段「${exist.label}」不可停用` })
    }
    data.enabled = !!body.enabled
  }
  if (body?.placeholder !== undefined) data.placeholder = body.placeholder ? String(body.placeholder) : null
  if (body?.helpText !== undefined) data.helpText = body.helpText ? String(body.helpText) : null
  if (body?.sort !== undefined) data.sort = Number(body.sort) || 0

  // 扩展字段才允许改 options
  if (!exist.isCore && body?.options !== undefined) {
    if (['radio', 'checkbox', 'select'].includes(exist.type)) {
      if (!Array.isArray(body.options) || body.options.length === 0) {
        throw createError({ statusCode: 400, statusMessage: '该类型字段需提供至少一个选项' })
      }
      data.options = body.options.map((o: any) => ({
        label: String(o.label || '').trim(),
        value: String(o.value ?? o.label ?? '').trim()
      })).filter((o: any) => o.label && o.value)
    }
  }

  return prisma.formFieldConfig.update({ where: { id }, data })
})
