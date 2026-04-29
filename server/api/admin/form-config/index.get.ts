// 后台：返回全部字段（含已停用）
export default defineEventHandler(async () => {
  return prisma.formFieldConfig.findMany({
    orderBy: [{ sort: 'asc' }, { id: 'asc' }]
  })
})
