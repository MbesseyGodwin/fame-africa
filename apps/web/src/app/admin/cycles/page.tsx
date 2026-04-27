'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../../lib/api'

// Sub-component to manage individual cycle card state
function CycleCard({ cycle, statusMutation, queryClient }: { cycle: any, statusMutation: any, queryClient: any }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    cycleName: cycle.cycleName || '',
    cycleNumber: cycle.cycleNumber || 1,
    registrationFee: cycle.registrationFee || 5000,
    registrationOpen: new Date(cycle.registrationOpen).toISOString().slice(0, 16),
    registrationClose: new Date(cycle.registrationClose).toISOString().slice(0, 16),
    votingOpen: new Date(cycle.votingOpen).toISOString().slice(0, 16),
    votingClose: new Date(cycle.votingClose).toISOString().slice(0, 16),
    revealAt: cycle.revealAt ? new Date(cycle.revealAt).toISOString().slice(0, 16) : new Date(cycle.votingClose).toISOString().slice(0, 16),
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateCycle(cycle.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_cycles'] })
      setIsEditing(false)
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to update cycle')
  })

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteCycle(cycle.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_cycles'] }),
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to delete cycle')
  })

  const handleSave = () => {
    updateMutation.mutate({
      cycleName: editData.cycleName,
      cycleNumber: Number(editData.cycleNumber),
      registrationFee: Number(editData.registrationFee),
      registrationOpen: new Date(editData.registrationOpen).toISOString(),
      registrationClose: new Date(editData.registrationClose).toISOString(),
      votingOpen: new Date(editData.votingOpen).toISOString(),
      votingClose: new Date(editData.votingClose).toISOString(),
      revealAt: new Date(editData.revealAt).toISOString(),
    })
  }

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${cycle.cycleName}? This cannot be undone.`)) {
      deleteMutation.mutate()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col">
      {cycle.status === 'VOTING_OPEN' && <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-full" />}

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 mr-4">
          {!isEditing ? (
            <>
              <h3 className="font-semibold text-gray-900 dark:text-white text-[16px]">{cycle.cycleName}</h3>
              <p className="text-xs text-gray-500">Season {cycle.cycleNumber} • Fee: ₦{cycle.registrationFee || 5000}</p>
            </>
          ) : (
            <div className="flex flex-col gap-2 mb-2 w-full">
              <input type="text" value={editData.cycleName} onChange={e => setEditData({...editData, cycleName: e.target.value})} className="font-semibold text-[16px] border rounded px-2 py-1 w-full bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700" placeholder="Cycle Name" />
              <div className="flex gap-2">
                <div className="flex flex-col">
                  <label className="text-[10px] text-gray-400">Season</label>
                  <input type="number" value={editData.cycleNumber} onChange={e => setEditData({...editData, cycleNumber: Number(e.target.value)})} className="text-xs border rounded px-2 py-1 w-16 bg-white dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700" title="Cycle Number" />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] text-gray-400">Fee (₦)</label>
                  <input type="number" value={editData.registrationFee} onChange={e => setEditData({...editData, registrationFee: Number(e.target.value)})} className="text-xs border rounded px-2 py-1 w-24 bg-white dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700" title="Registration Fee" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={cycle.status}
            onChange={(e) => statusMutation.mutate({ id: cycle.id, status: e.target.value })}
            className={`text-xs font-semibold px-2 py-1 rounded border-0 outline-none
              ${cycle.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' : ''}
              ${cycle.status === 'REGISTRATION_OPEN' ? 'bg-blue-100 text-blue-700' : ''}
              ${cycle.status === 'VOTING_OPEN' ? 'bg-green-100 text-green-700' : ''}
              ${cycle.status === 'CLOSED' ? 'bg-red-100 text-red-700' : ''}
            `}
          >
            <option value="DRAFT">DRAFT</option>
            <option value="REGISTRATION_OPEN">REGISTRATION OPEN</option>
            <option value="VOTING_OPEN">VOTING OPEN</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
      </div>

      <div className="flex-1">
        {!isEditing ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-gray-50 dark:bg-gray-950/50 rounded-lg">
              <div className="text-[10px] text-gray-500 uppercase font-medium">Registration</div>
              <div className="text-gray-900 dark:text-gray-300 mt-1">{new Date(cycle.registrationOpen).toLocaleDateString()}</div>
              <div className="text-gray-400 mt-0.5">{new Date(cycle.registrationClose).toLocaleDateString()}</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-950/50 rounded-lg">
              <div className="text-[10px] text-gray-500 uppercase font-medium">Voting Period</div>
              <div className="text-gray-900 dark:text-gray-300 mt-1">{new Date(cycle.votingOpen).toLocaleDateString()}</div>
              <div className="text-gray-400 mt-0.5">{new Date(cycle.votingClose).toLocaleDateString()}</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <div className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-medium mb-2">Edit Registration</div>
              <input type="datetime-local" value={editData.registrationOpen} onChange={e => setEditData({...editData, registrationOpen: e.target.value})} className="w-full text-xs px-2 py-1 mb-2 border rounded bg-white dark:bg-gray-900 dark:border-gray-700" title="Registration Open" />
              <input type="datetime-local" value={editData.registrationClose} onChange={e => setEditData({...editData, registrationClose: e.target.value})} className="w-full text-xs px-2 py-1 border rounded bg-white dark:bg-gray-900 dark:border-gray-700" title="Registration Close" />
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/30">
              <div className="text-[10px] text-green-600 dark:text-green-400 uppercase font-medium mb-2">Edit Voting & Reveal</div>
              <input type="datetime-local" value={editData.votingOpen} onChange={e => setEditData({...editData, votingOpen: e.target.value})} className="w-full text-xs px-2 py-1 mb-2 border rounded bg-white dark:bg-gray-900 dark:border-gray-700" title="Voting Open" />
              <input type="datetime-local" value={editData.votingClose} onChange={e => setEditData({...editData, votingClose: e.target.value})} className="w-full text-xs px-2 py-1 mb-2 border rounded bg-white dark:bg-gray-900 dark:border-gray-700" title="Voting Close" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500">Reveal:</span>
                <input type="datetime-local" value={editData.revealAt} onChange={e => setEditData({...editData, revealAt: e.target.value})} className="w-full text-xs px-2 py-1 border rounded bg-white dark:bg-gray-900 dark:border-gray-700" title="Reveal At" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Cycle'}
          </button>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="text-xs text-white bg-primary px-3 py-1.5 rounded hover:bg-primary-dark disabled:opacity-50 font-medium"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 font-medium"
              >
                Edit Cycle
              </button>
            )}
          </div>
        </div>

        {/* God Mode Section */}
        <div className="bg-orange-50/50 dark:bg-orange-900/5 p-3 rounded-lg border border-orange-100 dark:border-orange-900/20">
          <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.9L9.03 9.122a2 2 0 001.938 0l6.865-4.222a2 2 0 00-1.04-3.778H3.205a2 2 0 00-1.039 3.778zM19.937 9.122a2 2 0 010 3.756l-9.03 5.51a2 2 0 01-1.814 0l-9.03-5.51a2 2 0 010-3.756l9.03 5.51a2 2 0 011.814 0l9.03-5.51z" clipRule="evenodd" /></svg>
            Advanced Controls (God Mode)
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const status = window.prompt('Force status to (e.g. COMPLETED, REVEALING, VOTING_OPEN):', cycle.status)
                if (status) {
                  adminApi.forceCycleStatus(cycle.id, status).then(() => queryClient.invalidateQueries({ queryKey: ['admin_cycles'] }))
                }
              }}
              className="text-[10px] bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-gray-800 hover:border-orange-300 transition-all shadow-sm"
            >
              Force Status
            </button>
            <button
              onClick={() => {
                const pId = window.prompt('Enter Participant ID to declare as winner:')
                if (pId) {
                  adminApi.forceWinner(cycle.id, pId).then(() => queryClient.invalidateQueries({ queryKey: ['admin_cycles'] }))
                }
              }}
              className="text-[10px] bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-gray-800 hover:border-orange-300 transition-all shadow-sm"
            >
              Force Winner
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


export default function AdminCyclesPage() {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)

  const [formData, setFormData] = useState({
    cycleName: '',
    cycleNumber: 1,
    registrationFee: 5000,
    registrationOpen: '',
    registrationClose: '',
    votingOpen: '',
    votingClose: '',
    revealAt: ''
  })

  // Set default form data values
  const initDefaults = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    const defaultDate = now.toISOString().slice(0, 16)
    setFormData(prev => ({
      ...prev,
      registrationOpen: defaultDate,
      registrationClose: defaultDate,
      votingOpen: defaultDate,
      votingClose: defaultDate,
      revealAt: defaultDate
    }))
    setIsCreating(true)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin_cycles'],
    queryFn: async () => {
      const res = await adminApi.getCycles()
      return res.data?.data || []
    }
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createCycle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_cycles'] })
      setIsCreating(false)
    }
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => adminApi.updateCycleStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_cycles'] })
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...formData,
      cycleNumber: Number(formData.cycleNumber),
      registrationFee: Number(formData.registrationFee),
      registrationOpen: new Date(formData.registrationOpen).toISOString(),
      registrationClose: new Date(formData.registrationClose).toISOString(),
      votingOpen: new Date(formData.votingOpen).toISOString(),
      votingClose: new Date(formData.votingClose).toISOString(),
      revealAt: new Date(formData.revealAt).toISOString(),
    }
    createMutation.mutate(payload)
  }

  const cycles = data || []

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100">Competition Cycles</h1>
          <p className="text-sm text-gray-500">Manage seasons, configure registration windows, and flip cycle statuses.</p>
        </div>

        <button
          onClick={isCreating ? () => setIsCreating(false) : initDefaults}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition"
        >
          {isCreating ? 'Cancel Creation' : '+ New Cycle'}
        </button>
      </div>

      {isCreating && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-[15px] font-medium text-gray-900 dark:text-white mb-4">Create New Cycle</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs text-gray-500 mb-1">Cycle Name</label><input required type="text" value={formData.cycleName} onChange={e => setFormData({ ...formData, cycleName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Cycle Number</label><input required type="number" value={formData.cycleNumber} onChange={e => setFormData({ ...formData, cycleNumber: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white" /></div>

            <div><label className="block text-xs text-gray-500 mb-1">Registration Open</label><input required type="datetime-local" value={formData.registrationOpen} onChange={e => setFormData({ ...formData, registrationOpen: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Registration Close</label><input required type="datetime-local" value={formData.registrationClose} onChange={e => setFormData({ ...formData, registrationClose: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white" /></div>

            <div><label className="block text-xs text-gray-500 mb-1">Voting Open</label><input required type="datetime-local" value={formData.votingOpen} onChange={e => setFormData({ ...formData, votingOpen: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Voting Close</label><input required type="datetime-local" value={formData.votingClose} onChange={e => setFormData({ ...formData, votingClose: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white" /></div>

            <div className="md:col-span-2 flex justify-end mt-4">
              <button type="submit" disabled={createMutation.isPending} className="bg-primary text-white px-6 py-2 rounded-md font-medium text-sm disabled:opacity-50">
                {createMutation.isPending ? 'Saving...' : 'Save Cycle'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading && <div className="p-8 text-center text-gray-500 col-span-2">Loading cycles...</div>}

        {!isLoading && cycles.map((cycle: any) => (
          <CycleCard 
            key={cycle.id} 
            cycle={cycle} 
            statusMutation={statusMutation} 
            queryClient={queryClient} 
          />
        ))}
      </div>
    </div>
  )
}
