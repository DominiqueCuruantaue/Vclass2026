import React, { useState } from 'react'
import { Text, View } from 'react-native'
import { useAuth } from '../../src/context/AuthContext'
import { Button, ChipSelect, Field, H1, H2, Muted, Screen } from '../../src/components/ui'
import { colors } from '../../src/theme/colors'
import { createTicket, TICKET_CATEGORIES } from '../../src/api/support'
import { ApiError } from '../../src/api/client'

export default function HelpScreen() {
  const { user } = useAuth()
  const [category, setCategory] = useState<string>('other')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit() {
    setError('')
    setResult('')
    if (message.trim().length < 5) return setError('Descreve o problema com mais detalhe.')
    setLoading(true)
    try {
      await createTicket({
        category,
        message: message.trim(),
        name: user ? undefined : 'Visitante',
        email: user ? undefined : 'visitante@vclass.mz',
      })
      setResult('Pedido enviado! A nossa equipa vai responder em breve.')
      setMessage('')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível enviar o pedido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <H1>Ajuda e suporte</H1>
      <Muted style={{ marginBottom: 16 }}>Descreve o teu problema e a nossa equipa entra em contacto.</Muted>

      <H2>Categoria</H2>
      <ChipSelect
        options={TICKET_CATEGORIES.map((c) => c.id)}
        value={category}
        onChange={setCategory}
        labels={Object.fromEntries(TICKET_CATEGORIES.map((c) => [c.id, c.label]))}
      />

      <View style={{ height: 16 }} />
      <Field
        label="Mensagem"
        placeholder="Descreve o que aconteceu…"
        multiline
        numberOfLines={5}
        style={{ minHeight: 100, textAlignVertical: 'top' }}
        value={message}
        onChangeText={setMessage}
      />

      {error ? <Text style={{ color: colors.danger, marginBottom: 12, fontSize: 13 }}>{error}</Text> : null}
      {result ? <Text style={{ color: colors.brand700, marginBottom: 12, fontSize: 13, fontWeight: '600' }}>{result}</Text> : null}

      <Button title="Enviar pedido" onPress={handleSubmit} loading={loading} />
    </Screen>
  )
}
