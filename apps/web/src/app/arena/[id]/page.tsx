// apps/web/src/app/arena/[id]/page.tsx

'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Navbar } from '../../../components/layouts/Navbar'
import { Footer } from '../../../components/layouts/Footer'
import { io } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000'

export default function ArenaSpectatorPage() {
  const { id: eventId } = useParams()
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [eventInfo, setEventInfo] = useState<any>(null)
  const [status, setStatus] = useState<'WAITING' | 'LIVE' | 'COMPLETED'>('LIVE')

  useEffect(() => {
    const socket = io(SOCKET_URL)
    
    socket.emit('arena:spectate', eventId)

    socket.on('arena:leaderboard_update', (data) => {
      if (data.eventId === eventId) {
        setLeaderboard(data.leaderboard)
      }
    })

    socket.on('arena:completed', (data) => {
      if (data.eventId === eventId) {
        setStatus('COMPLETED')
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [eventId])

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Stage (Stream / Status) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 flex flex-col items-center justify-center relative group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
              
              <div className="z-10 text-center animate-pulse">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/50">
                  <div className="w-4 h-4 bg-primary rounded-full animate-ping"></div>
                </div>
                <h3 className="text-xl font-bold tracking-tight">Arena Live Stream</h3>
                <p className="text-gray-400 text-sm mt-2">Connecting to the Arena broadcast...</p>
              </div>

              {/* Live Tag */}
              <div className="absolute top-6 left-6 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">
                <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                Live
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-3xl border border-gray-800">
              <h1 className="text-3xl font-extrabold mb-2 tracking-tight">The Brain-Shatter Arena</h1>
              <p className="text-gray-400 leading-relaxed max-w-2xl">
                Contestants are currently facing 30 high-speed logic puzzles. Any contestant who misses 3 sessions is automatically disqualified. Use this space to see who has the sharpest mind!
              </p>
            </div>
          </div>

          {/* Real-time Leaderboard */}
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
              <div className="p-6 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
                <h2 className="font-bold text-lg">Arena Standings</h2>
                <div className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded">Real-time</div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {leaderboard.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600">
                        <p className="text-sm font-medium">Waiting for scores...</p>
                    </div>
                ) : (
                    leaderboard.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/30 transition group">
                        <div className="w-6 text-center font-bold text-gray-500 text-sm">{idx + 1}</div>
                        <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-gray-700">
                           {p.photo ? (
                               <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center font-bold text-xs uppercase">{p.name.substring(0,2)}</div>
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{p.name}</p>
                          <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                             <div className="bg-primary h-full transition-all duration-500" style={{ width: `${Math.min(p.score / 30, 100)}%` }}></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-primary font-black text-lg">{p.score}</div>
                          <div className="text-[9px] uppercase font-bold text-gray-500">Pts</div>
                        </div>
                      </div>
                    ))
                )}
              </div>

              <div className="p-4 bg-gray-950/50 border-t border-gray-800 text-center">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Powering the minds of Africa</p>
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 p-6 rounded-3xl">
               <h4 className="font-bold text-primary flex items-center gap-2 mb-2">
                 <span className="w-2 h-2 bg-primary rounded-full"></span>
                 Why this matters?
               </h4>
               <p className="text-xs text-gray-400 leading-relaxed">
                 Top performers in the Arena gain massive visibility on the main leaderboard, making them prime candidates for stanning and voting.
               </p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
