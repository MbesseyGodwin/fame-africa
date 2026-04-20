'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi, competitionsApi } from '../../../lib/api'

export default function AdminVotesPage() {
  const { data: cycleData } = useQuery({ queryKey: ['admin_cycle'], queryFn: () => competitionsApi.getCurrent() })
  const cycleId = cycleData?.data?.data?.id

  const { data, isLoading } = useQuery({
    queryKey: ['admin_votes', cycleId],
    queryFn: async () => {
      const res = await adminApi.getLiveVotes(cycleId)
      return res.data?.data || []
    },
    enabled: !!cycleId,
    refetchInterval: 5000 // Poll every 5s for the "live" effect
  })

  const votes = data || []

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Live Vote Ledger <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2"></span>
          </h1>
          <p className="text-sm text-gray-500">Real-time stream of incoming votes.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Target Participant</th>
                <th className="px-6 py-3">Voter Data</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Connecting to stream...</td></tr>
              ) : votes.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No votes cast yet.</td></tr>
              ) : votes.slice(0, 100).map((v: any) => (
                <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">{new Date(v.createdAt).toLocaleTimeString()}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{v.participant?.displayName || v.participantId}</td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 dark:text-gray-300">{v.voterPhone}</div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">{v.ipAddress}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {v.isDuplicate ? (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold">DUPLICATE</span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">COUNTED</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 text-center text-[11px] text-gray-400 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
          Showing last 100 votes
        </div>
      </div>
    </div>
  )
}
