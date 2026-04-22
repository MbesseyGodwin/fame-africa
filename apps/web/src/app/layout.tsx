import type { Metadata } from 'next'
import '../styles/globals.css'
import { ThemeProvider } from '../components/layouts/ThemeProvider'
import { QueryProvider } from '../components/layouts/QueryProvider'

export const metadata: Metadata = {
  title: 'FameAfrica | Africa’s Digital Stage for Rising Stars',
  description: 'Vote for your favorite rising stars on FameAfrica. Fame and Content Creation at its peak.',
  keywords: 'voting, competition, Africa, FameAfrica',
  openGraph: {
    title: 'FameAfrica',
    description: 'Africa’s digital stage for rising stars',
    url: 'https://fameafrica.com',
    siteName: 'FameAfrica',
    locale: 'en_NG',
    type: 'website',
  },
  metadataBase: new URL('https://fame-africa-web-ocvx.vercel.app'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}