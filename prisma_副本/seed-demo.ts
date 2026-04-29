/**
 * 演示数据：测试时段 + 报名记录（在 seed.ts 之后运行）
 * 用法：node --experimental-strip-types prisma/seed-demo.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ====== 测试时段 ======
const slots = [
  { label: '5月10日 上午笔试', startAt: '2026-05-10T09:00:00+08:00', endAt: '2026-05-10T11:30:00+08:00', capacity: 80 },
  { label: '5月10日 下午面试', startAt: '2026-05-10T14:00:00+08:00', endAt: '2026-05-10T17:00:00+08:00', capacity: 60 },
  { label: '5月11日 上午笔试', startAt: '2026-05-11T09:00:00+08:00', endAt: '2026-05-11T11:30:00+08:00', capacity: 80 },
  { label: '5月11日 下午面试', startAt: '2026-05-11T14:00:00+08:00', endAt: '2026-05-11T17:00:00+08:00', capacity: 60 },
  { label: '5月17日 全天', startAt: '2026-05-17T09:00:00+08:00', endAt: '2026-05-17T17:00:00+08:00', capacity: 100 }
]

// ====== 演示报名数据 ======
const surnames = ['张','李','王','陈','刘','杨','黄','赵','吴','周','徐','孙','马','朱','胡','郭','何','林','高','梁']
const givenNames = ['伟','芳','娜','秀英','敏','静','丽','强','磊','洋','艳','勇','军','杰','涛','明','超','秀兰','霞','平','刚','桂英']
const ethnicities = ['汉族','壮族','瑶族','苗族','侗族','回族']
const cities = ['桂林市','南宁市','柳州市','梧州市','北海市','钦州市','贵港市','玉林市','百色市','贺州市','河池市','来宾市','崇左市','防城港市']
const schools = ['桂林市第一中学','桂林中学','桂林市第十八中学','南宁市第二中学','柳州高级中学','梧州高级中学','北海中学','玉林高级中学','贺州高级中学','河池高级中学','百色中学','钦州市第一中学']
const statuses = ['pending','pending','pending','approved','approved','rejected'] // 加权：50% pending / 33% approved / 17% rejected

function rand<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

// 生成合法身份证号（不带真实校验位，只保证唯一）
function genIdCard(i: number) {
  const region = '450103'                              // 桂林市象山区
  const year   = 2007                                   // 18 岁
  const month  = String(randInt(1, 12)).padStart(2, '0')
  const day    = String(randInt(1, 28)).padStart(2, '0')
  const seq    = String(1000 + i).padStart(4, '0')      // 后 4 位用 i 避免重复
  // 简易校验位
  const body = `${region}${year}${month}${day}${seq.slice(0, 3)}`
  const w = [7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2]
  const m = ['1','0','X','9','8','7','6','5','4','3','2']
  const sum = body.split('').reduce((s, c, idx) => s + parseInt(c) * w[idx], 0)
  return body + seq[3] + m[sum % 11]
}

function genPhone() {
  return '13' + String(randInt(100000000, 999999999))
}

async function main() {
  // 1. 写入测试时段
  for (const s of slots) {
    await prisma.testSlot.upsert({
      where: { id: slots.indexOf(s) + 1 },
      update: {
        label: s.label, startAt: new Date(s.startAt), endAt: new Date(s.endAt),
        capacity: s.capacity, enabled: true
      },
      create: {
        id: slots.indexOf(s) + 1,
        label: s.label, startAt: new Date(s.startAt), endAt: new Date(s.endAt),
        capacity: s.capacity, enabled: true
      }
    })
  }
  console.log(`✓ TestSlot: ${slots.length}`)

  const majors = await prisma.major.findMany({ where: { enabled: true }, orderBy: { id: 'asc' } })
  const slotIds = (await prisma.testSlot.findMany({ where: { enabled: true } })).map(s => s.id)
  if (!majors.length) { console.error('请先运行 seed.ts 生成专业数据'); process.exit(1) }

  // 2. 生成 30 条报名（已存在的 idCard 会跳过）
  const total = 30
  let inserted = 0
  for (let i = 0; i < total; i++) {
    const surname = rand(surnames)
    const given   = rand(givenNames)
    const name    = surname + given
    const gender  = Math.random() < 0.5 ? '男' : '女'
    const major1  = rand(majors)
    const major2  = Math.random() < 0.6 ? rand(majors.filter(m => m.id !== major1.id)) : null
    const slotId  = Math.random() < 0.7 ? rand(slotIds) : null
    const idCard  = genIdCard(i)
    const status  = rand(statuses)

    // 随机过去 1-30 天创建
    const createdAt = new Date(Date.now() - randInt(0, 30) * 86400_000 - randInt(0, 86400_000))

    try {
      await prisma.application.create({
        data: {
          gaokaoNo: '26' + String(randInt(10000000, 99999999)),
          name, idCard, gender,
          phone: genPhone(),
          ethnicity: rand(ethnicities),
          hometown: '广西壮族自治区' + rand(cities),
          graduateSchool: rand(schools),
          major1Id: major1.id,
          major2Id: major2?.id ?? null,
          testSlotId: slotId,
          awards: Math.random() < 0.4 ? '校级三好学生 / 全国数学竞赛三等奖' : null,
          address: '广西壮族自治区' + rand(cities) + '某某街道 ' + randInt(1, 999) + ' 号',
          status,
          remark: status === 'rejected' ? '材料不完整，请补充' : null,
          ip: `192.168.${randInt(1,254)}.${randInt(1,254)}`,
          createdAt,
          updatedAt: createdAt
        }
      })
      inserted++
    } catch (e: any) {
      // 唯一约束冲突就跳过
      if (e.code !== 'P2002') throw e
    }
  }
  console.log(`✓ Application: 新增 ${inserted} / 跳过 ${total - inserted}`)

  // 3. 统计
  const [appCount, slotCount, majorCount, fieldCount] = await Promise.all([
    prisma.application.count(),
    prisma.testSlot.count(),
    prisma.major.count(),
    prisma.formFieldConfig.count()
  ])
  console.log('---')
  console.log('总览：', { 报名: appCount, 时段: slotCount, 专业: majorCount, 表单字段: fieldCount })
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
