import { Redirect, Stack } from 'expo-router'
import { useAuth } from '../../src/context/AuthContext'
import { LoadingState, Screen } from '../../src/components/ui'
import { colors } from '../../src/theme/colors'

export default function TeacherLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState />
      </Screen>
    )
  }
  if (!user) return <Redirect href="/(auth)/login" />
  if (user.role !== 'teacher') return <Redirect href="/" />

  return (
    <Stack screenOptions={{ headerShown: true, headerStyle: { backgroundColor: colors.bg }, headerShadowVisible: false, headerTintColor: colors.text }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="lesson/[id]" options={{ title: 'Editor de Lição' }} />
      <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
    </Stack>
  )
}
