// apps/mobile/src/screens/arena/ArenaLiveScreen.tsx

import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ActivityIndicator, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTheme } from '../../context/ThemeContext'
import { arenaApi } from '../../utils/api'
import { io as socketIO } from 'socket.io-client'
import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') || 'https://fameafrica-api.onrender.com'

const { width } = Dimensions.get('window')

interface Question {
  id: string
  questionText: string
  options: string[]
  timerSeconds: number
}

export function ArenaLiveScreen({ eventId }: { eventId: string }) {
  const { theme, textPrimary, textSecondary, surface, bg } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const socketRef = useRef<any>(null)

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const [score, setScore] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)

  const timerAnim = useRef(new Animated.Value(1)).current
  const s = makeStyles(theme, surface, textPrimary, textSecondary, insets)

  useEffect(() => {
    fetchEvent()

    async function initSocket() {
      const token = await SecureStore.getItemAsync('accessToken')
      const socket = socketIO(API_URL, { auth: { token } })
      socketRef.current = socket
      socket.emit('arena:join', eventId)
    }

    initSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('arena:leave', eventId)
        socketRef.current.disconnect()
      }
    }
  }, [eventId])

  useEffect(() => {
    if (questions.length > 0 && !isGameOver && !hasAnswered) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleNextQuestion()
            return 15
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [currentIndex, questions, isGameOver, hasAnswered])

  async function fetchEvent() {
    try {
      const res = await arenaApi.getEventDetail(eventId)
      setQuestions(res.data.data.questions)
      setTimeLeft(res.data.data.questions[0]?.timerSeconds || 15)
      setLoading(false)
    } catch (err) {
      Alert.alert('Error', 'Could not load the Arena game.')
      router.back()
    }
  }

  function handleAnswer(idx: number) {
    if (hasAnswered) return
    setSelectedIdx(idx)
    setHasAnswered(true)

    const question = questions[currentIndex]

    arenaApi.submitAnswer({
      eventId,
      questionId: question.id,
      selectedOption: idx,
      timeSpentSeconds: 15 - timeLeft
    }).then(res => {
      if (res.data.data.isCorrect) {
        setScore(prev => prev + 100)
      }
      setTimeout(handleNextQuestion, 1000)
    })
  }

  function handleNextQuestion() {
    setSelectedIdx(null)
    setHasAnswered(false)
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setTimeLeft(questions[currentIndex + 1].timerSeconds)
    } else {
      setIsGameOver(true)
    }
  }

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
      </View>
    )
  }

  const currentQ = questions[currentIndex]

  if (isGameOver) {
    return (
      <View style={s.container}>
        <View style={s.resultCard}>
          <Ionicons name="trophy" size={80} color="#FFD700" />
          <Text style={s.resultTitle}>Arena Complete!</Text>
          <Text style={s.resultScore}>{score} Points</Text>
          <Text style={s.resultSub}>Your score has been recorded. Check the live leaderboard to see your rank!</Text>
          <TouchableOpacity style={s.doneBtn} onPress={() => router.replace('/(tabs)/dashboard')}>
            <Text style={s.doneBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.statBox}>
          <Text style={s.statLabel}>Score</Text>
          <Text style={s.statValue}>{score}</Text>
        </View>
        <View style={s.timerCircle}>
          <Text style={[s.timerText, timeLeft <= 5 && { color: '#FF4C4C' }]}>{timeLeft}</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statLabel}>Question</Text>
          <Text style={s.statValue}>{currentIndex + 1}/{questions.length}</Text>
        </View>
      </View>

      <View style={s.qCard}>
        <Text style={s.qText}>{currentQ.questionText}</Text>
      </View>

      <View style={s.optionsRegion}>
        {currentQ.options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={[
              s.optionBtn,
              selectedIdx === i && { borderColor: theme.primaryColor, backgroundColor: theme.primaryColor + '10' }
            ]}
            onPress={() => handleAnswer(i)}
            disabled={hasAnswered}
          >
            <View style={[s.optionCircle, selectedIdx === i && { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor }]}>
              <Text style={[s.optionLetter, selectedIdx === i && { color: '#fff' }]}>{String.fromCharCode(65 + i)}</Text>
            </View>
            <Text style={s.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.footer}>
        <Ionicons name="shield-checkmark" size={16} color={textSecondary} />
        <Text style={s.footerText}>Fame Arena Live · IQ Blitz</Text>
      </View>
    </View>
  )
}

const makeStyles = (theme: any, surface: string, textPrimary: string, textSecondary: string, insets: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fe', padding: 24, paddingTop: insets.top + 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 10, color: textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: textPrimary },
  timerCircle: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 4, borderColor: theme.primaryColor + '20',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  timerText: { fontSize: 24, fontWeight: '800', color: theme.primaryColor },
  qCard: {
    backgroundColor: '#fff', padding: 32, borderRadius: 24,
    minHeight: 180, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 5,
    marginBottom: 32,
  },
  qText: { fontSize: 22, fontWeight: '700', color: textPrimary, textAlign: 'center', lineHeight: 32 },
  optionsRegion: { gap: 16 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', padding: 18,
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 2, borderColor: '#eee',
  },
  optionCircle: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: '#eee',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 16,
  },
  optionLetter: { fontSize: 14, fontWeight: '700', color: textSecondary },
  optionText: { fontSize: 16, fontWeight: '600', color: textPrimary },
  footer: { marginTop: 'auto', flexDirection: 'row', gap: 6, justifyContent: 'center', opacity: 0.5 },
  footerText: { fontSize: 12, color: textSecondary, fontWeight: '500' },
  resultCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  resultTitle: { fontSize: 28, fontWeight: '800', color: textPrimary },
  resultScore: { fontSize: 56, fontWeight: '900', color: theme.primaryColor },
  resultSub: { fontSize: 14, color: textSecondary, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
  doneBtn: { backgroundColor: theme.primaryColor, paddingVertical: 18, paddingHorizontal: 40, borderRadius: 100, marginTop: 20 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
