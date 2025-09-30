import { NextResponse } from 'next/server'

// đảm bảo chạy Node runtime (để dùng nodemailer)
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = await req.json()

  const admin = process.env.ADMIN_EMAIL || ''
  if (!admin) return NextResponse.json({ ok: false, reason: 'no_admin' })

  const subject = `Tutor application: ${body.full_name || body.email}`
  const text =
`New tutor application
Name: ${body.full_name}
Email: ${body.email}
Phone: ${body.phone}
Subjects: ${Array.isArray(body.subjects) ? body.subjects.join(', ') : body.subjects}
Districts: ${Array.isArray(body.districts) ? body.districts.join(', ') : body.districts}
Price/h: ${body.price_per_hour}
Bio: ${body.bio}
Evidence: ${body.evidence_url}`

  // ---- Ưu tiên Resend nếu có API key ----
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      // ⚠️ Nếu bạn không cài 'resend', hãy: npm i resend
      const { Resend } = await import('resend')
      const resend = new Resend(resendKey)
      await resend.emails.send({
        from: 'noreply@tutorlink.local',
        to: admin,
        subject,
        text
      })
      return NextResponse.json({ ok: true, via: 'resend' })
    } catch (e) {
      // fallthrough sang SMTP
    }
  }

  // ---- Fallback SMTP nếu có cấu hình ----
  const smtpHost = process.env.SMTP_HOST
  if (smtpHost) {
    try {
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })
      await transporter.sendMail({
        from: 'noreply@tutorlink.local',
        to: admin,
        subject,
        text
      })
      return NextResponse.json({ ok: true, via: 'smtp' })
    } catch (e) {
      return NextResponse.json({ ok: false, reason: 'smtp_failed' })
    }
  }

  // ---- Không cấu hình email: vẫn trả OK để MVP tiếp tục ----
  return NextResponse.json({ ok: true, via: 'none' })
}
