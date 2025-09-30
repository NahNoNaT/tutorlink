import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { supabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function sign(raw: string, secretKey: string) {
  return crypto.createHmac('sha256', secretKey).update(Buffer.from(raw, 'utf-8')).digest('hex')
}

export async function POST(req: Request) {
  const sb = await supabaseServer()
  const { data: auth } = await sb.auth.getUser()
  const user = auth?.user
  if (!user) return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 })

  const partnerCode = process.env.MOMO_PARTNER_CODE || ''
  const accessKey = process.env.MOMO_ACCESS_KEY || ''
  const secretKey = process.env.MOMO_SECRET_KEY || ''
  const endpoint = process.env.MOMO_ENDPOINT || ''
  if (!partnerCode || !accessKey || !secretKey || !endpoint) {
    return NextResponse.json({ ok: false, reason: 'not_configured' }, { status: 500 })
  }

  let bookingId = 0
  try {
    const body = await req.json()
    bookingId = Number((body as { bookingId?: number | string }).bookingId)
  } catch {}
  if (!bookingId) return NextResponse.json({ ok: false, reason: 'invalid_booking' }, { status: 400 })

  const { data: booking } = await sb
    .from('bookings')
    .select('id, student_id, price, payment_status')
    .eq('id', bookingId)
    .maybeSingle()
  if (!booking) return NextResponse.json({ ok: false, reason: 'booking_not_found' }, { status: 404 })
  if (booking.student_id !== user.id) return NextResponse.json({ ok: false, reason: 'not_student' }, { status: 403 })
  const amount = Math.max(1, Math.floor(booking.price || 0))
  if (!amount) return NextResponse.json({ ok: false, reason: 'invalid_price' }, { status: 400 })

  const h = await headers()
  const origin = h.get('origin') || process.env.NEXT_PUBLIC_APP_BASE_URL || ''
  const redirectUrl = `${origin}${process.env.MOMO_RETURN_PATH || '/api/payments/momo/return'}`
  const ipnUrl = `${origin}${process.env.MOMO_IPN_PATH || '/api/payments/momo/ipn'}`

  const orderId = `bk-${bookingId}-${Date.now()}`
  const requestId = `${Date.now()}`
  const orderInfo = `Thanh toan booking #${bookingId}`
  const requestType = process.env.MOMO_REQUEST_TYPE || 'captureWallet'
  const extraData = ''

  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${encodeURI(
    ipnUrl
  )}&orderId=${orderId}&orderInfo=${encodeURIComponent(orderInfo)}&partnerCode=${partnerCode}&redirectUrl=${encodeURI(
    redirectUrl
  )}&requestId=${requestId}&requestType=${requestType}`
  const signature = sign(rawSignature, secretKey)

  const payload = {
    partnerCode,
    accessKey,
    requestId,
    amount: String(amount),
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    lang: process.env.MOMO_LANG || 'vi',
    signature,
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = (await res.json()) as { payUrl?: string; resultCode?: number; message?: string }
  if (!json?.payUrl) {
    return NextResponse.json({ ok: false, reason: 'create_failed', message: json?.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, url: json.payUrl })
}

