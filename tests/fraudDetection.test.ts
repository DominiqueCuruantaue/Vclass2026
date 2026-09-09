import { describe, it, expect } from 'vitest'
import { evaluateFraudSignals, FRAUD_MIN_SAMPLE_SIZE } from '../src/services/fraudDetection'

describe('evaluateFraudSignals', () => {
  it('produces no signal below the minimum sample size, regardless of concentration', () => {
    const signals = evaluateFraudSignals({
      remunerableViews: FRAUD_MIN_SAMPLE_SIZE - 1,
      distinctStudents: 1,
      distinctIps: 1
    })
    expect(signals).toEqual([])
  })

  it('flags LOW_IP_DIVERSITY when almost all views come from very few IPs', () => {
    const signals = evaluateFraudSignals({
      remunerableViews: 40,
      distinctStudents: 30, // healthy student diversity
      distinctIps: 2 // but only 2 IPs total
    })
    expect(signals.map(s => s.code)).toContain('LOW_IP_DIVERSITY')
    expect(signals.map(s => s.code)).not.toContain('LOW_STUDENT_DIVERSITY')
  })

  it('flags LOW_STUDENT_DIVERSITY when a handful of students account for most views', () => {
    const signals = evaluateFraudSignals({
      remunerableViews: 40,
      distinctStudents: 5,
      distinctIps: 35 // healthy IP diversity
    })
    expect(signals.map(s => s.code)).toContain('LOW_STUDENT_DIVERSITY')
    expect(signals.map(s => s.code)).not.toContain('LOW_IP_DIVERSITY')
  })

  it('flags both signals when concentration is severe on both dimensions', () => {
    const signals = evaluateFraudSignals({
      remunerableViews: 100,
      distinctStudents: 3,
      distinctIps: 2
    })
    expect(signals.map(s => s.code).sort()).toEqual(['LOW_IP_DIVERSITY', 'LOW_STUDENT_DIVERSITY'])
  })

  it('produces no signal for a healthy, diverse distribution', () => {
    const signals = evaluateFraudSignals({
      remunerableViews: 50,
      distinctStudents: 42,
      distinctIps: 38
    })
    expect(signals).toEqual([])
  })

  it('does not divide by zero when remunerableViews is 0', () => {
    expect(() => evaluateFraudSignals({ remunerableViews: 0, distinctStudents: 0, distinctIps: 0 })).not.toThrow()
    expect(evaluateFraudSignals({ remunerableViews: 0, distinctStudents: 0, distinctIps: 0 })).toEqual([])
  })
})
