// 后台：删除字段（核心字段不可删）
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id 不合法' })
  const exist = await prisma.formFieldConfig.findUnique({ where: { id } })
  if (!exist) throw createError({ statusCode: 404, statusMessage: '字段不存在' })
  if (exist.isCore) throw createError({ statusCode: 400, statusMessage: '核心字段不可删除（可改为停用）' })
  await prisma.formFieldConfig.delete({ where: { id } })
  return { ok: true }
})
