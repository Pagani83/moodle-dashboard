import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// TEMPORARY: Completely disable middleware for manual user creation
// TODO: Re-enable auth middleware after users are created

export function middleware(req: NextRequest) {
  // Allow all requests through without authentication
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
