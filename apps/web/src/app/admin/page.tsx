'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, adminStatsApi, competitionsApi } from '../../lib/api'

export default function AdminOverviewPage() {
  const queryClient = useQueryClient()
  const [elimCounts, setElimCounts] = useState('2')
  const [cutoffTime, setCutoffTime] = useState('23:59')
  const [tiebreaker, setTiebreaker] = useState('LOWEST_CUMULATIVE_VOTES')

  const { data: cycleData } = useQuery({
    queryKey: ['admin_cycle'],
    queryFn: async () => {
      const res = await competitionsApi.getCurrent()
      return res.data?.data
    }
  })

  // Safe fallback if cycleData is still loading or doesn't exist
  const cycleId = cycleData?.id

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['admin_dashboard'],
    queryFn: async () => {
      const res = await adminApi.getDashboard()
      return res.data?.data
    }
  })

  // New query for vote trends
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['admin_vote_trends', cycleId],
    queryFn: async () => {
      if (!cycleId) return []
      const res = await adminStatsApi.getVoteTrends(cycleId, 7) // Last 7 days
      return res.data?.data || []
    },
    enabled: !!cycleId
  })

  const { data: elimQueue, isLoading: queueLoading } = useQuery({
    queryKey: ['admin_elim_queue', cycleId],
    queryFn: async () => {
      if (!cycleId) return []
      const res = await adminApi.getEliminationQueue(cycleId)
      const data = res.data?.data
      // Normalize: handle array, wrapped object, or null
      if (Array.isArray(data)) return data
      if (data?.queue && Array.isArray(data.queue)) return data.queue
      if (data?.participants && Array.isArray(data.participants)) return data.participants
      return []
    },
    enabled: !!cycleId
  })

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!cycleId) return
      await adminApi.updateSettings(cycleId, [
        { key: 'eliminations_per_day', value: elimCounts },
        { key: 'elimination_cutoff_time', value: cutoffTime },
        { key: 'tiebreaker_rule', value: tiebreaker },
      ])
    },
    onSuccess: () => {
      alert("Settings saved successfully!")
      queryClient.invalidateQueries({ queryKey: ['admin_elim_queue'] })
    }
  })

  if (dashLoading) {
    return <div className="text-gray-500 animate-pulse">Loading dashboard elements...</div>
  }

  // Mocked for smooth fallback if specific data hasn't seeded 1:1
  const stats = dashData || {
    totalParticipants: 0,
    eliminatedToday: 0,
    totalVotes: 0,
    todayVotes: 0,
    fraudFlagsOpen: 0,
    activeCycleInfo: { name: 'Loading...', dayNumber: 0, totalDays: 0 }
  }

  // Parse trend data for the chart
  const trends = trendData || []
  const maxVotes = trends.length > 0 ? Math.max(...trends.map((t: any) => t.totalVotes)) : 1

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header string */}
      <h1 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        {stats.activeCycleInfo?.name || "Current Cycle"} — Day {stats.activeCycleInfo?.dayNumber || 0} of {stats.activeCycleInfo?.totalDays || '?'}
      </h1>

      {/* Stats Grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Active participants" value={stats.totalParticipants} highlighted />
        <StatCard label="Eliminated today" value={stats.eliminatedToday} />
        <StatCard label="Total votes cast" value={stats.totalVotes?.toLocaleString()} highlighted />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Votes today so far" value={stats.todayVotes?.toLocaleString()} />
        <StatCard label="Fraud flags" value={stats.fraudFlagsOpen} danger={stats.fraudFlagsOpen > 0} />
        <StatCard label="Eliminations/day" value={elimCounts} />
      </div>

      {/* Vote Trends Chart */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
        <h2 className="text-[14px] font-medium text-gray-900 dark:text-gray-100 mb-6">Vote Volume (Last 7 Days)</h2>
        
        {trendLoading ? (
          <div className="h-48 flex items-center justify-center text-gray-400">Loading chart...</div>
        ) : trends.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No voting data available for this cycle yet.</div>
        ) : (
          <div className="h-48 flex items-end gap-2 sm:gap-4 lg:gap-8 pt-4">
            {trends.map((day: any, i: number) => {
              const heightPercent = Math.max((day.totalVotes / maxVotes) * 100, 2)
              const dateObj = new Date(day.date)
              const dateLabel = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`

              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-8 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-medium">
                    {day.totalVotes.toLocaleString()} votes
                  </div>
                  
                  {/* Bar */}
                  <div 
                    className="w-full max-w-[40px] bg-primary/20 hover:bg-primary transition-colors rounded-t-sm relative"
                    style={{ height: `${heightPercent}%` }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-sm" />
                  </div>
                  
                  {/* Label */}
                  <div className="text-[10px] text-gray-500 mt-2 font-medium">
                    {dateLabel}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Forms & Queues Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">

        {/* Settings Block */}
        <div>
          <h2 className="text-[14px] font-medium text-gray-900 dark:text-gray-100 mb-4">Elimination settings</h2>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-4">

            <div>
              <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">Eliminations per day</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={elimCounts}
                  onChange={(e) => setElimCounts(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-[13px] text-gray-500">participants/day</span>
              </div>
            </div>

            <div>
              <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">Cutoff time</label>
              <input
                type="time"
                value={cutoffTime}
                onChange={(e) => setCutoffTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">Tiebreaker rule</label>
              <select
                value={tiebreaker}
                onChange={(e) => setTiebreaker(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="LOWEST_CUMULATIVE_VOTES">Lowest cumulative votes</option>
                <option value="LATEST_REGISTRATION">Latest registration</option>
                <option value="RANDOM">Random draw</option>
              </select>
            </div>

            <button
              onClick={() => saveSettingsMutation.mutate()}
              className="mt-2 text-sm bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-md font-medium transition-colors w-full md:w-auto shadow-sm"
            >
              Save settings
            </button>
          </div>
        </div>

        {/* Queues Block */}
        <div>
          <h2 className="text-[14px] font-medium text-gray-900 dark:text-gray-100 mb-4">Today's elimination queue</h2>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">

              {queueLoading && <div className="p-4 text-sm text-center text-gray-500">Loading queue...</div>}

              {!queueLoading && (!elimQueue || elimQueue.length === 0) && (
                <div className="p-4 text-sm text-center text-gray-500">No participants queued for elimination today.</div>
              )}

              {Array.isArray(elimQueue) && elimQueue.map((item: any, idx: number) => {
                const willBeEliminated = idx < parseInt(elimCounts);
                return (
                  <div key={item.participantId} className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-gray-800 last-of-type:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold ${willBeEliminated ? 'bg-[#FCEBEB] text-[#A32D2D] dark:bg-red-900/30' : 'bg-[#EAF3DE] text-[#3B6D11] dark:bg-green-900/30'}`}>
                      {item.photoUrl ? <img src={item.photoUrl} alt="" className="w-full h-full rounded-full object-cover" /> : item.displayName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium text-gray-900 dark:text-gray-100 truncate">{item.displayName}</div>
                      <div className="text-[12px] text-gray-500 truncate">{item.votesToday} votes today</div>
                    </div>
                    <div className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${willBeEliminated ? 'bg-[#FCEBEB] text-[#A32D2D] dark:bg-red-900/30' : 'bg-[#EAF3DE] text-[#3B6D11] dark:bg-green-900/30'}`}>
                      {willBeEliminated ? 'eliminate' : 'safe'}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-gray-50 dark:bg-gray-950/50 p-3 border-t border-gray-200 dark:border-gray-800 text-[12px] text-gray-500 text-center">
              Auto-eliminates at {cutoffTime} tonight unless overridden
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

function StatCard({ label, value, highlighted = false, danger = false }: { label: string, value: string | number, highlighted?: boolean, danger?: boolean }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
      <div className="text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</div>
      <div className={`text-2xl font-bold ${danger ? 'text-[#A32D2D]' : highlighted ? 'text-primary' : 'text-gray-900 dark:text-gray-100'}`}>
        {value}
      </div>
    </div>
  )
}
