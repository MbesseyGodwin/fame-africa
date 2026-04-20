import { Redirect } from 'expo-router'
import { useAuth } from '../src/context/AuthContext'

export default function RootIndex() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/" />
  }

  return <Redirect href="/(auth)/welcome" />
}
