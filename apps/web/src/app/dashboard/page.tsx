'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { participantsApi } from '../../lib/api'
import { useAuthStore } from '../../hooks/useAuthStore'
import { useRouter } from 'next/navigation'
import { io } from 'socket.io-client'
import { useState } from 'react'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [liveVotes, setLiveVotes] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => participantsApi.getDashboard(),
    enabled: !!user,
  })

  const { data: analyticsRes } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => participantsApi.getAnalytics(),
    enabled: !!user,
  })

  const { data: aiRes, isLoading: aiLoading } = useQuery({
    queryKey: ['ai-advice'],
    queryFn: () => participantsApi.getAiAdvice(),
    enabled: !!user,
  })

  const dashboard = data?.data?.data
  const tallies = analyticsRes?.data?.data?.tallies || []
  const aiAdvice = aiRes?.data?.data

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  useEffect(() => {
    if (!dashboard?.participant?.id) return

    const token = localStorage.getItem('accessToken')
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
      auth: { token },
    })

    socket.emit('participant:join', dashboard.participant.id)

    socket.on('vote:received', (data: any) => {
      if (data.participantId === dashboard.participant.id) {
        setLiveVotes(data.todayCount)
      }
    })

    return () => { socket.disconnect() }
  }, [dashboard?.participant?.id])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading your dashboard...</div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">You are not a participant</h2>
        <p className="text-gray-500 text-center">
          Register as a participant to compete in the current cycle.
        </p>
        <a href="/register" className="btn-primary px-6 py-2.5 rounded-theme text-sm font-medium">
          Enter the competition
        </a>
      </div>
    )
  }

  const { participant, cycle, todayVotes, currentRank, activeParticipants, voteLink } = dashboard
  const todayDisplay = liveVotes !== null ? liveVotes : todayVotes
  const maxBar = Math.max(...tallies.map((t: any) => t.voteCount), 1)

  function copyLink() {
    navigator.clipboard.writeText(voteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-medium text-gray-900 dark:text-white">
              Welcome back, {participant.displayName}
            </h1>
            <p className="text-sm text-gray-500">{cycle.cycleName} · {cycle.status}</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            participant.status === 'ACTIVE'
              ? 'bg-green-100 text-green-700'
              : participant.status === 'WINNER'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {participant.status}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Votes today', value: todayDisplay.toLocaleString(), highlight: true },
            { label: 'Total votes', value: participant.totalVotes.toLocaleString() },
            { label: 'Current rank', value: `#${currentRank}` },
            { label: 'Competitors left', value: activeParticipants },
            { 
              label: 'Strikes', 
              value: participant.totalStrikes, 
              warning: participant.totalStrikes > 0,
              highlight: participant.totalStrikes > 0 
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-theme p-4 ${
                stat.highlight
                  ? stat.warning ? 'bg-orange-50 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/30' : 'bg-accent border border-primary/20'
                  : 'bg-card border border-gray-100 dark:border-gray-800'
              }`}
            >
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-medium ${
                stat.warning ? 'text-orange-600' : stat.highlight ? 'text-primary' : 'text-gray-900 dark:text-white'
              }`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Vote chart */}
          <div className="bg-card border border-gray-100 dark:border-gray-800 rounded-theme p-5">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Votes per day</h3>
            {tallies.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No vote data yet</p>
            ) : (
              <div className="flex items-end gap-2 h-32">
                {tallies.slice(-14).map((tally: any, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm bg-primary opacity-80"
                      style={{ height: `${Math.round((tally.voteCount / maxBar) * 100)}%`, minHeight: 2 }}
                    />
                    <span className="text-[9px] text-gray-400">D{tally.dayNumber}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Insights Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900 rounded-theme p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✨</span>
              <h3 className="text-sm font-medium text-indigo-900 dark:text-indigo-200">AI Campaign Strategist</h3>
            </div>
            
            {aiLoading ? (
              <div className="text-sm text-indigo-400/80 dark:text-indigo-500/50 text-center py-6">
                Analyzing your daily trends...
                <br />Your first personalized strategy will appear here soon.
              </div>
            ) : aiAdvice ? (
              <div className="space-y-3 relative">
                <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed">
                  {aiAdvice.adviceText}
                </p>
                <div className="pt-2 flex justify-between text-[10px] text-indigo-400 uppercase tracking-widest font-medium border-t border-indigo-100 dark:border-indigo-900/50 mt-4">
                  <span>Tone: {aiAdvice.tone}</span>
                  <span>Generated Today</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-indigo-400/80 dark:text-indigo-500/50 text-center py-6 opacity-70">
                No campaign advice for today.
                <br />Keep pushing for those votes!
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Campaign tools */}
          <div className="bg-card border border-gray-100 dark:border-gray-800 rounded-theme p-5">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Campaign tools</h3>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Your vote link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-primary bg-accent px-3 py-2 rounded-theme truncate">
                    {voteLink}
                  </code>
                  <button
                    onClick={copyLink}
                    className="btn-primary text-xs px-3 py-2 rounded-theme shrink-0"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    const text = `Vote for me on Fame Africa! ${voteLink}`
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                  }}
                  className="text-xs border border-green-300 text-green-700 rounded-theme py-2 hover:bg-green-50"
                >
                  Share on WhatsApp
                </button>
                <button
                  onClick={() => {
                    const text = `Vote for me on VoteNaija! ${voteLink}`
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
                  }}
                  className="text-xs border border-blue-300 text-blue-700 rounded-theme py-2 hover:bg-blue-50"
                >
                  Share on X/Twitter
                </button>
              </div>

              <button
                onClick={() => router.push('/dashboard/settings')}
                className="w-full text-xs border border-gray-200 text-gray-600 rounded-theme py-2 hover:bg-gray-50 mt-1"
              >
                Edit profile & appearance
              </button>
              <button
                onClick={() => useAuthStore.getState().logout()}
                className="w-full text-xs border border-red-200 text-red-600 rounded-theme py-2 hover:bg-red-50 mt-1 transition-colors"
              >
                Logout from account
              </button>
            </div>
          </div>
        </div>

        {/* Live indicator */}
        {cycle.status === 'VOTING_OPEN' && (
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
            <span className="relative w-2 h-2 live-dot">
              <span className="absolute inset-0 rounded-full bg-green-400" />
            </span>
            Vote count updates in real time as people vote for you
          </div>
        )}
      </div>
    </div>
  )
}
