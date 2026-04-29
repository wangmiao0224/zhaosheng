export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const used = await prisma.application.count({ where: { OR: [{ major1Id: id }, { major2Id: id }] } })
  if (used > 0) throw createError({ statusCode: 400, statusMessage: `该专业已有 ${used} 条报名记录，无法删除（可改为停用）` })
  await prisma.major.delete({ where: { id } })
  return { ok: true }
})
