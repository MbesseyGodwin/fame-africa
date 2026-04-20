'use client'

import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { adminBroadcastApi } from '../../../lib/api'

export default function AdminBroadcastPage() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetType: 'ALL',
    targetRole: 'VOTER'
  })

  const broadcastMutation = useMutation({
    mutationFn: (data: any) => adminBroadcastApi.sendBroadcast(data),
    onSuccess: (data) => {
      alert(`Broadcast sent successfully to ${data?.data?.data?.count || 0} users!`)
      setFormData({ ...formData, title: '', message: '' })
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to send broadcast')
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.message) {
      alert('Title and message are required')
      return
    }

    if (confirm(`Are you sure you want to send this broadcast to ${formData.targetType === 'ALL' ? 'ALL USERS' : 'ALL ' + formData.targetRole + 'S'}?`)) {
      broadcastMutation.mutate(formData)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100">Broadcast Center</h1>
          <p className="text-sm text-gray-500">Send push notifications and alerts to platform users by role or globally.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="VOTER">Voters Only</option>
                  <option value="CONTESTANT">Contestants Only</option>
                  <option value="ADMIN">Admins Only</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notification Title</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Voting for Cycle 3 is now open!"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notification Message</label>
            <textarea 
              required
              rows={4}
              placeholder="Type your message here..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
            />
            <p className="text-xs text-gray-500 mt-2 text-right">{formData.message.length} characters</p>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
            <button
              type="submit"
              disabled={broadcastMutation.isPending}
              className="bg-primary hover:bg-primary-dark text-white px-8 py-2.5 rounded-lg font-medium shadow-sm shadow-primary/30 flex items-center gap-2 transition disabled:opacity-70"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {broadcastMutation.isPending ? 'Sending...' : 'Send Broadcast'}
            </button>
          </div>

        </form>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-5 flex gap-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600">
          ℹ️
        </div>
        <div>
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">How Broadcasts Work</h4>
          <p className="text-xs text-blue-700 dark:text-blue-400/80 leading-relaxed">
            Broadcast messages appear in the notification drawer of mobile apps for all targeted active users. They instantly trigger push alerts if the user is connected to the internet. Please use this feature strictly for meaningful updates to avoid user fatigue.
          </p>
        </div>
      </div>
    </div>
  )
}
