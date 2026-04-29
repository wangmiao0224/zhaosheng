import { promises as fs } from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const storageRoot = path.resolve(config.storageDir)

  const parts = await readMultipartFormData(event)
  if (!parts || !parts.length) throw createError({ statusCode: 400, statusMessage: '请上传图标文件' })
  const file = parts.find(p => p.name === 'file' && p.filename)
  if (!file) throw createError({ statusCode: 400, statusMessage: '未找到文件字段 file' })

  const filename = file.filename || ''
  if (!/\.(ico|png|jpe?g|svg|webp)$/i.test(filename)) {
    throw createError({ statusCode: 400, statusMessage: '仅支持 ico/png/jpg/svg/webp' })
  }
  // 1MB 限制（favicon 通常很小）
  if (file.data.length > 1 * 1024 * 1024) {
    throw createError({ statusCode: 400, statusMessage: '图标过大（最大 1MB）' })
  }

  const ext = (filename.match(/\.(ico|png|jpe?g|svg|webp)$/i)?.[0] || '.ico').toLowerCase()
  const dir = path.join(storageRoot, 'favicon')
  await fs.mkdir(dir, { recursive: true })
  const name = `favicon-${Date.now()}${ext}`
  await fs.writeFile(path.join(dir, name), file.data)

  const url = `/files/favicon/${name}`
  await prisma.siteConfig.upsert({
    where: { id: 1 },
    update: { faviconImage: url },
    create: { id: 1, faviconImage: url }
  })

  return { ok: true, url }
})
