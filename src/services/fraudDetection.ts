// Gate anti-fraude mínimo antes de aprovar settlement (blueprint gap #7).
//
// V1: duas heurísticas explicáveis e auditáveis — concentração de IP e
// concentração de alunos entre as visualizações remuneráveis (VQ-R/VQ-B) de
// um professor num período. Um sinal NÃO rejeita nada: só impede a
// APROVAÇÃO AUTOMÁTICA das linhas desse professor nesse período (ficam em
// VALIDATING) até revisão manual via POST /api/finance/earnings/:id/approve.
//
// Os limiares abaixo são provisórios (PDR-08, por decidir/calibrar pelo
// utilizador com histórico real de settlement — hoje ainda não existe
// nenhum período aprovado em produção para calibrar contra). Deliberadamente
// não incluído nesta v1: detecção de pico de ganhos período-a-período —
// exigiria histórico de pelo menos 2-3 períodos aprovados, que ainda não
// existe; fica documentado aqui como próximo passo natural.

export const FRAUD_MIN_SAMPLE_SIZE = 15
export const FRAUD_MAX_IP_RATIO = 0.15
export const FRAUD_MIN_STUDENT_RATIO = 0.25

export interface FraudSignal {
  code: 'LOW_IP_DIVERSITY' | 'LOW_STUDENT_DIVERSITY'
  detail: string
}

export interface FraudMetricsInput {
  remunerableViews: number
  distinctStudents: number
  distinctIps: number
}

/**
 * Amostra abaixo de FRAUD_MIN_SAMPLE_SIZE não produz sinal nenhum — não há
 * dados suficientes para distinguir "poucos alunos aleatoriamente" de
 * "farming", e um professor a começar não deve ficar preso em revisão manual
 * pelas suas primeiras visualizações.
 */
export function evaluateFraudSignals(m: FraudMetricsInput): FraudSignal[] {
  if (m.remunerableViews < FRAUD_MIN_SAMPLE_SIZE) return []

  const signals: FraudSignal[] = []

  const ipRatio = m.distinctIps / m.remunerableViews
  if (ipRatio < FRAUD_MAX_IP_RATIO) {
    signals.push({
      code: 'LOW_IP_DIVERSITY',
      detail: `${m.distinctIps} IP(s) distinto(s) para ${m.remunerableViews} visualizações remuneráveis (${(ipRatio * 100).toFixed(1)}%, limiar ${(FRAUD_MAX_IP_RATIO * 100).toFixed(0)}%)`
    })
  }

  const studentRatio = m.distinctStudents / m.remunerableViews
  if (studentRatio < FRAUD_MIN_STUDENT_RATIO) {
    signals.push({
      code: 'LOW_STUDENT_DIVERSITY',
      detail: `${m.distinctStudents} aluno(s) distinto(s) para ${m.remunerableViews} visualizações remuneráveis (${(studentRatio * 100).toFixed(1)}%, limiar ${(FRAUD_MIN_STUDENT_RATIO * 100).toFixed(0)}%)`
    })
  }

  return signals
}
