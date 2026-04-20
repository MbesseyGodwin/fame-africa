// apps/web/src/app/vote/[slug]/page.tsx

'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { participantsApi, votingApi } from '../../../lib/api'

const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .vp-root {
    min-height: 100svh;
    background: #f7f6f2;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 40px 16px 64px;
    position: relative;
    overflow: hidden;
  }
  .vp-blob {
    position: fixed; border-radius: 50%;
    filter: blur(80px); pointer-events: none; z-index: 0; opacity: 0.45;
  }
  .vp-blob-1 { width: 500px; height: 500px; background: radial-gradient(circle, #c7d2fe 0%, transparent 70%); top: -160px; right: -120px; }
  .vp-blob-2 { width: 380px; height: 380px; background: radial-gradient(circle, #ddd6fe 0%, transparent 70%); bottom: -100px; left: -80px; }

  .vp-container { width: 100%; max-width: 440px; display: flex; flex-direction: column; gap: 0; position: relative; z-index: 1; }

  .vp-loading-state { flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
  .vp-loader-ring { width: 44px; height: 44px; border: 3px solid #e5e7eb; border-top-color: #6366f1; border-radius: 50%; animation: vp-spin 0.8s linear infinite; }
  .vp-loader-text { font-size: 14px; color: #9ca3af; }
  .vp-not-found-icon { width: 56px; height: 56px; border-radius: 50%; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #9ca3af; }
  .vp-not-found-title { font-size: 20px; font-weight: 600; color: #111827; margin: 0; }
  .vp-not-found-sub { font-size: 14px; color: #6b7280; margin: 0; text-align: center; }

  .vp-candidate-card {
    background: #6366f1;
    border-radius: 24px 24px 0 0;
    padding: 36px 28px 52px;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    position: relative; overflow: hidden;
  }
  .vp-candidate-card::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 80% 0%, rgba(139,92,246,0.4) 0%, transparent 60%),
                radial-gradient(ellipse at 20% 100%, rgba(167,139,250,0.3) 0%, transparent 50%);
    pointer-events: none;
  }

  .vp-avatar-wrap { position: relative; width: 88px; height: 88px; flex-shrink: 0; }
  .vp-avatar-img { width: 88px; height: 88px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255,255,255,0.3); }
  .vp-avatar-initials {
    width: 88px; height: 88px; border-radius: 50%;
    background: rgba(255,255,255,0.15); border: 3px solid rgba(255,255,255,0.3);
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Serif Display', serif; font-size: 28px; color: #fff; letter-spacing: -0.5px;
  }
  .vp-avatar-ring {
    position: absolute; inset: -6px; border-radius: 50%;
    border: 2px dashed rgba(255,255,255,0.25);
    animation: vp-rotate 14s linear infinite;
  }

  .vp-candidate-info { text-align: center; }
  .vp-candidate-name { font-family: 'DM Serif Display', serif; font-size: 26px; color: #fff; margin: 0 0 4px; letter-spacing: -0.3px; line-height: 1.2; }
  .vp-candidate-location { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: rgba(255,255,255,0.6); margin: 0 0 8px; }
  .vp-candidate-bio { font-size: 13px; color: rgba(255,255,255,0.75); margin: 0; line-height: 1.55; max-width: 300px; }

  .vp-vote-counter {
    display: flex; flex-direction: column; align-items: center;
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.15);
    border-radius: 14px; padding: 12px 28px; gap: 2px; backdrop-filter: blur(8px);
  }
  .vp-vote-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.55); font-weight: 500; }
  .vp-vote-number { font-family: 'DM Serif Display', serif; font-size: 32px; color: #fff; line-height: 1; letter-spacing: -1px; }

  .vp-status-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.1); border-radius: 20px; padding: 5px 12px; }
  .vp-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 0 3px rgba(74,222,128,0.25); animation: vp-pulse 2s ease-in-out infinite; }
  .vp-status-closed .vp-status-dot { background: #f87171; box-shadow: 0 0 0 3px rgba(248,113,113,0.25); animation: none; }

  .vp-closed-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 0; text-align: center; }
  .vp-closed-icon { font-size: 40px; margin-bottom: 20px; }
  .vp-closed-title { font-family: 'DM Serif Display', serif; font-size: 24px; color: #111827; margin: 0 0 10px; }
  .vp-closed-sub { font-size: 14px; color: #6b7280; max-width: 280px; line-height: 1.6; margin-bottom: 24px; }
  .vp-closed-link { font-size: 14px; font-weight: 600; color: #6366f1; text-decoration: none; border-bottom: 1.5px solid rgba(99,102,241,0.2); padding-bottom: 2px; transition: border-color 0.2s; }
  .vp-closed-link:hover { border-color: #6366f1; }

  .vp-form-card {
    background: #fff; border-radius: 0 0 24px 24px;
    border: 1px solid #e5e7eb; border-top: none;
    padding: 32px 28px 28px;
    display: flex; flex-direction: column; gap: 20px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.07);
  }

  .vp-alert { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 12px; font-size: 13px; font-weight: 500; line-height: 1.4; }
  .vp-alert svg { flex-shrink: 0; margin-top: 1px; }
  .vp-alert-success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  .vp-alert-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

  .vp-steps { display: flex; align-items: center; gap: 0; padding-bottom: 4px; }
  .vp-step { display: flex; align-items: center; gap: 8px; }
  .vp-step-circle { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; border: 1.5px solid #e5e7eb; color: #9ca3af; transition: all 0.2s; }
  .vp-step-active .vp-step-circle { background: #6366f1; border-color: #6366f1; color: #fff; }
  .vp-step-done .vp-step-circle { background: #4ade80; border-color: #4ade80; color: #fff; }
  .vp-step-label { font-size: 12px; font-weight: 500; color: #9ca3af; }
  .vp-step-active .vp-step-label { color: #4338ca; }
  .vp-step-done .vp-step-label { color: #16a34a; }
  .vp-step-connector { flex: 1; height: 1.5px; background: linear-gradient(90deg, #d1fae5, #e5e7eb); margin: 0 10px; }

  .vp-step-content { display: flex; flex-direction: column; gap: 18px; }
  .vp-fade-in { animation: vp-fade-slide 0.25s ease forwards; }
  .vp-step-header { display: flex; flex-direction: column; gap: 5px; }
  .vp-step-title { font-family: 'DM Serif Display', serif; font-size: 20px; color: #111827; margin: 0; letter-spacing: -0.2px; }
  .vp-step-sub { font-size: 13px; color: #6b7280; margin: 0; line-height: 1.5; }
  .vp-step-sub strong { color: #374151; }

  .vp-field-group { display: flex; flex-direction: column; gap: 12px; }
  .vp-field { display: flex; flex-direction: column; gap: 6px; }
  .vp-label { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .vp-input { width: 100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 12px; background: #fafafa; font-size: 14px; color: #111827; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.15s, box-shadow 0.15s, background 0.15s; box-sizing: border-box; }
  .vp-input:focus { border-color: #6366f1; background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
  .vp-input::placeholder { color: #d1d5db; }

  .vp-otp-field { display: flex; flex-direction: column; gap: 12px; }
  .vp-otp-input { width: 100%; padding: 20px 14px; border: 1.5px solid #e5e7eb; border-radius: 16px; background: #fafafa; font-size: 32px; font-weight: 700; font-family: 'DM Serif Display', serif; color: #111827; text-align: center; letter-spacing: 12px; outline: none; transition: border-color 0.15s, box-shadow 0.15s; box-sizing: border-box; }
  .vp-otp-input:focus { border-color: #6366f1; background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
  .vp-otp-input::placeholder { color: #e5e7eb; letter-spacing: 8px; }
  .vp-otp-progress { display: flex; justify-content: center; gap: 8px; }
  .vp-otp-pip { width: 28px; height: 4px; border-radius: 2px; background: #e5e7eb; transition: background 0.15s, transform 0.15s; }
  .vp-otp-pip-filled { background: #6366f1; transform: scaleY(1.5); }

  .vp-btn-primary { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 20px; background: #6366f1; color: #fff; border: none; border-radius: 14px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.15s, transform 0.1s, box-shadow 0.15s; box-shadow: 0 4px 14px rgba(99,102,241,0.35); }
  .vp-btn-primary:hover:not(:disabled) { background: #4f46e5; box-shadow: 0 6px 20px rgba(99,102,241,0.45); transform: translateY(-1px); }
  .vp-btn-primary:active:not(:disabled) { transform: scale(0.98); }
  .vp-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

  .vp-btn-ghost { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 10px; background: transparent; border: none; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #9ca3af; cursor: pointer; border-radius: 10px; transition: color 0.15s, background 0.15s; }
  .vp-btn-ghost:hover { color: #4b5563; background: #f9fafb; }

  .vp-spinner { width: 20px; height: 20px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: vp-spin 0.7s linear infinite; }

  .vp-privacy-note { display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 11px; color: #9ca3af; margin: 0; text-align: center; line-height: 1.5; }

  .vp-footer-note { text-align: center; font-size: 11px; color: #c4b9d4; margin: 16px 0 0; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 500; }

  @keyframes vp-spin { to { transform: rotate(360deg); } }
  @keyframes vp-rotate { to { transform: rotate(360deg); } }
  @keyframes vp-pulse { 0%, 100% { box-shadow: 0 0 0 3px rgba(74,222,128,0.25); } 50% { box-shadow: 0 0 0 6px rgba(74,222,128,0.1); } }
  @keyframes vp-fade-slide { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  @media (max-width: 480px) {
    .vp-root { padding: 24px 12px 48px; }
    .vp-candidate-card { padding: 28px 20px 44px; }
    .vp-form-card { padding: 24px 20px 20px; }
    .vp-candidate-name { font-size: 22px; }
    .vp-vote-number { font-size: 26px; }
  }
`

export default function VotePage() {
  const params = useParams()
  const slug = params.slug as string
  const queryClient = useQueryClient()

  const [step, setStep] = useState<1 | 2>(1)
  const [voterPhone, setVoterPhone] = useState('')
  const [voterEmail, setVoterEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const { data: participantData, isLoading, error } = useQuery({
    queryKey: ['participant', slug],
    queryFn: async () => {
      try {
        const res = await participantsApi.getBySlug(slug)
        return res.data?.data
      } catch {
        const allRes = await participantsApi.list({})
        const match = allRes.data?.data?.find((p: any) => p.voteLinkSlug === slug)
        if (!match) throw new Error('Participant not found')
        return match
      }
    },
    enabled: !!slug,
  })

  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg('')
      const res = await votingApi.sendOtp({ participantSlug: slug, voterPhone, voterEmail })
      return res.data
    },
    onSuccess: () => setStep(2),
    onError: (err: any) => setErrorMsg(err.response?.data?.message || 'Failed to send OTP'),
  })

  const castVoteMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg('')
      setSuccessMsg('')
      const res = await votingApi.castVote({ participantSlug: slug, voterPhone, voterEmail, otpCode, source: 'web' })
      return res.data
    },
    onSuccess: (data) => {
      setSuccessMsg(data?.message || 'Vote successfully cast!')
      setStep(1)
      setOtpCode('')
      queryClient.invalidateQueries({ queryKey: ['participant', slug] })
    },
    onError: (err: any) => setErrorMsg(err.response?.data?.message || 'Failed to verify OTP'),
  })

  if (isLoading) {
    return (
      <>
        <style>{pageStyles}</style>
        <div className="vp-root vp-loading-state">
          <div className="vp-loader-ring" />
          <p className="vp-loader-text">Loading candidate details…</p>
        </div>
      </>
    )
  }

  if (error || !participantData) {
    return (
      <>
        <style>{pageStyles}</style>
        <div className="vp-root vp-loading-state">
          <div className="vp-not-found-icon">?</div>
          <h2 className="vp-not-found-title">Participant Not Found</h2>
          <p className="vp-not-found-sub">This vote link is invalid or the candidate has been eliminated.</p>
        </div>
      </>
    )
  }

  const p = participantData
  const initials = p.displayName?.substring(0, 2).toUpperCase() ?? '??'
  const voteCount = p.totalVotes?.toLocaleString() ?? '0'

  return (
    <>
      <style>{pageStyles}</style>
      <div className="vp-root">
        <div className="vp-blob vp-blob-1" />
        <div className="vp-blob vp-blob-2" />

        <div className="vp-container">

          {/* ── Candidate card ── */}
          <div className="vp-candidate-card">
            <div className="vp-avatar-wrap">
              {p.photoUrl ? (
                <img src={p.photoUrl} alt={p.displayName} className="vp-avatar-img" />
              ) : (
                <span className="vp-avatar-initials">{initials}</span>
              )}
              <div className="vp-avatar-ring" />
            </div>

            <div className="vp-candidate-info">
              <h1 className="vp-candidate-name">{p.displayName}</h1>
              {(p.city || p.state) && (
                <p className="vp-candidate-location">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  {[p.city, p.state].filter(Boolean).join(', ')}
                </p>
              )}
              {p.bio && <p className="vp-candidate-bio">{p.bio}</p>}
            </div>

            <div className="vp-vote-counter">
              <span className="vp-vote-label">Total votes</span>
              <span className="vp-vote-number">{voteCount}</span>
            </div>

            <div className={`vp-status-pill ${p.cycle?.status === 'VOTING_OPEN' ? 'vp-status-open' : 'vp-status-closed'}`}>
              <span className="vp-status-dot" />
              {p.cycle?.status === 'VOTING_OPEN' ? 'Voting is active' : 'Voting is closed'}
            </div>
          </div>

          {/* ── Form card ── */}
          <div className="vp-form-card">
            {p.cycle?.status !== 'VOTING_OPEN' ? (
              <div className="vp-closed-state vp-fade-in">
                <div className="vp-closed-icon">🔒</div>
                <h2 className="vp-closed-title">Voting is currently closed</h2>
                <p className="vp-closed-sub">
                  {p.cycle?.status === 'REGISTRATION_OPEN' 
                    ? 'The competition is still in the registration phase. Check back once voting starts!' 
                    : 'The voting period for this cycle has ended or not yet begun.'}
                </p>
                <a href="/leaderboard" className="vp-closed-link">View Current Rankings</a>
              </div>
            ) : (
              <>
                {successMsg && (
                  <div className="vp-alert vp-alert-success">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    <span>{successMsg}</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="vp-alert vp-alert-error">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="vp-steps">
                  <div className={`vp-step ${step === 1 ? 'vp-step-active' : 'vp-step-done'}`}>
                    <div className="vp-step-circle">
                      {step > 1
                        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        : '1'}
                    </div>
                    <span className="vp-step-label">Identify</span>
                  </div>
                  <div className="vp-step-connector" />
                  <div className={`vp-step ${step === 2 ? 'vp-step-active' : ''}`}>
                    <div className="vp-step-circle">2</div>
                    <span className="vp-step-label">Verify</span>
                  </div>
                </div>

                {step === 1 && (
                  <div className="vp-step-content vp-fade-in">
                    <div className="vp-step-header">
                      <h2 className="vp-step-title">Support {p.displayName}</h2>
                      <p className="vp-step-sub">Enter your details — we'll send a one-time code to confirm your vote.</p>
                    </div>

                    <div className="vp-field-group">
                      <div className="vp-field">
                        <label className="vp-label">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.71 3.53 2 2 0 0 1 3.67 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z" /></svg>
                          Phone Number
                        </label>
                        <input type="tel" placeholder="+234 800 000 0000" value={voterPhone} onChange={e => setVoterPhone(e.target.value)} className="vp-input" />
                      </div>
                      <div className="vp-field">
                        <label className="vp-label">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                          Email Address
                        </label>
                        <input type="email" placeholder="voter@example.com" value={voterEmail} onChange={e => setVoterEmail(e.target.value)} className="vp-input" />
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-400 text-center mb-4">
                      By proceeding, you agree to our <a href="/terms" className="text-primary font-semibold hover:underline">Terms</a>. All votes are final and non-refundable.
                    </p>

                    <button onClick={() => sendOtpMutation.mutate()} disabled={!voterPhone || !voterEmail || sendOtpMutation.isPending} className="vp-btn-primary">
                      {sendOtpMutation.isPending ? <span className="vp-spinner" /> : <>Send Verification Code <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></>}
                    </button>

                    <p className="vp-privacy-note">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      One vote per day · Your info stays private · No account required
                    </p>
                  </div>
                )}

                {step === 2 && (
                  <div className="vp-step-content vp-fade-in">
                    <div className="vp-step-header">
                      <h2 className="vp-step-title">Enter your code</h2>
                      <p className="vp-step-sub">We sent a 6-digit code to <strong>{voterPhone}</strong>. It expires in 5 minutes.</p>
                    </div>

                    <div className="vp-otp-field">
                      <input type="text" inputMode="numeric" placeholder="• • • • • •" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} className="vp-otp-input" autoFocus />
                      <div className="vp-otp-progress">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className={`vp-otp-pip ${i < otpCode.length ? 'vp-otp-pip-filled' : ''}`} />
                        ))}
                      </div>
                    </div>

                    <button onClick={() => castVoteMutation.mutate()} disabled={otpCode.length !== 6 || castVoteMutation.isPending} className="vp-btn-primary">
                      {castVoteMutation.isPending ? <span className="vp-spinner" /> : <>Confirm My Vote <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></>}
                    </button>

                    <button onClick={() => { setStep(1); setOtpCode(''); setErrorMsg('') }} className="vp-btn-ghost">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                      Wrong number? Go back
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <p className="vp-footer-note">Fame Africa · Secure · Verified · Fair</p>
        </div>
      </div>
    </>
  )
}
