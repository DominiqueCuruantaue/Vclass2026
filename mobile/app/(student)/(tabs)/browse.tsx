import React, { useEffect, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Badge, Card, EmptyState, ErrorState, H1, LoadingState, Muted, Screen } from '../../../src/components/ui'
import { colors } from '../../../src/theme/colors'
import {
  fetchContentCountries,
  fetchEducationSystems,
  fetchGrades,
  fetchSubjects,
  fetchChapters,
  fetchLessonsForChapter,
} from '../../../src/api/curriculum'
import { ApiError } from '../../../src/api/client'
import type { Chapter, Country, Lesson } from '@shared/types'

type Step = 'country' | 'system' | 'grade' | 'subject' | 'chapter' | 'lessons'

interface Crumb {
  step: Step
  id: string
  label: string
}

export default function BrowseScreen() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('country')
  const [path, setPath] = useState<Crumb[]>([])
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStep()
  }, [step, path.length])

  async function loadStep() {
    setLoading(true)
    setError('')
    try {
      let data: any[] = []
      if (step === 'country') {
        data = await fetchContentCountries()
      } else if (step === 'system') {
        data = await fetchEducationSystems(path[path.length - 1].id)
      } else if (step === 'grade') {
        data = await fetchGrades(path[path.length - 1].id)
      } else if (step === 'subject') {
        data = await fetchSubjects(path[path.length - 1].id)
      } else if (step === 'chapter') {
        data = await fetchChapters(path[path.length - 1].id)
      } else if (step === 'lessons') {
        data = await fetchLessonsForChapter(path[path.length - 1].id)
      }
      setItems(data)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar.')
    } finally {
      setLoading(false)
    }
  }

  function goInto(id: string, label: string) {
    const nextStep: Record<Step, Step> = {
      country: 'system',
      system: 'grade',
      grade: 'subject',
      subject: 'chapter',
      chapter: 'lessons',
      lessons: 'lessons',
    }
    setPath((p) => [...p, { step, id, label }])
    setStep(nextStep[step])
  }

  function goBack(index: number) {
    // index = -1 significa voltar à raiz (países)
    if (index < 0) {
      setPath([])
      setStep('country')
      return
    }
    const newPath = path.slice(0, index + 1)
    const nextStep: Record<Step, Step> = {
      country: 'system',
      system: 'grade',
      grade: 'subject',
      subject: 'chapter',
      chapter: 'lessons',
      lessons: 'lessons',
    }
    setPath(newPath)
    setStep(nextStep[newPath[newPath.length - 1].step])
  }

  function selectLesson(lesson: Lesson) {
    router.push(`/(student)/lesson/${lesson.id}`)
  }

  const itemIdKey = (item: any) => item.id || item.grade_subject_id
  const itemLabel = (item: any) => item.name || item.title

  return (
    <Screen>
      <H1>Explorar</H1>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginBottom: 16 }}>
        <Crumb label="Países" active={path.length === 0} onPress={() => goBack(-1)} />
        {path.map((c, i) => (
          <Crumb key={i} label={c.label} active={i === path.length - 1} onPress={() => goBack(i)} />
        ))}
      </View>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadStep} />
      ) : items.length === 0 ? (
        <EmptyState icon="📂" title="Nada por aqui ainda" subtitle="Experimenta outra opção." />
      ) : step === 'lessons' ? (
        (items as Lesson[]).map((lesson) => (
          <TouchableOpacity key={lesson.id} onPress={() => selectLesson(lesson)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.text }}>{lesson.title}</Text>
                {lesson.description ? <Muted numberOfLines={2}>{lesson.description}</Muted> : null}
              </View>
              {lesson.is_free ? <Badge text="Grátis" tone="success" /> : null}
            </Card>
          </TouchableOpacity>
        ))
      ) : (
        items.map((item) => (
          <TouchableOpacity key={itemIdKey(item)} onPress={() => goInto(itemIdKey(item), itemLabel(item))}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>
                {item.flag ? `${item.flag} ` : ''}
                {itemLabel(item)}
              </Text>
              <Text style={{ color: colors.textFaint }}>›</Text>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </Screen>
  )
}

function Crumb({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ marginRight: 6, marginBottom: 6 }}>
      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: active ? colors.navy950 : '#f1f5f9',
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#fff' : colors.textMuted }}>{label}</Text>
      </View>
    </TouchableOpacity>
  )
}
