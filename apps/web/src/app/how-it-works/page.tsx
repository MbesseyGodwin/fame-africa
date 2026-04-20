import { HowItWorks } from '../../components/ui/HowItWorks'

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans pt-12 pb-24">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How Fame Africa Works</h1>
          <p className="text-gray-500 max-w-xl mx-auto text-lg">A transparent and verified voting process designed to reward the most loved participants organically.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-4 md:p-8">
          <HowItWorks />
        </div>
      </div>
    </div>
  )
}
