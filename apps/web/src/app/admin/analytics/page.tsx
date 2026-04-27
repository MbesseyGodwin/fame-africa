'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { 
  TrendingUp, Users, DollarSign, ShieldAlert, Award, 
  ArrowUpRight, ArrowDownRight, Activity, MapPin 
} from 'lucide-react'

const COLORS = ['#534AB7', '#7C72F8', '#A29BFF', '#C7C4FF', '#EEEDFE']

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics')
      return res.data.data
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const { summary, dailyVotes, categoryDistribution, stateDistribution, growthTrend, topParticipants } = data || {}

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Platform Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Comprehensive overview of platform performance and growth metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Revenue" 
          value={`₦${summary?.totalRevenue?.toLocaleString()}`} 
          icon={<DollarSign className="w-5 h-5" />} 
          trend="+12.5%" 
          color="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
        />
        <StatCard 
          label="Active Users" 
          value={summary?.totalUsers?.toLocaleString()} 
          icon={<Users className="w-5 h-5" />} 
          trend="+8.2%" 
          color="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
        />
        <StatCard 
          label="Total Participants" 
          value={summary?.totalParticipants?.toLocaleString()} 
          icon={<Award className="w-5 h-5" />} 
          trend="+5.4%" 
          color="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
        />
        <StatCard 
          label="Security Alerts" 
          value={summary?.securityAlertsCount?.toLocaleString()} 
          icon={<ShieldAlert className="w-5 h-5" />} 
          trend="-2.1%" 
          color="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Votes Chart */}
        <ChartContainer title="Daily Vote Velocity" subtitle="Vote count trends for the last 30 days">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyVotes}>
              <defs>
                <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#534AB7" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#534AB7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748B' }}
                minTickGap={30}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="votes" stroke="#534AB7" strokeWidth={2} fillOpacity={1} fill="url(#colorVotes)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Growth Trend Chart */}
        <ChartContainer title="Registration Growth" subtitle="Cumulative participant registrations">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={growthTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} minTickGap={30} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip 
                cursor={{ fill: '#F1F5F9' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" fill="#7C72F8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <ChartContainer title="Category Mix" subtitle="Contestants by talent category" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryDistribution?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Top Participants List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top Participants</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-gray-400 font-medium">
                  <th className="px-6 py-3">Participant</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Total Votes</th>
                  <th className="px-6 py-3">Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {topParticipants?.map((p: any, i: number) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                            {p.displayName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{p.displayName}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{p.category || 'N/A'}</td>
                    <td className="px-6 py-4 font-semibold text-primary">{p.totalVotes.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`
                        px-2 py-0.5 rounded-full text-[11px] font-bold
                        ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 
                          i === 1 ? 'bg-gray-100 text-gray-600' : 
                          i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'}
                      `}>
                        #{i + 1}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, trend, color }: any) {
  const isPositive = trend.startsWith('+')
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-sm transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${color} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[12px] font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
      </div>
    </div>
  )
}

function ChartContainer({ title, subtitle, children, className = '' }: any) {
  return (
    <div className={`bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 ${className}`}>
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-[12px] text-gray-500">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}
