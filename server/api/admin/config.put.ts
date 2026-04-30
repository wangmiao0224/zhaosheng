export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const data: any = {}
  const fields = ['schoolName', 'collegeName', 'officePhone', 'mobilePhone', 'primaryColor', 'bannerImage', 'logoImage', 'faviconImage', 'siteDescription', 'shareTitle', 'shareDescription', 'shareImage', 'homeEntries']
  for (const f of fields) {
    if (body[f] !== undefined) data[f] = body[f]
  }
  return prisma.siteConfig.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data }
  })
})
