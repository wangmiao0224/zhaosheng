export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.label || !body.startAt || !body.endAt) {
    throw createError({ statusCode: 400, statusMessage: '名称、开始/结束时间必填' })
  }
  return prisma.testSlot.create({
    data: {
      label: String(body.label).trim(),
      startAt: new Date(body.startAt),
      endAt: new Date(body.endAt),
      capacity: Number(body.capacity) || 0,
      enabled: body.enabled !== false
    }
  })
})
