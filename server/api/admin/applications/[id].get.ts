export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const item = await prisma.application.findUnique({
    where: { id },
    include: { major1: true, major2: true, testSlot: true }
  })
  if (!item) throw createError({ statusCode: 404, statusMessage: '记录不存在' })
  return item
})
