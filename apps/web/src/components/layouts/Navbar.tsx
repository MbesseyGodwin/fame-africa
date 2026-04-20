'use client'

import Link from 'next/link'
import { useAuthStore } from '../../hooks/useAuthStore'
import { useState } from 'react'

interface Props { minimal?: boolean }

export function Navbar({ minimal }: Props) {
  const { user, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="bg-card border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">
            F
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-primary transition-colors">
            FameAfrica
          </span>
        </Link>

        {!minimal && (
          <>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/leaderboard" className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary">
                Leaderboard
              </Link>
              <Link href="/participants" className="text-sm text-gray-600 hover:text-primary dark:text-gray-400">
                Participants
              </Link>
              <Link href="/results" className="text-sm text-gray-600 hover:text-primary dark:text-gray-400">
                Results
              </Link>
              <Link href="/how-it-works" className="text-sm text-gray-600 hover:text-primary dark:text-gray-400">
                How it works
              </Link>
              <Link href="/about" className="text-sm text-gray-600 hover:text-primary dark:text-gray-400">
                About
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-sm text-primary font-medium hidden md:block"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-medium text-primary"
                  >
                    {user.displayName.slice(0, 2).toUpperCase()}
                  </button>
                  {menuOpen && (
                    <div className="absolute right-4 top-14 bg-card border border-gray-100 rounded-theme shadow-sm p-2 min-w-40 z-50">
                      <Link href="/dashboard" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                        Dashboard
                      </Link>
                      <Link href="/dashboard/settings" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                        Appearance
                      </Link>
                      <button
                        onClick={logout}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm text-gray-600 hover:text-primary">
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="btn-primary text-sm px-4 py-2 rounded-theme font-medium"
                  >
                    Enter competition
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  )
}
