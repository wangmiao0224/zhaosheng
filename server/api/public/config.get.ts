export default defineEventHandler(async () => {
  const c = await prisma.siteConfig.findUnique({ where: { id: 1 } })
  if (!c) {
    return {
      schoolName: '招生报名',
      collegeName: '',
      officePhone: '',
      mobilePhone: '',
      primaryColor: '#1d4f8b',
      bannerImage: null,
      logoImage: null,
      faviconImage: null,
      siteDescription: null,
      brochurePages: 0,
      brochureVersion: 0,
      homeEntries: []
    }
  }
  return {
    schoolName: c.schoolName,
    collegeName: c.collegeName,
    officePhone: c.officePhone,
    mobilePhone: c.mobilePhone,
    primaryColor: c.primaryColor,
    bannerImage: c.bannerImage,
    logoImage: c.logoImage,
    faviconImage: c.faviconImage,
    siteDescription: c.siteDescription,
    brochurePages: c.brochurePages,
    brochureVersion: c.brochureVersion,
    homeEntries: c.homeEntries
  }
})
