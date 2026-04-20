'use client'

import { useQuery } from '@tanstack/react-query'
import { competitionsApi } from '../../lib/api'

export function StatsBar() {
  const { data } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      // Fetch the current competition active cycle explicitly. 
      // Wrapping with try-catch to not break rendering if no cycle exists yet
      try {
        const cycleRes = await competitionsApi.getCurrent()
        if (!cycleRes.data?.data?.id) return null;
        const cycleId = cycleRes.data.data.id
        const statsRes = await competitionsApi.getStats(cycleId)
        return statsRes.data.data
      } catch {
        return null
      }
    },
    retry: false
  })

  return (
    <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-10">
      <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-200 dark:divide-gray-800">
          <StatItem label="Participants" value={data?.activeParticipants || '0'} />
          <StatItem label="Total Votes" value={data?.totalVotes || '0'} />
          <StatItem label="Today's Votes" value={data?.todayVotes || '0'} />
          <StatItem label="Days Left" value="-" />
        </div>
      </div>
    </div>
  )
}

function StatItem({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="text-center px-4">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
    </div>
  )
}
