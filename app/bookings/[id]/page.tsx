'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase/browser'
import LoadingScreen from '@/components/ui/LoadingScreen'

type BookingRow = {
  id: number
  start_time: string
  end_time: string
  location: string
  price: number | null
  platform_fee: number | null
  payment_status: string | null
  student_id?: string
  tutor_id?: string
}

export default function BookingDetail() {
  const { id: rawId } = useParams<{ id: string | string[] }>()
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  const [row, setRow] = useState<BookingRow | null>(null)
  const [msg, setMsg] = useState('')
  const [loadingPay, setLoadingPay] = useState<'momo'|'vnpay'|''>('')
  const [showBank, setShowBank] = useState(false)
  const [uid, setUid] = useState('')
  const [role, setRole] = useState<'student'|'tutor'|'admin'|''>('')

  useEffect(() => {
    (async () => {
      if (!id) return
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user || null
      if (user) {
        setUid(user.id)
        const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
        if ((p as { role?: string } | null)?.role) setRole((p as { role: any }).role)
      }
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', Number(id))
        .maybeSingle()
      if (error) setMsg(error.message)
      setRow((data as BookingRow) || null)
    })()
  }, [id])

  const payWith = async (provider: 'momo' | 'vnpay') => {
    if (!id) return
    setMsg('')
    setLoadingPay(provider)
    try {
      const res = await fetch(`/api/payments/${provider}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: Number(id) }),
      })
      const json = await res.json()
      if (!res.ok || !json?.ok) {
        setMsg(json?.message || json?.reason || 'Could not create payment session')
        return
      }
      if (json.url) {
        window.location.href = json.url as string
      }
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : 'Unknown error'
      setMsg(err)
    } finally {
      setLoadingPay('')
    }
  }

  if (!row) return <LoadingScreen label="" full={false} />
  const payout = (row.price || 0) - (row.platform_fee || 0)
  const status = row.payment_status || 'unpaid'

  const declareCash = async () => {
    if (!id) return
    setMsg('')
    try {
      const res = await fetch('/api/payments/cash/declare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: Number(id) }),
      })
      const ct = res.headers.get('content-type') || ''
      const json = ct.includes('application/json') ? await res.json().catch(() => null) : null
      if (!res.ok || !(json?.ok)) {
        setMsg((json && (json.message || json.reason)) || 'Could not submit confirmation')
        return
      }
      setMsg('Reported cash payment. Waiting for tutor confirmation.')
      if (row) setRow({ ...row, payment_status: 'pending_review' })
    } catch (e: any) {
      setMsg(e?.message || 'Unknown error')
    }
  }

  const confirmCash = async () => {
    if (!id) return
    setMsg('')
    try {
      const res = await fetch('/api/payments/cash/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: Number(id) }),
      })
      const ct = res.headers.get('content-type') || ''
      const json = ct.includes('application/json') ? await res.json().catch(() => null) : null
      if (!res.ok || !(json?.ok)) {
        setMsg((json && (json.message || json.reason)) || 'Could not confirm')
        return
      }
      setMsg('Cash received confirmed.')
      if (row) setRow({ ...row, payment_status: 'paid' })
    } catch (e: any) {
      setMsg(e?.message || 'Unknown error')
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontWeight: 700, fontSize: 18 }}>Booking #{id}</h2>
      <div style={{ marginTop: 8 }}>
        <div>
          Time: {new Date(row.start_time).toLocaleString()} {'->'} {new Date(row.end_time).toLocaleString()}
        </div>
        <div>Location: {row.location || '-'}</div>
        <div>
          Price: {row.price} - Fee (20%): {row.platform_fee} - Tutor gets: {payout}
        </div>
        <div>
          Status: <span style={{
            padding: '2px 8px', borderRadius: 999,
            background: status === 'paid' ? '#16a34a' : status === 'failed' ? '#dc2626' : status === 'pending_review' ? '#f59e0b' : '#475569',
            color: 'white', fontSize: 12,
          }}>{status}</span>
        </div>
        {status !== 'paid' && uid && row.student_id === uid && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button style={btn} disabled={loadingPay==='momo'} onClick={() => payWith('momo')}>
              {loadingPay==='momo' ? 'Opening MoMo...' : 'Pay with MoMo'}
            </button>
            <button style={btn} disabled={loadingPay==='vnpay'} onClick={() => payWith('vnpay')}>
              {loadingPay==='vnpay' ? 'Opening VNPAY...' : 'Pay with VNPAY'}
            </button>
            <button style={btn} onClick={() => setShowBank(v => !v)}>
              Bank transfer (VietQR)
            </button>
          </div>
        )}
        {status !== 'paid' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {uid && row.student_id === uid && (
              <button style={btn} onClick={declareCash}>I paid cash</button>
            )}
            {role === 'tutor' && uid && row.tutor_id === uid && status !== 'paid' && (
              <button style={btn} onClick={confirmCash}>Confirm cash received</button>
            )}
          </div>
        )}
        {status !== 'paid' && showBank && uid && row.student_id === uid && (
          <BankTransferBlock bookingId={Number(id)} amount={row.price || 0} onSubmitted={(ok, note)=>{
            setMsg(note || '')
            if (ok && row) setRow({...row, payment_status: 'pending_review'})
          }} />
        )}
      </div>
      {msg && <p style={{ marginTop: 8, color: '#555' }}>{msg}</p>}
    </div>
  )
}

const btn: React.CSSProperties = {
  marginTop: 8,
  padding: '8px 12px',
  background: '#000',
  color: '#fff',
  borderRadius: 6,
}

function BankTransferBlock({ bookingId, amount, onSubmitted }:{ bookingId:number, amount:number, onSubmitted:(ok:boolean, note?:string)=>void }) {
  const bank = process.env.NEXT_PUBLIC_VIETQR_BANK || ''
  const acct = process.env.NEXT_PUBLIC_VIETQR_ACCOUNT || ''
  const name = process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || ''
  const addInfo = `TL_BK_${bookingId}`
  const configured = !!(bank && acct)
  const url = configured
    ? `https://img.vietqr.io/image/${encodeURIComponent(bank)}-${encodeURIComponent(acct)}-compact2.png?amount=${Math.max(0, amount)}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(name)}`
    : ''

  const submitProof = async () => {
    try {
      const { error: insErr } = await supabase
        .from('payments')
        .insert({
          booking_id: bookingId,
          gateway: 'bank',
          order_id: `bk-${bookingId}-${Date.now()}`,
          transaction_ref: null,
          amount: Math.max(0, amount),
          currency: 'VND',
          status: 'submitted',
          raw_data: { method: 'vietqr', note: addInfo },
        })
      if (insErr) { onSubmitted(false, insErr.message); return }
      const { error: updErr } = await supabase
        .from('bookings')
        .update({ payment_status: 'pending_review' })
        .eq('id', bookingId)
      if (updErr) { onSubmitted(false, updErr.message); return }
      onSubmitted(true, 'Submitted. Please wait for review.')
    } catch (e:any) {
      onSubmitted(false, e?.message || 'Could not submit proof')
    }
  }

  return (
    <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ color: '#cbd5e1', fontSize: 14, marginBottom: 8 }}>Bank transfer via VietQR</div>
      {!configured && <div style={{ color: '#fca5a5', fontSize: 12 }}>not_configured: set NEXT_PUBLIC_VIETQR_BANK, NEXT_PUBLIC_VIETQR_ACCOUNT, NEXT_PUBLIC_VIETQR_ACCOUNT_NAME</div>}
      {configured && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <img src={url} alt="VietQR" style={{ width: 220, height: 220, background: '#fff', borderRadius: 12 }} />
          <div style={{ color: '#cbd5e1', fontSize: 14 }}>
            <div>Bank: {bank}</div>
            <div>Account number: {acct}</div>
            <div>Account name: {name || '-'}</div>
            <div>Amount: {amount} VND</div>
            <div>Reference: {addInfo}</div>
            <button style={{...btn, marginTop: 12}} onClick={submitProof}>I have transferred</button>
          </div>
        </div>
      )}
    </div>
  )
}
