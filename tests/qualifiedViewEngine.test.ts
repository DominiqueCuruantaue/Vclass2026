import { describe, it, expect } from 'vitest'
import { classifyConsumption, resolveViewClassification } from '../src/services/qualifiedViewEngine'

describe('classifyConsumption — limiares de qualificação (Art. 7)', () => {
  it('aula de 4 min (240s): 59% não qualifica, 60% qualifica', () => {
    const duration = 240
    const at59 = Math.floor(duration * 0.59)
    const at60 = Math.ceil(duration * 0.60)
    expect(classifyConsumption(duration, at59).qualifies).toBe(false)
    expect(classifyConsumption(duration, at60).qualifies).toBe(true)
  })

  it('aula de 10 min (600s): 39% não qualifica, 40% qualifica', () => {
    const duration = 600
    const at39 = Math.floor(duration * 0.39)
    const at40 = Math.ceil(duration * 0.40)
    expect(classifyConsumption(duration, at39).qualifies).toBe(false)
    expect(classifyConsumption(duration, at40).qualifies).toBe(true)
  })

  it('aula de 20 min (1200s): 4m59s não qualifica, 5min qualifica (limiar fixo, não percentual)', () => {
    const duration = 1200
    expect(classifyConsumption(duration, 299).qualifies).toBe(false)
    expect(classifyConsumption(duration, 300).qualifies).toBe(true)
  })

  it('aula exactamente nos 5 minutos (300s, fronteira do primeiro escalão): usa regra <=5min → 60%', () => {
    const result = classifyConsumption(300, 180)
    expect(result.thresholdRequiredSeconds).toBe(180)
    expect(result.qualifies).toBe(true)
  })

  it('aula exactamente nos 15 minutos (900s, fronteira do segundo escalão): usa regra <=15min → 40%', () => {
    const result = classifyConsumption(900, 360)
    expect(result.thresholdRequiredSeconds).toBe(360)
    expect(result.qualifies).toBe(true)
  })

  it('aula sem duração registada (0 ou negativa) nunca qualifica', () => {
    expect(classifyConsumption(0, 999).qualifies).toBe(false)
    expect(classifyConsumption(-10, 999).qualifies).toBe(false)
  })

  it('mera abertura (0s assistidos) nunca qualifica', () => {
    expect(classifyConsumption(600, 0).qualifies).toBe(false)
  })
})

describe('resolveViewClassification — classificação final de 5 vias (Art. 6)', () => {
  const qualifiedConsumption = { qualifies: true, thresholdRequiredSeconds: 100 }
  const notQualifiedConsumption = { qualifies: false, thresholdRequiredSeconds: 100 }

  it('consumo insuficiente → VNQ, independentemente de tudo o resto', () => {
    const result = resolveViewClassification(
      notQualifiedConsumption,
      { lessonIsFree: false, hasEligibleFunding: true },
      { remunerableCountInWindow: 0 }
    )
    expect(result.classification).toBe('VNQ')
  })

  it('aula gratuita/preview qualificada → VQ-P, mesmo com subscrição paga', () => {
    const result = resolveViewClassification(
      qualifiedConsumption,
      { lessonIsFree: true, hasEligibleFunding: true },
      { remunerableCountInWindow: 0 }
    )
    expect(result.classification).toBe('VQ-P')
  })

  it('sem fonte financeira elegível → VQ-NR / INELIGIBLE_ACCESS', () => {
    const result = resolveViewClassification(
      qualifiedConsumption,
      { lessonIsFree: false, hasEligibleFunding: false },
      { remunerableCountInWindow: 0 }
    )
    expect(result).toEqual({ classification: 'VQ-NR', reasonCode: 'INELIGIBLE_ACCESS' })
  })

  it('elegível e dentro do limite → VQ-R', () => {
    const result = resolveViewClassification(
      qualifiedConsumption,
      { lessonIsFree: false, hasEligibleFunding: true },
      { remunerableCountInWindow: 0 }
    )
    expect(result).toEqual({ classification: 'VQ-R', reasonCode: null })
  })

  it('limite de repetição (Art. 13): visualização 1 e 2 elegíveis, 3ª → VQ-NR/REPEAT_LIMIT', () => {
    const funding = { lessonIsFree: false, hasEligibleFunding: true }
    const view1 = resolveViewClassification(qualifiedConsumption, funding, { remunerableCountInWindow: 0 })
    const view2 = resolveViewClassification(qualifiedConsumption, funding, { remunerableCountInWindow: 1 })
    const view3 = resolveViewClassification(qualifiedConsumption, funding, { remunerableCountInWindow: 2 })

    expect(view1.classification).toBe('VQ-R')
    expect(view2.classification).toBe('VQ-R')
    expect(view3).toEqual({ classification: 'VQ-NR', reasonCode: 'REPEAT_LIMIT' })
  })

  it('limite de repetição é configurável (não hardcoded a 2 na função)', () => {
    const funding = { lessonIsFree: false, hasEligibleFunding: true }
    const result = resolveViewClassification(qualifiedConsumption, funding, { remunerableCountInWindow: 1, limit: 1 })
    expect(result.classification).toBe('VQ-NR')
  })
})
