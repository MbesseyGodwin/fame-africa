// apps/web/src/app/auth/reset-password/page.tsx

'use client'

import React, { useState, useEffect, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '../../../lib/api'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Password Requirements Logic
  const requirements = useMemo(() => [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'At least one uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'At least one number', met: /[0-9]/.test(password) },
    { label: 'At least one special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ], [password])

  const strength = useMemo(() => {
    const metCount = requirements.filter(r => r.met).length
    if (metCount === 0) return { label: 'Very Weak', color: 'bg-gray-200', width: 'w-0' }
    if (metCount === 1) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' }
    if (metCount === 2) return { label: 'Fair', color: 'bg-orange-500', width: 'w-1/2' }
    if (metCount === 3) return { label: 'Good', color: 'bg-blue-500', width: 'w-3/4' }
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' }
  }, [requirements])

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing password reset token. Please request a new link.')
    }
  }, [token])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) return
    
    const allMet = requirements.every(r => r.met)
    if (!allMet) {
      setError('Please fulfill all password security requirements.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await authApi.resetPassword(token, password)
      setSuccess(true)
    } catch (err: any) {
      console.error('Reset password error:', err)
      const detail = err.response?.data?.message || err.message || 'Failed to reset password.'
      setError(detail)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-900 py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100 dark:border-gray-800 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Password Reset Successful</h3>
          <p className="text-gray-500 text-sm mb-6">Your password has been successfully updated. You can now login with your new password.</p>
          <Link
            href="/auth/login"
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white dark:bg-gray-900 py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100 dark:border-gray-800">
        <form className="space-y-5" onSubmit={handleReset}>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm animate-pulse">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <div className="mt-1 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={!token}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Strength Bar */}
          {password.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                <span className="text-gray-400">Strength</span>
                <span className={strength.color.replace('bg-', 'text-')}>{strength.label}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ease-out ${strength.color} ${strength.width}`} />
              </div>
            </div>
          )}

          {/* Requirements Checklist */}
          {password.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2 border border-gray-100 dark:border-gray-800">
              {requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${req.met ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                    {req.met ? (
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-1 h-1 bg-current rounded-full" />
                    )}
                  </div>
                  <span className={`text-[11px] ${req.met ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-500'}`}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm New Password
            </label>
            <div className="mt-1 relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                disabled={!token}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !token || !strength.width.includes('full')}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Updating...</span>
                </div>
              ) : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-8 text-center px-4">
          <Link href="/" className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            Fame Africa
          </Link>
          <div className="mt-4 h-1 w-12 bg-primary mx-auto rounded-full" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white text-center tracking-tight">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Enter a strong new password to secure your account.
        </p>
      </div>

      <Suspense fallback={
        <div className="mt-8 flex justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
