'use client'

import { useState } from 'react'
import { auditApi } from '../../lib/api'

export default function VerifyVotePage() {
  const [voteId, setVoteId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!voteId.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await auditApi.verifyVote(voteId.trim())
      setResult(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please check the Vote ID.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col pt-20 px-4">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-3">Vote Verification Ledger</h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Fame Africa uses cryptographic Merkle Trees to anchor your vote to an immutable public blockchain. Paste your Vote ID below to verify your ballot independently.
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 mb-8">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="voteId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Enter your exact Vote ID
              </label>
              <input
                id="voteId"
                type="text"
                placeholder="e.g. cly...12345"
                value={voteId}
                onChange={(e) => setVoteId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !voteId.trim()}
              className="w-full btn-primary py-3 rounded-lg font-medium transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Performing Cryptographic Verification...' : 'Verify Cryptographic Proof'}
            </button>
          </form>
        </div>

        {/* Error Result */}
        {error && (
          <div className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-xl text-center border border-red-100 dark:border-red-900/50">
            {error}
          </div>
        )}

        {/* Success Result */}
        {result && result.status !== 'VERIFIED' && (
          <div className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 p-6 rounded-xl border border-yellow-100 dark:border-yellow-900/50 text-center">
            <h3 className="text-lg font-medium mb-2">Vote Recorded</h3>
            <p className="text-sm">{result.message}</p>
          </div>
        )}

        {result && result.status === 'VERIFIED' && (
          <div className="bg-card border border-green-200 dark:border-green-900/50 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-center gap-3 text-green-600 dark:text-green-400 mb-6">
              <span className="text-3xl">✓</span>
              <h2 className="text-2xl font-medium">Verify Success</h2>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Your Vote Hash (Leaf)</p>
                  <code className="text-xs text-gray-800 dark:text-gray-200 break-all">{result.voteHash}</code>
                </div>
                <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Daily Merkle Root</p>
                  <code className="text-xs text-green-700 dark:text-green-500 break-all">{result.merkleRoot}</code>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                  Cryptographic Breakdown
                </h4>
                <ul className="text-xs text-gray-500 space-y-2 mb-4">
                  <li><strong>Audit Ledger Date:</strong> {new Date(result.auditDate).toLocaleDateString()} (Day {result.dayNumber})</li>
                  <li><strong>Inclusion Path:</strong> {result.proof.length} sibling hashes mathematically link your vote to the Root.</li>
                </ul>
              </div>

              {result.txHash && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                  <p className="text-sm text-gray-500 mb-3">
                    This daily root has been permanently anchored to the Ethereum Virtual Machine blockchain.
                  </p>
                  <a
                    href={`https://sepolia.basescan.org/tx/${result.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-2.5 rounded-full text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
                  >
                    View on Block Explorer
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
