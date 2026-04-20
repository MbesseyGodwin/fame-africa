// apps/mobile/src/screens/about/AboutScreen.tsx

import React from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Linking, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../context/ThemeContext'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

/* ─── data ──────────────────────────────────────────────────── */
/* ─── data ──────────────────────────────────────────────────── */
const USER_TYPES = [
  {
    icon: 'people',
    role: 'Voters',
    color: '#3B82F6',
    items: [
      'Support your favourite stars from anywhere in Africa',
      'Interact directly during Live Virtual House sessions',
      'One-Vote-Per-Day policy ensures authentic fan engagement',
      'Join Stan Clubs to rally behind your chosen contestant',
      'Real-time verification ensures every vote counts',
      'Help determine the next big name in African entertainment',
    ],
  },
  {
    icon: 'mic',
    role: 'Rising Stars',
    color: '#8B5CF6',
    items: [
      'Enter the stage and get a unique URL to rally your fans',
      'Go LIVE from the mobile app to connect with your audience',
      'Share your content across WhatsApp, TikTok, and Instagram',
      'Get professional analytics on your audience growth',
      'Generate viral campaign cards to boost your visibility',
      'Win life-changing prizes and Pan-African fame',
      'Build a verified fan base that follows you forever',
    ],
  },
  {
    icon: 'briefcase',
    role: 'Sponsors',
    color: '#F59E0B',
    items: [
      'Connect your brand with the most engaged youth in Africa',
      'Targeted ad placements on contestant voting pages',
      'Transparent impression tracking and performance data',
      'Support African talent discovery and home-grown excellence',
    ],
  },
]

const WEEKS = [
  { week: 1, title: 'The Audition Phase', icon: 'create-outline', desc: 'Contestants join the platform, set up their digital stage, and begin the initial hustle for visibility.' },
  { week: 2, title: 'Virtual House Opening', icon: 'videocam-outline', desc: 'The "Virtual Big Brother" experience begins. Live streaming goes live, allowing stars to bond and fans to watch.' },
  { week: 3, title: 'The Stage Lights Up', icon: 'rocket-outline', desc: 'Voting officially begins. The Pan-African leaderboard goes live, showing who has the strongest fans.' },
  { week: 4, title: 'The Daily Cut', icon: 'flame-outline', desc: 'One-by-one, the dream ends for those at the bottom. Only the most consistent mobilizers survive.' },
  { week: 5, title: 'The Top 10 Elite', icon: 'star-outline', desc: 'Remaining stars reach celebrity status. Stan clubs grow into massive communities across borders.' },
  { week: 6, title: 'The Finalists', icon: 'trophy-outline', desc: 'Only the best remain. Engagement peaks as fans battle to save their favorite stars from the final cuts.' },
  { week: 7, title: 'Continental Coronation', icon: 'ribbon-outline', desc: 'The Winner is crowned live. All votes are audited for total transparency, broadcasted to millions.' },
]

const BENEFITS = [
  { icon: 'trending-up', title: 'Viral Exposure', desc: 'Gain thousands of new followers as your campaign link goes viral.' },
  { icon: 'videocam', title: 'Live Connection', desc: 'Interact with fans 24/7 in our interactive Virtual House.' },
  { icon: 'cash', title: 'Grand Prizes', desc: 'Win cash prizes funded by the platform and elite sponsors.' },
  { icon: 'shield-checkmark', title: 'Integrity First', desc: 'Zero tolerance for fraud. Verified voting with real-time auditing.' },
  { icon: 'earth', title: 'Pan-African Reach', desc: 'Rally votes from Lagos to Accra, Nairobi to Johannesburg.' },
  { icon: 'analytics', title: 'Live Insights', desc: 'Detailed data on your audience and stream engagement.' },
]

const ROADMAP = [
  { year: 'Now', label: 'Talent & Fame Competitions', active: true },
  { year: '2027', label: 'Regional Entertainment Awards' },
  { year: '2028', label: 'Reality Show Audition Infrastructure' },
  { year: '2030', label: 'The African Stardom Index (ASI)' },
]

export default function AboutScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { theme, bg, surface, textPrimary, textSecondary, border, pad } = useTheme()
  const primary = theme.primaryColor || '#534AB7'
  const accent = theme.accentColor || '#EEEDFE'

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>About Fame Africa</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Hero */}
        <View style={[styles.heroSection, { backgroundColor: accent + '40' }]}>
          <Text style={[styles.heroEmoji]}>🌍</Text>
          <Text style={[styles.heroTitle, { color: textPrimary }]}>
            Africa's Most Transparent Voting Platform
          </Text>
          <Text style={[styles.heroSubtitle, { color: textSecondary }]}>
            Fame Africa — A flagship product of Consolidated Software Solutions Limited, redefining trust in engagement.
          </Text>
        </View>

        {/* What is Fame Africa */}
        <View style={[styles.section, { paddingHorizontal: pad }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Corporate Governance</Text>
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.bodyText, { color: textSecondary }]}>
              Fame Africa is developed and managed by <Text style={{ fontWeight: '700', color: primary }}>Consolidated Software Solutions Limited</Text>. Our mission is to empower organizations with innovative, reliable software solutions that drive digital transformation across Africa.
            </Text>
            <View style={[styles.highlightBox, { backgroundColor: primary + '15', borderColor: primary + '30' }]}>
              <Text style={[styles.highlightText, { color: primary }]}>
                🎯 Mission: To drive operational efficiency and create meaningful impact in healthcare, business intelligence, and enterprise systems.
              </Text>
            </View>
          </View>
        </View>

        {/* Who Is It For */}
        <View style={[styles.section, { paddingHorizontal: pad }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Who Is It For?</Text>
          {USER_TYPES.map((type, i) => (
            <View key={i} style={[styles.roleCard, { backgroundColor: surface, borderColor: border }]}>
              <View style={[styles.roleHeader]}>
                <View style={[styles.roleIconBox, { backgroundColor: type.color + '20' }]}>
                  <Ionicons name={type.icon as any} size={24} color={type.color} />
                </View>
                <Text style={[styles.roleTitle, { color: textPrimary }]}>{type.role}</Text>
              </View>
              {type.items.map((item, j) => (
                <View key={j} style={styles.roleItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginTop: 2 }} />
                  <Text style={[styles.roleItemText, { color: textSecondary }]}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Benefits */}
        <View style={[styles.section, { paddingHorizontal: pad }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>The Advantage</Text>
          <View style={styles.benefitsGrid}>
            {BENEFITS.map((b, i) => (
              <View key={i} style={[styles.benefitCard, { backgroundColor: surface, borderColor: border }]}>
                <Ionicons name={b.icon as any} size={28} color={primary} style={{ marginBottom: 8 }} />
                <Text style={[styles.benefitTitle, { color: textPrimary }]}>{b.title}</Text>
                <Text style={[styles.benefitDesc, { color: textSecondary }]}>{b.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Timeline */}
        <View style={[styles.section, { paddingHorizontal: pad }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>The 7-Week Journey</Text>
          <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
            From auditions to the finale — witness the making of a star.
          </Text>

          {WEEKS.map((w, i) => (
            <View key={i} style={[styles.timelineItem]}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: primary }]}>
                  <Ionicons name={w.icon as any} size={16} color="#FFF" />
                </View>
                {i < WEEKS.length - 1 && (
                  <View style={[styles.timelineLine, { backgroundColor: primary + '30' }]} />
                )}
              </View>
              <View style={[styles.timelineContent, { backgroundColor: surface, borderColor: border }]}>
                <View style={[styles.weekBadge, { backgroundColor: primary + '15' }]}>
                  <Text style={[styles.weekBadgeText, { color: primary }]}>STAGE {w.week}</Text>
                </View>
                <Text style={[styles.weekTitle, { color: textPrimary }]}>{w.title}</Text>
                <Text style={[styles.weekDesc, { color: textSecondary }]}>{w.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* The Platform */}
        <View style={[styles.section, { paddingHorizontal: pad }]}>
          <View style={[styles.arenaCard, { backgroundColor: primary + '08', borderColor: primary + '20' }]}>
            <Text style={styles.arenaEmoji}>🚀</Text>
            <Text style={[styles.arenaTitle, { color: textPrimary }]}>
              A Product of Innovation
            </Text>
            <Text style={[styles.bodyText, { color: textSecondary, textAlign: 'center' }]}>
              Fame Africa sits alongside our other world-class products:
            </Text>
            <Text style={[styles.bodyText, { color: primary, fontWeight: '700', textAlign: 'center', marginTop: 12 }]}>
              • I Am Alive • Dekigram •{'\n'}• Nigerian HIV ART Analyzer •
            </Text>
          </View>
        </View>

        {/* Future */}
        <View style={[styles.section, { paddingHorizontal: pad }]}>
          <View style={[styles.visionBadge, { backgroundColor: '#DCFCE7' }]}>
            <Text style={{ color: '#15803D', fontSize: 12, fontWeight: '700' }}>🌍 PAN-AFRICAN VISION</Text>
          </View>
          <Text style={[styles.sectionTitle, { color: textPrimary, marginTop: 8 }]}>
            The Future of Stardom
          </Text>
          <Text style={[styles.bodyText, { color: textSecondary, marginBottom: 20 }]}>
            Our technology ensures that fan engagement is real, transparent, and auditable across all borders. We are building the infrastructure for the next generation of African entertainment.
          </Text>

          {ROADMAP.map((m, i) => (
            <View key={i} style={[
              styles.roadmapItem,
              {
                backgroundColor: m.active ? primary + '12' : surface,
                borderColor: m.active ? primary + '40' : border,
              },
            ]}>
              <Text style={[styles.roadmapYear, { color: m.active ? primary : textSecondary }]}>
                {m.year}
              </Text>
              <View style={[styles.roadmapDot, { backgroundColor: m.active ? primary : border }]} />
              <Text style={[styles.roadmapLabel, { color: m.active ? primary : textSecondary, fontWeight: m.active ? '600' : '400' }]}>
                {m.label}
              </Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={[styles.ctaSection, { paddingHorizontal: pad }]}>
          <Text style={[styles.ctaTitle, { color: textPrimary }]}>Your Journey Starts Here</Text>
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: primary }]}
            onPress={() => router.push('/participants' as any)}
          >
            <Text style={styles.ctaButtonText}>Explore Rising Stars</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ctaButtonOutline, { borderColor: primary }]}
            onPress={() => router.push('/participants/register' as any)}
          >
            <Text style={[styles.ctaButtonOutlineText, { color: primary }]}>Join the Competition</Text>
          </TouchableOpacity>
        </View>

        {/* Support & FAQ */}
        <View style={[styles.section, { paddingHorizontal: pad }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Support & FAQ</Text>
          <TouchableOpacity 
            style={[styles.faqLink, { backgroundColor: surface, borderColor: border }]}
            onPress={() => router.push('/about/faq' as any)}
          >
            <View style={[styles.faqIconBox, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="help-circle" size={24} color="#15803D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.faqLinkTitle, { color: textPrimary }]}>Knowledge Center</Text>
              <Text style={[styles.faqLinkSub, { color: textSecondary }]}>Find answers to common questions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.faqLink, { backgroundColor: surface, borderColor: border, marginTop: 12 }]}
            onPress={() => Linking.openURL('https://fameafrica.tv/rules')}
          >
            <View style={[styles.faqIconBox, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="document-text" size={24} color="#0369A1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.faqLinkTitle, { color: textPrimary }]}>Arena Rules</Text>
              <Text style={[styles.faqLinkSub, { color: textSecondary }]}>Official platform guidelines</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={{ padding: pad, alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: textSecondary, textAlign: 'center', opacity: 0.6 }}>
            © {new Date().getFullYear()} Consolidated Software Solutions Ltd.{'\n'}All rights reserved. Fame Africa is a global product.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

/* ─── styles ────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  heroSection: {
    paddingVertical: 40, paddingHorizontal: 24, alignItems: 'center',
  },
  heroEmoji: { fontSize: 48, marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', lineHeight: 32, marginBottom: 12 },
  heroSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 320 },

  section: { paddingVertical: 24 },
  sectionTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  sectionSubtitle: { fontSize: 14, lineHeight: 20, marginBottom: 16 },

  card: { borderRadius: 16, padding: 20, borderWidth: 1 },
  bodyText: { fontSize: 14, lineHeight: 22 },
  highlightBox: {
    borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1,
  },
  highlightText: { fontSize: 13, fontWeight: '600', lineHeight: 20 },

  roleCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  roleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  roleIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  roleTitle: { fontSize: 18, fontWeight: '700' },
  roleItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  roleItemText: { fontSize: 13, lineHeight: 20, flex: 1 },

  benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  benefitCard: {
    borderRadius: 14, padding: 16, borderWidth: 1,
    width: '48%' as any, flexGrow: 0, flexShrink: 0, flexBasis: '47%',
  },
  benefitTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  benefitDesc: { fontSize: 12, lineHeight: 18 },

  timelineItem: { flexDirection: 'row', marginBottom: 0 },
  timelineLeft: { alignItems: 'center', width: 40, marginRight: 12 },
  timelineDot: {
    width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  timelineLine: { width: 2, flex: 1, marginVertical: 4 },
  timelineContent: {
    flex: 1, borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 12,
  },
  weekBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  weekBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  weekTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  weekDesc: { fontSize: 13, lineHeight: 20 },

  arenaCard: {
    borderRadius: 20, padding: 28, borderWidth: 1, alignItems: 'center',
  },
  arenaEmoji: { fontSize: 48, marginBottom: 16 },
  arenaTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', lineHeight: 30, marginBottom: 16 },

  visionBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },

  roadmapItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 12,
  },
  roadmapYear: { fontSize: 12, fontWeight: '700', fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }), width: 36 },
  roadmapDot: { width: 10, height: 10, borderRadius: 5 },
  roadmapLabel: { fontSize: 13, flex: 1 },

  ctaSection: { paddingVertical: 32, alignItems: 'center' },
  ctaTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  ctaButton: {
    width: '100%', paddingVertical: 16, borderRadius: 30,
    alignItems: 'center', marginBottom: 12,
  },
  ctaButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  ctaButtonOutline: {
    width: '100%', paddingVertical: 16, borderRadius: 30,
    alignItems: 'center', borderWidth: 2,
  },
  ctaButtonOutlineText: { fontSize: 16, fontWeight: '700' },
  
  faqLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  faqIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  faqLinkTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  faqLinkSub: {
    fontSize: 13,
  },
})
