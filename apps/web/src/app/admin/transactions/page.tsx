'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../../lib/api'

export default function AdminTransactionsPage() {
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedTx, setSelectedTx] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin_transactions', typeFilter, statusFilter],
    queryFn: () => adminApi.getTransactions({ type: typeFilter, status: statusFilter }).then(res => res.data.data)
  })

  const stats = {
    total: data?.length || 0,
    revenue: data?.reduce((acc: number, curr: any) => curr.status === 'SUCCESS' ? acc + Number(curr.amount) : acc, 0) || 0
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100">Transaction History</h1>
          <p className="text-sm text-gray-500">Monitor all payments for registrations and mega votes.</p>
        </div>
        <div className="bg-primary/5 border border-primary/10 rounded-xl px-4 py-2 text-right">
          <p className="text-[10px] uppercase tracking-wider text-primary font-bold">Total Successful Revenue</p>
          <p className="text-xl font-bold text-primary">₦{stats.revenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="REGISTRATION_FEE">Registration Fee</option>
            <option value="MEGA_VOTE">Mega Vote</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 bg-gray-50 dark:bg-gray-950/50">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading transactions...</td></tr>
              ) : data?.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">No transactions found.</td></tr>
              ) : (
                data.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{tx.user?.fullName}</div>
                      <div className="text-xs text-gray-500">{tx.user?.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{tx.reference}</td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                      ₦{Number(tx.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tx.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                        tx.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        See More
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedTx(null)}
          />

          {/* Modal Content */}
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Transaction Details</h2>
                <p className="text-[10px] text-gray-400 font-mono mt-1">ID: {selectedTx.id}</p>
              </div>
              <button onClick={() => setSelectedTx(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <DetailItem label="Customer" value={selectedTx.user?.fullName} />
                <DetailItem label="Email" value={selectedTx.user?.email} />
                <DetailItem label="Reference" value={selectedTx.reference} />
                <DetailItem label="Gateway" value={selectedTx.provider} />
                <DetailItem label="Transaction Type" value={selectedTx.type?.replace(/_/g, ' ')} />
                <DetailItem label="Amount" value={`₦${Number(selectedTx.amount).toLocaleString()}`} />
                <DetailItem label="Status" value={selectedTx.status} isStatus />
                <DetailItem label="Fulfilled" value={selectedTx.isFulfilled ? 'YES' : 'NO'} />
                <DetailItem label="Created At" value={new Date(selectedTx.createdAt).toLocaleString()} />
                <DetailItem label="Last Update" value={new Date(selectedTx.updatedAt).toLocaleString()} />
              </div>

              {selectedTx.metadata && Object.keys(selectedTx.metadata).length > 0 && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Gateway Metadata</h3>
                  <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <pre className="text-[11px] font-mono text-gray-600 dark:text-gray-400 overflow-x-auto">
                      {JSON.stringify(selectedTx.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setSelectedTx(null)}
                className="w-full py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailItem({ label, value, isStatus }: { label: string, value: string, isStatus?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">{label}</p>
      {isStatus ? (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${value === 'SUCCESS' ? 'bg-green-100 text-green-700' :
            value === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
          {value}
        </span>
      ) : (
        <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">{value || 'N/A'}</p>
      )}
    </div>
  )
}
