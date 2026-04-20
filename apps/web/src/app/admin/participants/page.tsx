'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../../lib/api'

export default function AdminParticipantsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['admin_participants', page, statusFilter],
    queryFn: async () => {
      const params: any = { page, limit: 15 }
      if (statusFilter !== 'ALL') params.status = statusFilter
      const res = await adminApi.getParticipants(params)
      return res.data?.data
    }
  })

  const disqualMutation = useMutation({
    mutationFn: (id: string) => adminApi.updateParticipantStatus(id, 'DISQUALIFIED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_participants'] })
    }
  })

  // We are not passing full API signatures safely but typical pagination looks like this:
  const participants = data?.data || []
  const total = data?.total || 0
  const pages = Math.ceil(total / 15) || 1

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100">Participant Management</h1>
          <p className="text-sm text-gray-500">Monitor active users, view logs, and manually disqualify if needed.</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm bg-white dark:bg-gray-900 focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="ELIMINATED">Eliminated</option>
            <option value="DISQUALIFIED">Disqualified</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Participant</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Votes</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading participants...</td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No participants found.</td>
                </tr>
              ) : participants.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center font-semibold text-gray-600 dark:text-gray-300">
                        {p.displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{p.displayName}</div>
                        <div className="text-xs text-gray-500">{p.fullName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 dark:text-gray-300">{p.user?.email}</div>
                    <div className="text-xs text-gray-500">{p.user?.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{p.totalVotes.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">All Time</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        p.status === 'ELIMINATED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {p.status === 'ACTIVE' && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to DISQUALIFY ${p.displayName}? This is irreversible.`)) {
                            disqualMutation.mutate(p.id)
                          }
                        }}
                        className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1.5 rounded bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        Disqualify
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">Showing page {page} of {pages} ({total} total)</div>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm disabled:opacity-50">Prev</button>
            <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-3 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
