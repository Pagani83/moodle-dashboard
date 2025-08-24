import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardHomePage } from '@/components/dashboard/dashboard-home-page'

export default async function HomePage() {
  // TEMPORARY: Disable auth check for manual user creation
  // TODO: Re-enable after users are created
  
  // const session = await auth()
  // 
  // if (!session) {
  //   redirect('/auth/signin')
  // }

  return <DashboardHomePage />
}
