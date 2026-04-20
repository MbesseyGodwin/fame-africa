// apps/web/src/app/rules/page.tsx

import React from 'react'

export const metadata = {
  title: 'Arena Rules & Guidelines - Fame Africa',
  description: 'Official competition rules and community guidelines for Fame Africa contestants and voters.',
}

export default function RulesPage() {
  const rules = [
    {
      title: "1. The Transparency Oath",
      content: "All contestants must adhere to the Transparency Oath. This means no misleading claims, no fraudulent voting schemes, and full disclosure of campaign tactics. Fame Africa is a popularity and talent competition, not an investment scheme."
    },
    {
      title: "2. The Three-Strike Stream Policy",
      content: "To maintain a safe 'Virtual House', we enforce a 3-strike rule for live streams. Violations include: Harassment, explicit content, or dangerous activities. 1st Strike: 24h Suspension. 2nd Strike: 7-day Suspension. 3rd Strike: Instant Permanent Disqualification."
    },
    {
      title: "3. Voter Integrity",
      content: "Automated bot voting is strictly prohibited. Our 'Audit Sentinel' logic monitors IP addresses and device fingerprints. Any suspicious activity will lead to the immediate voiding of the affected votes and a permanent ban on the associated accounts."
    },
    {
      title: "4. Disqualification Criteria",
      content: "Contestants may be disqualified for: (a) Engaging in off-platform 'vote buying' scams. (b) Inciting violence against other participants. (c) Failing to provide valid kyc documentation when requested during the elimination phase."
    },
    {
      title: "5. Elimination Protocol",
      content: "Eliminations are processed daily at 11:59 PM (UTC). Results are calculated based on the day's vote count. Total votes are cumulative for ranking but daily counts determine the 'Survival Threshold'. Once eliminated, a contestant cannot rejoin the current cycle."
    },
    {
      title: "6. Interaction Guidelines",
      content: "Voters are encouraged to engage with contestants via Chat. However, toxic behavior, spamming, or promotion of other platforms in the 'Virtual House' chat is forbidden and will result in a chat ban."
    }
  ]

  return (
    <main className="min-h-screen bg-white py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-[#534AB7] p-3 rounded-2xl">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="G9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-[#1A1A40]">Arena Rules</h1>
        </div>
        
        <p className="text-lg text-gray-600 mb-12 max-w-2xl">
          To ensure Fame Africa remains the most transparent and competitive talent platform in the world, all users must follow these strictly enforced rules.
        </p>

        <div className="grid gap-8">
          {rules.map((rule, index) => (
            <section key={index} className="p-8 rounded-3xl border-2 border-gray-50 bg-[#F9FBFF] hover:border-[#534AB7]/20 transition-colors">
              <h2 className="text-xl font-bold text-[#1A1A40] mb-4 uppercase tracking-tight">
                {rule.title}
              </h2>
              <p className="text-gray-600 leading-relaxed text-base">
                {rule.content}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-16 p-10 rounded-[32px] bg-gradient-to-br from-[#1A1A40] to-[#534AB7] text-white">
          <h2 className="text-2xl font-black mb-4 italic">The Fairness Promise</h2>
          <p className="text-[#B4B1DB] leading-relaxed">
            Fame Africa uses immutable logging for every vote cast. Our systems are designed to be tamper-proof, ensuring that the only way to win is through the genuine love and support of your stans.
          </p>
        </div>
      </div>
    </main>
  )
}
