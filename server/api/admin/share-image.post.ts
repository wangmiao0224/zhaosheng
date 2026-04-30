import { promises as fs } from 'node:fs'
import path from 'node:path'

/**
 * 上传分享卡片缩略图（独立于首页 Banner）。
 * 用于 og:image / twitter:image，让微信/QQ 分享时的右侧图标可单独配置。
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const storageRoot = path.resolve(config.storageDir)

  const parts = await readMultipartFormData(event)
  if (!parts || !parts.length) throw createError({ statusCode: 400, statusMessage: '请上传图片文件' })
  const file = parts.find(p => p.name === 'file' && p.filename)
  if (!file) throw createError({ statusCode: 400, statusMessage: '未找到文件字段 file' })

  const filename = file.filename || ''
  if (!/\.(png|jpe?g|webp|gif)$/i.test(filename)) {
    throw createError({ statusCode: 400, statusMessage: '仅支持 png/jpg/webp/gif' })
  }
  if (file.data.length > 5 * 1024 * 1024) {
    throw createError({ statusCode: 400, statusMessage: '图片过大（最大 5MB）' })
  }

  const ext = (filename.match(/\.(png|jpe?g|webp|gif)$/i)?.[0] || '.png').toLowerCase()
  const dir = path.join(storageRoot, 'share')
  await fs.mkdir(dir, { recursive: true })
  const name = `share-${Date.now()}${ext}`
  await fs.writeFile(path.join(dir, name), file.data)

  const url = `/files/share/${name}`
  await prisma.siteConfig.upsert({
    where: { id: 1 },
    update: { shareImage: url },
    create: { id: 1, shareImage: url }
  })

  return { ok: true, url }
})
