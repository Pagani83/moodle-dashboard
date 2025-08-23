'use client'

import { signOut, useSession } from 'next-auth/react'
import { LogOut, User, Shield } from 'lucide-react'

export function UserMenu() {
  const { data: session } = useSession()

  if (!session?.user) return null

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2 text-sm">
        <div className="flex items-center space-x-2 px-3 py-2 bg-slate-100 dark:bg-gray-700 rounded-lg">
          {session.user.role === 'ADMIN' ? (
            <Shield className="h-4 w-4 text-blue-600" />
          ) : (
            <User className="h-4 w-4 text-gray-600" />
          )}
          <span className="font-medium text-slate-700 dark:text-gray-300">
            {session.user.name}
          </span>
          <span className="text-xs text-slate-500 dark:text-gray-400">
            ({session.user.role})
          </span>
        </div>
      </div>
      
      <button
        onClick={() => signOut({ callbackUrl: '/auth/signin' })}
        className="inline-flex items-center space-x-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-800/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-all duration-200"
        title="Sair do sistema"
      >
        <LogOut className="h-4 w-4" />
        <span>Sair</span>
      </button>
    </div>
  )
}
