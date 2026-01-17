import type {
  ApartmentEvolution,
  ApartmentMonthSnapshot,
  ApartmentPayload,
  ApartmentSeriesKey,
  ApartmentInstallmentInput,
} from '@/types/schema'
import { get, put } from './httpClient'

const BASE_PATH = '/apartment'

export async function fetchApartmentMonth(
  year: string,
  month: string
): Promise<ApartmentMonthSnapshot> {
  return get<ApartmentMonthSnapshot>(`${BASE_PATH}/${year}/${month}`)
}

export async function updateApartmentMonth(
  year: string,
  month: string,
  payload: ApartmentPayload
): Promise<ApartmentMonthSnapshot> {
  return put<ApartmentMonthSnapshot>(
    `${BASE_PATH}/${year}/${month}`,
    payload
  )
}

export async function saveApartmentSeriesEntry(
  year: string,
  month: string,
  series: ApartmentSeriesKey,
  installment: ApartmentInstallmentInput | null
): Promise<ApartmentMonthSnapshot> {
  return updateApartmentMonth(year, month, {
    [series]: installment,
  })
}

export async function fetchApartmentEvolution(
  params?: { year?: string | number }
): Promise<ApartmentEvolution> {
  return get<ApartmentEvolution>(`${BASE_PATH}/evolution`, {
    year: params?.year,
  })
}
