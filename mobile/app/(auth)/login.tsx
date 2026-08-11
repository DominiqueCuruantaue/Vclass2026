import React, { useState } from 'react'
import { Image, Text, View } from 'react-native'
import { Link, router } from 'expo-router'
import { useAuth } from '../../src/context/AuthContext'
import { Button, Field, H1, Muted, PasswordField, Screen } from '../../src/components/ui'
import { ApiError } from '../../src/api/client'
import { colors } from '../../src/theme/colors'

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError('')
    if (!email.trim() || !password) {
      setError('Preenche o email e a senha.')
      return
    }
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
      router.replace('/')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível entrar. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginTop: 32, marginBottom: 32 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: colors.navy950,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Text style={{ color: colors.brand500, fontWeight: '900', fontSize: 26 }}>V</Text>
        </View>
        <H1>Bem-vindo de volta</H1>
        <Muted>Entra na tua conta VClass</Muted>
      </View>

      <Field
        label="Email"
        placeholder="teu@email.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <PasswordField label="Senha" placeholder="A tua senha" value={password} onChangeText={setPassword} />

      {error ? (
        <Text style={{ color: colors.danger, marginBottom: 12, fontSize: 13 }}>{error}</Text>
      ) : null}

      <Button title="Entrar" onPress={handleSubmit} loading={loading} />

      <View style={{ marginTop: 24, alignItems: 'center', gap: 8 }}>
        <Link href="/(auth)/register" style={{ color: colors.brand600, fontWeight: '600' }}>
          Ainda não tens conta? Regista-te como estudante
        </Link>
        <Link href="/(auth)/register-teacher" style={{ color: colors.textMuted, fontWeight: '600' }}>
          És professor? Candidata-te aqui
        </Link>
      </View>
    </Screen>
  )
}
