'use client'

import { useQuery } from '@tanstack/react-query'
import { sponsorsApi } from '../../lib/api'

export function SponsorsSection() {
  const { data } = useQuery({
    queryKey: ['sponsors'],
    queryFn: async () => {
      try {
        const res = await sponsorsApi.getActive()
        return res.data?.data || []
      } catch {
        return []
      }
    }
  })

  // Only render if sponsors exist
  if (!data?.length) return null

  return (
    <section className="py-24 border-t border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-8">
          Proudly Sponsored By
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 hover:opacity-100 transition-opacity">
          {data.map((s: any) => (
            <div key={s.id} className="grayscale hover:grayscale-0 transition-all duration-300">
              <img 
                src={s.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.companyName)}&background=random`} 
                alt={s.companyName} 
                className="h-12 w-auto object-contain rounded" 
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
