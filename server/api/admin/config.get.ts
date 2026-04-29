export default defineEventHandler(async () => {
  return prisma.siteConfig.findUnique({ where: { id: 1 } })
})
