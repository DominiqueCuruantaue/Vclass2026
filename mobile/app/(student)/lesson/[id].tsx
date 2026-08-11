import React, { useEffect, useRef, useState } from 'react'
import { Dimensions, Text, TouchableOpacity, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useEvent } from 'expo'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Badge, Card, ErrorState, H2, LoadingState, Muted, Screen } from '../../../src/components/ui'
import { colors, radius } from '../../../src/theme/colors'
import { fetchLesson } from '../../../src/api/curriculum'
import { getVideoStreamUrl, reportVideoProgress } from '../../../src/api/video'
import { fetchExercises, submitAnswer, type SubmitAnswerResult } from '../../../src/api/exercises'
import { ApiError } from '../../../src/api/client'
import type { Exercise, Lesson } from '@shared/types'

const { width } = Dimensions.get('window')
const VIDEO_HEIGHT = (width * 9) / 16

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const player = useVideoPlayer(streamUrl ?? '', (p) => {
    p.timeUpdateEventInterval = 15
  })

  const lastReport = useRef(0)
  useEvent(player, 'timeUpdate', { currentTime: 0, bufferedPosition: 0 } as any)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const lessonData = await fetchLesson(id)
        setLesson(lessonData)

        if (lessonData.video_id) {
          try {
            const stream = await getVideoStreamUrl(lessonData.id, lessonData.video_id)
            setStreamUrl(stream.url)
          } catch {
            // Bunny pode não estar configurado em dev — segue sem vídeo
          }
        }

        const ex = await fetchExercises(id)
        setExercises(ex)
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Não foi possível carregar a lição.')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  // Reporta progresso periodicamente enquanto o vídeo está a tocar
  useEffect(() => {
    if (!streamUrl || !id) return
    const interval = setInterval(() => {
      const cur = player.currentTime
      const dur = player.duration
      if (dur > 0 && cur !== lastReport.current) {
        lastReport.current = cur
        const percent = Math.min(100, Math.round((cur / dur) * 100))
        reportVideoProgress(id, cur, dur, percent).catch(() => {})
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [streamUrl, id, player])

  if (loading) return <Screen><LoadingState label="A preparar a aula…" /></Screen>
  if (error) return <Screen><ErrorState message={error} /></Screen>
  if (!lesson) return <Screen><ErrorState message="Lição não encontrada." /></Screen>

  return (
    <Screen scroll style={{ padding: 0 }}>
      {streamUrl ? (
        <VideoView
          style={{ width, height: VIDEO_HEIGHT, backgroundColor: '#000' }}
          player={player}
          nativeControls
        />
      ) : (
        <View style={{ width, height: VIDEO_HEIGHT, backgroundColor: colors.navy950, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 32 }}>🎬</Text>
          <Text style={{ color: colors.textFaint, marginTop: 8 }}>Vídeo indisponível de momento</Text>
        </View>
      )}

      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy950, marginBottom: 6 }}>{lesson.title}</Text>
        {lesson.description ? <Muted style={{ marginBottom: 16 }}>{lesson.description}</Muted> : null}

        {exercises.length > 0 ? (
          <>
            <H2>Exercícios</H2>
            {exercises.map((ex) => (
              <ExerciseCard key={ex.id} exercise={ex} />
            ))}
          </>
        ) : null}
      </View>
    </Screen>
  )
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<SubmitAnswerResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSelect(optionId: string) {
    if (result) return
    setSelected(optionId)
    setSubmitting(true)
    try {
      const res = await submitAnswer({ exercise_id: exercise.id, selected_option_id: optionId })
      setResult(res)
    } catch {
      // silencioso — permite tentar novamente
      setSelected(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 12 }}>{exercise.question}</Text>
      {(exercise.options ?? []).map((opt) => {
        const isSelected = selected === opt.id
        const isCorrectOption = result?.correctAnswer?.id === opt.id
        let bg: string = colors.surface
        let border: string = colors.border
        if (result) {
          if (isCorrectOption) {
            bg = colors.brand50
            border = colors.brand600
          } else if (isSelected) {
            bg = '#fef2f2'
            border = colors.danger
          }
        } else if (isSelected) {
          border = colors.brand600
        }
        return (
          <TouchableOpacity key={opt.id} onPress={() => handleSelect(opt.id)} disabled={!!result || submitting}>
            <View
              style={{
                borderWidth: 1.5,
                borderColor: border,
                backgroundColor: bg,
                borderRadius: radius.md,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: colors.text }}>{opt.option_text}</Text>
            </View>
          </TouchableOpacity>
        )
      })}
      {result ? (
        <View style={{ marginTop: 4 }}>
          <Badge text={result.is_correct ? 'Correto! 🎉' : 'Incorreto'} tone={result.is_correct ? 'success' : 'danger'} />
          {exercise.explanation ? <Muted style={{ marginTop: 8 }}>{exercise.explanation}</Muted> : null}
        </View>
      ) : null}
    </Card>
  )
}
