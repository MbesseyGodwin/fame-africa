export function HowItWorks() {
  const steps = [
    { title: "Register & Pay", desc: "Sign up and pay the entry fee to get your unique voting link and viral campaign card." },
    { title: "Share & Mobilize", desc: "Share your profile link everywhere! Build your 'Stan' club to dominate the leaderboard." },
    { title: "Virtual House", desc: "Go Live! Bond with fans, host virtual hangouts, and stay active to avoid elimination." },
    { title: "Fame Arena", desc: "Every evening at 6 PM, join 'The Arena' for a live IQ Blitz. Missing this can lead to disqualification!" },
    { title: "Win Big", desc: "Top the standings at the end of the journey to win the grand prize and Pan-African fame." }
  ]

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            The Roadmap to Fame
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
          <p className="text-gray-600 dark:text-gray-400">A transparent and verified voting process designed to reward the most loved participants.</p>
        </div>

        <div className="grid md:grid-cols-5 gap-8 mb-24">
          {steps.map((step, i) => (
            <div key={i} className="relative text-center group">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-900 shadow-lg border border-gray-100 dark:border-gray-800 flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                {i + 1}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-24">
            {/* The Arena Laws */}
            <div className="bg-gray-900 rounded-[3rem] p-8 md:p-12 border border-gray-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-12 -translate-y-12">
                    <div className="text-9xl font-black">ARENA</div>
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-yellow-400/20 rounded-xl flex items-center justify-center">
                            <span className="text-xl">🏆</span>
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tight uppercase">The Arena Laws</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-1 h-auto bg-gray-800 rounded-full"></div>
                            <div>
                                <h4 className="font-bold text-white mb-1">Daily IQ Blitz (6 PM - 7 PM)</h4>
                                <p className="text-gray-400 text-sm">Every day at 6:00 PM GMT+1, the Arena opens. Every active contestant must participate in the 1-hour window.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-1 h-auto bg-red-600/50 rounded-full"></div>
                            <div>
                                <h4 className="font-bold text-red-500 mb-1">The 3-Strike Rule</h4>
                                <p className="text-gray-400 text-sm">Missing an Arena session is a "Strike". 3 strikes lead to <span className="text-white font-bold">automatic disqualification</span>.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* The Virtual House Laws */}
            <div className="bg-primary/20 rounded-[3rem] p-8 md:p-12 border border-primary/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-12 -translate-y-12">
                    <div className="text-9xl font-black text-white">LIVE</div>
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <span className="text-xl">🎥</span>
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tight uppercase">House Access</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-1 h-auto bg-white/20 rounded-full"></div>
                            <div>
                                <h4 className="font-bold text-white mb-1">24/7 Virtual Window</h4>
                                <p className="text-white/70 text-sm">Contestants can go live at any time. This is your chance to show the real you and bond with your "Stan Clubs".</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-1 h-auto bg-white/20 rounded-full"></div>
                            <div>
                                <h4 className="font-bold text-white mb-1">Archived Sessions</h4>
                                <p className="text-white/70 text-sm">Every live session is recorded. Fans can watch saved clips on-demand to stay caught up on the drama.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-12 p-6 bg-primary/5 rounded-2xl border border-primary/10 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
                <strong>Disclaimer:</strong> Fame Africa is a competitive talent platform. All participation is at the contestant's own risk. All registration fees and votes are strictly non-refundable.
            </p>
        </div>
      </div>
    </section>
  )
}
