'use client'
import { useEffect, useState } from 'react'
import { useUserProfile } from '../../../components/useUserProfile'
import LoadingScreen from '@/components/ui/LoadingScreen'

type AppRow = {
  id: number
  user_id: string
  full_name: string
  email: string
  phone: string
  subjects: string[]
  districts: string[]
  price_per_hour: number
  bio: string
  evidence_url: string
}

export default function AdminApplications() {
  const { profile, user, loading } = useUserProfile()
  const [list, setList] = useState<AppRow[]>([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/applications', { cache: 'no-store' })
        const json = await res.json()
        if (json?.ok) {
          setList((json.data as AppRow[]) || [])
        }
      } catch (e) {
        setMsg('Không tải được danh sách đơn.')
      }
    })()
  }, [])

  const approve = async (app: AppRow, accept: boolean) => {
    if (!user) return
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: accept ? 'approve' : 'reject', app })
      })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.reason || 'Update failed')
      setList(prev => prev.filter(x => x.id !== app.id))
      setMsg(accept ? 'Đã duyệt hồ sơ.' : 'Đã từ chối.')
    } catch (e: any) {
      setMsg(e?.message || 'Lỗi cập nhật.')
    }
  }

  if (loading) return <LoadingScreen label="" full={false} />
  if (!profile || profile.role !== 'admin') {
    return <p style={{ padding: 20 }}>Bạn không có quyền truy cập (cần role admin).</p>
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 className="text-xl font-semibold mb-4">Đơn xin trở thành gia sư (Pending)</h2>
      {list.map(app => (
        <div key={app.id} className="border rounded-2xl p-4 mb-3">
          <div className="font-medium">{app.full_name} • {app.email} • {app.phone}</div>
          <div className="text-sm text-slate-600">Subjects: {app.subjects?.join(', ')}</div>
          <div className="text-sm text-slate-600">Districts: {app.districts?.join(', ')}</div>
          <div className="text-sm text-slate-600">Price/h: {app.price_per_hour}</div>
          {app.evidence_url && <a className="underline text-sm" href={app.evidence_url} target="_blank">Evidence</a>}
          <div className="mt-2 flex gap-2">
            <button onClick={() => approve(app, true)} className="px-3 py-1 rounded bg-black text-white">Approve</button>
            <button onClick={() => approve(app, false)} className="px-3 py-1 rounded border">Reject</button>
          </div>
        </div>
      ))}
      {list.length === 0 && <div>Không còn đơn pending.</div>}
      {msg && <p className="text-slate-600 mt-2">{msg}</p>}
    </div>
  )
}

