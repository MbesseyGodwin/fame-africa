'use client'

import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../lib/api'

interface GodModeActionsProps {
  participant: any
}

export function GodModeActions({ participant }: GodModeActionsProps) {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [actionType, setActionType] = useState<'VOTES' | 'STRIKE' | 'STATUS' | null>(null)
  
  // Form states
  const [amount, setAmount] = useState(0)
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState(participant.status)

  const adjustVotesMutation = useMutation({
    mutationFn: ({ amount, reason }: { amount: number, reason: string }) => 
      adminApi.adjustVotes(participant.id, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_participants'] })
      closeModal()
    }
  })

  const strikeMutation = useMutation({
    mutationFn: (reason: string) => adminApi.giveStrike(participant.id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_participants'] })
      closeModal()
    }
  })

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => adminApi.updateParticipantStatus(participant.id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_participants'] })
      closeModal()
    }
  })

  const closeModal = () => {
    setShowModal(false)
    setActionType(null)
    setReason('')
    setAmount(0)
  }

  const handleAction = () => {
    if (actionType === 'VOTES') {
      adjustVotesMutation.mutate({ amount, reason })
    } else if (actionType === 'STRIKE') {
      strikeMutation.mutate(reason)
    } else if (actionType === 'STATUS') {
      statusMutation.mutate(status)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => { setActionType('VOTES'); setShowModal(true) }}
          className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 hover:bg-indigo-100 transition-colors"
        >
          Adjust Votes
        </button>
        <button
          onClick={() => { setActionType('STRIKE'); setShowModal(true) }}
          className="text-[10px] bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100 hover:bg-orange-100 transition-colors"
        >
          Give Strike
        </button>
        <button
          onClick={() => { setActionType('STATUS'); setShowModal(true) }}
          className="text-[10px] bg-gray-50 text-gray-700 px-2 py-1 rounded border border-gray-100 hover:bg-gray-100 transition-colors"
        >
          Status
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800 p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {actionType === 'VOTES' ? 'Adjust Votes' : actionType === 'STRIKE' ? 'Give Strike' : 'Change Status'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">Participant: {participant.displayName}</p>

            <div className="space-y-4">
              {actionType === 'VOTES' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Amount (+ or -)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(parseInt(e.target.value))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. 500 or -200"
                    />
                  </div>
                </>
              )}

              {actionType === 'STATUS' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">New Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ELIMINATED">ELIMINATED</option>
                    <option value="DISQUALIFIED">DISQUALIFIED</option>
                    <option value="SHORTLISTED">SHORTLISTED</option>
                    <option value="WINNER">WINNER</option>
                    <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                  </select>
                </div>
              )}

              {(actionType === 'VOTES' || actionType === 'STRIKE') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Reason / Note</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                    placeholder="Provide a justification for this action..."
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={adjustVotesMutation.isPending || strikeMutation.isPending || statusMutation.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                {adjustVotesMutation.isPending || strikeMutation.isPending || statusMutation.isPending ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
