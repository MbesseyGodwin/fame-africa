'use client'

import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminBroadcastApi } from '../../../lib/api'

export default function AdminBroadcastPage() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    targetType: 'ALL',
    targetRole: 'VOTER',
    channels: ['PUSH'] as string[],
    scheduledAt: ''
  })

  const { data: historyRes, isLoading: historyLoading } = useQuery({
    queryKey: ['admin-broadcasts'],
    queryFn: () => adminBroadcastApi.getBroadcasts(),
    refetchInterval: 5000 // Poll every 5 seconds to update processing status
  })

  const history = historyRes?.data?.data || []

  const broadcastMutation = useMutation({
    mutationFn: (data: any) => adminBroadcastApi.sendBroadcast(data),
    onSuccess: () => {
      alert('Broadcast processed successfully!')
      setFormData({ 
        title: '', 
        body: '', 
        targetType: 'ALL', 
        targetRole: 'VOTER', 
        channels: ['PUSH'],
        scheduledAt: ''
      })
      queryClient.invalidateQueries({ queryKey: ['admin-broadcasts'] })
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to process broadcast')
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminBroadcastApi.cancelBroadcast(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-broadcasts'] })
    }
  })

  const toggleChannel = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.body) return alert('Title and message are required')
    if (formData.channels.length === 0) return alert('Please select at least one channel')

    const confirmMsg = formData.scheduledAt 
      ? `Schedule this broadcast for ${new Date(formData.scheduledAt).toLocaleString()}?`
      : 'Send this broadcast immediately?'

    if (confirm(confirmMsg)) {
      broadcastMutation.mutate({
        ...formData,
        targetRole: formData.targetType === 'ROLE' ? formData.targetRole : null,
        scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : null
      })
    }
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Broadcast Center</h1>
          <p className="text-sm text-gray-500">Reach your users via Push, Email, and SMS.</p>
        </div>

        <div className="bg-card border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Audience</label>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetType: 'ALL' })}
                    className={`flex-1 text-sm py-2 px-4 rounded-md font-medium transition ${formData.targetType === 'ALL' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-600 dark:text-gray-400'}`}
                  >
                    All Users
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetType: 'ROLE' })}
                    className={`flex-1 text-sm py-2 px-4 rounded-md font-medium transition ${formData.targetType === 'ROLE' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-600 dark:text-gray-400'}`}
                  >
                    By Role
                  </button>
                </div>
              </div>

              {formData.targetType === 'ROLE' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select User Role</label>
                  <select 
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white outline-none"
                  >
                    <option value="VOTER">Voters Only</option>
                    <option value="PARTICIPANT">Participants Only</option>
                    <option value="ADMIN">Admins Only</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Delivery Channels</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'PUSH', label: 'App Push', icon: '📱' },
                  { id: 'EMAIL', label: 'Email', icon: '📧' },
                  { id: 'SMS', label: 'SMS', icon: '💬' }
                ].map(ch => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition ${
                      formData.channels.includes(ch.id)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-100 dark:border-gray-800 text-gray-500'
                    }`}
                  >
                    <span className="text-xl">{ch.icon}</span>
                    <span className="text-xs font-bold">{ch.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notification Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Voting for Cycle 3 is now open!"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none font-medium"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notification Message</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Type your message here..."
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Schedule Sending (Optional)
                </label>
                <input 
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Leave empty to send immediately.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                type="submit"
                disabled={broadcastMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition disabled:opacity-70"
              >
                {broadcastMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : formData.scheduledAt ? 'Schedule Broadcast' : 'Send Broadcast Now'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* History Sidebar */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h2>
        <div className="space-y-3">
          {historyLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg" />)}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
              <p className="text-sm text-gray-400">No history yet</p>
            </div>
          ) : (
            history.map((b: any) => (
              <div key={b.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    b.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    b.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                    b.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {b.status}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{b.title}</h4>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1">{b.body}</p>
                
                <div className="mt-3 flex items-center justify-between border-t border-gray-50 dark:border-gray-800 pt-3">
                  <div className="flex gap-1">
                    {b.channels.map((c: string) => (
                      <span key={c} className="text-[9px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500 uppercase">{c}</span>
                    ))}
                  </div>
                  {b.status === 'SCHEDULED' && (
                    <button 
                      onClick={() => confirm('Cancel this scheduled broadcast?') && cancelMutation.mutate(b.id)}
                      className="text-[10px] text-red-500 font-bold hover:underline"
                    >
                      Cancel
                    </button>
                  )}
                  {b.status === 'COMPLETED' && (
                    <span className="text-[10px] text-gray-400">{b.recipientCount} sent</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
