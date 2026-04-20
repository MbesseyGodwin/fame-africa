'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, competitionsApi } from '../../../lib/api'

export default function AdminSponsorsPage() {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    targetUrl: '',
    tier: 'GOLD',
    isActive: true,
    displayOrder: 1,
    cycleId: ''
  })

  // Get active cycle to default association
  const { data: cycleData } = useQuery({ queryKey: ['current_cycle'], queryFn: () => competitionsApi.getCurrent() })
  const cycleId = cycleData?.data?.data?.id

  const { data, isLoading } = useQuery({
    queryKey: ['admin_sponsors', cycleId],
    queryFn: async () => {
      const res = await adminApi.getSponsors(cycleId)
      return res.data?.data || []
    },
    enabled: !!cycleId
  })

  const formMutation = useMutation({
    mutationFn: (data: any) => adminApi.createSponsor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_sponsors'] })
      setIsCreating(false)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteSponsor(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_sponsors'] })
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    formMutation.mutate({ ...formData, cycleId })
  }

  const sponsors = data || []

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100">Sponsors & Ads</h1>
          <p className="text-sm text-gray-500">Inject banners, manage tiers, and sort sponsor logs for the active cycle.</p>
        </div>

        <button
          onClick={() => {
            if (!cycleId) return alert("No active cycle found. Create one first.")
            setIsCreating(!isCreating)
            setFormData({ ...formData, cycleId })
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition"
        >
          {isCreating ? 'Cancel' : '+ Add Sponsor'}
        </button>
      </div>

      {isCreating && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs text-gray-500 mb-1">Company Name</label><input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-950" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Sponsor Tier</label>
              <select value={formData.tier} onChange={e => setFormData({ ...formData, tier: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-950">
                <option value="PLATINUM">Platinum</option>
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
              </select>
            </div>
            <div><label className="block text-xs text-gray-500 mb-1">Logo URL</label><input required type="url" value={formData.logoUrl} onChange={e => setFormData({ ...formData, logoUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-950" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Target Click URL</label><input required type="url" value={formData.targetUrl} onChange={e => setFormData({ ...formData, targetUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-950" /></div>

            <div className="md:col-span-2 flex justify-end mt-2">
              <button type="submit" disabled={formMutation.isPending} className="bg-primary text-white px-6 py-2 rounded-md font-medium text-sm disabled:opacity-50">
                Save Sponsor
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading && <div className="text-gray-500 p-8 col-span-full">Loading sponsors...</div>}
        {!isLoading && sponsors.length === 0 && !isCreating && <div className="text-gray-500 p-8 col-span-full border border-dashed rounded-xl border-gray-300 text-center">No sponsors registered for the current cycle.</div>}

        {!isLoading && sponsors.map((sponsor: any) => (
          <div key={sponsor.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm relative group flex flex-col justify-between">
            <button
              onClick={() => { if (confirm("Delete this sponsor?")) deleteMutation.mutate(sponsor.id) }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 bg-red-50 p-1.5 rounded-md hover:bg-red-100 transition"
            >
              x
            </button>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                  {sponsor.logoUrl ? <img src={sponsor.logoUrl} className="w-full h-full object-contain p-1" /> : <div className="w-full h-full bg-gray-200"></div>}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{sponsor.name}</h3>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${sponsor.tier === 'PLATINUM' ? 'bg-slate-200 text-slate-700' :
                      sponsor.tier === 'GOLD' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                    }`}>{sponsor.tier}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 text-xs flex justify-betweentext-gray-500 truncate">
              <span className="text-gray-400">Links to:</span> <a href={sponsor.targetUrl} target="_blank" className="text-primary truncate ml-1">{sponsor.targetUrl}</a>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
