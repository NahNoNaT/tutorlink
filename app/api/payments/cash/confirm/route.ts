import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const sb = await supabaseServer()
    const { data: auth } = await sb.auth.getUser()
    const user = auth?.user
    if (!user) return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({} as { bookingId?: number }))
    const bookingId = Number((body as any).bookingId)
    if (!bookingId) return NextResponse.json({ ok: false, reason: 'invalid_booking' }, { status: 400 })

    const admin = getSupabaseAdmin()
    const { data: b } = await admin
      .from('bookings')
      .select('id, tutor_id, price, payment_status')
      .eq('id', bookingId)
      .maybeSingle()
    if (!b) return NextResponse.json({ ok: false, reason: 'booking_not_found' }, { status: 404 })
    if (b.tutor_id !== user.id) return NextResponse.json({ ok: false, reason: 'not_tutor' }, { status: 403 })

    // Mark paid and log payment (with explicit error checks)
    const { error: upErr } = await admin
      .from('bookings')
      .update({ payment_status: 'paid' })
      .eq('id', bookingId)
    if (upErr) return NextResponse.json({ ok: false, reason: 'update_failed', message: upErr.message }, { status: 500 })

    const { error: insErr } = await admin.from('payments').insert({
      booking_id: bookingId,
      gateway: 'cash',
      order_id: `cash-bk-${bookingId}-${Date.now()}`,
      transaction_ref: null,
      amount: Math.max(0, Number(b.price || 0)),
      currency: 'VND',
      status: 'paid',
      raw_data: { from: 'tutor' },
    })
    if (insErr) return NextResponse.json({ ok: false, reason: 'insert_failed', message: insErr.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'unknown_error'
    return NextResponse.json({ ok: false, reason: 'error', message }, { status: 500 })
  }
}
