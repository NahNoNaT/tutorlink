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

  const hashSecret = process.env.VNP_HASH_SECRET || ''
  if (!hashSecret) return NextResponse.json({ RspCode: '97', Message: 'Not configured' })

  const sorted = sortObject(rest)
  const signData = Object.keys(sorted)
    .map((k) => `${k}=${encodeURIComponent(sorted[k])}`)
    .join('&')
  const checkHash = crypto.createHmac('sha512', hashSecret).update(Buffer.from(signData, 'utf-8')).digest('hex')
  if (checkHash !== receivedHash) return NextResponse.json({ RspCode: '97', Message: 'Checksum failed' })

  const ok = params['vnp_ResponseCode'] === '00' && params['vnp_TransactionStatus'] === '00'
  const ref = params['vnp_TxnRef'] || ''
  const bookingId = Number(ref.split('-')[1]) || 0

  try {
    const admin = getSupabaseAdmin()
    await admin.from('payments').insert({
      booking_id: bookingId || null,
      gateway: 'vnpay',
      order_id: ref,
      transaction_ref: params['vnp_TransactionNo'] || null,
      amount: Math.round(Number(params['vnp_Amount'] || '0') / 100),
      currency: params['vnp_CurrCode'] || 'VND',
      status: ok ? 'paid' : 'failed',
      raw_data: params as unknown as Record<string, unknown>,
    })
    if (ok && bookingId) {
      await admin.from('bookings').update({ payment_status: 'paid' }).eq('id', bookingId)
    }
  } catch {}

  return NextResponse.json({ RspCode: '00', Message: 'OK' })
}
