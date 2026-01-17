import type {
  ApartmentEvolution,
  ApartmentEvolutionEntry,
  ApartmentInstallment,
  ApartmentMonthSnapshot,
} from '@/types/schema'

function overrideOrDefault<T, K extends keyof T>(
  overrides: Partial<T> | undefined,
  key: K,
  fallback: T[K]
): T[K] {
  if (
    overrides &&
    Object.prototype.hasOwnProperty.call(overrides, key)
  ) {
    const value = overrides[key]
    if (value === undefined) {
      return fallback
    }
    return value as T[K]
  }
  return fallback
}

export function createApartmentInstallment(
  overrides?: Partial<ApartmentInstallment>
): ApartmentInstallment {
  const base: ApartmentInstallment = {
    referencia: '2024-05',
    ano: '2024',
    mes: '05',
    valor_parcela: 1200,
    saldo_devedor: 200000,
    diferenca_vs_mes_anterior: -350,
    saldo_devedor_variacao: -1200,
  }

  return {
    ...base,
    ...overrides,
  }
}

export function createApartmentSnapshot(
  overrides?: Partial<ApartmentMonthSnapshot>
): ApartmentMonthSnapshot {
  const base: ApartmentMonthSnapshot = {
    referencia: '2024-05',
    financiamento_caixa: createApartmentInstallment({
      valor_parcela: 1800,
      saldo_devedor: 195000,
    }),
    entrada_construtora: createApartmentInstallment({
      referencia: '2024-05-C',
      valor_parcela: 800,
      saldo_devedor: 45000,
    }),
    totais: {
      parcelas: 2600,
      saldo_devedor: 240000,
    },
  }

  return {
    ...base,
    ...overrides,
    financiamento_caixa: overrideOrDefault(
      overrides,
      'financiamento_caixa',
      base.financiamento_caixa
    ),
    entrada_construtora: overrideOrDefault(
      overrides,
      'entrada_construtora',
      base.entrada_construtora
    ),
    totais: overrideOrDefault(overrides, 'totais', base.totais),
  }
}

export function createApartmentEvolution(
  overrides?: Partial<ApartmentEvolution>
): ApartmentEvolution {
  const base: ApartmentEvolution = {
    financiamento_caixa: [
      createApartmentInstallment({
        referencia: '2024-03',
        mes: '03',
        valor_parcela: 1750,
        saldo_devedor: 197000,
      }),
    ],
    entrada_construtora: [
      createApartmentInstallment({
        referencia: '2024-02',
        mes: '02',
        valor_parcela: 600,
        saldo_devedor: 40000,
      }),
    ],
    combinada: [
      {
        referencia: '2024-03',
        parcelas: 2350,
        saldo_devedor: 237000,
        diferenca_vs_mes_anterior: -500,
        saldo_devedor_variacao: -1700,
      },
    ],
  }

  return {
    ...base,
    ...overrides,
    financiamento_caixa: overrideOrDefault(
      overrides,
      'financiamento_caixa',
      base.financiamento_caixa
    ) as ApartmentInstallment[],
    entrada_construtora: overrideOrDefault(
      overrides,
      'entrada_construtora',
      base.entrada_construtora
    ) as ApartmentInstallment[],
    combinada: overrideOrDefault(
      overrides,
      'combinada',
      base.combinada
    ) as ApartmentEvolutionEntry[],
  }
}
