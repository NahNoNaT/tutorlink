'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/browser'

export default function RoleSelect({ id, role }: { id: string; role: 'student'|'tutor'|'admin' }) {
  const [value, setValue] = useState(role)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  async function save(next: 'student'|'tutor'|'admin') {
    if (saving) return
    setSaving(true); setMsg('')
    const { error } = await supabase.from('profiles').update({ role: next }).eq('id', id)
    if (!error) setValue(next); else setMsg(error.message)
    setSaving(false)
  }
  return (
    <div className="flex items-center gap-2">
      <select value={value} onChange={e=>save(e.target.value as 'student'|'tutor'|'admin')} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm">
        <option value="student">student</option>
        <option value="tutor">tutor</option>
        <option value="admin">admin</option>
      </select>
      {saving && <span className="text-xs text-slate-400">Saving…</span>}
      {msg && <span className="text-xs text-rose-300">{msg}</span>}
    </div>
  )
}
