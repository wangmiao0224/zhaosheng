/**
 * 全局站点 head 注入：
 *  - 动态 favicon（管理员后台上传）
 *  - Open Graph 分享卡（微信/QQ/Twitter 等分享时显示标题、描述、缩略图）
 */
export default defineNuxtPlugin(async () => {
  const { data } = await useFetch<any>('/api/public/config', {
    key: 'site-config-head',
    // 失败时不阻塞页面渲染
    default: () => null,
  })
  const c = data.value
  if (!c) return

  // 把 /files/xx 这种相对路径转成绝对 URL，社交分享平台抓取需要绝对地址
  const url = useRequestURL()
  const origin = url?.origin || ''
  const toAbs = (p?: string | null) => {
    if (!p) return ''
    if (/^https?:\/\//i.test(p)) return p
    return origin + p
  }

  const favicon = toAbs(c.faviconImage)
  const ogImage = toAbs(c.bannerImage)

  const title = [c.schoolName, c.collegeName].filter(Boolean).join(' · ') + ' 报名'
  const desc =
    c.siteDescription ||
    `${c.schoolName || ''}${c.collegeName ? ' ' + c.collegeName : ''} 在线报名系统`

  const link: any[] = []
  if (favicon) {
    // 推断 mime type
    const ext = favicon.split('.').pop()?.toLowerCase()
    const type =
      ext === 'ico' ? 'image/x-icon' :
      ext === 'svg' ? 'image/svg+xml' :
      ext === 'png' ? 'image/png' :
      ext === 'webp' ? 'image/webp' :
      ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : undefined
    link.push({ rel: 'icon', href: favicon, ...(type ? { type } : {}) })
    link.push({ rel: 'shortcut icon', href: favicon })
    link.push({ rel: 'apple-touch-icon', href: favicon })
  }

  const meta: any[] = [
    { name: 'description', content: desc },
    { property: 'og:title', content: title },
    { property: 'og:description', content: desc },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: desc },
  ]
  if (ogImage) {
    meta.push({ property: 'og:image', content: ogImage })
    meta.push({ name: 'twitter:image', content: ogImage })
  }

  useHead({ link, meta })
})
