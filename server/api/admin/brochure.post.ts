import { promises as fs } from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const storageRoot = path.resolve(config.storageDir)

  const parts = await readMultipartFormData(event)
  if (!parts || !parts.length) throw createError({ statusCode: 400, statusMessage: '请上传 PDF 文件' })
  const file = parts.find(p => p.name === 'file' && p.filename)
  if (!file) throw createError({ statusCode: 400, statusMessage: '未找到文件字段 file' })
  if (!/\.pdf$/i.test(file.filename || '')) {
    throw createError({ statusCode: 400, statusMessage: '请上传 PDF 文件' })
  }

  const cur = await prisma.siteConfig.findUnique({ where: { id: 1 } })
  const version = (cur?.brochureVersion || 0) + 1

  const dir = path.join(storageRoot, 'brochure', String(version))
  await fs.mkdir(dir, { recursive: true })
  const pdfPath = path.join(dir, 'source.pdf')
  await fs.writeFile(pdfPath, file.data)

  let pages = 0
  try {
    const r = await slicePdfToImages(pdfPath, storageRoot, version)
    pages = r.pages
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'PDF 切片失败：' + (e?.message || e) +
        '（请确认服务器已安装 graphicsmagick 与 ghostscript）'
    })
  }

  const relPdf = `/files/brochure/${version}/source.pdf`
  await prisma.siteConfig.upsert({
    where: { id: 1 },
    update: { brochurePdf: relPdf, brochurePages: pages, brochureVersion: version },
    create: { id: 1, brochurePdf: relPdf, brochurePages: pages, brochureVersion: version }
  })

  return { ok: true, version, pages, url: relPdf }
})
