'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { leaderboardApi, competitionsApi } from '../../lib/api'
import { Navbar } from '../../components/layouts/Navbar'
import { Footer } from '../../components/layouts/Footer'
import Link from 'next/link'

export default function LeaderboardPage() {
  const { data: cycleData } = useQuery({
    queryKey: ['current_cycle'],
    queryFn: async () => {
      const res = await competitionsApi.getCurrent()
      return res.data?.data
    }
  })

  const cycleId = cycleData?.id

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', cycleId],
    queryFn: async () => {
      if (!cycleId) return []
      const res = await leaderboardApi.getCurrent(cycleId)
      return res.data?.data || []
    },
    enabled: !!cycleId
  })

  const leaderboardTop3 = data?.slice(0, 3) || []
  const leaderboardRest = data?.slice(3) || []

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="text-center mb-16 animate-in slide-in-from-bottom-4 duration-700">
          <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            Live Rankings
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            The Leaderboard
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Real-time standings for the current Fame Africa competition cycle. Keep voting to ensure your favorite participant stays at the top.
          </p>
        </div>

        {isLoading || !cycleId ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-pulse">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Crunching the latest votes...</p>
          </div>
        ) : data?.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Data Yet</h3>
            <p className="text-gray-500">The leaderboard is currently empty. Check back once voting begins!</p>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in duration-1000">
            {/* Top 3 Podium */}
            <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-6 mt-8">
              {/* Rank 2 (Left) */}
              {leaderboardTop3[1] && (
                <PodiumCard participant={leaderboardTop3[1]} rank={2} color="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200" height="h-32" />
              )}
              {/* Rank 1 (Center) */}
              {leaderboardTop3[0] && (
                <PodiumCard participant={leaderboardTop3[0]} rank={1} color="bg-yellow-400 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100" height="h-40" crown />
              )}
              {/* Rank 3 (Right) */}
              {leaderboardTop3[2] && (
                <PodiumCard participant={leaderboardTop3[2]} rank={3} color="bg-orange-300 dark:bg-orange-800/80 text-orange-900 dark:text-orange-200" height="h-24" />
              )}
            </div>

            {/* Rest of the Leaderboard */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {leaderboardRest.map((p: any, idx: number) => (
                  <Link href={`/participants/${p.slug || p.participantId}`} key={p.participantId} className="flex items-center gap-4 p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition group">
                    <div className="w-8 text-center font-bold text-gray-400 dark:text-gray-500 group-hover:text-primary transition-colors">
                      #{idx + 4}
                    </div>
                    
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={p.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-lg">
                          {p.displayName?.substring(0, 2).toUpperCase() || '??'}
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base group-hover:text-primary transition-colors">
                        {p.displayName}
                      </h3>
                      {p.category && <p className="text-sm text-gray-500 mt-0.5">{p.category}</p>}
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                        {p.totalVotes.toLocaleString()}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-0.5">Votes</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

function PodiumCard({ participant, rank, color, height, crown }: { participant: any, rank: number, color: string, height: string, crown?: boolean }) {
  return (
    <Link 
      href={`/participants/${participant.slug || participant.participantId}`}
      className="flex flex-col items-center group w-full md:w-48 transform transition hover:-translate-y-2 relative"
    >
      {crown && (
        <div className="absolute -top-8 text-3xl animate-bounce">👑</div>
      )}
      
      <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 ${crown ? 'border-yellow-400 dark:border-yellow-600' : 'border-white dark:border-gray-800 shadow-sm'} overflow-hidden mb-4 z-10 bg-white dark:bg-gray-900 relative`}>
        {participant.photoUrl ? (
          <img src={participant.photoUrl} alt={participant.displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-2xl">
             {participant.displayName?.substring(0, 2).toUpperCase() || '??'}
          </div>
        )}
      </div>

      <div className={`w-full ${height} ${color} rounded-t-xl sm:rounded-t-2xl flex flex-col items-center pt-4 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-white/10 dark:bg-black/10"></div>
        <div className="relative z-10 text-center px-2">
          <div className="text-3xl font-black mb-1 opacity-90">#{rank}</div>
          <div className="font-bold text-sm truncate w-full px-1">{participant.displayName}</div>
          <div className="text-xs font-medium opacity-80 mt-1">{participant.totalVotes.toLocaleString()} Votes</div>
        </div>
      </div>
    </Link>
  )
}
