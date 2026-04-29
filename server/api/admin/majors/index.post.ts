export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.name) throw createError({ statusCode: 400, statusMessage: '专业名称必填' })
  return prisma.major.create({
    data: {
      name: String(body.name).trim(),
      code: body.code ? String(body.code).trim() : null,
      enabled: body.enabled !== false,
      sort: Number(body.sort) || 0,
      remark: body.remark || null
    }
  })
})
