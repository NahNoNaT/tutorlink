import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export default async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll().map(c => ({ name: c.name, value: c.value })),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set({ name, value, ...options })
          })
        }
      },
    }
  )

  // Refresh session cookies when navigating protected sections
  await supabase.auth.getUser()

  return res
}

// Limit middleware to reduce overhead
export const config = {
  matcher: [
    '/admin/:path*',
    '/tutor/:path*',
    '/student/:path*',
    '/bookings/:path*',
    '/reviews/:path*',
    '/auth/:path*',
  ],
}
