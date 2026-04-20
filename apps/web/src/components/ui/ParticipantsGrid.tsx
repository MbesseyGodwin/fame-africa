'use client'

import { useQuery } from '@tanstack/react-query'
import { participantsApi } from '../../lib/api'
import Link from 'next/link'

export function ParticipantsGrid() {
  const { data } = useQuery({
    queryKey: ['participants'],
    queryFn: async () => {
      try {
        const res = await participantsApi.list({ limit: 10, sort: 'votes' })
        return res.data?.data?.participants || []
      } catch {
        return []
      }
    }
  })

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No participants found for the current cycle.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {data.map((p: any) => (
        <Link 
          key={p.id} 
          href={`/vote/${p.voteLinkSlug}`}
          className="group block rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30 backdrop-blur-sm"
        >
          <div className="aspect-square rounded-full overflow-hidden mb-4 border-2 border-gray-50 dark:border-gray-800 group-hover:border-primary transition-colors mx-auto w-24">
            <img 
              src={p.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.voteLinkSlug}`} 
              alt={p.displayName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{p.displayName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {Number(p.totalVotes).toLocaleString()} votes
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
