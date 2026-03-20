import * as XLSX from 'xlsx'

import {
  DAYS_OF_WEEK,
  MEAL_CATEGORIES,
  MEAL_COLUMN_MAP,
  TECH_SHEET_NAME,
} from '@/constants/menu'
import type { DayOfWeek, TranslatedMenu } from '@/types/menu'

/**
 * Finds header rows for each day of the week in column A/B.
 * Returns a map: day name → row index of the header.
 */
function findDayHeaderRows(
  sheet: XLSX.WorkSheet
): Map<DayOfWeek, number> {
  const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1')
  const headers = new Map<DayOfWeek, number>()

  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = 0; col <= 1; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      const cell = sheet[cellAddress]

      if (!cell || typeof cell.v !== 'string') continue

      const cellText = cell.v.trim().toLowerCase()

      for (const day of DAYS_OF_WEEK) {
        if (cellText.includes(day.toLowerCase())) {
          headers.set(day, row)
          break
        }
      }
    }

    if (headers.size === DAYS_OF_WEEK.length) break
  }

  return headers
}

/**
 * Determines the last data row for a day block:
 * from headerRow+1 up to (nextHeaderRow-1) or end of sheet.
 */
function getBlockEndRow(
  headerRow: number,
  allHeaderRows: number[],
  sheetEndRow: number
): number {
  const sorted = [...allHeaderRows].sort((a, b) => a - b)
  const idx = sorted.indexOf(headerRow)
  const nextHeader = idx < sorted.length - 1 ? sorted[idx + 1] : undefined

  return nextHeader !== undefined ? nextHeader - 1 : sheetEndRow
}

/**
 * Merges translated menu into an xlsx template buffer.
 * Writes meal data into the Tech sheet, columns G–L,
 * for every employee row within each day block.
 */
export function mergeMenuIntoTemplate(
  templateBuffer: ArrayBuffer,
  menu: TranslatedMenu
): ArrayBuffer {
  const workbook = XLSX.read(templateBuffer, { type: 'array' })
  const sheet = workbook.Sheets[TECH_SHEET_NAME]

  if (!sheet) {
    throw new Error(
      `Лист "${TECH_SHEET_NAME}" не найден в загруженном файле`
    )
  }

  const headers = findDayHeaderRows(sheet)

  if (headers.size === 0) {
    throw new Error('Не найдены заголовки дней недели в листе Tech')
  }

  const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1')
  const allHeaderRows = [...headers.values()]

  for (const day of DAYS_OF_WEEK) {
    const headerRow = headers.get(day)
    if (headerRow === undefined) continue

    const startRow = headerRow + 1
    const endRow = getBlockEndRow(headerRow, allHeaderRows, range.e.r)

    for (const category of MEAL_CATEGORIES) {
      const col = MEAL_COLUMN_MAP[category]
      const dishes = menu[day][category]
      const value = dishes.join(', ')

      for (let row = startRow; row <= endRow; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        sheet[cellAddress] = { t: 's', v: value }
      }
    }
  }

  // Expand sheet range to include newly written columns
  const maxCol = Math.max(range.e.c, ...Object.values(MEAL_COLUMN_MAP))
  sheet['!ref'] = XLSX.utils.encode_range({
    s: range.s,
    e: { r: range.e.r, c: maxCol },
  })

  const output = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  })

  return output as ArrayBuffer
}
