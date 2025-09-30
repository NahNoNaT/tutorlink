import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type StripeType from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const stripe = getStripe()
  const body = await req.text()
  const sig = (await headers()).get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) return NextResponse.json({ ok: false, reason: 'no_webhook_secret' }, { status: 500 })
  if (!sig) return NextResponse.json({ ok: false, reason: 'no_signature' }, { status: 400 })

  let event: StripeType.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'invalid_signature'
    return NextResponse.json({ ok: false, reason: 'invalid_signature', message: msg }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as StripeType.Checkout.Session
        const bookingId = Number(session?.metadata?.booking_id)
        if (bookingId) {
          await admin.from('bookings').update({ payment_status: 'paid' }).eq('id', bookingId)
        }
        break
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object as StripeType.PaymentIntent
        const bookingId = Number(pi?.metadata?.booking_id)
        if (bookingId) {
          await admin.from('bookings').update({ payment_status: 'paid' }).eq('id', bookingId)
        }
        break
      }
      default:
        break
    }
  } catch (e) {
    // Ignore DB errors for idempotency; respond 200 so Stripe does not retry endlessly if our logic is safe
  }

  return NextResponse.json({ received: true })
}
