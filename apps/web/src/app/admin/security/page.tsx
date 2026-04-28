'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../../lib/api'

export default function AdminSecurityPage() {
  const queryClient = useQueryClient()
  const [resolvedFilter, setResolvedFilter] = useState('false')

  const { data, isLoading } = useQuery({
    queryKey: ['admin_security_alerts', resolvedFilter],
    queryFn: () => adminApi.getSecurityAlerts({ resolved: resolvedFilter }).then(res => res.data.data)
  })

  const resolveMutation = useMutation({
    mutationFn: (id: string) => adminApi.resolveSecurityAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_security_alerts'] })
      alert('Alert resolved')
    }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span className="text-red-500">🛡️</span> Security Alerts
          </h1>
          <p className="text-sm text-gray-500">Manage brute-force attempts, session hijacking, and suspicious activities.</p>
        </div>
        <div className="flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1">
          <button
            onClick={() => setResolvedFilter('false')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${resolvedFilter === 'false' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500'}`}
          >
            Active
          </button>
          <button
            onClick={() => setResolvedFilter('true')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${resolvedFilter === 'true' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500'}`}
          >
            Resolved
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500">Loading security alerts...</div>
        ) : data?.length === 0 ? (
          <div className="py-12 text-center text-gray-500 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
            <p className="text-lg mb-1">✅ No {resolvedFilter === 'true' ? 'resolved' : 'active'} alerts</p>
            <p className="text-sm">Platform security status is healthy.</p>
          </div>
        ) : (
          data.map((alert: any) => (
            <div key={alert.id} className={`bg-white dark:bg-gray-900 border ${alert.severity === 'CRITICAL' ? 'border-red-200 dark:border-red-900/50' : 'border-gray-200 dark:border-gray-800'} rounded-xl shadow-sm overflow-hidden`}>
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      alert.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                      alert.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                      alert.severity === 'MEDIUM' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs font-bold text-gray-400 font-mono">{alert.type}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{alert.message}</p>
                  <p className="text-xs text-gray-500">{new Date(alert.createdAt).toLocaleString()} • {alert.id}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  {alert.metadata && (
                    <div className="text-[10px] bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-800 font-mono text-gray-600 dark:text-gray-400">
                      IP: {alert.metadata.ip || 'Unknown'}
                    </div>
                  )}
                  {!alert.isResolved && (
                    <button
                      onClick={() => resolveMutation.mutate(alert.id)}
                      className="px-4 py-2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
