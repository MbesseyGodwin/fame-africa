'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, competitionsApi } from '../../../../lib/api'

export default function AdminSettingsPlatform() {
  const queryClient = useQueryClient()
  const { data: cycleData } = useQuery({ queryKey: ['admin_cycle'], queryFn: () => competitionsApi.getCurrent() })
  const cycleId = cycleData?.data?.data?.id

  // These map to "Global" settings theoretically, but for this project settings belong to the Cycle scope
  const [flags, setFlags] = useState({
    maintenance_mode: 'false',
    allow_new_registrations: 'true',
    max_votes_per_device: '3'
  })

  const { data } = useQuery({
    queryKey: ['admin_settings', cycleId],
    queryFn: async () => {
      const res = await adminApi.getSettings(cycleId as string)
      return res.data?.data || []
    },
    enabled: !!cycleId
  })

  useEffect(() => {
    if (data) {
      // Seed if they exist
      const mMode = data.find((s: any) => s.settingKey === 'maintenance_mode')?.settingValue
      const allowReg = data.find((s: any) => s.settingKey === 'allow_new_registrations')?.settingValue
      const maxVotes = data.find((s: any) => s.settingKey === 'max_votes_per_device')?.settingValue
      setFlags({
        maintenance_mode: mMode || flags.maintenance_mode,
        allow_new_registrations: allowReg || flags.allow_new_registrations,
        max_votes_per_device: maxVotes || flags.max_votes_per_device
      })
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      await adminApi.updateSettings(cycleId as string, [
        { key: 'maintenance_mode', value: flags.maintenance_mode },
        { key: 'allow_new_registrations', value: flags.allow_new_registrations },
        { key: 'max_votes_per_device', value: flags.max_votes_per_device },
      ])
    },
    onSuccess: () => {
      alert("Platform config saved!")
      queryClient.invalidateQueries({ queryKey: ['admin_settings'] })
    }
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">

      <div>
        <h1 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100">Platform Configuration</h1>
        <p className="text-sm text-gray-500">Global toggles for security thresholds and service modes.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-6">

        {!cycleId && <div className="text-amber-600 bg-amber-50 p-3 rounded text-sm mb-4">You do not have an active cycle open.</div>}

        <div className="space-y-6">
          {/* Toggles */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <div className="font-medium text-[14px]">Maintenance Mode</div>
              <div className="text-xs text-gray-500">Halts all frontend traffic and displays a maintenance banner.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={flags.maintenance_mode === 'true'} onChange={e => setFlags({ ...flags, maintenance_mode: e.target.checked ? 'true' : 'false' })} disabled={!cycleId} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-500 disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <div className="font-medium text-[14px]">Allow Registrations</div>
              <div className="text-xs text-gray-500">Globally accept or reject new participant signups.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={flags.allow_new_registrations === 'true'} onChange={e => setFlags({ ...flags, allow_new_registrations: e.target.checked ? 'true' : 'false' })} disabled={!cycleId} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary disabled:opacity-50"></div>
            </label>
          </div>

          {/* Values */}
          <div className="max-w-sm py-3">
            <label className="block text-[14px] mb-1.5 font-medium">Rate Limiting (Votes per IP/day)</label>
            <div className="text-xs text-gray-500 mb-2">Maximum identical phone/device/IP hits allowed before auto-flagging as Fraud.</div>
            <input type="number" value={flags.max_votes_per_device} onChange={e => setFlags({ ...flags, max_votes_per_device: e.target.value })} disabled={!cycleId} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-950 text-sm focus:ring-primary disabled:opacity-50" />
          </div>

        </div>

        <div className="pt-4">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!cycleId || saveMutation.isPending}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Deploy Configuration'}
          </button>
        </div>
      </div>
    </div>
  )
}
