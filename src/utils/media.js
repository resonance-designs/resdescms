export const apiBase = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/+$/, '')

export function resolveMediaUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('//')) return window.location.protocol + url
  return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`
}
