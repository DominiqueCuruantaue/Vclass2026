import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'
// @ts-ignore — tus-js-client não publica tipos completos para o alvo React Native
import { Upload } from 'tus-js-client'
import {
  Badge,
  Button,
  Card,
  ChipSelect,
  Field,
  H2,
  LoadingState,
  Muted,
  ProgressBar,
  Screen,
} from '../../../src/components/ui'
import { colors, radius } from '../../../src/theme/colors'
import {
  fetchCreatorLesson,
  fetchCreatorChapters,
  createLesson,
  updateLesson,
  saveLessonExercises,
  requestVideoUploadUrl,
  fetchVideoStatus,
  type CreatorChapter,
  type CreatorExerciseDraft,
} from '../../../src/api/creator'
import { ApiError } from '../../../src/api/client'

type Tab = 'info' | 'video' | 'exercises' | 'resources' | 'publish'

interface ExerciseDraft {
  question: string
  explanation: string
  options: string[]
  correct: number
}

function emptyExercise(): ExerciseDraft {
  return { question: '', explanation: '', options: ['', '', '', ''], correct: 0 }
}

export default function LessonEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const isNew = id === 'new'

  const [tab, setTab] = useState<Tab>('info')
  const [loading, setLoading] = useState(!isNew)
  const [lessonId, setLessonId] = useState<string | null>(isNew ? null : id)

  // Info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [chapters, setChapters] = useState<CreatorChapter[]>([])
  const [chapterId, setChapterId] = useState<string>()
  const [isFree, setIsFree] = useState(false)

  // Vídeo
  const [videoId, setVideoId] = useState<string>()
  const [videoUrl, setVideoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoStatus, setVideoStatus] = useState<string>('')
  const uploadRef = useRef<any>(null)

  // Exercícios
  const [exercises, setExercises] = useState<ExerciseDraft[]>([])

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchCreatorChapters().then(setChapters).catch(() => setChapters([]))
  }, [])

  useEffect(() => {
    if (isNew) return
    fetchCreatorLesson(id)
      .then((lesson) => {
        setTitle(lesson.title)
        setDescription(lesson.description || '')
        setContent(lesson.content || '')
        setChapterId(lesson.chapter_id)
        setIsFree(lesson.is_free)
        setVideoId(lesson.video_id)
        setVideoUrl(lesson.video_url || '')
        setExercises(
          (lesson.exercises || []).map((ex: CreatorExerciseDraft) => ({
            question: ex.question,
            explanation: ex.explanation || '',
            options: ex.exercise_options.map((o) => o.option_text),
            correct: Math.max(0, ex.exercise_options.findIndex((o) => o.is_correct)),
          }))
        )
      })
      .catch(() => setMessage('Não foi possível carregar a lição.'))
      .finally(() => setLoading(false))
  }, [id])

  // Poll do estado de processamento do vídeo no Bunny
  useEffect(() => {
    if (!videoId || videoStatus === 'ready') return
    const interval = setInterval(async () => {
      try {
        const s = await fetchVideoStatus(videoId)
        setVideoStatus(s.ready ? 'ready' : s.status)
      } catch {}
    }, 8000)
    return () => clearInterval(interval)
  }, [videoId, videoStatus])

  async function handlePickVideo() {
    const result = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true })
    if (result.canceled || !result.assets?.[0]) return
    const file = result.assets[0]

    setUploading(true)
    setUploadProgress(0)
    setMessage('')
    try {
      const creds = await requestVideoUploadUrl(file.name, title || file.name)
      setVideoId(creds.videoId)
      setVideoStatus('processing')

      const upload = new Upload(
        { uri: file.uri, name: file.name, type: file.mimeType || 'video/mp4' },
        {
          endpoint: creds.upload.endpoint,
          headers: creds.upload.headers,
          metadata: creds.upload.metadata,
          chunkSize: 5 * 1024 * 1024,
          retryDelays: [0, 3000, 5000, 10000],
          onError: (err: Error) => {
            setUploading(false)
            setMessage(`Falha no upload do vídeo: ${err.message}`)
          },
          onProgress: (sent: number, total: number) => {
            setUploadProgress(Math.round((sent / total) * 100))
          },
          onSuccess: () => {
            setUploading(false)
            setUploadProgress(100)
            setMessage('Vídeo carregado! A processar no servidor de streaming…')
          },
        }
      )
      uploadRef.current = upload
      upload.start()
    } catch (e) {
      setUploading(false)
      setMessage(e instanceof ApiError ? e.message : 'Não foi possível iniciar o upload do vídeo.')
    }
  }

  function updateExercise(index: number, patch: Partial<ExerciseDraft>) {
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, ...patch } : ex)))
  }

  function updateOption(exIndex: number, optIndex: number, value: string) {
    setExercises((prev) =>
      prev.map((ex, i) => (i === exIndex ? { ...ex, options: ex.options.map((o, oi) => (oi === optIndex ? value : o)) } : ex))
    )
  }

  async function persistInfo(nextStatus?: 'draft' | 'published') {
    if (title.trim().length < 3) {
      setMessage('O título deve ter pelo menos 3 caracteres.')
      return null
    }
    if (!chapterId) {
      setMessage('Selecciona um capítulo.')
      return null
    }
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      content: content.trim() || undefined,
      chapter_id: chapterId,
      video_id: videoId,
      video_url: videoUrl.trim() || undefined,
      is_free: isFree,
      status: nextStatus,
    }
    setSaving(true)
    setMessage('')
    try {
      if (lessonId) {
        await updateLesson(lessonId, payload)
        return lessonId
      } else {
        const res = await createLesson(payload)
        setLessonId(res.id)
        router.setParams({ id: res.id })
        return res.id
      }
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : 'Não foi possível guardar a lição.')
      return null
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveDraft() {
    const savedId = await persistInfo('draft')
    if (savedId) setMessage('Rascunho guardado.')
  }

  async function handleSaveExercises() {
    if (!lessonId) {
      setMessage('Guarda primeiro a informação da lição (aba Info).')
      return
    }
    const invalid = exercises.some((ex) => ex.question.trim().length < 5 || ex.options.some((o) => !o.trim()))
    if (exercises.length > 0 && invalid) {
      setMessage('Preenche a pergunta e as 4 alternativas de cada exercício.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      await saveLessonExercises(
        lessonId,
        exercises.map((ex) => ({ question: ex.question.trim(), explanation: ex.explanation.trim(), options: ex.options, correct: ex.correct }))
      )
      setMessage('Exercícios guardados.')
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : 'Não foi possível guardar os exercícios.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    if (!videoId && !videoUrl.trim()) {
      setMessage('Adiciona um vídeo antes de publicar.')
      return
    }
    if (exercises.length === 0) {
      setMessage('Adiciona pelo menos 1 exercício antes de publicar.')
      return
    }
    const savedId = await persistInfo('published')
    if (savedId) {
      await saveLessonExercises(
        savedId,
        exercises.map((ex) => ({ question: ex.question.trim(), explanation: ex.explanation.trim(), options: ex.options, correct: ex.correct }))
      )
      setMessage('Enviada para revisão! Um editor vai analisar antes de ficar visível aos alunos.')
    }
  }

  if (loading) return <Screen><LoadingState /></Screen>

  const checklist = [
    { label: 'Título preenchido', done: title.trim().length >= 3 },
    { label: 'Capítulo seleccionado', done: !!chapterId },
    { label: 'Vídeo pronto', done: !!videoId || !!videoUrl.trim() },
    { label: 'Pelo menos 1 exercício', done: exercises.length > 0 },
  ]

  return (
    <Screen>
      <ChipSelect
        options={['info', 'video', 'exercises', 'resources', 'publish'] as Tab[]}
        value={tab}
        onChange={setTab}
        labels={{ info: 'Info', video: 'Vídeo', exercises: 'Exercícios', resources: 'Recursos', publish: 'Publicar' }}
      />
      <View style={{ height: 16 }} />

      {message ? (
        <Card style={{ backgroundColor: '#eff6ff', borderColor: colors.info }}>
          <Muted>{message}</Muted>
        </Card>
      ) : null}

      {tab === 'info' ? (
        <>
          <Field label="Título" value={title} onChangeText={setTitle} />
          <Field label="Descrição" multiline numberOfLines={3} style={{ minHeight: 70, textAlignVertical: 'top' }} value={description} onChangeText={setDescription} />
          <Field label="Notas / conteúdo (opcional)" multiline numberOfLines={4} style={{ minHeight: 90, textAlignVertical: 'top' }} value={content} onChangeText={setContent} />

          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 }}>Capítulo</Text>
          <ChipSelect
            options={chapters.map((c) => c.id)}
            value={chapterId}
            onChange={setChapterId}
            labels={Object.fromEntries(chapters.map((c) => [c.id, c.title]))}
          />
          <View style={{ height: 12 }} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 }}>Acesso</Text>
          <ChipSelect
            options={['free', 'premium']}
            value={isFree ? 'free' : 'premium'}
            onChange={(v) => setIsFree(v === 'free')}
            labels={{ free: 'Grátis', premium: 'Premium' }}
          />
          <View style={{ height: 20 }} />
          <Button title="Guardar rascunho" onPress={handleSaveDraft} loading={saving} />
        </>
      ) : null}

      {tab === 'video' ? (
        <>
          <Card>
            {videoId ? (
              <View style={{ marginBottom: 12 }}>
                <Badge text={videoStatus === 'ready' ? 'Pronto ✅' : 'A processar…'} tone={videoStatus === 'ready' ? 'success' : 'warning'} />
                <Muted style={{ marginTop: 6 }}>ID do vídeo: {videoId}</Muted>
              </View>
            ) : null}
            {uploading ? (
              <View style={{ marginBottom: 12 }}>
                <ProgressBar percent={uploadProgress} />
                <Muted style={{ marginTop: 6 }}>A carregar… {uploadProgress}%</Muted>
              </View>
            ) : null}
            <Button title={videoId ? 'Substituir vídeo' : 'Carregar vídeo'} onPress={handlePickVideo} loading={uploading} variant="outline" />
          </Card>
          <Text style={{ textAlign: 'center', color: colors.textFaint, marginVertical: 8 }}>ou, para testes locais</Text>
          <Field label="URL directo do vídeo (MP4/HLS)" autoCapitalize="none" value={videoUrl} onChangeText={setVideoUrl} />
          <Button title="Guardar" onPress={handleSaveDraft} loading={saving} />
        </>
      ) : null}

      {tab === 'exercises' ? (
        <>
          {exercises.map((ex, i) => (
            <Card key={i}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontWeight: '700', color: colors.text }}>Exercício {i + 1}</Text>
                <TouchableOpacity onPress={() => setExercises((prev) => prev.filter((_, idx) => idx !== i))}>
                  <Text style={{ color: colors.danger, fontWeight: '600' }}>Remover</Text>
                </TouchableOpacity>
              </View>
              <Field label="Pergunta" value={ex.question} onChangeText={(v) => updateExercise(i, { question: v })} />
              {ex.options.map((opt, oi) => (
                <TouchableOpacity key={oi} onPress={() => updateExercise(i, { correct: oi })}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1.5,
                      borderColor: ex.correct === oi ? colors.brand600 : colors.border,
                      borderRadius: radius.md,
                      marginBottom: 8,
                      paddingHorizontal: 10,
                    }}
                  >
                    <Text style={{ marginRight: 8 }}>{ex.correct === oi ? '✅' : '⬜️'}</Text>
                    <Field
                      placeholder={`Alternativa ${oi + 1}`}
                      value={opt}
                      onChangeText={(v) => updateOption(i, oi, v)}
                      style={{ flex: 1, marginBottom: 0, borderWidth: 0, paddingHorizontal: 0 }}
                    />
                  </View>
                </TouchableOpacity>
              ))}
              <Field label="Explicação (opcional)" value={ex.explanation} onChangeText={(v) => updateExercise(i, { explanation: v })} />
            </Card>
          ))}
          <Button title="+ Adicionar exercício" variant="outline" onPress={() => setExercises((prev) => [...prev, emptyExercise()])} />
          <View style={{ height: 12 }} />
          <Button title="Guardar exercícios" onPress={handleSaveExercises} loading={saving} />
        </>
      ) : null}

      {tab === 'resources' ? (
        <Card>
          <Muted>
            Os recursos complementares (PDFs e outros anexos) podem ser adicionados através da versão web do editor de
            lições — esta secção estará disponível em breve na app.
          </Muted>
        </Card>
      ) : null}

      {tab === 'publish' ? (
        <>
          <H2>Checklist de publicação</H2>
          <Card>
            {checklist.map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
                <Text style={{ marginRight: 8 }}>{item.done ? '✅' : '⬜️'}</Text>
                <Text style={{ color: item.done ? colors.text : colors.textMuted }}>{item.label}</Text>
              </View>
            ))}
          </Card>
          <Muted style={{ marginBottom: 16 }}>
            Ao publicar, a lição entra na fila de revisão de um editor — só fica visível aos alunos depois de aprovada.
          </Muted>
          <Button
            title="Publicar Lição Agora"
            onPress={handlePublish}
            loading={saving}
            disabled={!checklist.every((c) => c.done)}
          />
        </>
      ) : null}
    </Screen>
  )
}
