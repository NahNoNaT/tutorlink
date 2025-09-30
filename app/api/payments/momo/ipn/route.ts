import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

function hmacSha256(raw: string, key: string) {
  return crypto.createHmac('sha256', key).update(Buffer.from(raw, 'utf-8')).digest('hex')
}

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, string>

  const secretKey = process.env.MOMO_SECRET_KEY || ''
  if (!secretKey) return NextResponse.json({ resultCode: 97, message: 'Not configured' })

  const raw = `accessKey=${process.env.MOMO_ACCESS_KEY || ''}&amount=${body.amount || ''}&extraData=${
    body.extraData || ''
  }&message=${body.message || ''}&orderId=${body.orderId || ''}&orderInfo=${body.orderInfo || ''}&orderType=${
    body.orderType || ''
  }&partnerCode=${body.partnerCode || ''}&payType=${body.payType || ''}&requestId=${body.requestId || ''}&responseTime=${
    body.responseTime || ''
  }&resultCode=${body.resultCode || ''}&transId=${body.transId || ''}`
  const check = hmacSha256(raw, secretKey)
  if (check !== body.signature) return NextResponse.json({ resultCode: 97, message: 'Checksum failed' })

  const ok = body.resultCode === '0'
  const bookingId = Number((body.orderId || '').split('-')[1]) || 0

  try {
    const admin = getSupabaseAdmin()
    await admin.from('payments').insert({
      booking_id: bookingId || null,
      gateway: 'momo',
      order_id: body.orderId || '',
      transaction_ref: body.transId || null,
      amount: Number(body.amount || '0'),
      currency: 'VND',
      status: ok ? 'paid' : 'failed',
      raw_data: body as unknown as Record<string, unknown>,
    })
    if (ok && bookingId) {
      await admin.from('bookings').update({ payment_status: 'paid' }).eq('id', bookingId)
    }
  } catch {}

  return NextResponse.json({ resultCode: 0, message: 'OK' })
}

