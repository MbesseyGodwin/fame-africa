'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { paymentsApi } from '../../../lib/api'
import { Ionicons } from '@expo/vector-icons'

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your payment...')

  useEffect(() => {
    const transactionId = searchParams.get('transaction_id')
    const txRef = searchParams.get('tx_ref')
    const flwStatus = searchParams.get('status')

    if (flwStatus === 'cancelled') {
      setStatus('error')
      setMessage('Payment was cancelled. Redirecting you back...')
      setTimeout(() => router.push('/register'), 3000)
      return
    }

    if (!transactionId || !txRef) {
      setStatus('error')
      setMessage('Invalid payment response. Please contact support.')
      return
    }

    const verify = async () => {
      try {
        const { data } = await paymentsApi.verifyPayment({ 
          transactionId, 
          reference: txRef 
        })

        if (data.status === 'success') {
          setStatus('success')
          setMessage('Payment verified successfully! Welcome to FameAfrica.')
          setTimeout(() => router.push('/dashboard'), 3000)
        } else {
          setStatus('error')
          setMessage('Verification failed. Please try again or contact support.')
        }
      } catch (err: any) {
        console.error('Verification error:', err)
        setStatus('error')
        setMessage(err.response?.data?.message || 'An error occurred during verification.')
      }
    }

    verify()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto"></div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="bg-green-100 p-4 rounded-full mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Success!</h1>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="bg-red-100 p-4 rounded-full mb-4">
              <span className="text-4xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          </div>
        )}

        <p className="mt-4 text-gray-600 text-lg">{message}</p>
        
        {status !== 'loading' && (
          <button
            onClick={() => router.push(status === 'success' ? '/dashboard' : '/register')}
            className="mt-8 w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            {status === 'success' ? 'Go to Dashboard' : 'Try Again'}
          </button>
        )}
      </div>
    </div>
  )
}
