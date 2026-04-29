// PDF -> JPG 切片。需要系统安装 graphicsmagick + ghostscript（pdf2pic 依赖）。
// macOS:  brew install graphicsmagick ghostscript
// Ubuntu: apt install -y graphicsmagick ghostscript
import { fromPath } from 'pdf2pic'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export interface SliceResult {
  pages: number
  outputDir: string
  version: number
}

export async function slicePdfToImages(
  pdfAbsPath: string,
  storageRoot: string,
  version: number
): Promise<SliceResult> {
  const outputDir = path.join(storageRoot, 'brochure', String(version))
  await fs.mkdir(outputDir, { recursive: true })

  const converter = fromPath(pdfAbsPath, {
    density: 150,
    saveFilename: 'page',
    savePath: outputDir,
    format: 'jpg',
    width: 1080,
    height: 1528 // A4 比例
  })

  const all = await converter.bulk(-1, { responseType: 'image' })
  return { pages: all.length, outputDir, version }
}
