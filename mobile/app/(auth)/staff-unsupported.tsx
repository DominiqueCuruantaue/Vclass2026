import React from 'react'
import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../src/context/AuthContext'
import { Button, H1, Muted, Screen } from '../../src/components/ui'

export default function StaffUnsupportedScreen() {
  const { user, logout } = useAuth()

  async function handleLogout() {
    await logout()
    router.replace('/(auth)/login')
  }

  return (
    <Screen scroll={false} style={{ justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>💻</Text>
        <H1>Este papel usa a versão web</H1>
        <Muted style={{ textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
          A app mobile da VClass cobre, por agora, apenas os perfis Estudante e Professor.{'\n'}
          A tua conta ({user?.role}) tem painel próprio na versão web da plataforma.
        </Muted>
        <Button title="Terminar sessão" onPress={handleLogout} variant="outline" />
      </View>
    </Screen>
  )
}
