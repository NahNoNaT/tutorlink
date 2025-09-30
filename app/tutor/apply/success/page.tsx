import Link from 'next/link'
export default function TutorApplySuccess() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-teal-500/20 text-teal-300 grid place-items-center text-2xl">✓</div>
      <h1 className="text-2xl font-bold text-white">Đã gửi đơn trở thành gia sư</h1>
      <p className="mt-2 text-slate-400">Chúng tôi đã nhận được đơn của bạn và sẽ phản hồi sau khi xét duyệt.</p>
      <div className="mt-6 inline-flex gap-2">
        <Link href="/" className="rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 px-4 py-2 text-slate-900 font-semibold">Về trang chủ</Link>
        <Link href="/tutor/feed" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-slate-100">Xem Tutor feed</Link>
      </div>
    </div>
  )
}
