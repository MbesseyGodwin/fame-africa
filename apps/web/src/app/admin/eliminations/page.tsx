'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi, competitionsApi } from '../../../lib/api'

export default function AdminEliminationsPage() {
  const { data: cycleData } = useQuery({ queryKey: ['admin_cycle'], queryFn: () => competitionsApi.getCurrent() })
  const cycleId = cycleData?.data?.data?.id

  const { data, isLoading } = useQuery({
    queryKey: ['admin_eliminations_history', cycleId],
    queryFn: async () => {
      const res = await adminApi.getEliminations(cycleId)
      return res.data?.data || []
    },
    enabled: !!cycleId
  })

  // The active "queue" and "settings" belong on the /admin overview page!
  // This page is a dedicated ledger for *historical* eliminations inside the current cycle.

  const history = data || []

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100">Elimination History</h1>
          <p className="text-sm text-gray-500">Historical ledger of all dropped participants for the active cycle.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Participant</th>
                <th className="px-6 py-3">Date Dropped</th>
                <th className="px-6 py-3">Reason</th>
                <th className="px-6 py-3 text-right">Votes at drop</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Loading history...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No participants have been eliminated yet.</td></tr>
              ) : history.map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{e.participant?.displayName || 'Unknown'}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(e.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded text-xs">
                      {e.reason || 'AUTO_ELIMINATION'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-200">
                    {e.participant?.totalVotes || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
