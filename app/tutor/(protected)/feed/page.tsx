'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../../../lib/supabase/browser'
import { useEnsureProfile } from '../../../../components/useEnsureProfile'
import { useRouter } from 'next/navigation'
import ButtonLink from '@/components/ui/ButtonLink'
import LoadingScreen from '@/components/ui/LoadingScreen'

type Request = {
  id: number
  student_id: string
  subject: string
  level: string | null
  district: string
  address_note: string | null
  start_time: string | null
  duration_minutes: number | null
  budget: number | null
  first_free: boolean
  status: string
  created_at: string
}

const DANANG_DISTRICTS = [
  'Hai Chau','Thanh Khe','Son Tra','Ngu Hanh Son','Lien Chieu','Cam Le','Hoa Vang','Hoang Sa'
]

type Filters = {
  subject: string
  district: string
  minBudget: string
  maxBudget: string
  firstFree: boolean
  sortBy: 'newest'|'oldest'|'start_soon'|'start_latest'|'budget_high'|'budget_low'
}

export default function TutorFeed(){
  const ready = useEnsureProfile('tutor')
  const [list, setList] = useState<Request[]>([])
  const [msg, setMsg] = useState('')
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>({ subject: '', district: '', minBudget: '', maxBudget: '', firstFree: false, sortBy: 'newest' })

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    const uid = session?.user?.id || ''
    let q = supabase
      .from('requests')
      .select('*')
      .eq('status', 'open')
      .or(`tutor_id.is.null${uid ? `,tutor_id.eq.${uid}` : ''}`)

    if (filters.subject.trim()) q = q.ilike('subject', `%${filters.subject.trim()}%`)
    if (filters.district) q = q.eq('district', filters.district)
    if (filters.minBudget) q = q.gte('budget', Number(filters.minBudget))
    if (filters.maxBudget) q = q.lte('budget', Number(filters.maxBudget))
    if (filters.firstFree) q = q.eq('first_free', true)

    switch (filters.sortBy) {
      case 'oldest':
        q = q.order('created_at', { ascending: true })
        break
      case 'start_soon':
        q = q.order('start_time', { ascending: true })
        break
      case 'start_latest':
        q = q.order('start_time', { ascending: false })
        break
      case 'budget_high':
        q = q.order('budget', { ascending: false })
        break
      case 'budget_low':
        q = q.order('budget', { ascending: true })
        break
      default:
        q = q.order('created_at', { ascending: false })
    }

    const { data, error } = await q
    if (error) setMsg(error.message)
    setList((data as Request[]) || [])
  }

  useEffect(()=>{ load() },[])

  const accept = async (id:number)=>{
    const { data:{ session } } = await supabase.auth.getSession()
    const user = session?.user
    if(!user){ setMsg('Please sign in'); return }

    const { data, error } = await supabase.from('requests')
      .update({ status:'accepted', tutor_id: user.id })
      .eq('id', id).eq('status','open').select('*')

    if(error){ setMsg(error.message); return }
    if(!data || !data.length){ setMsg('This request has been accepted by someone else.'); return }

    const req = data[0] as Request
    const start = req.start_time ? new Date(req.start_time) : new Date()
    const end = new Date(start.getTime() + ((req.duration_minutes||90) * 60000))
    const price = req.budget || 200000
    const fee = Math.round(price * 0.2)

    const { data: bk, error: bErr } = await supabase.from('bookings').insert({
      request_id: req.id,
      tutor_id: user.id,
      student_id: req.student_id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      location: req.address_note || req.district,
      price: price,
      platform_fee: fee
    }).select('id').single()

    if(bErr){ setMsg(bErr.message); return }
    setMsg('Accepted! Booking #' + bk?.id)
    router.push(`/bookings/${bk?.id}`)
  }

  if(!ready) return <LoadingScreen label="" full={false} />

  return (
    <div style={{padding:20}}>
      <div className="mb-3 grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            placeholder="Subject contains..."
            value={filters.subject}
            onChange={e=>setFilters({...filters, subject:e.target.value})}
          />
          <select
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            value={filters.district}
            onChange={e=>setFilters({...filters, district:e.target.value})}
          >
            <option value="">All districts</option>
            {DANANG_DISTRICTS.map(d=> <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            value={filters.sortBy}
            onChange={e=>setFilters({...filters, sortBy: e.target.value as Filters['sortBy']})}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="start_soon">Start time (soonest)</option>
            <option value="start_latest">Start time (latest)</option>
            <option value="budget_high">Budget (high → low)</option>
            <option value="budget_low">Budget (low → high)</option>
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex items-stretch rounded-lg border border-white/10 bg-white/5">
            <input className="flex-1 bg-transparent px-3 py-2 text-sm" type="number" min={0} placeholder="Min budget"
              value={filters.minBudget} onChange={e=>setFilters({...filters, minBudget:e.target.value})} />
            <span className="px-2 py-2 text-xs text-slate-400 border-l border-white/10">VND</span>
          </div>
          <div className="flex items-stretch rounded-lg border border-white/10 bg-white/5">
            <input className="flex-1 bg-transparent px-3 py-2 text-sm" type="number" min={0} placeholder="Max budget"
              value={filters.maxBudget} onChange={e=>setFilters({...filters, maxBudget:e.target.value})} />
            <span className="px-2 py-2 text-xs text-slate-400 border-l border-white/10">VND</span>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-teal-500" checked={filters.firstFree} onChange={e=>setFilters({...filters, firstFree:e.target.checked})} />
            First lesson free
          </label>
        </div>
        <div className="flex gap-2">
          <button className="rounded-xl bg-black px-4 py-2 text-white" onClick={load}>Apply</button>
          <button className="rounded-xl border border-white/10 px-4 py-2 text-slate-200" onClick={()=>{setFilters({subject:'',district:'',minBudget:'',maxBudget:'',firstFree:false,sortBy:'newest'}); load()}}>Clear</button>
        </div>
      </div>
      <div className="mb-4 flex gap-2">
        <ButtonLink href="/">Home</ButtonLink>
        <ButtonLink href="/bookings" variant="outline">My bookings</ButtonLink>
      </div>
      <h2 style={{fontWeight:700, fontSize:18, marginBottom:12}}>Open requests</h2>
      {list.map(r=>{
        const start = r.start_time ? new Date(r.start_time) : null
        const duration = r.duration_minutes || 90
        return (
          <div key={r.id} style={{border:'1px solid #eee', borderRadius:8, padding:12, marginBottom:10}}>
            <div style={{fontWeight:600}}>
              <Link href={`/requests/${r.id}`} className="underline hover:text-white">
                {r.subject || 'N/A'} - {r.level||'N/A'} - {r.district}
              </Link>
            </div>
            <div style={{fontSize:13, color:'#bbb'}} className="mt-1">
              {start ? `Start: ${start.toLocaleString()}` : 'Start: (not set)'} • Duration: {duration}m
            </div>
            {r.address_note && (
              <div style={{fontSize:13, color:'#bbb'}}>Address: {r.address_note}</div>
            )}
            <div style={{fontSize:13, color:'#555'}} className="mt-1">Budget: {r.budget || '-'} {r.first_free ? '• 1st free' : ''}</div>
            <div className="flex gap-2 mt-2 items-center">
              <button style={btn} onClick={()=>accept(r.id)}>Accept</button>
              <a className="px-3 py-2 rounded border" href={`/chat/${r.id}`}>Chat</a>
              <Link className="px-3 py-2 rounded border" href={`/requests/${r.id}`}>Details</Link>
            </div>
          </div>
        )
      })}
      {list.length===0 && <div>No open requests.</div>}
      {msg && <p style={{marginTop:8, color:'#555'}}>{msg}</p>}
    </div>
  )
}
const btn: React.CSSProperties = { padding:'8px 12px', background:'#000', color:'#fff', borderRadius:6 }

