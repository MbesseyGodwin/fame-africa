// apps/web/src/app/faq/page.tsx

import React from 'react'

export const metadata = {
  title: 'FAQ - Fame Africa',
  description: 'Frequently Asked Questions about the Fame Africa Virtual House and Competition.',
}

export default function FAQPage() {
  const faqs = [
    {
      q: "How does the voting process work?",
      a: "Votes are cast daily for your favorite contestants. Each vote is verified via OTP (Email or Phone) to ensure transparency and prevent bot manipulation. One person can cast one vote per contestant per day."
    },
    {
      q: "Is there a registration fee for contestants?",
      a: "Yes, Fame Africa requires a small registration fee for contestants to ensure only serious talent enters the Virtual House. This fee goes towards platform maintenance, prize pools, and cloud recording infrastructure."
    },
    {
      q: "What is the Virtual House (Live Streaming)?",
      a: "The Virtual House is where the action happens! Global contestants go LIVE 24/7 to showcase their talent, hustle, and personality. It's a digital 'Big Brother' where the audience decides who stays through constant engagement and voting."
    },
    {
      q: "How are contestants eliminated?",
      a: "Eliminations happen daily at 23:59 GMT/UTC. The contestants with the lowest votes on that specific day (or cumulative, depending on the cycle phase) are automatically moved to 'ELIMINATED' status by our system."
    },
    {
      q: "Are my votes refundable?",
      a: "No. All votes cast on the platform are final. We use a transparent audit system to ensure every verified vote is counted accurately towards the contestant's total."
    },
    {
      q: "How can I become a 'Top Stan'?",
      a: "Consistency is key! The 'Top Stans' leaderboard tracks the most active supporters for each contestant. To climb the rank, you need to vote daily and engage with your favorite star's live streams."
    }
  ]

  return (
    <main className="min-h-screen bg-[#F9FBFF] py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black text-[#1A1A40] mb-4 text-center">
          Got Questions? <span className="text-[#534AB7]">We've Got Answers.</span>
        </h1>
        <p className="text-gray-500 text-center mb-16 text-lg">
          Everything you need to know about navigating the Fame Africa arena.
        </p>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <h3 className="text-xl font-bold text-[#1A1A40] mb-3">
                <span className="text-[#534AB7] mr-2">Q:</span> {faq.q}
              </h3>
              <p className="text-gray-600 leading-relaxed pl-7">
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-20 p-8 rounded-3xl bg-[#1A1A40] text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Our support team is available 24/7 to help you with any technical issues or voting disputes.
          </p>
          <a href="mailto:support@fameafrica.tv" className="inline-block bg-[#534AB7] px-8 py-4 rounded-xl font-bold hover:bg-[#6459D4] transition-all">
            Contact Support
          </a>
        </div>
      </div>
    </main>
  )
}
