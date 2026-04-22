'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { participantsApi, votingApi, sponsorsApi } from '../../lib/api'
import { Navbar } from '../layouts/Navbar'

type Step = 'form' | 'otp' | 'success'

interface Props { slug: string }

export function VotePageClient({ slug }: Props) {
  const [step, setStep] = useState<Step>('form')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [deviceFingerprint, setDeviceFingerprint] = useState('')

  const { data: participantRes, isLoading: participantLoading } = useQuery({
    queryKey: ['participant', slug],
    queryFn: () => participantsApi.getBySlug(slug),
  })

  const { data: adRes } = useQuery({
    queryKey: ['nextAd'],
    queryFn: () => sponsorsApi.getNextAd(),
  })

  const participant = participantRes?.data?.data
  const ad = adRes?.data?.data

  useEffect(() => {
    // Simple device fingerprint from browser properties
    const fp = btoa([
      navigator.userAgent,
      screen.width,
      screen.height,
      navigator.language,
      new Date().getTimezoneOffset(),
    ].join('|')).slice(0, 32)
    setDeviceFingerprint(fp)
  }, [])

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await votingApi.sendOtp({ participantSlug: slug, voterPhone: phone, voterEmail: email })
      setStep('otp')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCastVote(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await votingApi.castVote({
        participantSlug: slug,
        voterPhone: phone,
        voterEmail: email,
        otpCode: otp,
        deviceFingerprint,
        source: 'web',
      })
      setStep('success')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (participantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!participant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-medium text-gray-900">Participant not found</h1>
        <p className="text-gray-500">This vote link is invalid or has expired.</p>
        <a href="/" className="btn-primary px-6 py-2 rounded-theme text-sm">
          Go to FameAfrica
        </a>
      </div>
    )
  }

  if (participant.status === 'ELIMINATED') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-5xl">😔</div>
        <h1 className="text-xl font-medium text-gray-900">{participant.displayName} has been eliminated</h1>
        <p className="text-gray-500 text-center">You can still vote for other participants!</p>
        <a href="/participants" className="btn-primary px-6 py-2 rounded-theme text-sm">
          View active participants
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar minimal />
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Participant hero */}
        <div className="bg-header rounded-theme p-6 text-center mb-4">
          {participant.photoUrl ? (
            <img
              src={participant.photoUrl}
              alt={participant.displayName}
              className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-2 border-white/30"
            />
          ) : (
            <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-white/20 flex items-center justify-center text-2xl font-medium text-white">
              {participant.displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <h1 className="text-xl font-medium text-white mb-1">{participant.displayName}</h1>
          {participant.bio && (
            <p className="text-white/75 text-sm leading-relaxed">{participant.bio}</p>
          )}
          {(participant.city || participant.state) && (
            <p className="text-white/60 text-xs mt-2">
              {[participant.city, participant.state].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        {/* Ad banner */}
        {ad && (
          <div className="bg-accent border border-primary/20 rounded-theme p-3 mb-4 flex items-center gap-3">
            <span className="text-xs border border-primary/40 text-primary rounded px-1 py-0.5 font-medium shrink-0">
              AD
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary truncate">{ad.companyName}</p>
              {ad.prizeDescription && (
                <p className="text-xs text-gray-500 truncate">{ad.prizeDescription}</p>
              )}
            </div>
          </div>
        )}

        {/* Step: form */}
        {step === 'form' && (
          <div className="bg-card rounded-theme border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="text-base font-medium text-gray-900 dark:text-white mb-1">
              Vote for {participant.displayName}
            </h2>
            <p className="text-sm text-gray-500 mb-4">Enter your details to cast your vote</p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-theme p-3 mb-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email address (Mandatory)</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-theme px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phone number (Optional for SMS code)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-theme px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary rounded-theme py-2.5 text-sm font-medium disabled:opacity-60"
              >
                {isLoading ? 'Sending OTP...' : 'Send verification OTP'}
              </button>
            </form>
            <p className="text-xs text-gray-400 text-center mt-3">
              One vote per day · No account needed · Your identity stays private
            </p>
          </div>
        )}

        {/* Step: OTP */}
        {step === 'otp' && (
          <div className="bg-card rounded-theme border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="text-base font-medium text-gray-900 dark:text-white mb-1">Enter your OTP</h2>
            <p className="text-sm text-gray-500 mb-4">
              We sent a 6-digit code to <strong>{email}</strong> {phone ? `and ${phone}` : ''}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-theme p-3 mb-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleCastVote} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code"
                required
                className="w-full border border-gray-200 dark:border-gray-700 rounded-theme px-3 py-3 text-center text-2xl tracking-widest font-medium bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="w-full btn-primary rounded-theme py-2.5 text-sm font-medium disabled:opacity-60"
              >
                {isLoading ? 'Confirming vote...' : 'Confirm my vote'}
              </button>
            </form>

            <button
              onClick={() => setStep('form')}
              className="w-full text-xs text-gray-400 mt-3 hover:text-primary"
            >
              Go back
            </button>
          </div>
        )}

        {/* Step: success */}
        {step === 'success' && (
          <div className="fade-in">
            <div className="bg-green-50 border border-green-200 rounded-theme p-6 text-center mb-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                ✓
              </div>
              <h2 className="text-lg font-medium text-green-800 mb-1">Vote confirmed!</h2>
              <p className="text-sm text-green-700">
                Your vote for <strong>{participant.displayName}</strong> has been recorded.
              </p>
              <p className="text-xs text-green-600 mt-2">
                A confirmation was sent to your phone and email.
                Come back tomorrow to vote again!
              </p>
            </div>

            <div className="bg-card rounded-theme border border-gray-100 p-4">
              <p className="text-sm text-gray-500 mb-3 text-center">
                Help {participant.displayName} by sharing their vote link!
              </p>
              <button
                onClick={() => {
                  navigator.share?.({
                    title: `Vote for ${participant.displayName} on FameAfrica!`,
                    text: `I just voted for ${participant.displayName} on FameAfrica - Africa's digital stage. Support them too!`,
                    url: window.location.href,
                  }) || navigator.clipboard.writeText(window.location.href)
                }}
                className="w-full btn-primary rounded-theme py-2.5 text-sm font-medium"
              >
                Share this vote link
              </button>
            </div>

            <div className="mt-4 text-center">
              <a href="/participants" className="text-sm text-primary hover:underline">
                Browse other participants
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
