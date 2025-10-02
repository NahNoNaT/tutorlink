import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/'

  const redirectURL = new URL(next, url.origin)
  const res = NextResponse.redirect(redirectURL)

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
          setAll: (setCookies) => {
            setCookies.forEach(({ name, value, options }) => {
              res.cookies.set({ name, value, ...options })
            })
          },
        },
      }
    )

    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch {
      // Swallow error and continue redirect; UI can handle auth state
    }
  }

  return res
}

