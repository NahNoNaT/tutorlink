import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

function sortObject(obj: Record<string, string>) {
  const sorted: Record<string, string> = {}
  Object.keys(obj)
    .sort()
    .forEach((key) => (sorted[key] = obj[key]))
  return sorted
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const params = Object.fromEntries(url.searchParams.entries()) as Record<string, string>
  const receivedHash = params['vnp_SecureHash'] || ''
  const rest: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) {
    if (k !== 'vnp_SecureHash' && k !== 'vnp_SecureHashType') rest[k] = v
  }

  // Verify
  const hashSecret = process.env.VNP_HASH_SECRET || ''
  if (!hashSecret) return NextResponse.redirect(new URL('/', url.origin))
  const sorted = sortObject(rest)
  const signData = Object.keys(sorted)
    .map((k) => `${k}=${encodeURIComponent(sorted[k])}`)
    .join('&')
  const checkHash = crypto.createHmac('sha512', hashSecret).update(Buffer.from(signData, 'utf-8')).digest('hex')
  const success = checkHash === receivedHash && params['vnp_ResponseCode'] === '00' && params['vnp_TransactionStatus'] === '00'

  // Try to parse bookingId from vnp_TxnRef: format bk-<id>-<ts>
  const ref = params['vnp_TxnRef'] || ''
  const bookingId = Number(ref.split('-')[1]) || 0

  const admin = getSupabaseAdmin()
  if (bookingId) {
    if (success) {
      await admin.from('bookings').update({ payment_status: 'paid' }).eq('id', bookingId)
    } else {
      await admin.from('bookings').update({ payment_status: 'canceled' }).eq('id', bookingId)
    }
    await admin.from('payments').insert({
      booking_id: bookingId,
      gateway: 'vnpay',
      order_id: ref,
      transaction_ref: params['vnp_TransactionNo'] || null,
      amount: Math.round(Number(params['vnp_Amount'] || '0') / 100),
      currency: params['vnp_CurrCode'] || 'VND',
      status: success ? 'paid' : 'canceled',
      raw_data: params as unknown as Record<string, unknown>,
    })
  }

  const target = new URL(`/bookings/${bookingId || ''}${success ? '?paid=1' : '?failed=1'}`, url.origin)
  return NextResponse.redirect(target)
}
