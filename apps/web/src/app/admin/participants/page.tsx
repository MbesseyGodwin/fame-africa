'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../../lib/api'
import { GodModeActions } from '../../../components/admin/GodModeActions'

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
      return res.data
    }
  })

  const disqualMutation = useMutation({
    mutationFn: (id: string) => adminApi.updateParticipantStatus(id, 'DISQUALIFIED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_participants'] })
    }
  })

  // We are not passing full API signatures safely but typical pagination looks like this:
  // Correctly handle the paginated response structure
  const participants = data?.data || []
  const total = data?.pagination?.total || 0
  const pages = data?.pagination?.totalPages || 1

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
                    <div className="flex flex-col gap-1">
                      <span className={`inline-block w-fit px-2.5 py-1 rounded-full text-[11px] font-medium ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          p.status === 'ELIMINATED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                        {p.status}
                      </span>
                      {p.totalStrikes > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-orange-600 font-bold">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          {p.totalStrikes} Strikes
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <GodModeActions participant={p} />
                      {p.status === 'ACTIVE' && (
                        <button
                          disabled={disqualMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to DISQUALIFY ${p.displayName}? This is irreversible.`)) {
                              disqualMutation.mutate(p.id)
                            }
                          }}
                          className="text-[10px] text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {disqualMutation.isPending ? (
                            <>
                              <div className="w-2.5 h-2.5 border border-red-200 border-t-red-600 rounded-full animate-spin" />
                              ...
                            </>
                          ) : 'Disqualify'}
                        </button>
                      )}
                    </div>
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
