import { createBrowserClient } from '@supabase/ssr'

function getCookie(name: string) {
  if (typeof document === 'undefined') return undefined
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return m ? decodeURIComponent(m[2]) : undefined
}
function setCookie(name: string, value: string, options?: { maxAge?: number }) {
  if (typeof document === 'undefined') return
  const attrs = [
    `Path=/`,
    `SameSite=Lax`,
    // cần maxAge để Supabase gia hạn phiên
    options?.maxAge ? `Max-Age=${options.maxAge}` : '',
  ].filter(Boolean).join('; ')
  document.cookie = `${name}=${encodeURIComponent(value)}; ${attrs}`
}
function removeCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`
}

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: { get: getCookie, set: setCookie, remove: removeCookie },
  }
)
