'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      textAlign: 'center',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#111827',
    }}>
      <div style={{ maxWidth: '460px', width: '100%' }}>

        {/* Icon */}
        <div style={{
          width: '116px',
          height: '116px',
          backgroundColor: '#f3f4f6',
          color: '#9ca3af',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '42px',
          margin: '0 auto 24px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 1)',
        }}>
          🔍
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '36px',
          fontWeight: '800',
          letterSpacing: '-0.025em',
          marginBottom: '12px',
          lineHeight: '1.1',
        }}>
          Page Not Found
        </h1>

        {/* Description */}
        <p style={{
          color: '#6b7280',
          fontSize: '15.5px',
          lineHeight: '1.55',
          marginBottom: '32px',
        }}>
          We couldn't find the page or voting link you were looking for.
          It might have been removed, eliminated, or never existed!
        </p>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '380px',
          margin: '0 auto',
        }}>

          <Link
            href="/participants"
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '12px',
              fontWeight: '600',
              textDecoration: 'none',
              fontSize: '1.02rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            View Candidates
          </Link>

          <Link
            href="/"
            style={{
              backgroundColor: 'white',
              color: '#111827',
              padding: '16px 24px',
              borderRadius: '12px',
              fontWeight: '600',
              textDecoration: 'none',
              fontSize: '1.02rem',
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white'
            }}
          >
            Go Home
          </Link>
        </div>

      </div>
    </div>
  )
}