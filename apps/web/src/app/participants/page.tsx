// apps/web/src/app/participants/page.tsx

'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { participantsApi } from '../../lib/api'
import Link from 'next/link'

export default function ParticipantsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRegion, setFilterRegion] = useState('All')

  const { data: participantsData, isLoading } = useQuery({
    queryKey: ['participants_list'],
    queryFn: async () => {
      const res = await participantsApi.list({})
      return res.data?.data || []
    }
  })

  // Quick client-side filtering since API might just dump all active
  const filtered = (participantsData || []).filter((p: any) => {
    const matchesSearch = p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.bio && p.bio.toLowerCase().includes(searchTerm.toLowerCase()))

    // If you had state/region in the schema, you'd filter it here. Using 'All' for MVP.
    const matchesRegion = filterRegion === 'All'
    return matchesSearch && matchesRegion
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Participants</h1>
          <p className="text-gray-500 max-w-xl mx-auto">Discover and support your favorite candidates. Use the search to find someone specific or browse the active leaderboard.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search participants by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {['All', 'Lagos', 'Abuja', 'PH'].map(region => (
              <button
                key={region}
                onClick={() => setFilterRegion(region)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterRegion === region ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 h-48 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((participant: any) => (
              <Link
                href={`/vote/${participant.voteLinkSlug}`}
                key={participant.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 text-center group hover:shadow-lg transition-all hover:-translate-y-1 block"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold mb-3 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  {participant.photoUrl ? (
                    <img src={participant.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    participant.displayName.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="font-medium text-gray-900 dark:text-white text-[15px] mb-1 truncate">{participant.displayName}</div>
                <div className="text-[11px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full inline-block font-medium mb-3">
                  {participant.status === 'ELIMINATED' ? <span className="text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400">Eliminated</span> : participant.status.toLowerCase()}
                </div>

                <button className="w-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors py-2 rounded-lg text-sm font-medium">
                  Vote
                </button>
              </Link>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500">
                No participants found matching your criteria.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
