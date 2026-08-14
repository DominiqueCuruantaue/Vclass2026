import React, { useCallback, useEffect, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { ChipSelect, EmptyState, ErrorState, Card, Field, H1, LoadingState, Muted, Screen, SubjectDot } from '../../../src/components/ui'
import { colors, FALLBACK_SUBJECT_COLOR } from '../../../src/theme/colors'
import { fetchLibrary, type LibraryItem } from '../../../src/api/library'
import { ApiError } from '../../../src/api/client'

const CATEGORIES = [
  { id: 'all', label: 'Tudo' },
  { id: 'books', label: 'Livros' },
  { id: 'handouts', label: 'Apostilas' },
  { id: 'exercises', label: 'Exercícios' },
] as const

export default function LibraryScreen() {
  const router = useRouter()
  const [items, setItems] = useState<LibraryItem[]>([])
  const [category, setCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchLibrary({ category: category === 'all' ? undefined : category, q: search || undefined })
      setItems(res.books)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar a biblioteca.')
    } finally {
      setLoading(false)
    }
  }, [category, search])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  return (
    <Screen>
      <H1>Biblioteca</H1>
      <Field placeholder="Pesquisar…" value={search} onChangeText={setSearch} style={{ marginTop: 12 }} />
      <ChipSelect
        options={CATEGORIES.map((c) => c.id)}
        value={category}
        onChange={setCategory}
        labels={Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]))}
      />
      <View style={{ height: 16 }} />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState icon="📚" title="Nada encontrado" subtitle="Tenta outra categoria ou pesquisa." />
      ) : (
        items.map((item) => (
          <TouchableOpacity key={item.id} onPress={() => router.push(`/(student)/library/${item.id}`)}>
            <Card
              style={{
                flexDirection: 'row',
                gap: 12,
                alignItems: 'center',
                borderLeftWidth: 4,
                borderLeftColor: item.subjects?.color || FALLBACK_SUBJECT_COLOR,
              }}
            >
              <SubjectDot color={item.subjects?.color} label={item.subjects?.name || item.title} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.text }}>{item.title}</Text>
                {item.subjects?.name ? <Muted>{item.subjects.name}</Muted> : item.author ? <Muted>{item.author}</Muted> : null}
                <Muted style={{ marginTop: 4 }}>{item.downloads_count} downloads</Muted>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </Screen>
  )
}
