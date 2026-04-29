export default defineEventHandler(async () => {
  return prisma.major.findMany({ orderBy: [{ sort: 'asc' }, { id: 'asc' }] })
})
