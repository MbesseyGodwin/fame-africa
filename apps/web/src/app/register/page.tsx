// apps/web/src/app/register/page.tsx

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { participantsApi, authApi, competitionsApi } from '../../lib/api'
import { useAuthStore } from '../../hooks/useAuthStore'

type StepStatus = 'pending' | 'loading' | 'done' | 'error'

interface Step {
  id: string
  label: string
  status: StepStatus
  detail?: string
}

const initialSteps: Step[] = [
  { id: 'account', label: 'Creating your account', status: 'pending' },
  { id: 'cycle', label: 'Fetching active competition', status: 'pending' },
  { id: 'participant', label: 'Registering as a participant', status: 'pending' },
  { id: 'payment', label: 'Processing entry fee', status: 'pending' },
]

function StepIndicator({ steps }: { steps: Step[] }) {
  return (
    <div className="mt-6 space-y-3">
      {steps.map((step) => (
        <div key={step.id} className="flex items-start gap-3">
          <div className="mt-0.5 w-5 h-5 flex-shrink-0 flex items-center justify-center">
            {step.status === 'pending' && (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            )}
            {step.status === 'loading' && (
              <svg className="w-4 h-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {step.status === 'done' && (
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {step.status === 'error' && (
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${step.status === 'done' ? 'text-green-700' :
              step.status === 'error' ? 'text-red-600' :
                step.status === 'loading' ? 'text-primary' :
                  'text-gray-400'
              }`}>
              {step.label}
            </p>
            {step.detail && (
              <p className={`text-xs mt-0.5 ${step.status === 'error' ? 'text-red-500' : 'text-gray-500'}`}>
                {step.detail}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()

  const [activeStep, setActiveStep] = useState(0) // UI Wizard Step
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', password: '',
    displayName: '', bio: '',
    state: '', city: '', category: '',
    nationality: '',
    instagramUrl: '', twitterUrl: '', tiktokUrl: '', youtubeUrl: ''
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [video, setVideo] = useState<File | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [steps, setSteps] = useState<Step[]>(initialSteps)

  const updateStep = (id: string, status: StepStatus, detail?: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, detail } : s))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNext = () => {
    if (activeStep === 1) {
      if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
        setError('Please fill in all account details.')
        return
      }
      if (!agreedToTerms) {
        setError('You must agree to the Terms and Privacy Policy to continue.')
        return
      }
    }
    if (activeStep === 2) {
      if (!formData.displayName || !formData.category || !formData.state || !formData.city || !formData.bio || !formData.nationality) {
        setError('Please fill in all profile details, including nationality.')
        return
      }
    }
    setError('')
    setActiveStep(prev => prev + 1)
  }

  const handleBack = () => {
    setError('')
    setActiveStep(prev => prev - 1)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSteps(initialSteps)

    try {
      // ── Step 1: Create account ───────────────────────────────────
      updateStep('account', 'loading')
      const authRes = await authApi.register({
        fullName: formData.fullName,
        displayName: formData.displayName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      })

      const tokens = authRes.data?.data
      if (tokens?.accessToken) {
        localStorage.setItem('accessToken', tokens.accessToken)
        localStorage.setItem('refreshToken', tokens.refreshToken)
        useAuthStore.getState().setAuth(tokens.user, tokens.accessToken)
      }
      updateStep('account', 'done', `Account created for ${formData.email}`)

      // ── Step 2: Fetch active cycle ───────────────────────────────
      updateStep('cycle', 'loading')
      const cycleRes = await competitionsApi.getCurrent()
      const cycle = cycleRes.data?.data

      if (!cycle?.id) {
        updateStep('cycle', 'error', 'No active competition cycle right now.')
        throw new Error('No active competition cycle right now.')
      }
      updateStep('cycle', 'done', `Found: ${cycle.cycleName ?? cycle.id}`)

      // ── Step 3: Register as participant ──────────────────────────
      updateStep('participant', 'loading')
      const regData = new FormData()
      regData.append('category', formData.category)
      regData.append('nationality', formData.nationality)
      regData.append('instagramUrl', formData.instagramUrl)
      regData.append('twitterUrl', formData.twitterUrl)
      regData.append('tiktokUrl', formData.tiktokUrl)
      regData.append('youtubeUrl', formData.youtubeUrl)
      if (photo) regData.append('photo', photo)
      if (video) regData.append('video', video)

      const res = await participantsApi.register(regData)

      const participant = res.data?.data?.participant
      updateStep('participant', 'done',
        participant?.voteLinkSlug
          ? `Vote link: /vote/${participant.voteLinkSlug}`
          : 'Participant profile created'
      )

      // ── Step 4: Payment ──────────────────────────────────────────
      updateStep('payment', 'loading')
      const paymentUrl = res.data?.data?.paymentUrl
      if (paymentUrl) {
        updateStep('payment', 'done', 'Redirecting to payment...')
        setTimeout(() => { window.location.href = paymentUrl }, 1200)
        return
      }
      // Free cycle or mock payment
      updateStep('payment', 'done', 'Entry fee processed (mock reference accepted)')

      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2500)

    } catch (err: any) {
      console.error(err)
      const message = err.response?.data?.message || err.message || 'Registration failed. Please check your details.'
      setError(message)
      // Mark any still-loading step as errored
      setSteps(prev => prev.map(s => s.status === 'loading' ? { ...s, status: 'error', detail: message } : s))
    } finally {
      setIsLoading(false)
    }
  }

  const hasStartedSubmission = steps.some(s => s.status !== 'pending')

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center bg-white p-10 rounded-xl shadow border border-green-200">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 text-3xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-500 mb-4">Welcome to FameAfrica.</p>
          <StepIndicator steps={steps} />
          <div className="text-sm font-medium text-primary mt-4">Taking you to Dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="text-3xl font-semibold text-primary">FameAfrica</Link>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
          {activeStep === 0 ? 'The Transparency Oath' : 'Enter the Competition'}
        </h2>

        {/* Progress Bar */}
        <div className="mt-4 flex justify-center gap-2">
          {[0, 1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 w-8 rounded-full transition-all duration-300 ${activeStep === s ? 'bg-primary' : s < activeStep ? 'bg-primary/40' : 'bg-gray-200 dark:bg-gray-800'
                }`}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-gray-900 py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100 dark:border-gray-800">

          {hasStartedSubmission ? (
            <div className="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Finalizing your entry...</p>
              <StepIndicator steps={steps} />
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* STEP 0: DISCLAIMER */}
              {activeStep === 0 && (
                <div className="space-y-6">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-6 rounded-r-xl">
                    <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                      <span>⚖️</span> Important Transparency Oath
                    </h3>
                    <p className="mt-3 text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                      FameAfrica is a high-stakes digital stage for rising stars. To ensure a fair and professional environment, you must acknowledge the following:
                    </p>

                    <ul className="mt-6 space-y-4">
                      <li className="flex gap-3">
                        <span className="text-amber-600">⚡</span>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          <strong>Results = Hustle:</strong> Registration does not guarantee winning. You must actively mobilize your network to get votes.
                        </p>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-amber-600">💸</span>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          <strong>No Refunds:</strong> Your entry fee is strictly non-refundable as it powers the platform and the prize pools.
                        </p>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-amber-600">🚫</span>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          <strong>Not an Investment:</strong> This is a talent competition. Do not treat this as a financial scheme or investment.
                        </p>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleNext}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-bold text-white bg-primary hover:bg-primary-dark transition-colors"
                    >
                      I Understand & Enter the Arena
                    </button>
                    <p className="mt-4 text-center text-xs text-gray-500 italic">
                      "Winning is for those who rally the most fans. Bring your best content."
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 1: ACCOUNT */}
              {activeStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Account Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <input
                      type="text" name="fullName" required
                      value={formData.fullName} onChange={handleChange}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-950 text-sm"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                    <input
                      type="email" name="email" required
                      value={formData.email} onChange={handleChange}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-950 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone (080...)</label>
                      <input
                        type="tel" name="phone" required
                        value={formData.phone} onChange={handleChange}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-950 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                      <input
                        type="password" name="password" required
                        value={formData.password} onChange={handleChange}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-950 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-500 dark:text-gray-400">
                      I agree to the <Link href="/terms" className="text-primary font-semibold hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary font-semibold hover:underline">Privacy Policy</Link>
                    </label>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button onClick={handleBack} className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                      Back
                    </button>
                    <button onClick={handleNext} className="flex-[2] py-3 px-4 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary-dark">
                      Continue to Profile
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PROFILE */}
              {activeStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Contestant Profile</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stage Name</label>
                      <input
                        type="text" name="displayName" required
                        value={formData.displayName} onChange={handleChange}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-950 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                      <select
                        name="category" required
                        value={formData.category} onChange={handleChange}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-950 text-sm"
                      >
                        <option value="">Select Category</option>
                        <option value="Talent">Talent</option>
                        <option value="Beauty">Beauty</option>
                        <option value="Influencer">Influencer</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Music">Music</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">State</label>
                      <input
                        type="text" name="state" required
                        value={formData.state} onChange={handleChange}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-950 text-sm"
                        placeholder="e.g. Lagos"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                      <input
                        type="text" name="city" required
                        value={formData.city} onChange={handleChange}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-950 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nationality</label>
                      <input
                        type="text" name="nationality" required
                        value={formData.nationality} onChange={handleChange}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-950 text-sm"
                        placeholder="e.g. Nigerian"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Campaign Pitch / Bio</label>
                    <textarea
                      name="bio" rows={3} required
                      value={formData.bio} onChange={handleChange}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-950 text-sm"
                      placeholder="Why should fans vote for you?"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Social Hub (Optional but Recommended)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400 text-sm">IG @</span>
                        <input
                          type="text" name="instagramUrl"
                          value={formData.instagramUrl} onChange={handleChange}
                          className="pl-12 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs"
                          placeholder="handle"
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400 text-sm">X @</span>
                        <input
                          type="text" name="twitterUrl"
                          value={formData.twitterUrl} onChange={handleChange}
                          className="pl-12 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs"
                          placeholder="handle"
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400 text-sm">TT @</span>
                        <input
                          type="text" name="tiktokUrl"
                          value={formData.tiktokUrl} onChange={handleChange}
                          className="pl-12 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs"
                          placeholder="handle"
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400 text-sm">YT</span>
                        <input
                          type="text" name="youtubeUrl"
                          value={formData.youtubeUrl} onChange={handleChange}
                          className="pl-9 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs"
                          placeholder="URL"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button onClick={handleBack} className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                      Back
                    </button>
                    <button onClick={handleNext} className="flex-[2] py-3 px-4 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary-dark">
                      Continue to Media
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: MEDIA */}
              {activeStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Media Uploads</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Photo</label>
                      <input
                        type="file" accept="image/*" required
                        onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                        className="mt-1 block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Talent Video</label>
                      <input
                        type="file" accept="video/*" required
                        onChange={(e) => setVideo(e.target.files?.[0] || null)}
                        className="mt-1 block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-base font-bold text-primary">Registration Fee: ₦5,000</span>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold uppercase tracking-wider">Transparency</span>
                    </div>
                    <div className="space-y-2 border-t border-primary/10 pt-4">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>Prize Pool Contribution (50%)</span>
                        <span className="font-semibold text-gray-900 dark:text-white">₦2,500</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>Marketing & Promotion (30%)</span>
                        <span className="font-semibold text-gray-900 dark:text-white">₦1,500</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>Platform Maintenance (20%)</span>
                        <span className="font-semibold text-gray-900 dark:text-white">₦1,000</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button onClick={handleBack} className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                      Back
                    </button>
                    <button
                      onClick={handleRegister}
                      disabled={isLoading || !photo || !video}
                      className="flex-[2] py-3 px-4 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary-dark disabled:opacity-50"
                    >
                      {isLoading ? 'Processing...' : 'Register & Proceed to Payment'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {!hasStartedSubmission && (
            <div className="mt-8 text-center border-t border-gray-100 dark:border-gray-800 pt-6">
              <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">
                Already have an account? <span className="text-primary font-bold">Sign in here</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}