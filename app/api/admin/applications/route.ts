import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { supabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

async function ensureAdmin() {
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { ok: false as const, reason: 'unauthorized' as const }
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile || profile.role !== 'admin') return { ok: false as const, reason: 'forbidden' as const }
  return { ok: true as const, userId: user.id }
}

export async function GET() {
  const guard = await ensureAdmin()
  if (!guard.ok) return NextResponse.json(guard, { status: guard.reason === 'unauthorized' ? 401 : 403 })

  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('tutor_applications')
    .select('*')
    .or('status.eq.pending,status.is.null')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ ok: false, reason: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}

export async function POST(req: Request) {
  const guard = await ensureAdmin()
  if (!guard.ok) return NextResponse.json(guard, { status: guard.reason === 'unauthorized' ? 401 : 403 })

  const body = await req.json().catch(() => ({}))
  const action = body?.action as 'approve' | 'reject'
  const app = body?.app as any
  if (!app || (action !== 'approve' && action !== 'reject')) {
    return NextResponse.json({ ok: false, reason: 'invalid_request' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Update application status first
  const { error: upErr } = await admin
    .from('tutor_applications')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_by: guard.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', app.id)

  if (upErr) return NextResponse.json({ ok: false, reason: upErr.message }, { status: 500 })

  if (action === 'approve') {
    // Promote user to tutor and sync tutor_profiles
    await admin.from('profiles').upsert({ id: app.user_id, role: 'tutor', full_name: app.full_name }, { onConflict: 'id' })
    const { data: t } = await admin.from('tutor_profiles').upsert({
      tutor_id: app.user_id,
      subjects: app.subjects || [],
      districts: app.districts || [],
      price_per_hour: app.price_per_hour || 200000,
      bio: app.bio || null,
    }, { onConflict: 'tutor_id' })

    if (!t) {
      await admin.from('tutor_profiles').insert({
        tutor_id: app.user_id,
        subjects: app.subjects || [],
        districts: app.districts || [],
        price_per_hour: app.price_per_hour || 200000,
        bio: app.bio || null,
      })
    } else {
      await admin.from('tutor_profiles').update({
        subjects: app.subjects || [],
        districts: app.districts || [],
        price_per_hour: app.price_per_hour || 200000,
        bio: app.bio || null,
      }).eq('tutor_id', app.user_id)
    }
  }

  return NextResponse.json({ ok: true })
}
