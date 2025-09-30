import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import { supabaseServer } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const sb = await supabaseServer()
    const { data: auth } = await sb.auth.getUser()
    const user = auth?.user
    if (!user) return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 })

    // Require tutor role
    const { data: profile } = await sb
      .from('profiles')
      .select('role, stripe_account_id')
      .eq('id', user.id)
      .maybeSingle()
    if (!profile || (profile as { role?: string }).role !== 'tutor') {
      return NextResponse.json({ ok: false, reason: 'not_tutor' }, { status: 403 })
    }

    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      return NextResponse.json({ ok: false, reason: 'stripe_not_configured' }, { status: 500 })
    }
    const stripe = getStripe()
    const admin = getSupabaseAdmin()

    let accountId: string | undefined = (profile as { stripe_account_id?: string }).stripe_account_id || undefined
    if (!accountId) {
      const account = await stripe.accounts.create({ type: 'express' })
      accountId = account.id
      await admin.from('profiles').update({ stripe_account_id: accountId }).eq('id', user.id)
    }

    const origin = (await headers()).get('origin') || process.env.NEXT_PUBLIC_APP_BASE_URL || ''
    const refreshUrl = `${origin}/tutor/${user.id}`
    const returnUrl = `${origin}/tutor/${user.id}`

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })

    return NextResponse.json({ ok: true, url: link.url })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'unknown_error'
    return NextResponse.json({ ok: false, reason: 'error', message }, { status: 500 })
  }
}
