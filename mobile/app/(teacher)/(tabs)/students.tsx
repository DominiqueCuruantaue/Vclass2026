import React, { useCallback, useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Card, EmptyState, ErrorState, Field, H1, LoadingState, Muted, ProgressBar, Screen } from '../../../src/components/ui'
import { colors } from '../../../src/theme/colors'
import { fetchCreatorStudents, type CreatorStudent } from '../../../src/api/creator'
import { ApiError } from '../../../src/api/client'

export default function TeacherStudentsScreen() {
  const [students, setStudents] = useState<CreatorStudent[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchCreatorStudents({ q: search || undefined })
      setStudents(data)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar os alunos.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useFocusEffect(useCallback(() => { load() }, [load]))
  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search])

  return (
    <Screen>
      <H1>Alunos</H1>
      <Field placeholder="Pesquisar aluno…" value={search} onChangeText={setSearch} style={{ marginTop: 12, marginBottom: 12 }} />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : students.length === 0 ? (
        <EmptyState icon="🎓" title="Sem alunos ainda" subtitle="Os alunos que assistirem às tuas aulas aparecem aqui." />
      ) : (
        students.map((s) => (
          <Card key={s.user_id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontWeight: '700', color: colors.text }}>{s.full_name}</Text>
              <Muted>{s.last_active}</Muted>
            </View>
            <Muted style={{ marginBottom: 8 }}>{s.email}</Muted>
            <ProgressBar percent={s.progress_percent} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Muted>{s.lessons_done} lições concluídas</Muted>
              <Muted>Nota média: {s.score}%</Muted>
            </View>
          </Card>
        ))
      )}
    </Screen>
  )
}
