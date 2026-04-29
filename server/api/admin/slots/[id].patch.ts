export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  return prisma.testSlot.update({
    where: { id },
    data: {
      label: body.label?.trim(),
      startAt: body.startAt ? new Date(body.startAt) : undefined,
      endAt: body.endAt ? new Date(body.endAt) : undefined,
      capacity: body.capacity === undefined ? undefined : Number(body.capacity),
      enabled: body.enabled
    }
  })
})
