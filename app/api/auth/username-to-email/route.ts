import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const usernameRaw = typeof body?.username === 'string' ? body.username : ''
    const username = usernameRaw.trim().toLowerCase()
    if (!username || username.length < 3) {
      return NextResponse.json({ ok: false, reason: 'invalid_username' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .maybeSingle()

    if (error) {
      console.error('username lookup failed', error)
      return NextResponse.json({ ok: false, reason: 'lookup_failed' }, { status: 500 })
    }
    if (!data?.email) {
      return NextResponse.json({ ok: false, reason: 'not_found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, email: data.email })
  } catch (err) {
    console.error('username lookup error', err)
    return NextResponse.json({ ok: false, reason: 'bad_request' }, { status: 400 })
  }
}
