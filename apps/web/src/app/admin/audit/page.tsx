'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../../lib/api'

export default function AdminAuditPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin_audit', page],
    queryFn: async () => {
      const res = await adminApi.getAuditLog({ page, limit: 20 })
      return res.data?.data
    }
  })

  // Destructure pagination
  const logs = data?.data || []
  const total = data?.total || 0
  const pages = Math.ceil(total / 20) || 1

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100">Audit Log</h1>
          <p className="text-sm text-gray-500">Security trail of all destructive or state-changing actions performed by admins.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Admin</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Target Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Loading trail...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No logs generated yet.</td></tr>
              ) : logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{log.adminId}</td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono text-[11px] whitespace-pre-wrap">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">Showing page {page} of {pages} ({total} events)</div>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm disabled:opacity-50">Prev</button>
            <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-3 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
