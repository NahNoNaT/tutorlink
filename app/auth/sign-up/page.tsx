'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/browser'
import Link from 'next/link'

const USERNAME_RE = /^[a-z0-9._-]{3,20}$/i

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    if (password !== confirm) return setMsg('Mật khẩu nhập lại không khớp')
    const uname = username.trim().toLowerCase()
    if (!USERNAME_RE.test(uname)) {
      return setMsg('Tên đăng nhập 3–20 ký tự, chỉ gồm a–z, 0–9, ., _, -')
    }

    setLoading(true)
    try {
      // 1) Check trùng username
      const { data: existed } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', uname)
        .maybeSingle()
      if (existed) { setLoading(false); return setMsg('Tên đăng nhập đã tồn tại') }

      // 2) Tạo tài khoản Supabase Auth
      const { error: upErr } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, username: uname, role: 'student' } }
      })
      if (upErr) { setLoading(false); return setMsg(upErr.message) }

      // 3) Đăng nhập ngay (nếu có confirm email thì bước này sẽ báo cần xác nhận)
      const { error: inErr } = await supabase.auth.signInWithPassword({ email, password })
      if (inErr) { setLoading(false); return setMsg('Đăng ký thành công. Hãy xác nhận email rồi đăng nhập.') }

      // 4) Lưu vào DB web (profiles). Không đụng admin/tutor
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: p } = await supabase.from('profiles').select('id,role').eq('id', user.id).maybeSingle()
        if (!p) {
          await supabase.from('profiles').insert({
            id: user.id,
            role: 'student',
            full_name: fullName || user.email,
            email: user.email,
            username: uname
          })
        } else if (p.role !== 'admin') {
          await supabase.from('profiles')
            .update({ full_name: fullName || user.email, email: user.email, username: uname })
            .eq('id', user.id)
        }
      }

      router.push('/student/request-new')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">Tạo tài khoản TutorLink</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border px-3 py-2 rounded" placeholder="Họ tên"
               value={fullName} onChange={e=>setFullName(e.target.value)} required />
        <input className="w-full border px-3 py-2 rounded" type="email" placeholder="Email"
               value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full border px-3 py-2 rounded" placeholder="Tên đăng nhập"
               value={username} onChange={e=>setUsername(e.target.value)} required />
        <input className="w-full border px-3 py-2 rounded" type="password" placeholder="Mật khẩu (>=6)"
               minLength={6} value={password} onChange={e=>setPassword(e.target.value)} required />
        <input className="w-full border px-3 py-2 rounded" type="password" placeholder="Nhập lại mật khẩu"
               minLength={6} value={confirm} onChange={e=>setConfirm(e.target.value)} required />

        <button disabled={loading} className="w-full px-4 py-2 rounded-2xl bg-black text-white">
          {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
        </button>
        {msg && <p className="text-sm text-slate-600">{msg}</p>}
      </form>

      <p className="text-sm text-slate-600 mt-3">
        Đã có tài khoản? <Link href="/auth/sign-in" className="underline">Đăng nhập</Link>
      </p>
    </div>
  )
}
