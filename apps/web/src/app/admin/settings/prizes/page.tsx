'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, competitionsApi } from '../../../../lib/api'

export default function AdminSettingsPrizes() {
  const queryClient = useQueryClient()
  const { data: cycleData } = useQuery({ queryKey: ['admin_cycle'], queryFn: () => competitionsApi.getCurrent() })
  const cycleId = cycleData?.data?.data?.id

  const [prizes, setPrizes] = useState({
    first_place: '5000000',
    second_place: '2000000',
    third_place: '1000000',
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
      const p1 = data.find((s: any) => s.settingKey === 'first_place_prize')?.settingValue
      const p2 = data.find((s: any) => s.settingKey === 'second_place_prize')?.settingValue
      const p3 = data.find((s: any) => s.settingKey === 'third_place_prize')?.settingValue
      setPrizes({
        first_place: p1 || prizes.first_place,
        second_place: p2 || prizes.second_place,
        third_place: p3 || prizes.third_place
      })
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      await adminApi.updateSettings(cycleId as string, [
        { key: 'first_place_prize', value: prizes.first_place },
        { key: 'second_place_prize', value: prizes.second_place },
        { key: 'third_place_prize', value: prizes.third_place },
      ])
    },
    onSuccess: () => {
      alert("Prizes updated successfully!")
      queryClient.invalidateQueries({ queryKey: ['admin_settings'] })
    }
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">

      <div>
        <h1 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100">Prize Pool Configuration</h1>
        <p className="text-sm text-gray-500">Adjust the displayed prize amounts for the public podium.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-6">

        {!cycleId && <div className="text-amber-600 bg-amber-50 p-3 rounded text-sm mb-4">You do not have an active cycle to configure prizes for.</div>}

        <div className="space-y-4 max-w-sm">
          <div>
            <label className="block text-[13px] text-gray-500 mb-1.5 font-medium">First Place (Winner)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">₦</span>
              <input type="number" value={prizes.first_place} onChange={e => setPrizes({ ...prizes, first_place: e.target.value })} disabled={!cycleId} className="w-full pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-950 text-sm focus:ring-primary disabled:opacity-50" />
            </div>
          </div>

          <div>
            <label className="block text-[13px] text-gray-500 mb-1.5 font-medium">Second Place</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">₦</span>
              <input type="number" value={prizes.second_place} onChange={e => setPrizes({ ...prizes, second_place: e.target.value })} disabled={!cycleId} className="w-full pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-950 text-sm focus:ring-primary disabled:opacity-50" />
            </div>
          </div>

          <div>
            <label className="block text-[13px] text-gray-500 mb-1.5 font-medium">Third Place</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">₦</span>
              <input type="number" value={prizes.third_place} onChange={e => setPrizes({ ...prizes, third_place: e.target.value })} disabled={!cycleId} className="w-full pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-950 text-sm focus:ring-primary disabled:opacity-50" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!cycleId || saveMutation.isPending}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Update Prize Values'}
          </button>
        </div>
      </div>
    </div>
  )
}
