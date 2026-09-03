// Payout Engine — valor mínimo de pagamento e carry-forward (Art. 31)
//
// Regra: saldo aprovado < 500 MZN não é pago neste ciclo; transita
// integralmente (nunca expira) para o ciclo seguinte, onde volta a somar-se
// aos novos ganhos aprovados antes de se repetir a mesma verificação.

import { addMicros, mznToMicros, microsToDecimalString, type Micros } from '../utils/money'

export const MIN_PAYOUT_MZN = 500

export interface PayoutDecision {
  totalApprovedMzn: string
  payableNowMzn: string
  carryForwardMzn: string
  willPay: boolean
}

/**
 * @param approvedThisPeriodMzn Soma dos earnings com status APPROVED neste ciclo de settlement.
 * @param carriedForwardMzn Saldo transitado de ciclos anteriores (sempre >= 0, nunca expira).
 */
export function determinePayout(
  approvedThisPeriodMzn: number,
  carriedForwardMzn: number = 0,
  minPayoutMzn: number = MIN_PAYOUT_MZN
): PayoutDecision {
  const total: Micros = addMicros(mznToMicros(approvedThisPeriodMzn), mznToMicros(carriedForwardMzn))
  const minMicros = mznToMicros(minPayoutMzn)
  const willPay = total >= minMicros

  return {
    totalApprovedMzn: microsToDecimalString(total),
    payableNowMzn: willPay ? microsToDecimalString(total) : '0.00',
    carryForwardMzn: willPay ? '0.00' : microsToDecimalString(total),
    willPay
  }
}
