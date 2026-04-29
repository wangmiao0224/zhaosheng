export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ status?: string; remark?: string }>(event)
  const data: any = {}
  if (body.status) {
    if (!['pending', 'contacted', 'admitted', 'rejected'].includes(body.status)) {
      throw createError({ statusCode: 400, statusMessage: '状态值非法' })
    }
    data.status = body.status
  }
  if (body.remark !== undefined) data.remark = body.remark
  const updated = await prisma.application.update({ where: { id }, data })
  return updated
})
