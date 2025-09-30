import { redirect } from 'next/navigation'
import { getUserAndProfile } from '@/lib/auth/getProfileServer'

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getUserAndProfile()
  if (!user) redirect('/auth/sign-in?next=/tutor/feed')
  if (profile?.role !== 'tutor') redirect('/tutor/apply')
  return <>{children}</>
}
