// app/student/layout.tsx
import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getUserAndProfile } from '@/lib/auth/getProfileServer'

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const { user } = await getUserAndProfile() // <-- hàm server bạn đã có
  if (!user) {
    redirect('/auth/sign-in?next=/student')
  }
  return <>{children}</>
}