'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminUsersApi } from '../../../lib/api'

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const logoutMutation = useMutation({
    mutationFn: (id: string) => adminUsersApi.forceLogout(id),
    onSuccess: () => alert('User logged out from all devices successfully'),
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to force logout')
  })


  const { data, isLoading } = useQuery({
    queryKey: ['admin_users', searchTerm, roleFilter, statusFilter],
    queryFn: async () => {
      const params: any = {}
      if (searchTerm) params.search = searchTerm
      if (roleFilter) params.role = roleFilter
      if (statusFilter === 'active') params.isActive = 'true'
      if (statusFilter === 'banned') params.isActive = 'false'

      const res = await adminUsersApi.listUsers(params)
      return res.data?.data || []
    }
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string, role: string }) => adminUsersApi.updateRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_users'] }),
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to update user role')
  })

  const banMutation = useMutation({
    mutationFn: ({ id, action }: { id: string, action: 'ban' | 'unban' }) => {
      if (action === 'ban') {
        const reason = prompt('Reason for ban (optional):') || 'Admin action'
        return adminUsersApi.banUser(id, reason)
      } else {
        return adminUsersApi.unbanUser(id)
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_users'] }),
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to change user status')
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100">User Accounts</h1>
          <p className="text-sm text-gray-500">Manage all registered users, ban bad actors, and assign administrative roles.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
          >
            <option value="">All Roles</option>
            <option value="VOTER">VOTER</option>
            <option value="PARTICIPANT">PARTICIPANT</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPER_ADMIN">SUPER ADMIN</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 bg-gray-50 dark:bg-gray-950/50">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last Login</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading users...</td></tr>
              ) : data?.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">No users found matching your filters.</td></tr>
              ) : (
                data?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{user.fullName || 'Anonymous'}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5" title={user.id}>{user.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700 dark:text-gray-300">{user.email}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{user.phone || 'No phone'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => {
                          if (confirm(`Change role to ${e.target.value} for ${user.email}?`)) {
                            roleMutation.mutate({ id: user.id, role: e.target.value })
                          }
                        }}
                        disabled={user.role === 'SUPER_ADMIN'}
                        className={`text-xs font-semibold px-2 py-1 rounded border-0 outline-none
                          ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : ''}
                          ${user.role === 'VOTER' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' : ''}
                          ${user.role === 'PARTICIPANT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                          ${user.role === 'SUPER_ADMIN' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                        `}
                      >
                        <option value="VOTER">VOTER</option>
                        <option value="PARTICIPANT">PARTICIPANT</option>
                        <option value="ADMIN">ADMIN</option>
                        {user.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">SUPER ADMIN</option>}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Banned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedUserId(user.id)}
                          className="text-xs font-medium px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="View History"
                        >
                          📜
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Force logout this user from all devices?')) {
                              logoutMutation.mutate(user.id)
                            }
                          }}
                          className="text-xs font-medium px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Force Logout"
                        >
                          🚫
                        </button>
                        {user.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => banMutation.mutate({ id: user.id, action: user.isActive ? 'ban' : 'unban' })}
                            className={`text-xs font-medium px-3 py-1.5 rounded ${user.isActive ? 'text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/30' : 'text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/10 dark:hover:bg-green-900/30'}`}
                          >
                            {user.isActive ? 'Ban' : 'Unban'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {selectedUserId && (
        <HistoryModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  )
}

function HistoryModal({ userId, onClose }: { userId: string, onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['user_history', userId],
    queryFn: () => adminUsersApi.getLoginHistory(userId).then(res => res.data.data)
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">User Activity & Security History</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading history...</div>
          ) : (
            <>
              {/* Login/Auth Logs */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Login & Session Events</h3>
                <div className="space-y-2">
                  {data?.auditLogs?.length > 0 ? data.auditLogs.map((log: any) => (
                    <div key={log.id} className="text-xs p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                      <div>
                        <span className={`font-bold mr-2 ${log.action === 'LOGIN' ? 'text-green-600' : 'text-blue-600'}`}>{log.action}</span>
                        <span className="text-gray-500">{log.ipAddress || 'Unknown IP'}</span>
                      </div>
                      <div className="text-gray-400">{new Date(log.createdAt).toLocaleString()}</div>
                    </div>
                  )) : <div className="text-xs text-gray-500 italic">No login events found.</div>}
                </div>
              </div>

              {/* Failed Logins */}
              <div>
                <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                  <span>⚠️</span> Failed Login Attempts
                </h3>
                <div className="space-y-2">
                  {data?.failedLogins?.length > 0 ? data.failedLogins.map((fail: any) => (
                    <div key={fail.id} className="text-xs p-3 bg-red-50/50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20 flex justify-between items-center">
                      <div className="font-medium text-red-700 dark:text-red-400">Attempt from {fail.ipAddress}</div>
                      <div className="text-red-500/70">{new Date(fail.createdAt).toLocaleString()}</div>
                    </div>
                  )) : <div className="text-xs text-gray-500 italic">No failed attempts recorded.</div>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
