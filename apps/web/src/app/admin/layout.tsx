'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '../../hooks/useAuthStore'
import { 
  LayoutDashboard, PieChart, Users, Sword, Vote, 
  Settings, Megaphone, Gift, User, ShieldCheck, 
  CreditCard, Radio, Wrench, ShieldAlert, ClipboardList, 
  Flag, LogOut, Clock
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [time, setTime] = React.useState(new Date())

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const isActive = (path: string) => pathname === path

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#08090a] font-sans overflow-hidden">
      {/* Topbar */}
      <header className="h-[64px] bg-white/80 dark:bg-[#0d0f11]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 flex items-center px-6 gap-4 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-primary/20">F</div>
          <div className="text-[16px] font-black text-gray-900 dark:text-white tracking-tighter uppercase">FAME AFRICA <span className="text-primary font-medium">ADMIN</span></div>
        </div>
        
        <div className="ml-auto flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[12px] font-mono font-bold text-gray-700 dark:text-gray-300">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
            <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-[2px]">Systems Live</span>
          </div>
          
          <div className="h-8 w-px bg-gray-200 dark:border-white/10 mx-1"></div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[12px] font-black text-gray-900 dark:text-white leading-none">Management</p>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Super User</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center text-[13px] font-black shadow-xl shadow-primary/10">
              AD
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[260px] flex-shrink-0 bg-white dark:bg-[#0d0f11] border-r border-gray-200 dark:border-white/5 p-5 h-full overflow-y-auto no-scrollbar">
          <div className="space-y-8 pb-12">
            <div>
              <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[3px] mb-4 px-3">Main Control</div>
              <nav className="space-y-1.5">
                <SidebarItem href="/admin" active={isActive('/admin')} label="Overview" icon={<LayoutDashboard className="w-4 h-4" /> as any} />
                <SidebarItem href="/admin/analytics" active={isActive('/admin/analytics')} label="Deep Analytics" icon={<PieChart className="w-4 h-4" /> as any} />
                <SidebarItem href="/admin/participants" active={isActive('/admin/participants')} label="Participants" icon={<Users className="w-4 h-4" /> as any} />
                <SidebarItem href="/admin/eliminations" active={isActive('/admin/eliminations')} label="Eliminations" icon={<Sword className="w-4 h-4" /> as any} />
                <SidebarItem href="/admin/votes" active={isActive('/admin/votes')} label="Vote Logs" icon={<Vote className="w-4 h-4" /> as any} />
              </nav>
            </div>

            <div>
              <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[3px] mb-4 px-3">Competition</div>
              <nav className="space-y-1.5">
                <SidebarItem href="/admin/cycles" active={isActive('/admin/cycles')} label="Cycle Config" icon={<Settings className="w-4 h-4" /> as any} />
                <SidebarItem href="/admin/sponsors" active={isActive('/admin/sponsors')} label="Partnerships" icon={<Megaphone className="w-4 h-4" /> as any} />
                <SidebarItem href="/admin/settings/prizes" active={isActive('/admin/settings/prizes')} label="Prize Settings" icon={<Gift className="w-4 h-4" /> as any} />
              </nav>
            </div>

            <div>
              <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[3px] mb-4 px-3">Platform</div>
              <nav className="space-y-1.5">
                <SidebarItem href="/admin/users" active={isActive('/admin/users')} label="User Base" icon={<User className="w-4 h-4" /> as any} />
                <SidebarItem href="/admin/kyc" active={isActive('/admin/kyc')} label="KYC / AML" icon={<ShieldCheck className="w-4 h-4" /> as any} />
                <SidebarItem href="/admin/transactions" active={isActive('/admin/transactions')} label="Financials" icon={<CreditCard className="w-4 h-4" /> as any} />
                <SidebarItem href="/admin/broadcast" active={isActive('/admin/broadcast')} label="Notifications" icon={<Radio className="w-4 h-4" /> as any} />
                <SidebarItem href="/admin/settings/platform" active={isActive('/admin/settings/platform')} label="Environment" icon={<Wrench className="w-4 h-4" /> as any} />
              </nav>
            </div>

            <div>
              <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[3px] mb-4 px-3">Security</div>
              <nav className="space-y-1.5">
                <SidebarItem href="/admin/security" active={isActive('/admin/security')} label="Threat Alerts" icon={<ShieldAlert className="w-4 h-4" /> as any} />
                <SidebarItem href="/admin/audit" active={isActive('/admin/audit')} label="Audit Trail" icon={<ClipboardList className="w-4 h-4" /> as any} />
                <SidebarItem href="/admin/fraud" active={isActive('/admin/fraud')} label="Fraud Flags" icon={<Flag className="w-4 h-4" /> as any} />
              </nav>
            </div>
          </div>

          <div className="sticky bottom-0 pt-6 mt-auto border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#0d0f11]">
            <button
              onClick={() => useAuthStore.getState().logout()}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-300 group"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Sign Out Console
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto bg-gray-50 dark:bg-[#08090a] scroll-smooth">
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarItem({ href, active, label, icon }: { href: string, active: boolean, label: string, icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-4 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 group
        ${active
          ? 'bg-primary text-white shadow-2xl shadow-primary/40 ring-4 ring-primary/10'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
        }
      `}
    >
      <div className={`transition-transform duration-300 group-hover:scale-110 ${active ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary'}`}>
        {icon}
      </div>
      <span className="tracking-tight">{label}</span>
      {active && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
      )}
    </Link>
  )
}
