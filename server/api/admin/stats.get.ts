export default defineEventHandler(async () => {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last30 = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
  last30.setHours(0, 0, 0, 0)

  const [total, todayCount, weekCount, byStatus, byGender, byMajor, recent30] = await Promise.all([
    prisma.application.count(),
    prisma.application.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.application.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.application.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.application.groupBy({ by: ['gender'], _count: { _all: true } }),
    prisma.application.groupBy({
      by: ['major1Id'],
      _count: { _all: true },
      orderBy: { _count: { major1Id: 'desc' } },
      take: 10
    }),
    prisma.application.findMany({
      where: { createdAt: { gte: last30 } },
      select: { createdAt: true }
    })
  ])

  // 按日聚合
  const dayMap = new Map<string, number>()
  for (let i = 0; i < 30; i++) {
    const d = new Date(last30.getTime() + i * 86400000)
    const k = d.toISOString().slice(0, 10)
    dayMap.set(k, 0)
  }
  for (const r of recent30) {
    const k = new Date(r.createdAt).toISOString().slice(0, 10)
    if (dayMap.has(k)) dayMap.set(k, (dayMap.get(k) || 0) + 1)
  }
  const trend = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }))

  // 专业名补全
  const majorIds = byMajor.map(m => m.major1Id)
  const majors = majorIds.length
    ? await prisma.major.findMany({ where: { id: { in: majorIds } }, select: { id: true, name: true } })
    : []
  const majorNameMap = new Map(majors.map(m => [m.id, m.name]))
  const topMajors = byMajor.map(m => ({
    majorId: m.major1Id,
    name: majorNameMap.get(m.major1Id) || `#${m.major1Id}`,
    count: m._count._all
  }))

  return {
    total,
    todayCount,
    weekCount,
    byStatus: byStatus.map(s => ({ status: s.status, count: s._count._all })),
    byGender: byGender.map(g => ({ gender: g.gender, count: g._count._all })),
    topMajors,
    trend
  }
})
