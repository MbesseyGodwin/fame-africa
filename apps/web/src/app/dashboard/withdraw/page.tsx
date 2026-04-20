'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { participantsApi } from '@/lib/api'
import { useAuthStore } from '@/hooks/useAuthStore'
import Link from 'next/link'

export default function WithdrawPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  
  const [step, setStep] = useState<1 | 2>(1)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleRequestWithdrawal = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      await participantsApi.requestWithdrawal()
      setStep(2)
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Failed to request withdrawal.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || token.length < 4) {
      setErrorMsg('Please enter a valid withdrawal token.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    try {
      await participantsApi.confirmWithdrawal(token)
      router.push('/dashboard')
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Invalid or expired token.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="bg-white dark:bg-gray-900 border border-red-100 dark:border-rose-900 rounded-2xl p-8 shadow-sm text-center">
        <div className="w-20 h-20 bg-red-50 dark:bg-rose-950/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          ⚠️
        </div>
        
        <h1 className="text-2xl font-bold border-gray-900 dark:text-white mb-4">
          Withdraw from Competition
        </h1>

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6 text-sm">
            {errorMsg}
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
              Warning: Withdrawing from the competition means you will be permanently
              disqualified and removed from the active participants list. 
              This action cannot be undone.
            </p>
            
            <p className="text-sm font-medium text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
              To proceed, we will send a temporary token to your registered email
              address ({user?.email}) to confirm your identity.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link 
                href="/dashboard/settings"
                className="px-6 py-3 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </Link>
              <button 
                onClick={handleRequestWithdrawal}
                disabled={loading}
                className="px-6 py-3 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-600/20 transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Request Withdrawal'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
              We have sent a withdrawal token to your email. Please enter it below
              to confirm your withdrawal.
            </p>

            <form onSubmit={handleConfirmWithdrawal} className="space-y-6">
              <div>
                <input
                  type="text"
                  placeholder="Enter Token (e.g. A3F8K2P9)"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  className="w-full max-w-sm mx-auto text-center px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 focus:border-primary text-xl tracking-widest outline-none uppercase font-mono"
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-600/20 transition disabled:opacity-50"
                >
                  {loading ? 'Confirming...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
