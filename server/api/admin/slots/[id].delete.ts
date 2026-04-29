export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const used = await prisma.application.count({ where: { testSlotId: id } })
  if (used > 0) throw createError({ statusCode: 400, statusMessage: `该时段已有 ${used} 条报名，无法删除（可改为停用）` })
  await prisma.testSlot.delete({ where: { id } })
  return { ok: true }
})
