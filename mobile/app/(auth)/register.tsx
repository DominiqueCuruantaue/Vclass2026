import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { Link, router } from 'expo-router'
import { useAuth } from '../../src/context/AuthContext'
import { Button, ChipSelect, ErrorState, Field, H1, H2, LoadingState, Muted, PasswordField, Screen } from '../../src/components/ui'
import { ApiError } from '../../src/api/client'
import { fetchCountries, fetchCountryLevels, type CurriculumCountry, type CurriculumGrade } from '../../src/api/curriculum'
import { colors } from '../../src/theme/colors'

export default function RegisterScreen() {
  const { registerStudent } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [countries, setCountries] = useState<CurriculumCountry[]>([])
  const [countriesLoading, setCountriesLoading] = useState(true)
  const [countriesError, setCountriesError] = useState('')
  const [countryCode, setCountryCode] = useState<string>()
  const [grades, setGrades] = useState<CurriculumGrade[]>([])
  const [gradeId, setGradeId] = useState<string>()
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [gradesError, setGradesError] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadCountries = () => {
    setCountriesLoading(true)
    setCountriesError('')
    fetchCountries()
      .then(setCountries)
      .catch((e) => setCountriesError(e instanceof ApiError ? e.message : 'Não foi possível carregar a lista de países.'))
      .finally(() => setCountriesLoading(false))
  }

  useEffect(() => {
    loadCountries()
  }, [])

  const loadGrades = (code: string) => {
    setLoadingGrades(true)
    setGradesError('')
    fetchCountryLevels(code)
      .then((res) => {
        const allGrades = res.curriculum.flatMap((level) => level.grades)
        setGrades(allGrades)
      })
      .catch((e) => {
        setGrades([])
        setGradesError(e instanceof ApiError ? e.message : 'Não foi possível carregar as classes.')
      })
      .finally(() => setLoadingGrades(false))
  }

  useEffect(() => {
    if (!countryCode) return
    setGradeId(undefined)
    loadGrades(countryCode)
  }, [countryCode])

  async function handleSubmit() {
    setError('')
    if (!fullName.trim() || fullName.trim().length < 3) return setError('Indica o teu nome completo.')
    if (!email.trim()) return setError('Indica o teu email.')
    if (password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.')
    if (password !== confirmPassword) return setError('As senhas não coincidem.')

    setLoading(true)
    try {
      await registerStudent({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        role: 'student',
        phone: phone.trim() || undefined,
        country_code: countryCode,
        grade_id: gradeId,
      })
      router.replace('/')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível criar a conta. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <View style={{ marginTop: 16, marginBottom: 24 }}>
        <H1>Criar conta de estudante</H1>
        <Muted>Começa a aprender hoje — é grátis para começar.</Muted>
      </View>

      <Field label="Nome completo" placeholder="O teu nome" value={fullName} onChangeText={setFullName} />
      <Field
        label="Email"
        placeholder="teu@email.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Field label="Telefone (opcional)" placeholder="+258…" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <PasswordField label="Senha" placeholder="Mínimo 8 caracteres" value={password} onChangeText={setPassword} />
      <PasswordField label="Confirmar senha" placeholder="Repete a senha" value={confirmPassword} onChangeText={setConfirmPassword} />

      <H2>País</H2>
      {countriesLoading ? (
        <LoadingState label="A carregar países…" />
      ) : countriesError ? (
        <ErrorState message={countriesError} onRetry={loadCountries} />
      ) : (
        <ChipSelect
          options={countries.map((c) => c.id)}
          value={countryCode}
          onChange={setCountryCode}
          labels={Object.fromEntries(countries.map((c) => [c.id, `${c.flag} ${c.name}`]))}
        />
      )}

      {countryCode ? (
        <View style={{ marginTop: 16 }}>
          <H2>Classe / Ano</H2>
          {loadingGrades ? (
            <Muted>A carregar classes…</Muted>
          ) : gradesError ? (
            <ErrorState message={gradesError} onRetry={() => loadGrades(countryCode)} />
          ) : (
            <ChipSelect
              options={grades.map((g) => g.id)}
              value={gradeId}
              onChange={setGradeId}
              labels={Object.fromEntries(grades.map((g) => [g.id, g.name]))}
            />
          )}
        </View>
      ) : null}

      {error ? <Text style={{ color: colors.danger, marginTop: 16, fontSize: 13 }}>{error}</Text> : null}

      <View style={{ marginTop: 20 }}>
        <Button title="Criar conta" onPress={handleSubmit} loading={loading} />
      </View>

      <View style={{ marginTop: 20, alignItems: 'center' }}>
        <Link href="/(auth)/login" style={{ color: colors.brand600, fontWeight: '600' }}>
          Já tens conta? Entra
        </Link>
      </View>
    </Screen>
  )
}
