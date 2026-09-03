// Aritmética monetária sem floating point.
//
// Representação interna: BigInt em "micro-MZN" (1 MZN = 1_000_000 micro).
// Precisão de 6 casas decimais internamente evita perda de precisão em
// cálculos intermédios (ex: VCPM por 1000 visualizações); arredonda-se
// apenas na conversão final para exibição/armazenamento (NUMERIC(14,2)).
//
// Política de arredondamento (PDR-005, ver blueprint): round-half-up a 2
// casas decimais, aplicado só no output final — nunca a meio de um cálculo
// progressivo (ver vcpmEngine.ts).

const MICRO = 1_000_000n

export type Micros = bigint

export function mznToMicros(mzn: number): Micros {
  if (!Number.isFinite(mzn)) throw new Error(`Valor monetário inválido: ${mzn}`)
  // Números de entrada (tarifas da política) são inteiros ou têm no máximo
  // 2 casas decimais — Math.round(mzn * 1e6) é seguro para essa gama.
  return BigInt(Math.round(mzn * 1_000_000))
}

export function microsFromInt(whole: number): Micros {
  return BigInt(whole) * MICRO
}

export function addMicros(a: Micros, b: Micros): Micros {
  return a + b
}

/** overlap (contagem inteira) × rate (MZN por 1000 unidades) → micros, exacto. */
export function tierAmountMicros(overlapCount: bigint, rateMznPer1000Micros: Micros): Micros {
  // overlapCount * rateMznPer1000Micros é sempre divisível por 1000 porque
  // rateMznPer1000Micros é, por construção, um múltiplo de 1000 (MICRO/1000 = 1000).
  return (overlapCount * rateMznPer1000Micros) / 1000n
}

/** Arredondamento round-half-up a 2 casas decimais, só na fronteira de saída. */
export function microsToDecimalString(micros: Micros): string {
  const negative = micros < 0n
  const abs = negative ? -micros : micros
  // micros está em milionésimos de MZN; queremos centésimos (2 casas).
  // Passo intermédio em "décimos de centésimo" (4 casas) para decidir o
  // arredondamento sem usar floats.
  const centsScaled = abs * 100n // agora em (MZN * 1e8), i.e. 8 casas
  const cents = centsScaled / MICRO // trunca para inteiro em (MZN*100), 2 casas
  const remainder = centsScaled % MICRO
  const roundedCents = remainder * 2n >= MICRO ? cents + 1n : cents
  const wholePart = roundedCents / 100n
  const fracPart = roundedCents % 100n
  const sign = negative && roundedCents !== 0n ? '-' : ''
  return `${sign}${wholePart.toString()}.${fracPart.toString().padStart(2, '0')}`
}

export function microsToNumber(micros: Micros): number {
  return Number(microsToDecimalString(micros))
}
