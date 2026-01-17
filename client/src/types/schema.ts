export type YearString = string
export type MonthString = string
export type YearMonthString = `${string}-${string}`

export interface SalaryAdvanceConfig {
  habilitado: boolean
  dia: number | null
  percentual: number | null
}

export interface AppConfig {
  fechamento_fatura_dia: number
  adiantamento_salario: SalaryAdvanceConfig
  criado_em?: string
  atualizado_em?: string
}

export interface MonthIncomeData {
  adiantamento: number
  pagamento: number
  total_liquido?: number
}

export interface MonthCalendar {
  pagamentos: string[]
  fechamento_fatura: string | null
}

export interface Recurrence {
  tipo: 'mensal'
  termina_em: string | null
}

export interface MovementBase {
  id?: string
  serie_id?: string
  data: string
  valor: number
  descricao: string
  categoria?: string | null
  tags?: string[]
}

export interface MovementPayload extends MovementBase {
  parcela?: string | null
}

export interface Movement extends MovementBase {
  id: string
  parcela: string | null
  categoria: string | null
  tags: string[]
}

export interface RecurringMovementPayload extends MovementBase {
  recorrencia?: Recurrence | null
}

export interface RecurringMovement extends MovementBase {
  id: string
  recorrencia: Recurrence | null
  categoria: string | null
  tags: string[]
}

export interface SavingsMovementBase {
  id?: string
  data: string
  valor: number
  descricao: string
  tipo: 'aporte' | 'resgate'
}

export interface SavingsMovement extends SavingsMovementBase {
  id: string
}

export interface SavingsPayload {
  movimentos: SavingsMovementBase[]
}

export interface SavingsBlock {
  movimentos: SavingsMovement[]
}

export interface LoanMovementBase {
  id?: string
  data: string
  valor: number
  descricao: string
}

export interface LoanMovement extends LoanMovementBase {
  id: string
}

export interface LoansPayload {
  feitos: LoanMovementBase[]
  recebidos: LoanMovementBase[]
}

export interface LoansBlock {
  feitos: LoanMovement[]
  recebidos: LoanMovement[]
}

export interface MonthData {
  dados: {
    adiantamento: number
    pagamento: number
    total_liquido: number
  }
  calendario: MonthCalendar
  entradas_saidas: Movement[]
  contas_recorrentes_pre_fatura: RecurringMovement[]
  contas_recorrentes_pos_fatura: RecurringMovement[]
  poupanca: SavingsBlock
  emprestimos: LoansBlock
}

export type RecurringPeriodParam = 'pre' | 'pos'
export type RecurringListKey =
  | 'contas_recorrentes_pre_fatura'
  | 'contas_recorrentes_pos_fatura'

export interface ApartmentInstallmentInput {
  ano: YearString
  mes: MonthString
  valor_parcela: number
  saldo_devedor: number | null
}

export interface ApartmentInstallment extends ApartmentInstallmentInput {
  referencia: string
  diferenca_vs_mes_anterior: number | null
  saldo_devedor_variacao: number | null
}

export interface ApartmentTotals {
  parcelas: number
  saldo_devedor: number | null
}

export interface ApartmentMonthSnapshot {
  referencia: string
  financiamento_caixa: ApartmentInstallment | null
  entrada_construtora: ApartmentInstallment | null
  totais: ApartmentTotals | null
}

export interface ApartmentEvolutionEntry {
  referencia: string
  parcelas: number
  saldo_devedor: number | null
  diferenca_vs_mes_anterior: number | null
  saldo_devedor_variacao: number | null
}

export interface ApartmentEvolution {
  financiamento_caixa: ApartmentInstallment[]
  entrada_construtora: ApartmentInstallment[]
  combinada: ApartmentEvolutionEntry[]
}

export interface ApartmentPayload {
  financiamento_caixa?: ApartmentInstallmentInput | null
  entrada_construtora?: ApartmentInstallmentInput | null
}

export type ApartmentSeriesKey = 'financiamento_caixa' | 'entrada_construtora'

export interface SavingsSummary {
  aportes: number
  resgates: number
  saldo_mes: number
  saldo_acumulado: number
}

export interface LoansSummary {
  feitos: number
  recebidos: number
  saldo_mes: number
  saldo_acumulado: number
}

export interface RecurringSummary {
  total: number
  entradas: number
  saidas: number
}

export interface MonthSummary {
  referencia: string
  salarios: {
    adiantamento: number
    pagamento: number
    bruto: number
  }
  variaveis: {
    entradas: number
    saidas: number
    saldo: number
  }
  recorrentes: {
    pre_fatura: RecurringSummary
    pos_fatura: RecurringSummary
  }
  resultado: {
    receitas: number
    despesas: number
    liquido: number
    saldo_disponivel: number
  }
  poupanca: SavingsSummary
  emprestimos: LoansSummary
  apartamento: ApartmentMonthSnapshot
}

export interface YearSummary {
  ano: string
  meses_disponiveis: MonthString[]
  totais: {
    salarios: {
      adiantamento: number
      pagamento: number
      bruto: number
    }
    variaveis: {
      entradas: number
      saidas: number
      saldo: number
    }
    recorrentes: {
      pre_fatura: number
      pos_fatura: number
    }
    resultado: {
      receitas: number
      despesas: number
      liquido: number
      saldo_disponivel: number
    }
    poupanca: {
      aportes: number
      resgates: number
      saldo_final: number
    }
    emprestimos: {
      feitos: number
      recebidos: number
      saldo_final: number
    }
    apartamento: {
      parcelas: {
        caixa: number
        construtora: number
        total: number
      }
      saldo_devedor_final: {
        caixa: number | null
        construtora: number | null
        total: number | null
      }
    }
  }
  medias: {
    liquido: number
    saldo_disponivel: number
  }
  meses: MonthSummary[]
}

export interface DatabaseSnapshot {
  config: AppConfig
  anos: Record<
    YearString,
    {
      meses: Record<MonthString, MonthData>
    }
  >
  apartamento: {
    financiamento_caixa: ApartmentInstallmentInput[]
    entrada_construtora: ApartmentInstallmentInput[]
  }
}

export interface AdminStatus {
  has_data: boolean
  years: string[]
  last_year: string | null
  last_month: string | null
  config: AppConfig | null
  db_path: string
}

export interface AdminExportResponse {
  exported_at: string
  db: DatabaseSnapshot
}

export interface AdminValidationResult {
  errors: string[]
  warnings: string[]
  normalized: DatabaseSnapshot | null
  summary: { years: number; months: number } | null
}

export interface BackupInfo {
  backup_at: string
  file: string
  size_bytes: number
  reason: string
}

export interface AdminImportResponse {
  imported_at: string
  status: 'ok'
  size_bytes: number
  config: AppConfig
  backup: BackupInfo | null
  warnings: string[]
  summary: { years: number; months: number }
}

export interface AdminBootstrapResponse {
  created_at: string
  status: 'ok'
  year: string
  month: string
  config: AppConfig
  warnings: string[]
}
