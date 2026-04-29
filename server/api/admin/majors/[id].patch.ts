export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  return prisma.major.update({
    where: { id },
    data: {
      name: body.name?.trim(),
      code: body.code === undefined ? undefined : (body.code || null),
      enabled: body.enabled,
      sort: body.sort === undefined ? undefined : Number(body.sort),
      remark: body.remark
    }
  })
})
