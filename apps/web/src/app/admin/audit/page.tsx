'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi, api } from '../../../lib/api'

export default function AdminAuditPage() {
  const [page, setPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)

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

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const response = await adminApi.exportAuditLog()
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'audit-logs-export.csv')
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
    } catch (error) {
      console.error('Export failed', error)
      alert('Failed to export audit logs.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500 pb-20">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100">System Audit Trail</h1>
          <p className="text-sm text-gray-500">Immutable record of all administrative actions and system events.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2 shadow-sm"
        >
          {isExporting ? 'Generating CSV...' : 'Export to CSV'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Actor</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Entity Type</th>
                <th className="px-6 py-3 min-w-[200px]">Changes / Details</th>
                <th className="px-6 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading trail...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No logs generated yet.</td></tr>
              ) : logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors align-top">
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white text-xs">{log.user?.displayName || 'System'}</div>
                    <div className="text-[10px] text-gray-500">{log.user?.email || 'automated'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{log.entityType}</span>
                    {log.entityId && <div className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {log.entityId}</div>}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono text-[10px] whitespace-pre-wrap max-w-sm overflow-hidden text-ellipsis">
                    {log.oldValue && (
                      <div className="mb-1 text-red-500 dark:text-red-400 line-through">
                        - {JSON.stringify(log.oldValue)}
                      </div>
                    )}
                    {log.newValue && (
                      <div className="text-green-600 dark:text-green-400">
                        + {JSON.stringify(log.newValue)}
                      </div>
                    )}
                    {!log.oldValue && !log.newValue && <span className="text-gray-400 italic">No diff available</span>}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">{log.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">Showing page {page} of {pages} ({total} events)</div>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Prev</button>
            <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-3 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
