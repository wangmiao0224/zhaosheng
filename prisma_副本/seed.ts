import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'admin123'

  const hash = await bcrypt.hash(password, 10)
  await prisma.admin.upsert({
    where: { username },
    update: { password: hash },
    create: { username, password: hash }
  })

  await prisma.siteConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      homeEntries: [
        { title: '招生报名入口', subtitle: '应用职业本科（点击报名）', link: '/apply', cover: '' },
        { title: '2026年招生简章', subtitle: '点击查看', link: '/brochure', cover: '' }
      ]
    }
  })

  const majors = [
    '电子信息工程', '计算机科学与技术', '软件工程',
    '机械设计制造及其自动化', '工商管理', '会计学',
    '电子商务', '艺术设计'
  ]
  for (let i = 0; i < majors.length; i++) {
    const name = majors[i]
    await prisma.major.upsert({
      where: { id: i + 1 },
      update: { name, sort: i, enabled: true },
      create: { id: i + 1, name, sort: i, enabled: true }
    })
  }

  // 核心表单字段（与 Application 模型字段一一对应）
  const coreFields: Array<any> = [
    { key: 'gaokaoNo',       label: '高考报名号',     type: 'text',     required: false, placeholder: '请输入高考报名号' },
    { key: 'name',           label: '学生姓名',       type: 'text',     required: true,  placeholder: '请输入您真实姓名' },
    { key: 'idCard',         label: '身份证号码',     type: 'text',     required: true,  placeholder: '请输入身份证号码' },
    { key: 'gender',         label: '学生性别',       type: 'gender',   required: true },
    { key: 'phone',          label: '电话号码',       type: 'text',     required: true,  placeholder: '请输入本人电话号码' },
    { key: 'ethnicity',      label: '民族',           type: 'text',     required: true,  placeholder: '请输入您的民族' },
    { key: 'hometown',       label: '籍贯',           type: 'text',     required: true,  placeholder: '请输入您的籍贯' },
    { key: 'graduateSchool', label: '毕业学校',       type: 'text',     required: true,  placeholder: '请输入您的毕业学校名称' },
    { key: 'major1Id',       label: '报读专业一',     type: 'major',    required: true,  placeholder: '请选择报读专业' },
    { key: 'major2Id',       label: '报读专业二',     type: 'major2',   required: false, placeholder: '请选择报读专业（可选）' },
    { key: 'testSlotId',     label: '预约测试',       type: 'slot',     required: false, placeholder: '请选择面试或笔试时间' },
    { key: 'awards',         label: '曾获奖项或个人特长登记', type: 'textarea', required: false, placeholder: '请输入您曾获奖项或个人特长' },
    { key: 'address',        label: '录取通知书收件地址',     type: 'textarea', required: true,  placeholder: '请输入您的收件地址' }
  ]

  for (let i = 0; i < coreFields.length; i++) {
    const f = coreFields[i]
    await prisma.formFieldConfig.upsert({
      where: { key: f.key },
      update: {
        label: f.label, type: f.type, required: f.required,
        placeholder: f.placeholder, isCore: true,
        // 不覆盖 enabled / sort（让管理员的修改保留）
      },
      create: {
        key: f.key, label: f.label, type: f.type, required: f.required,
        placeholder: f.placeholder ?? null,
        isCore: true, enabled: true, sort: i
      }
    })
  }

  console.log('Seed done. Admin:', username, '/', password)
}

main().finally(() => prisma.$disconnect())
