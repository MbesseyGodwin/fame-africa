'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '../../hooks/useAuthStore'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      {/* Topbar */}
      <header className="h-[52px] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 gap-4 sticky top-0 z-20">
        <div className="text-[16px] font-medium text-primary">VoteNaija Admin</div>
        <div className="ml-auto flex items-center gap-4">
          <div className="bg-[#EAF3DE] text-[#3B6D11] dark:bg-green-900/30 dark:text-green-400 text-[11px] px-3 py-1 rounded-full font-medium">
            Voting live
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold ring-2 ring-white dark:ring-gray-900">
            AD
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[240px] flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 sticky top-[52px] h-[calc(100vh-52px)] overflow-y-auto">
          {/* Section: Competition */}
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Competition</div>
          <nav className="space-y-1 mb-6">
            <SidebarItem href="/admin" active={isActive('/admin')} label="Overview" icon="📊" />
            <SidebarItem href="/admin/analytics" active={isActive('/admin/analytics')} label="Analytics" icon="📈" />
            <SidebarItem href="/admin/participants" active={isActive('/admin/participants')} label="Participants" icon="👥" />
            <SidebarItem href="/admin/eliminations" active={isActive('/admin/eliminations')} label="Eliminations" icon="⚔️" />
            <SidebarItem href="/admin/votes" active={isActive('/admin/votes')} label="Vote logs" icon="🗳️" />
          </nav>

          {/* Section: Settings */}
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-4">Settings</div>
          <nav className="space-y-1 mb-6">
            <SidebarItem href="/admin/cycles" active={isActive('/admin/cycles')} label="Cycle config" icon="⚙️" />
            <SidebarItem href="/admin/sponsors" active={isActive('/admin/sponsors')} label="Sponsors & ads" icon="📢" />
            <SidebarItem href="/admin/settings/prizes" active={isActive('/admin/settings/prizes')} label="Prize settings" icon="🎁" />
          </nav>

          {/* Section: Platform */}
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-4">Platform</div>
          <nav className="space-y-1">
            <SidebarItem href="/admin/users" active={isActive('/admin/users')} label="User accounts" icon="👤" />
            <SidebarItem href="/admin/broadcast" active={isActive('/admin/broadcast')} label="Broadcasts" icon="📣" />
            <SidebarItem href="/admin/settings/platform" active={isActive('/admin/settings/platform')} label="Platform config" icon="🛠️" />
            <SidebarItem href="/admin/audit" active={isActive('/admin/audit')} label="Audit log" icon="📋" />
            <SidebarItem href="/admin/fraud" active={isActive('/admin/fraud')} label="Fraud flags" icon="🚩" />
          </nav>

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => useAuthStore.getState().logout()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <span className="w-5 h-5 flex items-center justify-center text-[14px]">
                🚪
              </span>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function SidebarItem({ href, active, label, icon }: { href: string, active: boolean, label: string, icon: string }) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors
        ${active
          ? 'bg-primary/10 text-primary'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
        }
      `}
    >
      <span className="w-5 h-5 flex items-center justify-center text-[14px]">
        {icon}
      </span>
      {label}
    </Link>
  )
}
