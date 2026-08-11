import { Redirect, Stack } from 'expo-router'
import { useAuth } from '../../src/context/AuthContext'
import { LoadingState, Screen } from '../../src/components/ui'
import { colors } from '../../src/theme/colors'

export default function StudentLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState />
      </Screen>
    )
  }
  if (!user) return <Redirect href="/(auth)/login" />
  if (user.role !== 'student') return <Redirect href="/" />

  return (
    <Stack screenOptions={{ headerShown: true, headerStyle: { backgroundColor: colors.bg }, headerShadowVisible: false, headerTintColor: colors.text }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="lesson/[id]" options={{ title: 'Aula' }} />
      <Stack.Screen name="library/[id]" options={{ title: 'Material' }} />
      <Stack.Screen name="profile/plans" options={{ title: 'Planos' }} />
      <Stack.Screen name="profile/edit" options={{ title: 'Editar perfil' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notificações' }} />
      <Stack.Screen name="help" options={{ title: 'Ajuda' }} />
      <Stack.Screen name="achievements" options={{ title: 'Conquistas' }} />
    </Stack>
  )
}
