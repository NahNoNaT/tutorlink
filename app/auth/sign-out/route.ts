import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const res = NextResponse.redirect(new URL('/', request.url))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        async setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            res.cookies.set({ name, value, ...options })
          }
        },
      },
    }
  )

  // Server-side sign out to ensure cookies are cleared before redirect
  await supabase.auth.signOut()
  return res
}
