import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import { supabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const sb = await supabaseServer()
    const { data: auth } = await sb.auth.getUser()
    const user = auth?.user
    if (!user) return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 })

    let bookingId = 0
    try {
      const data = await req.json()
      bookingId = Number((data as { bookingId?: number | string }).bookingId)
    } catch {}
    if (!bookingId) return NextResponse.json({ ok: false, reason: 'invalid_booking' }, { status: 400 })

    // Load booking
    const { data: booking, error: bErr } = await sb
      .from('bookings')
      .select('id, student_id, tutor_id, price, platform_fee, payment_status')
      .eq('id', bookingId)
      .maybeSingle()
    if (bErr || !booking) return NextResponse.json({ ok: false, reason: 'booking_not_found' }, { status: 404 })
    if (booking.student_id !== user.id) return NextResponse.json({ ok: false, reason: 'not_student' }, { status: 403 })
    if (!booking.price || booking.price <= 0) return NextResponse.json({ ok: false, reason: 'invalid_price' }, { status: 400 })
    if (booking.payment_status === 'paid') return NextResponse.json({ ok: true, alreadyPaid: true })

    // Load tutor profile for Stripe account id
    const tutorId = booking.tutor_id as string | null
    if (!tutorId) return NextResponse.json({ ok: false, reason: 'no_tutor' }, { status: 400 })

    const { data: tutorProfile } = await sb
      .from('profiles')
      .select('id, full_name, stripe_account_id')
      .eq('id', tutorId)
      .maybeSingle()

    const destination = (tutorProfile && (tutorProfile as { stripe_account_id?: string }).stripe_account_id) || undefined
    if (!destination) {
      return NextResponse.json({ ok: false, reason: 'tutor_not_onboarded', message: 'Tutor chưa bật nhận tiền. Vui lòng yêu cầu tutor bật payouts.' }, { status: 400 })
    }

    const stripe = getStripe()

    // Currency and amounts
    const currency = (process.env.STRIPE_CURRENCY || 'vnd').toLowerCase()
    const unitAmount = Math.max(1, Math.floor(booking.price))
    const feeAmount = Math.max(0, Math.floor(booking.platform_fee || 0))

    const origin = (await headers()).get('origin') || process.env.NEXT_PUBLIC_APP_BASE_URL || ''
    const successUrl = `${origin}/bookings/${bookingId}?paid=1`
    const cancelUrl = `${origin}/bookings/${bookingId}?canceled=1`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Thanh toán buổi học #${bookingId}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: feeAmount,
        transfer_data: { destination },
        metadata: {
          booking_id: String(bookingId),
          student_id: booking.student_id,
          tutor_id: tutorId,
        },
      },
      metadata: {
        booking_id: String(bookingId),
        student_id: booking.student_id,
        tutor_id: tutorId,
      },
    })

    return NextResponse.json({ ok: true, url: session.url })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return NextResponse.json({ ok: false, reason: 'error', message: msg }, { status: 500 })
  }
}
