import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

export default auth((req) => {
  const { pathname } = req.nextUrl
  // const isAuthenticated = !!req.auth
  
  // TEMPORARY: Disable authentication for manual user creation
  // TODO: Re-enable after users are created
  
  // Public paths that don't require authentication
  // const publicPaths = ['/auth/signin', '/api/auth']
  
  // const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // If not authenticated and trying to access protected route
  // if (!isAuthenticated && !isPublicPath) {
  //   const signInUrl = new URL('/auth/signin', req.url)
  //   return NextResponse.redirect(signInUrl)
  // }
  
  // If authenticated and trying to access sign-in page, redirect to dashboard
  // if (isAuthenticated && pathname === '/auth/signin') {
  //   return NextResponse.redirect(new URL('/', req.url))
  // }
  
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
