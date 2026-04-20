import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 py-12">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            Fame Africa
          </Link>
          <p className="text-sm text-gray-500 mt-2">
            Innovative software solutions for healthcare, business <br/> intelligence, and digital transformation.
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
          <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
          <Link href="/services" className="hover:text-primary transition-colors">Services</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
        </div>
      </div>
      <div className="mt-12 text-center text-[10px] text-gray-400 uppercase tracking-widest px-4 leading-relaxed">
        © {new Date().getFullYear()} Fame Africa. A Product of <span className="font-bold">Consolidated Software Solutions Limited</span>. All rights reserved.
      </div>
    </footer>
  )
}
