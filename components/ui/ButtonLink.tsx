'use client'
import Link from 'next/link'
import React from 'react'

type Props = {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'outline' | 'ghost'
  className?: string
}

export default function ButtonLink({ href, children, variant='primary', className='' }: Props) {
  const base = 'inline-flex items-center justify-center px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 active:scale-[.98]'
  const styles =
    variant === 'primary'
      ? 'bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-900 hover:shadow-lg hover:shadow-teal-500/25'
      : variant === 'outline'
      ? 'border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10'
      : 'text-slate-300 hover:text-white hover:bg-white/5'
  return <Link href={href} className={`${base} ${styles} ${className}`}>{children}</Link>
}
