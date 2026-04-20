import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-gray-950 pt-32 pb-20 lg:pt-48 lg:pb-32">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>

      <div className="relative max-w-6xl mx-auto px-4 text-center">
        <span className="inline-block py-1 px-3 rounded-full border border-primary/20 bg-primary/10 text-primary text-sm font-semibold mb-6 animate-pulse">
          Fame Africa 2026 is LIVE
        </span>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-gray-900 dark:text-white leading-tight">
          Shape the Future <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">One Vote at a Time</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
          Welcome to the **Virtual House**. Join thousands of fans in the premier live-interactive showdown. Support your favorite stars, watch them live, and shape their history with every vote.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/vote" className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-full font-medium hover:scale-105 hover:shadow-lg hover:shadow-primary/50 transition-all duration-300">
            Start Voting Now
          </Link>
          <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Register as Participant
          </Link>
        </div>
      </div>
    </section>
  )
}
