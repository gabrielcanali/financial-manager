export function formatCurrency(
  value: number | null | undefined
): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '--'
  }
  const formatted = Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `R$ ${formatted}`
}

export function formatPlainNumber(
  value: number | null | undefined,
  options?: { digits?: number }
): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '--'
  }
  const digits = options?.digits ?? 0
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}
