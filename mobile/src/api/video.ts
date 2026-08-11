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
