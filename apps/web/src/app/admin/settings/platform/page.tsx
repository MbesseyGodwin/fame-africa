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
    max_votes_per_device: '3',
    daily_elimination_count: '1',
    vote_price_ngn: '100',
    max_votes_per_transaction: '1000',
    min_withdrawal_amount: '10000',
    enable_kyc_verification: 'false',
    require_email_verification: 'false',
    enable_sms_notifications: 'true',
    enable_email_notifications: 'true',
    tiebreaker_rule: 'LOWEST_CUMULATIVE_VOTES',
    ai_bio_daily_limit: '2',
    ai_bio_max_words: '80',
    ai_agent_enabled: 'true',
    ai_strategy_daily_limit: '2',
    ai_strategy_max_words: '250',
    story_max_file_size_mb: '50',
    story_daily_limit: '5',
    story_allowed_formats: '.mp4,.mov',
    story_moderation_enabled: 'false'
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
      const getValue = (key: string) => data.find((s: any) => s.key === key)?.value
      
      setFlags(prev => ({
        maintenance_mode: getValue('maintenance_mode') || prev.maintenance_mode,
        allow_new_registrations: getValue('allow_new_registrations') || prev.allow_new_registrations,
        max_votes_per_device: getValue('max_votes_per_device') || prev.max_votes_per_device,
        daily_elimination_count: getValue('daily_elimination_count') || prev.daily_elimination_count,
        vote_price_ngn: getValue('vote_price_ngn') || prev.vote_price_ngn,
        max_votes_per_transaction: getValue('max_votes_per_transaction') || prev.max_votes_per_transaction,
        min_withdrawal_amount: getValue('min_withdrawal_amount') || prev.min_withdrawal_amount,
        enable_kyc_verification: getValue('enable_kyc_verification') || prev.enable_kyc_verification,
        require_email_verification: getValue('require_email_verification') || prev.require_email_verification,
        enable_sms_notifications: getValue('enable_sms_notifications') || prev.enable_sms_notifications,
        enable_email_notifications: getValue('enable_email_notifications') || prev.enable_email_notifications,
        tiebreaker_rule: getValue('tiebreaker_rule') || prev.tiebreaker_rule,
        ai_bio_daily_limit: getValue('ai_bio_daily_limit') || prev.ai_bio_daily_limit,
        ai_bio_max_words: getValue('ai_bio_max_words') || prev.ai_bio_max_words,
        ai_agent_enabled: getValue('ai_agent_enabled') || prev.ai_agent_enabled,
        ai_strategy_daily_limit: getValue('ai_strategy_daily_limit') || prev.ai_strategy_daily_limit,
        ai_strategy_max_words: getValue('ai_strategy_max_words') || prev.ai_strategy_max_words,
        story_max_file_size_mb: getValue('story_max_file_size_mb') || prev.story_max_file_size_mb,
        story_daily_limit: getValue('story_daily_limit') || prev.story_daily_limit,
        story_allowed_formats: getValue('story_allowed_formats') || prev.story_allowed_formats,
        story_moderation_enabled: getValue('story_moderation_enabled') || prev.story_moderation_enabled,
      }))
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = Object.entries(flags).map(([key, value]) => ({ key, value }))
      await adminApi.updateSettings(cycleId as string, payload)
    },
    onSuccess: () => {
      alert("Platform config saved!")
      queryClient.invalidateQueries({ queryKey: ['admin_settings'] })
    }
  })

  const Toggle = ({ label, desc, field }: { label: string, desc: string, field: keyof typeof flags }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
      <div>
        <div className="font-medium text-[14px]">{label}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={flags[field] === 'true'} onChange={e => setFlags({ ...flags, [field]: e.target.checked ? 'true' : 'false' })} disabled={!cycleId} className="sr-only peer" />
        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${field === 'maintenance_mode' ? 'peer-checked:bg-red-500' : 'peer-checked:bg-primary'} disabled:opacity-50`}></div>
      </label>
    </div>
  )

  const NumberInput = ({ label, desc, field }: { label: string, desc: string, field: keyof typeof flags }) => (
    <div className="py-3">
      <label className="block text-[14px] mb-1.5 font-medium">{label}</label>
      <div className="text-xs text-gray-500 mb-2">{desc}</div>
      <input type="number" value={flags[field]} onChange={e => setFlags({ ...flags, [field]: e.target.value })} disabled={!cycleId} className="w-full max-w-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-950 text-sm focus:ring-primary disabled:opacity-50" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100">Platform Configuration</h1>
        <p className="text-sm text-gray-500">Comprehensive settings for operations, financials, security, and notifications.</p>
      </div>

      {!cycleId && <div className="text-amber-600 bg-amber-50 p-3 rounded text-sm mb-4">You do not have an active cycle open. Settings are locked.</div>}

      <div className="grid grid-cols-1 gap-6">
        
        {/* Operations & Core Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">System Operations</h2>
          <Toggle label="Maintenance Mode" desc="Halts all frontend traffic and displays a maintenance banner." field="maintenance_mode" />
          <Toggle label="Allow Registrations" desc="Globally accept or reject new participant signups." field="allow_new_registrations" />
          
          <NumberInput label="Daily Elimination Count" desc="Number of participants to drop at the bottom of the leaderboard each day." field="daily_elimination_count" />
          
          <div className="py-3">
            <label className="block text-[14px] mb-1.5 font-medium">Tiebreaker Rule</label>
            <div className="text-xs text-gray-500 mb-2">How to decide eliminations if multiple participants have the exact same vote count.</div>
            <select value={flags.tiebreaker_rule} onChange={e => setFlags({ ...flags, tiebreaker_rule: e.target.value })} disabled={!cycleId} className="w-full max-w-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-950 text-sm focus:ring-primary disabled:opacity-50">
              <option value="LOWEST_CUMULATIVE_VOTES">Lowest Cumulative Votes</option>
              <option value="LATEST_REGISTRATION">Latest Registration Date</option>
              <option value="RANDOM">Random (Coin Flip)</option>
            </select>
          </div>
        </div>

        {/* Daily Stories Configuration */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center gap-2">
            Daily Stories Management
            <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">New</span>
          </h2>
          <NumberInput label="Max Video Size (MB)" desc="Maximum file size allowed for participant video uploads." field="story_max_file_size_mb" />
          <NumberInput label="Daily Upload Limit" desc="Number of stories a participant can post per day." field="story_daily_limit" />
          
          <div className="py-3">
            <label className="block text-[14px] mb-1.5 font-medium">Allowed Formats</label>
            <div className="text-xs text-gray-500 mb-2">Comma-separated list of allowed video extensions.</div>
            <input type="text" value={flags.story_allowed_formats} onChange={e => setFlags({ ...flags, story_allowed_formats: e.target.value })} disabled={!cycleId} className="w-full max-w-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-950 text-sm focus:ring-primary disabled:opacity-50" />
          </div>

          <Toggle label="Enable Story Moderation" desc="If enabled, stories will remain hidden until an admin approves them." field="story_moderation_enabled" />
        </div>

        {/* AI Agent Configuration */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center gap-2">
            AI Agent Management
            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">New</span>
          </h2>
          <Toggle label="Enable AI Magic Write" desc="Globally turn on/off the AI bio generation for participants." field="ai_agent_enabled" />
          <NumberInput label="Bio Generation Limit" desc="Number of times a participant can use Magic Write per day." field="ai_bio_daily_limit" />
          <NumberInput label="Maximum Bio Word Count" desc="Strict word limit for the AI-generated PR content." field="ai_bio_max_words" />
          
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
            <NumberInput label="Strategic Advice Limit" desc="Number of times a participant can request AI Campaign Strategy advice per day." field="ai_strategy_daily_limit" />
            <NumberInput label="Maximum Strategy Word Count" desc="Strict word limit for the AI-generated Strategic briefings." field="ai_strategy_max_words" />
          </div>
        </div>

        {/* Financials & Limits */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Financials & Limits</h2>
          <NumberInput label="Vote Price (₦)" desc="The unit cost of a single vote." field="vote_price_ngn" />
          <NumberInput label="Max Votes Per Transaction" desc="Cap on bulk voting to prevent payment gateway issues." field="max_votes_per_transaction" />
          <NumberInput label="Minimum Withdrawal Amount (₦)" desc="Threshold for participants to cash out their earnings." field="min_withdrawal_amount" />
        </div>

        {/* Security & Notifications */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Security & Communications</h2>
          <NumberInput label="Rate Limiting (Votes per IP/day)" desc="Maximum identical phone/device/IP hits allowed before auto-flagging as Fraud." field="max_votes_per_device" />
          
          <Toggle label="Enable KYC Verification" desc="Require contestants to pass identity verification before payouts." field="enable_kyc_verification" />
          <Toggle label="Require Email Verification" desc="Force new voters to confirm email before casting their first vote." field="require_email_verification" />
          
          <Toggle label="Enable SMS Notifications" desc="Globally enable or disable automated SMS alerts via provider." field="enable_sms_notifications" />
          <Toggle label="Enable Email Notifications" desc="Globally enable or disable automated email receipts and alerts." field="enable_email_notifications" />
        </div>

        <div className="sticky bottom-4 z-10 flex justify-end">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!cycleId || saveMutation.isPending}
            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving Configuration...' : 'Deploy Global Configuration'}
          </button>
        </div>
      </div>
    </div>
  )
}
