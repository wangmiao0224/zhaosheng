export default defineEventHandler(async () => {
  const list = await prisma.major.findMany({
    where: { enabled: true },
    orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    select: { id: true, name: true, code: true }
  })
  return list
})
