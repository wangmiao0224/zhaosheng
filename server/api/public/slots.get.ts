export default defineEventHandler(async () => {
  const now = new Date()
  const list = await prisma.testSlot.findMany({
    where: { enabled: true, endAt: { gte: now } },
    orderBy: { startAt: 'asc' },
    select: { id: true, label: true, startAt: true, endAt: true, capacity: true }
  })
  // 附带已报名数量，前端判断是否满员
  const counts = await prisma.application.groupBy({
    by: ['testSlotId'],
    where: { testSlotId: { in: list.map(s => s.id) } },
    _count: { _all: true }
  })
  const map = new Map(counts.map(c => [c.testSlotId, c._count._all]))
  return list.map(s => ({ ...s, used: map.get(s.id) || 0 }))
})
