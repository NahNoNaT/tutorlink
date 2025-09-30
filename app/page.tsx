"use client"
import dynamic from 'next/dynamic'
import LoadingScreen from '@/components/ui/LoadingScreen'

const Landing = dynamic(() => import('@/components/ui/TutorlinkUIKit'), {
  ssr: false,
  loading: () => <LoadingScreen label="Loading homepage…" />,
})

export default function Page() {
  return <Landing />
}
