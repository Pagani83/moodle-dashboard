import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardHomePage } from '@/components/dashboard/dashboard-home-page'

export default async function HomePage() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin')
  }

  return <DashboardHomePage />
}
