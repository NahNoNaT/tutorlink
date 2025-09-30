import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { supabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function sortObject(obj: Record<string, string>) {
  const sorted: Record<string, string> = {}
  Object.keys(obj)
    .sort()
    .forEach((key) => (sorted[key] = obj[key]))
  return sorted
}

export async function POST(req: Request) {
  const sb = await supabaseServer()
  const { data: auth } = await sb.auth.getUser()
  const user = auth?.user
  if (!user) return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 })

  const tmnCode = process.env.VNP_TMN_CODE || ''
  const hashSecret = process.env.VNP_HASH_SECRET || ''
  const vnpUrl = process.env.VNP_URL || ''
  const currCode = process.env.VNP_CURR_CODE || 'VND'
  const locale = process.env.VNP_LOCALE || 'vn'
  if (!tmnCode || !hashSecret || !vnpUrl) {
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
  const returnUrl = `${origin}${process.env.VNP_RETURN_PATH || '/api/payments/vnpay/return'}`

  const ip = h.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const createDate = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(
    now.getMinutes()
  )}${pad(now.getSeconds())}`
  const orderId = `bk-${bookingId}-${Date.now()}`

  const params: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: currCode,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Thanh toan booking #${bookingId}`,
    vnp_OrderType: 'other',
    vnp_Amount: String(amount * 100),
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ip,
    vnp_CreateDate: createDate,
  }

  const sorted = sortObject(params)
  const signData = Object.keys(sorted)
    .map((k) => `${k}=${encodeURIComponent(sorted[k])}`)
    .join('&')
  const hmac = crypto.createHmac('sha512', hashSecret)
  const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')
  const url = `${vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`

  return NextResponse.json({ ok: true, url })
}

