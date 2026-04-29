// 后台：批量排序，body = { ids: [1,2,3,...] }，按数组顺序设置 sort = index*10
export default defineEventHandler(async (event) => {
  const body = await readBody<{ ids: number[] }>(event)
  if (!Array.isArray(body?.ids) || body.ids.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'ids 不能为空' })
  }
  await prisma.$transaction(
    body.ids.map((id, idx) =>
      prisma.formFieldConfig.update({ where: { id: Number(id) }, data: { sort: idx * 10 } })
    )
  )
  return { ok: true }
})
