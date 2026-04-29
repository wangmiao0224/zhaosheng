// 统一从 H3/Nuxt 错误对象里提取后端 statusMessage（中文）
export function getErrMsg(e: any, fallback = '操作失败'): string {
  return (
    e?.data?.statusMessage ||
    e?.data?.message ||
    e?.statusMessage ||
    e?.message ||
    fallback
  )
}

// 包装 $fetch，自动错误 toast；返回 [data, error]，外层无需 try/catch
export async function apiCall<T = any>(
  fn: () => Promise<T>,
  opts: { successMsg?: string; errorFallback?: string; silent?: boolean } = {}
): Promise<{ data: T | null; error: any }> {
  const { ElMessage } = await import('element-plus')
  try {
    const data = await fn()
    if (opts.successMsg) ElMessage.success(opts.successMsg)
    return { data, error: null }
  } catch (e: any) {
    if (!opts.silent) ElMessage.error(getErrMsg(e, opts.errorFallback))
    return { data: null, error: e }
  }
}
