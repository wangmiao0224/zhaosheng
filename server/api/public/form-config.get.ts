// 公开接口：返回启用中的表单字段配置（H5 报名页使用）
export default defineEventHandler(async () => {
  const fields = await prisma.formFieldConfig.findMany({
    where: { enabled: true },
    orderBy: [{ sort: 'asc' }, { id: 'asc' }]
  })
  return fields
})
