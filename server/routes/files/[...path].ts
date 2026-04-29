// 静态文件服务：将上传到 storage/ 目录的运行时文件以 /files/* 路径暴露。
// 比 nitro.publicAssets 更适合 dev 模式，因为后者只在启动时扫描目录。
import { promises as fs } from 'node:fs'
import { createReadStream } from 'node:fs'
import path from 'node:path'

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8'
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const storageRoot = path.resolve(config.storageDir)

  const params = getRouterParams(event)
  const rel = (params.path as string | string[] | undefined)
  const relPath = Array.isArray(rel) ? rel.join('/') : (rel || '')

  // 防止路径穿越
  const abs = path.normalize(path.join(storageRoot, relPath))
  if (!abs.startsWith(storageRoot + path.sep) && abs !== storageRoot) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  let stat
  try {
    stat = await fs.stat(abs)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  if (!stat.isFile()) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const mime = MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream'
  setResponseHeader(event, 'Content-Type', mime)
  setResponseHeader(event, 'Content-Length', String(stat.size))
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  return sendStream(event, createReadStream(abs))
})
