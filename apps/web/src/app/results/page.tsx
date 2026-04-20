'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { eliminationsApi } from '../../lib/api'

export default function ResultsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['eliminations_history'],
    queryFn: async () => {
      const res = await eliminationsApi.getCurrentCycle()
      return res.data?.data || []
    }
  })

  const eliminations = Array.isArray(data) ? data : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            Spring 2026 Cycle
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Competition Results</h1>
          <p className="text-gray-500 max-w-xl mx-auto">Track the daily eliminations. The participant with the lowest votes at 23:59 each day is eliminated. The last one standing wins it all.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {eliminations.length === 0 && (
              <div className="text-center py-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
                <div className="text-5xl mb-4">🏆</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Eliminations Yet</h3>
                <p className="text-sm text-gray-500">The competition is still in its early stages. Check back after the first cutoff time!</p>
              </div>
            )}

            {eliminations.map((elim: any, idx: number) => (
              <div key={elim.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 flex items-center gap-5 shadow-sm transition-transform hover:-translate-y-1">
                <div className="w-14 h-14 rounded-full bg-[#FCEBEB] text-[#A32D2D] dark:bg-red-900/30 flex items-center justify-center font-bold text-xl flex-shrink-0">
                  {elim.participant?.user?.displayName?.substring(0, 2).toUpperCase() || '••'}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-[16px]">
                      {elim.participant?.user?.displayName || 'Unknown Participant'}
                    </h3>
                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                      Eliminated
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Eliminated on Day {elim.dayNumber} with {elim.voteCountThatDay} votes
                  </p>
                </div>

                <div className="text-right hidden sm:block">
                  <div className="text-xs text-gray-400 uppercase tracking-wide font-medium">Cumulative Votes</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{elim.cumulativeVotes?.toLocaleString() || 0}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
