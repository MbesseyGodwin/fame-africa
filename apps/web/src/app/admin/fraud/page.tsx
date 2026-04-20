'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../../lib/api'

export default function AdminFraudPage() {
  const queryClient = useQueryClient()
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin_fraud_flags'],
    queryFn: async () => {
      const res = await adminApi.getFraudFlags()
      return res.data?.data || []
    }
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution }: { id: string, resolution: string }) => adminApi.resolveFraudFlag(id, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_fraud_flags'] })
      setResolvingId(null)
    }
  })

  // To deduct votes or keep them, an admin usually types a resolution note.
  const handleResolve = (id: string, action: string) => {
    const resolutionText = action === 'DEDUCT' ? 'Resolved: Invalidated matched votes.' : 'Resolved: Verified as legitimate.'
    resolveMutation.mutate({ id, resolution: resolutionText })
  }

  const flags = data || []

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Fraud Monitoring
            {flags.length > 0 && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">{flags.length} open</span>}
          </h1>
          <p className="text-sm text-gray-500">Review suspected vote duplicates triggered by device fingerprint/IP collisions.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex justify-between items-center text-sm font-medium text-gray-500">
          Unresolved Security Flags
        </div>

        {isLoading && <div className="p-8 text-center text-gray-500">Loading active flags...</div>}

        {!isLoading && flags.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">System is clear</h3>
            <p className="text-gray-500 text-sm">No unresolved fraudulent voting attempts detected.</p>
          </div>
        )}

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {!isLoading && flags.map((flag: any) => (
            <div key={flag.id} className="p-5 flex flex-col md:flex-row gap-5 items-start md:items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 flex items-center justify-center font-bold flex-shrink-0">
                !
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Multiple votes detected from single fingerprint</h3>
                  <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 rounded uppercase font-medium">{flag.flagType}</span>
                </div>

                <div className="text-xs text-gray-500 grid sm:grid-cols-2 gap-x-8 gap-y-1 w-max mt-2 bg-gray-50 dark:bg-gray-950/50 p-2 rounded border border-gray-100 dark:border-gray-800">
                  <div><strong>Targeted Participant:</strong> {flag.vote?.participantId}</div>
                  <div><strong>Voter Phone:</strong> {flag.vote?.voterPhone}</div>
                  <div><strong>Reported IP:</strong> {flag.vote?.ipAddress}</div>
                  <div><strong>Time of Incident:</strong> {new Date(flag.createdAt).toLocaleString()}</div>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleResolve(flag.id, 'DEDUCT')}
                  disabled={resolveMutation.isPending}
                  className="text-xs font-medium px-4 py-2 rounded-md bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition"
                >
                  Deduce Votes & Resolve
                </button>
                <button
                  onClick={() => handleResolve(flag.id, 'IGNORE')}
                  disabled={resolveMutation.isPending}
                  className="text-xs font-medium px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Mark as Legitimate
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
