import React, { useCallback, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import {
  Badge,
  Button,
  Card,
  ChipSelect,
  EmptyState,
  ErrorState,
  Field,
  H1,
  LoadingState,
  Muted,
  Screen,
} from '../../../src/components/ui'
import { colors } from '../../../src/theme/colors'
import {
  fetchCreatorLessons,
  fetchCreatorChapters,
  createChapter,
  type CreatorLessonListItem,
  type CreatorChapter,
} from '../../../src/api/creator'
import { ApiError } from '../../../src/api/client'

const STATUS_LABELS: Record<string, string> = {
  all: 'Todas',
  draft: 'Rascunho',
  pending_review: 'Em revisão',
  published: 'Publicada',
}

const STATUS_TONE: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
  draft: 'default',
  pending_review: 'warning',
  published: 'success',
  archived: 'default',
}

export default function ContentScreen() {
  const router = useRouter()
  const [view, setView] = useState<'lessons' | 'chapters'>('lessons')

  const [lessons, setLessons] = useState<CreatorLessonListItem[]>([])
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')

  const [chapters, setChapters] = useState<CreatorChapter[]>([])
  const [showChapterForm, setShowChapterForm] = useState(false)
  const [chapterTitle, setChapterTitle] = useState('')
  const [creatingChapter, setCreatingChapter] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [lessonsRes, chaptersRes] = await Promise.all([
        fetchCreatorLessons({ status: status === 'all' ? undefined : status, q: search || undefined }),
        fetchCreatorChapters(),
      ])
      setLessons(lessonsRes)
      setChapters(chaptersRes)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar os conteúdos.')
    } finally {
      setLoading(false)
    }
  }, [status, search])

  useFocusEffect(useCallback(() => { load() }, [load]))

  async function handleCreateChapter() {
    if (chapterTitle.trim().length < 2) return
    setCreatingChapter(true)
    try {
      await createChapter({ title: chapterTitle.trim() })
      setChapterTitle('')
      setShowChapterForm(false)
      load()
    } catch (e) {
      // erro silencioso — o utilizador pode tentar de novo
    } finally {
      setCreatingChapter(false)
    }
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <H1>Conteúdos</H1>
        {view === 'lessons' ? (
          <Button title="+ Aula" onPress={() => router.push('/(teacher)/lesson/new')} style={{ paddingHorizontal: 16, paddingVertical: 10 }} />
        ) : null}
      </View>

      <ChipSelect
        options={['lessons', 'chapters']}
        value={view}
        onChange={setView}
        labels={{ lessons: 'Lições', chapters: 'Capítulos' }}
      />
      <View style={{ height: 16 }} />

      {view === 'lessons' ? (
        <>
          <Field placeholder="Pesquisar lições…" value={search} onChangeText={setSearch} />
          <ChipSelect
            options={['all', 'draft', 'pending_review', 'published']}
            value={status}
            onChange={setStatus}
            labels={STATUS_LABELS}
          />
          <View style={{ height: 12 }} />

          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : lessons.length === 0 ? (
            <EmptyState icon="🎬" title="Ainda não tens lições" subtitle="Toca em + Aula para criar a primeira." />
          ) : (
            lessons.map((lesson) => (
              <TouchableOpacity key={lesson.id} onPress={() => router.push(`/(teacher)/lesson/${lesson.id}`)}>
                <Card>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontWeight: '700', color: colors.text, flex: 1 }}>{lesson.title}</Text>
                    <Badge text={STATUS_LABELS[lesson.status] || lesson.status} tone={STATUS_TONE[lesson.status] || 'default'} />
                  </View>
                  <Muted>{lesson.subject} · {lesson.chapter}</Muted>
                  <Muted>{lesson.views} visualizações · {lesson.access === 'free' ? 'Grátis' : 'Premium'}</Muted>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </>
      ) : (
        <>
          {showChapterForm ? (
            <Card>
              <Field label="Título do capítulo" value={chapterTitle} onChangeText={setChapterTitle} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button title="Criar" onPress={handleCreateChapter} loading={creatingChapter} style={{ flex: 1 }} />
                <Button title="Cancelar" variant="outline" onPress={() => setShowChapterForm(false)} style={{ flex: 1 }} />
              </View>
            </Card>
          ) : (
            <Button title="+ Novo capítulo" variant="outline" onPress={() => setShowChapterForm(true)} />
          )}
          <View style={{ height: 12 }} />

          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : chapters.length === 0 ? (
            <EmptyState icon="📖" title="Ainda não tens capítulos" />
          ) : (
            chapters.map((ch) => (
              <Card key={ch.id}>
                <Text style={{ fontWeight: '700', color: colors.text }}>{ch.title}</Text>
                {ch.description ? <Muted>{ch.description}</Muted> : null}
              </Card>
            ))
          )}
        </>
      )}
    </Screen>
  )
}
