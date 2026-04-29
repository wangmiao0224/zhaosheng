export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  await prisma.application.delete({ where: { id } })
  return { ok: true }
})
