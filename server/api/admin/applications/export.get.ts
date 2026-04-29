import ExcelJS from 'exceljs'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const keyword = (q.keyword as string)?.trim()
  const status = (q.status as string)?.trim()
  const major = q.major ? Number(q.major) : undefined
  const from = q.from ? new Date(q.from as string) : undefined
  const to = q.to ? new Date(q.to as string) : undefined

  const where: any = {}
  if (keyword) where.OR = [
    { name: { contains: keyword } },
    { phone: { contains: keyword } },
    { idCard: { contains: keyword } }
  ]
  if (status) where.status = status
  if (major) where.major1Id = major
  if (from || to) where.createdAt = { gte: from, lte: to }

  const list = await prisma.application.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { major1: true, major2: true, testSlot: true }
  })

  // 启用中的扩展字段（按 sort）
  const extraFieldsCfg = await prisma.formFieldConfig.findMany({
    where: { isCore: false, enabled: true },
    orderBy: [{ sort: 'asc' }, { id: 'asc' }]
  })

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('报名记录')
  const baseColumns = [
    { header: '序号', key: 'id', width: 8 },
    { header: '姓名', key: 'name', width: 12 },
    { header: '性别', key: 'gender', width: 8 },
    { header: '身份证号', key: 'idCard', width: 22 },
    { header: '手机号', key: 'phone', width: 14 },
    { header: '高考报名号', key: 'gaokaoNo', width: 18 },
    { header: '民族', key: 'ethnicity', width: 10 },
    { header: '籍贯', key: 'hometown', width: 14 },
    { header: '毕业学校', key: 'graduateSchool', width: 22 },
    { header: '报读专业一', key: 'major1', width: 18 },
    { header: '报读专业二', key: 'major2', width: 18 },
    { header: '预约测试', key: 'slot', width: 22 },
    { header: '奖项/特长', key: 'awards', width: 28 },
    { header: '收件地址', key: 'address', width: 32 }
  ]
  const extraColumns = extraFieldsCfg.map(f => ({
    header: f.label, key: 'x_' + f.key, width: 18
  }))
  const tailColumns = [
    { header: '状态', key: 'status', width: 10 },
    { header: '备注', key: 'remark', width: 22 },
    { header: '提交时间', key: 'createdAt', width: 20 }
  ]
  ws.columns = [...baseColumns, ...extraColumns, ...tailColumns]
  ws.getRow(1).font = { bold: true }

  for (const it of list) {
    const row: any = {
      id: it.id,
      name: it.name,
      gender: it.gender === 'male' ? '男' : '女',
      idCard: it.idCard,
      phone: it.phone,
      gaokaoNo: it.gaokaoNo || '',
      ethnicity: it.ethnicity,
      hometown: it.hometown,
      graduateSchool: it.graduateSchool,
      major1: it.major1?.name,
      major2: it.major2?.name || '',
      slot: it.testSlot?.label || '',
      awards: it.awards || '',
      address: it.address,
      status: { pending: '待处理', contacted: '已联系', admitted: '已录取', rejected: '已拒绝' }[it.status] || it.status,
      remark: it.remark || '',
      createdAt: new Date(it.createdAt).toLocaleString('zh-CN')
    }
    const ed: any = (it as any).extraData || {}
    for (const f of extraFieldsCfg) {
      const raw = ed[f.key]
      let display = ''
      if (raw === undefined || raw === null || raw === '') {
        display = ''
      } else {
        const opts: any[] = Array.isArray(f.options) ? (f.options as any[]) : []
        if (f.type === 'radio' || f.type === 'select') {
          display = opts.find(o => String(o.value) === String(raw))?.label || String(raw)
        } else if (f.type === 'checkbox') {
          const arr = Array.isArray(raw) ? raw : [raw]
          display = arr.map((v: any) => opts.find(o => String(o.value) === String(v))?.label || v).join('、')
        } else {
          display = String(raw)
        }
      }
      row['x_' + f.key] = display
    }
    ws.addRow(row)
  }

  const buf = await wb.xlsx.writeBuffer()
  const filename = `applications_${Date.now()}.xlsx`
  setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
  return buf
})
