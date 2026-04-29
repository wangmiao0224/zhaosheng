export default defineEventHandler(async () => {
  return prisma.testSlot.findMany({ orderBy: { startAt: 'asc' } })
})
