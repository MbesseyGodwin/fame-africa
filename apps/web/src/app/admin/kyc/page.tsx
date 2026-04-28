'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../../lib/api'

export default function AdminKycPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('PENDING')

  const { data, isLoading } = useQuery({
    queryKey: ['admin_kyc', statusFilter],
    queryFn: () => adminApi.getKycRecords({ status: statusFilter }).then(res => res.data.data)
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string, status: string, reason?: string }) => 
      adminApi.updateKycStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_kyc'] })
      alert('KYC status updated')
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Update failed')
  })

  const handleAction = (id: string, status: 'APPROVED' | 'REJECTED') => {
    let reason = ''
    if (status === 'REJECTED') {
      reason = prompt('Reason for rejection:') || ''
      if (!reason) return
    }
    if (confirm(`Are you sure you want to ${status.toLowerCase()} this KYC record?`)) {
      updateStatusMutation.mutate({ id, status, reason })
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100">KYC Verification</h1>
        <p className="text-sm text-gray-500">Review and verify participant identities for prize eligibility.</p>
      </div>

      <div className="flex gap-2">
        {['PENDING', 'APPROVED', 'REJECTED'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status 
                ? 'bg-primary text-white' 
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-gray-500">Loading KYC records...</div>
        ) : data?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500">No {statusFilter.toLowerCase()} records found.</div>
        ) : (
          data.map((record: any) => (
            <div key={record.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{record.user?.fullName}</h3>
                  <p className="text-xs text-gray-500">{record.user?.email}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  record.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                  record.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {record.status}
                </span>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-gray-500 mb-1">ID Type</p>
                    <p className="font-medium text-gray-900 dark:text-white">{record.idType}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">ID Number</p>
                    <p className="font-medium text-gray-900 dark:text-white">{record.idNumber || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 mb-1">BVN</p>
                    <p className="font-medium text-gray-900 dark:text-white font-mono">{record.bvn}</p>
                  </div>
                </div>

                <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative group">
                  {record.idImageUrl ? (
                    <img src={record.idImageUrl} alt="ID Document" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image Provided</div>
                  )}
                  <a 
                    href={record.idImageUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                  >
                    View Full Image
                  </a>
                </div>

                {record.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(record.id, 'APPROVED')}
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {updateStatusMutation.isPending ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ...
                        </>
                      ) : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(record.id, 'REJECTED')}
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {updateStatusMutation.isPending ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ...
                        </>
                      ) : 'Reject'}
                    </button>
                  </div>
                )}
                {record.rejectionReason && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                    <p className="text-[11px] font-bold text-red-700 dark:text-red-400 mb-1">Rejection Reason:</p>
                    <p className="text-xs text-red-600 dark:text-red-300">{record.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
