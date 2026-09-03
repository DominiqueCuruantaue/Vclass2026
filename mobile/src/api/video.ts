import { apiRequest, API_BASE_URL } from './client'
import type { VideoTokenResponse, VideoStreamResponse } from '@shared/types'

export async function getVideoStreamUrl(lessonId: string, videoId: string): Promise<{ url: string; expiresAt: string }> {
  const tokenData = await apiRequest<VideoTokenResponse>('/api/video/token', {
    method: 'POST',
    body: { lessonId, videoId },
  })

  const streamData = await apiRequest<VideoStreamResponse>(
    `/api/video/stream/${lessonId}?vt=${encodeURIComponent(tokenData.token)}`
  )

  // streamUrl é relativo ao backend (proxy HLS) — resolver para absoluto.
  const url = streamData.streamUrl.startsWith('http') ? streamData.streamUrl : `${API_BASE_URL}${streamData.streamUrl}`
  return { url, expiresAt: streamData.expiresAt }
}

export function reportVideoProgress(lessonId: string, position: number, duration: number, percent: number) {
  return apiRequest(`/api/video/${lessonId}/progress`, {
    method: 'POST',
    body: { position, duration, percent },
  })
}

export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export type VideoHeartbeatEventType = 'play' | 'heartbeat' | 'pause' | 'seek' | 'resume' | 'ended'

// Fundação do Teacher Earnings V1 (Política de Remuneração e Comissões dos
// Professores, Art. 6-13) — fonte financeira server-side da classificação
// VQ-R/VQ-P/VQ-B/VQ-NR/VNQ. Distinto de reportVideoProgress acima, que só
// serve para UX ("continuar de onde ficou").
export function reportVideoHeartbeat(
  lessonId: string,
  params: {
    sessionToken: string
    eventType: VideoHeartbeatEventType
    positionSeconds: number
    deltaSeconds: number
  }
) {
  return apiRequest(`/api/video/${lessonId}/heartbeat`, {
    method: 'POST',
    body: { ...params, eventId: uuidv4() },
  })
}
