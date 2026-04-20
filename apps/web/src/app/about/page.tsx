import { Metadata } from 'next'
import { Navbar } from '../../components/layouts/Navbar'
import { Footer } from '../../components/layouts/Footer'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Fame Africa — Africa\'s Most Transparent Virtual Voting Platform',
  description: 'Learn how Fame Africa works, and the core mission behind the platform built by Consolidated Software Solutions Limited.',
}

/* ─── data ──────────────────────────────────────────────────── */
const userTypes = [
  {
    icon: '🗳️',
    role: 'Voters',
    color: 'from-blue-500 to-cyan-500',
    items: [
      'Vote for your favourite contestants every day for free',
      'Watch and interact with stars in the Live Virtual House',
      'OTP verification ensures one person = one vote — no bots, no cheating',
      'Track your vote history and see your impact on the leaderboard',
      'Join stan clubs to connect with other fans of your favourite contestants',
      'Receive real-time notifications when your contestant is at risk of elimination',
      'Compete for a spot on the "Top Stans" leaderboard for your favorite star',
    ],
  },
  {
    icon: '🎤',
    role: 'Contestants',
    color: 'from-primary to-purple-500',
    items: [
      'Pay a small entry fee to get your unique voting link',
      'Go LIVE from the mobile app to bond with your fans',
      'Share your link on WhatsApp, Instagram, TikTok — everywhere',
      'Get a personal mobilization dashboard with real-time vote analytics',
      'Generate viral campaign cards to rally your supporters',
      'Build a fan base (stan club) that grows with you beyond the competition',
      'Win cash prizes and massive social media visibility',
    ],
  },
  {
    icon: '🏢',
    role: 'Sponsors & Partners',
    color: 'from-amber-500 to-orange-500',
    items: [
      'Place banner ads that reach thousands of engaged daily active users',
      'Sponsor prizes — your brand appears on winner announcements and campaign cards',
      'Track impressions and engagement through the sponsor analytics dashboard',
      'Partner with the fastest-growing voting platform in West Africa',
    ],
  },
]

const competitionWeeks = [
  {
    week: 1,
    title: 'Registration Week',
    icon: '📝',
    status: 'REGISTRATION_OPEN',
    desc: 'Registration opens to the public. Anyone over 18 in Nigeria can sign up by paying the entry fee. You receive your unique voting link, create your profile, and start telling your supporters about the competition. This is your time to prepare your campaign — line up your WhatsApp groups, alert your social media followers, and get your stan club ready.',
    tip: 'Pro tip: Start sharing your link before voting opens. The contestants who mobilize early always have an advantage.',
  },
  {
    week: 2,
    title: 'Virtual House Opening — Live Interaction',
    icon: '🎥',
    status: 'VOTING_PENDING',
    desc: 'The "Virtual Big Brother" begins! Contestants go live from their mobile devices, bonding with fans and each other in real-time. This is where personalities shine and the strongest fan bases are formed before the first vote is even cast. Fans can comment, like, and support their stars live.',
    tip: 'Voters want to see the real you. Contestants who go live daily build 5x larger fan bases than those who stay silent.',
  },
  {
    week: 3,
    title: 'Voting Begins — The Opening Sprint',
    icon: '🚀',
    status: 'VOTING_OPEN',
    desc: 'Voting goes live! Every registered phone number can vote once per day. Votes are verified via OTP to prevent fraud. The leaderboard updates in real-time, and the bottom-ranked contestants face their first elimination at the end of the week.',
    tip: 'This is the most critical week. Initial momentum sets the tone. Use your live sessions to rally the opening votes.',
  },
  {
    week: 3,
    title: 'Daily Eliminations Begin',
    icon: '⚔️',
    status: 'VOTING_OPEN',
    desc: 'From this point, one or more contestants are eliminated every day based on the lowest vote count. The pressure intensifies — contestants must keep their voters engaged daily, not just once. The leaderboard becomes the most-watched page on the platform.',
    tip: 'This is where "lazy campaigns" die. Daily consistency beats one-time viral posts.',
  },
  {
    week: 4,
    title: 'The Archive — Playback the Magic',
    icon: '📼',
    status: 'VOTING_OPEN',
    desc: 'Missed a live session? All Virtual House streams are now automatically recorded and archived. Fans can watch previous performances, hustle sessions, and drama to decide who truly deserves their daily vote.',
    tip: "Your recorded content works for you while you sleep. High-quality archives drive 24/7 engagement.",
  },
  {
    week: 4,
    title: 'The Great Purge — Half Remaining',
    icon: '🔥',
    status: 'VOTING_OPEN',
    desc: 'By now, roughly half the contestants have been eliminated. The surviving contestants are the serious mobilizers — those who\'ve built genuine fan communities. Sponsor prizes begin to be announced, adding extra motivation. The competition starts getting national media attention.',
    tip: "This is when alliances form. Smart contestants cross-promote each other's links to share voter bases.",
  },
  {
    week: 5,
    title: 'Top 10 — Celebrity Status',
    icon: '⭐',
    status: 'VOTING_OPEN',
    desc: 'Only the top 10 remain. These contestants have effectively become local celebrities. Their stan clubs are thousands strong, their campaign cards are shared hundreds of times daily, and their daily vote counts are in the thousands. Eliminations slow down to build suspense — only one contestant is eliminated every 2 days.',
    tip: 'The Top 10 often gain more Instagram and TikTok followers during this week than in the previous year.',
  },
  {
    week: 6,
    title: 'Final 5 — The Endgame',
    icon: '🏆',
    status: 'VOTING_OPEN',
    desc: 'Five contestants remain. Each elimination is a nationally-discussed event. Voting intensity peaks — this is when the most votes are cast per day across the entire competition. The final 5 are featured on the Fame Africa homepage, sponsor announcements, and partner media outlets.',
    tip: 'Expect 10x the daily vote volume compared to Week 2. The competition heats up exponentially.',
  },
  {
    week: 7,
    title: 'Grand Finale — The Reveal',
    icon: '👑',
    status: 'REVEALING',
    desc: 'The last elimination round happens live. Votes are frozen, tallied, and verified by the Fame Africa transparency engine. The tiebreaker rules are applied if needed. The winner is announced with a full public audit of the final vote counts — every number transparent, every vote accounted for. The winner receives the grand prize.',
    tip: 'Fame Africa is the only platform in Africa where the final vote count is fully published and auditable.',
  },
]

const benefits = [
  { icon: '📈', title: 'Massive Visibility', desc: 'Contestants who reach the Top 10 gain thousands of new followers across all social media platforms — organically.' },
  { icon: '💰', title: 'Real Cash Prizes', desc: 'Winners take home substantial cash prizes from the platform and sponsors. Even runner-ups get sponsor rewards.' },
  { icon: '🤝', title: 'Community Building', desc: 'Your stan club stays with you after the competition. These are real fans who chose to support you — not paid followers.' },
  { icon: '🛡️', title: 'Fair & Fraud-Proof', desc: 'OTP-verified votes, device fingerprinting, and AI fraud detection ensure that every vote counts and nobody cheats.' },
  { icon: '🌍', title: 'National Reach', desc: 'Fame Africa contestants come from all 36 states. Win fans from Lagos to Maiduguri — your reach becomes truly national.' },
  { icon: '🎯', title: 'Personal Analytics', desc: 'Every contestant gets a real-time dashboard showing daily vote trends, geographic breakdown, and mobilization tips.' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-28 pb-20 lg:pt-40 lg:pb-28">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -z-10 h-[400px] w-[600px] rounded-full bg-primary/15 opacity-30 blur-[120px]"></div>

          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <span className="inline-block py-1.5 px-4 rounded-full border border-primary/20 bg-primary/10 text-primary text-sm font-semibold mb-6">
              About Fame Africa
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-gray-900 dark:text-white leading-tight">
              Africa's Most <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Transparent</span> Virtual Voting Platform
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Fame Africa is a premier product of <strong>Consolidated Software Solutions Limited</strong>, designed to redefine secure, transparent, and fair public voting across the continent.
            </p>
          </div>
        </section>

        {/* ── What is VoteNaija ───────────────────────────────── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">What is Fame Africa?</h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                  <p>
                    Fame Africa is Nigeria's premier public voting competition platform. Contestants register, share their unique voting link with supporters, and rally votes to climb the leaderboard. The contestant with the most votes at the end of 7 weeks wins.
                  </p>
                  <p>
                    But make no mistake — <strong className="text-gray-900 dark:text-white">Fame Africa is a platform, not a magic wand.</strong> We provide the arena, the technology, and the fair rules. The real work? That's on you. Your hustle, your network, your creativity, your ability to mobilize people — that's what wins competitions here.
                  </p>
                  <p>
                    Every vote is OTP-verified, every tally is transparent, and every elimination is auditable. We built Fame Africa on a simple principle: <em className="text-primary font-medium">if the process is fair, the best mobilizer wins — and that's exactly how democracy should work.</em>
                  </p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">🇳🇬</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Built for Nigeria.<br/>Designed for Africa.</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Verified Votes', value: 'OTP + Device ID' },
                    { label: 'Fraud Detection', value: 'AI-Powered' },
                    { label: 'Transparency', value: 'Full Public Audit' },
                    { label: 'Elimination Method', value: 'Lowest Daily Votes' },
                    { label: 'Technology Stack', value: 'Bank-Grade Encryption' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Who Is It For ──────────────────────────────────── */}
        <section className="py-20 bg-white dark:bg-gray-950">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Who Is Fame Africa For?</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Whether you're a voter, a contestant, or a brand — there's a place for you on Fame Africa.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {userTypes.map((type, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                  <div className={`h-2 bg-gradient-to-r ${type.color}`}></div>
                  <div className="p-6">
                    <div className="text-4xl mb-4">{type.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{type.role}</h3>
                    <ul className="space-y-3">
                      {type.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Benefits ───────────────────────────────────────── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Why People Love Fame Africa</h2>
              <p className="text-gray-500 max-w-xl mx-auto">It's not just about winning prizes — it's about building a movement around your name.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((b, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
                  <div className="text-3xl mb-3">{b.icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Competition Stages ──────────────────────────────── */}
        <section className="py-20 bg-white dark:bg-gray-950">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How The Competition Works</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">Every competition cycle runs for 7 intense weeks. Here's what happens at each stage — from registration to crowning the winner.</p>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-purple-400 to-amber-500"></div>

              <div className="space-y-8">
                {competitionWeeks.map((w, i) => (
                  <div key={i} className="relative group">
                    <div className="flex gap-6 items-start">
                      {/* Timeline dot */}
                      <div className="hidden md:flex shrink-0 w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border-2 border-primary/20 items-center justify-center text-2xl z-10 group-hover:scale-110 group-hover:border-primary transition-all duration-300">
                        {w.icon}
                      </div>

                      {/* Content card */}
                      <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-800 hover:border-primary/30 transition-colors duration-300">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="md:hidden text-2xl">{w.icon}</span>
                          <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                            Week {w.week}
                          </span>
                          <span className="hidden sm:inline-block py-1 px-2 rounded text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800">
                            {w.status}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{w.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{w.desc}</p>
                        <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-3 border border-primary/10">
                          <p className="text-sm text-primary font-medium">💡 {w.tip}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Corporate Identity ────────────────────────────── */}
        <section className="py-24 bg-white dark:bg-gray-950">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-16 items-start">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Our Governance</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                  Fame Africa is a strategic product developed and managed by <strong className="text-primary">Consolidated Software Solutions Limited</strong>. 
                  Headquartered in Nigeria and operating with a global mindset, we specialize in delivering transformative software solutions that drive operational 
                  efficiency across healthcare, business intelligence, and enterprise systems.
                </p>
                
                <div className="space-y-8">
                  <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-primary mb-3">Our Mission</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      To empower organizations with innovative, reliable software solutions that drive digital transformation, improve operational efficiency, and create meaningful impact in healthcare, business intelligence, and enterprise systems.
                    </p>
                  </div>
                  <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-primary mb-3">Our Vision</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      To be a leading software innovation partner recognized for delivering transformative solutions that enable organizations to thrive in an increasingly digital world while maintaining the highest standards of quality and customer service.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Core Values</h2>
                <div className="grid gap-6">
                  {[
                    { title: 'Innovation', desc: 'We continuously push boundaries and embrace emerging technologies to deliver cutting-edge solutions.' },
                    { title: 'Reliability', desc: 'Our solutions are built on solid foundations with rigorous testing to ensure maximum performance.' },
                    { title: 'Social Impact', desc: 'We commit to creating technology that makes a positive difference in the community.' },
                  ].map((value, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold">{i+1}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">{value.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{value.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 p-8 bg-gradient-to-br from-primary to-purple-600 rounded-3xl text-white shadow-xl shadow-primary/20">
                  <h3 className="text-xl font-bold mb-4">Corporate Portfolio</h3>
                  <p className="text-sm text-white/80 mb-6 font-medium">Fame Africa sits alongside other world-class solutions in our innovation hub:</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-white/10">
                      <span className="text-sm font-bold">I Am Alive</span>
                      <span className="text-[10px] uppercase bg-white/20 px-2 py-0.5 rounded">Emergency Safety</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-white/10">
                      <span className="text-sm font-bold">Dekigram</span>
                      <span className="text-[10px] uppercase bg-white/20 px-2 py-0.5 rounded">Digital Networking</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-bold">Nigerian HIV ART Analyzer</span>
                      <span className="text-[10px] uppercase bg-white/20 px-2 py-0.5 rounded">Healthcare IT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Vision: The Future of E-Voting ─────────────────── */}
        <section className="py-20 bg-white dark:bg-gray-950">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block py-1 px-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider mb-4">
                  🌍 Vision 2036
                </span>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Building Africa's Future of Secure Elections
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                  <p>
                    Fame Africa isn't just a competition app. We're proving that <strong className="text-gray-900 dark:text-white">large-scale, secure, transparent digital voting is possible in Africa — today.</strong>
                  </p>
                  <p>
                    Every Fame Africa competition processes thousands of OTP-verified votes per day with zero fraud incidents. The same technology — identity verification, real-time tallying, public audit trails, and tamper-proof recording — is exactly what's needed for government elections.
                  </p>
                  <p>
                    We believe that within <strong className="text-gray-900 dark:text-white">10 years</strong>, African governments will adopt platforms like Fame Africa for local government elections, student union elections, party primaries, and eventually — national elections. We're building that future, one daily competition at a time.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { year: 'Now', label: 'Entertainment voting competitions', active: true },
                  { year: '2027', label: 'University student union elections' },
                  { year: '2028', label: 'Corporate board elections & AGMs' },
                  { year: '2030', label: 'Local government pilot elections' },
                  { year: '2033', label: 'State-level election infrastructure' },
                  { year: '2036', label: 'National e-voting readiness' },
                ].map((milestone, i) => (
                  <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                    milestone.active
                      ? 'bg-primary/10 border-primary/30 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                  }`}>
                    <span className={`text-sm font-mono font-bold shrink-0 w-12 ${
                      milestone.active ? 'text-primary' : 'text-gray-400'
                    }`}>{milestone.year}</span>
                    <div className={`w-3 h-3 rounded-full shrink-0 ${
                      milestone.active ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                    }`}></div>
                    <span className={`text-sm ${
                      milestone.active ? 'text-primary font-semibold' : 'text-gray-600 dark:text-gray-400'
                    }`}>{milestone.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Help & Safety ──────────────────────────────────── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl">🛡️</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Community Safety</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  We enforce a zero-tolerance policy for harassment or explicit content in the Virtual House. Our real-time Reporting System allows fans to flag violations instantly, which are reviewed by our moderation team within minutes.
                </p>
                <Link href="/rules" className="text-primary font-bold hover:underline flex items-center gap-2">
                  Read Arena Rules <span className="text-lg">→</span>
                </Link>
              </div>

              <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl">❓</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Got Questions?</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Whether you're curious about the voting logic, withdrawal process, or how the Virtual House works, our comprehensive Knowledge Center covers everything you need to know.
                </p>
                <Link href="/faq" className="text-primary font-bold hover:underline flex items-center gap-2">
                  Visit FAQ Center <span className="text-lg">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <section className="py-24 bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/10 dark:from-primary/10 dark:via-purple-800/10 dark:to-primary/5">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Ready to Make History?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-xl mx-auto">
              Whether you're here to vote, compete, or sponsor — you're joining the most important voting technology platform being built in Africa right now.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/vote"
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-full font-medium hover:scale-105 hover:shadow-lg hover:shadow-primary/40 transition-all duration-300"
              >
                Start Voting Now
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium hover:scale-105 transition-all duration-300"
              >
                Enter as Contestant
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
