import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

function hmacSha256(raw: string, key: string) {
  return crypto.createHmac('sha256', key).update(Buffer.from(raw, 'utf-8')).digest('hex')
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const p = Object.fromEntries(url.searchParams.entries())

  const secretKey = process.env.MOMO_SECRET_KEY || ''
  if (!secretKey) return NextResponse.redirect(new URL('/', url.origin))

  const {
    partnerCode,
    orderId,
    requestId,
    amount,
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    payType,
    responseTime,
    extraData,
    signature,
  } = p

  const raw = `accessKey=${process.env.MOMO_ACCESS_KEY || ''}&amount=${amount || ''}&extraData=${extraData || ''}&message=${
    message || ''
  }&orderId=${orderId || ''}&orderInfo=${orderInfo || ''}&orderType=${orderType || ''}&partnerCode=${
    partnerCode || ''
  }&payType=${payType || ''}&requestId=${requestId || ''}&responseTime=${responseTime || ''}&resultCode=${
    resultCode || ''
  }&transId=${transId || ''}`
  const check = hmacSha256(raw, secretKey)
  const success = check === signature && resultCode === '0'

  const bookingId = Number((orderId || '').split('-')[1]) || 0
  const admin = getSupabaseAdmin()
  if (bookingId) {
    if (success) {
      await admin.from('bookings').update({ payment_status: 'paid' }).eq('id', bookingId)
    } else {
      await admin.from('bookings').update({ payment_status: 'canceled' }).eq('id', bookingId)
    }
    await admin.from('payments').insert({
      booking_id: bookingId,
      gateway: 'momo',
      order_id: orderId,
      transaction_ref: transId || null,
      amount: Number(amount || '0'),
      currency: 'VND',
      status: success ? 'paid' : 'canceled',
      raw_data: p as unknown as Record<string, unknown>,
    })
  }

  const target = new URL(`/bookings/${bookingId || ''}${success ? '?paid=1' : '?failed=1'}`, url.origin)
  return NextResponse.redirect(target)
}
