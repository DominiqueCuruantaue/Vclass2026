import React, { useEffect, useState } from 'react'
import { Linking, Text, TouchableOpacity, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Badge, Button, Card, ErrorState, H2, LoadingState, Muted, Screen, SubjectDot } from '../../../src/components/ui'
import { colors } from '../../../src/theme/colors'
import { fetchLibraryItem, registerLibraryDownload, type LibraryItem } from '../../../src/api/library'
import { ApiError } from '../../../src/api/client'

export default function LibraryItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [item, setItem] = useState<(LibraryItem & { related: LibraryItem[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    fetchLibraryItem(id)
      .then(setItem)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Material não encontrado.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleOpen() {
    if (!item) return
    registerLibraryDownload(item.id).catch(() => {})
    Linking.openURL(item.file_url).catch(() => {})
  }

  if (loading) return <Screen><LoadingState /></Screen>
  if (error || !item) return <Screen><ErrorState message={error || 'Erro'} /></Screen>

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <SubjectDot color={item.subjects?.color} label={item.subjects?.name || item.title} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy950 }}>{item.title}</Text>
          {item.subjects?.name ? <Muted>{item.subjects.name}</Muted> : null}
          {item.author ? <Muted>Por {item.author}</Muted> : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {item.pages ? <Badge text={`${item.pages} páginas`} /> : null}
        {item.file_size_kb ? <Badge text={`${Math.round(item.file_size_kb / 1024)} MB`} /> : null}
        <Badge text={`${item.downloads_count} downloads`} tone="info" />
      </View>

      {item.description ? (
        <Card>
          <Muted>{item.description}</Muted>
        </Card>
      ) : null}

      <Button title="Abrir / Descarregar" onPress={handleOpen} />

      {item.related?.length ? (
        <>
          <View style={{ height: 20 }} />
          <H2>Relacionados</H2>
          {item.related.map((r) => (
            <TouchableOpacity key={r.id} onPress={() => router.push(`/(student)/library/${r.id}`)}>
              <Card>
                <Text style={{ fontWeight: '600', color: colors.text }}>{r.title}</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </>
      ) : null}
    </Screen>
  )
}
