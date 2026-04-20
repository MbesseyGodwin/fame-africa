import { Suspense } from 'react'
import { HeroSection } from '../components/ui/HeroSection'
import { StatsBar } from '../components/ui/StatsBar'
import { ParticipantsGrid } from '../components/ui/ParticipantsGrid'
import { HowItWorks } from '../components/ui/HowItWorks'
import { SponsorsSection } from '../components/ui/SponsorsSection'
import { Navbar } from '../components/layouts/Navbar'
import { Footer } from '../components/layouts/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <StatsBar />
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-medium mb-8 text-gray-900 dark:text-red-900">
            Active participants
          </h2>
          <Suspense fallback={<ParticipantsGridSkeleton />}>
            <ParticipantsGrid />
          </Suspense>
        </section>
        <HowItWorks />
        <SponsorsSection />
      </main>
      <Footer />
    </div>
  )
}

function ParticipantsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="rounded-theme border border-gray-100 p-4 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-gray-200 mx-auto mb-3" />
          <div className="h-3 bg-gray-200 rounded mx-auto w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded mx-auto w-1/2" />
        </div>
      ))}
    </div>
  )
}
