export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const page = Math.max(1, Number(q.page) || 1)
  const size = Math.min(100, Math.max(5, Number(q.size) || 20))
  const keyword = (q.keyword as string)?.trim()
  const status = (q.status as string)?.trim()
  const major = q.major ? Number(q.major) : undefined
  const from = q.from ? new Date(q.from as string) : undefined
  const to = q.to ? new Date(q.to as string) : undefined

  const where: any = {}
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { phone: { contains: keyword } },
      { idCard: { contains: keyword } }
    ]
  }
  if (status) where.status = status
  if (major) where.major1Id = major
  if (from || to) where.createdAt = { gte: from, lte: to }

  const [total, list] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
      include: {
        major1: { select: { id: true, name: true } },
        major2: { select: { id: true, name: true } },
        testSlot: { select: { id: true, label: true } }
      }
    })
  ])
  return { total, page, size, list }
})
