import { Redirect } from 'expo-router'
import { useAuth } from '../src/context/AuthContext'
import { LoadingState, Screen } from '../src/components/ui'

export default function Index() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState label="A preparar a VClass…" />
      </Screen>
    )
  }

  if (!user) return <Redirect href="/(auth)/login" />
  if (user.role === 'teacher') return <Redirect href="/(teacher)/(tabs)/dashboard" />
  if (user.role === 'student') return <Redirect href="/(student)/(tabs)/dashboard" />

  // Papéis de staff (admin/editor/país/financeiro/moderador/suporte) não têm
  // painel mobile — este app cobre apenas Estudante e Professor (ver README).
  return <Redirect href="/(auth)/staff-unsupported" />
}
