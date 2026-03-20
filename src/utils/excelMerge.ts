import * as XLSX from 'xlsx'

import {
  DAY_SHEET_NAMES,
  DAYS_OF_WEEK,
  MEAL_CATEGORIES,
  MEAL_COLUMN_MAP,
  PREVIEW_CATEGORY_HEADERS,
  PREVIEW_COLUMN_MAP,
  TECH_SHEET_NAME,
} from '@/constants/menu'
import type { MealCategory, TranslatedMenu } from '@/types/menu'

/** Number of data rows reserved per day block */
const ROWS_PER_DAY = 10

/** Category headers for the template (F–L columns) */
const TEMPLATE_CATEGORY_HEADERS: Record<MealCategory, string> = {
  'Сок': 'Соки',
  'Завтрак': 'Завтрак',
  'Суп': 'Суп',
  'Горячее': 'Горячее',
  'Гарнир': 'Гарнир',
  'Салат': 'Салат',
  'Десерт': 'Десерт',
}

/**
 * Builds a standalone menu .xlsx from translated JSON.
 * Structure matches the example file: Tech sheet,
 * each day as a block with one row per dish.
 */
export function buildMenuWorkbook(
  menu: TranslatedMenu
): ArrayBuffer {
  const workbook = XLSX.utils.book_new()
  const sheet: XLSX.WorkSheet = {}
  let currentRow = 0

  for (let dayIdx = 0; dayIdx < DAYS_OF_WEEK.length; dayIdx++) {
    const day = DAYS_OF_WEEK[dayIdx]
    const dayMenu = menu[day]

    // Day header row: day name in columns B–G (1–6)
    for (let col = 1; col <= 6; col++) {
      const addr = XLSX.utils.encode_cell({ r: currentRow, c: col })
      sheet[addr] = { t: 's', v: day }
    }
    currentRow++

    // Category header row: Соки only for Monday, Завтрак(B)..Десерт(G) always
    const startCol = dayIdx === 0 ? 0 : 1
    for (let col = startCol; col < PREVIEW_CATEGORY_HEADERS.length; col++) {
      const addr = XLSX.utils.encode_cell({ r: currentRow, c: col })
      sheet[addr] = { t: 's', v: PREVIEW_CATEGORY_HEADERS[col] }
    }
    currentRow++

    // Juices are the same for the whole week — only write for Monday
    const isMonday = dayIdx === 0
    const categories = isMonday
      ? MEAL_CATEGORIES
      : MEAL_CATEGORIES.filter((cat) => cat !== 'Сок')

    // Always reserve a fixed number of rows per day block
    const ROWS_PER_DAY = 10

    // Data rows: one row per dish index (up to ROWS_PER_DAY)
    for (let i = 0; i < ROWS_PER_DAY; i++) {
      for (const category of categories) {
        const dishes = dayMenu[category]
        if (i < dishes.length) {
          const col = PREVIEW_COLUMN_MAP[category]
          const addr = XLSX.utils.encode_cell({ r: currentRow, c: col })
          sheet[addr] = { t: 's', v: dishes[i] }
        }
      }
      currentRow++
    }

    // Empty separator row between days (skip after last day)
    if (dayIdx < DAYS_OF_WEEK.length - 1) {
      currentRow++
    }
  }

  // Set sheet range
  sheet['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: currentRow - 1, c: 6 },
  })

  XLSX.utils.book_append_sheet(workbook, sheet, TECH_SHEET_NAME)

  return XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer
}

/**
 * Merges translated menu into an xlsx template buffer.
 * Writes menu catalog into the Tech sheet starting at F1,
 * one dish per cell vertically. Columns A–E are not touched.
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

  const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1')
  let currentRow = 0

  for (let dayIdx = 0; dayIdx < DAYS_OF_WEEK.length; dayIdx++) {
    const day = DAYS_OF_WEEK[dayIdx]!
    const dayMenu = menu[day]

    // Day header row: day name in G–L (cols 6–11)
    for (let col = MEAL_COLUMN_MAP['Завтрак']; col <= MEAL_COLUMN_MAP['Десерт']; col++) {
      const addr = XLSX.utils.encode_cell({ r: currentRow, c: col })
      sheet[addr] = { t: 's', v: day }
    }
    currentRow++

    // Category header row
    const isMonday = dayIdx === 0
    if (isMonday) {
      const juiceAddr = XLSX.utils.encode_cell({
        r: currentRow, c: MEAL_COLUMN_MAP['Сок'],
      })
      sheet[juiceAddr] = { t: 's', v: TEMPLATE_CATEGORY_HEADERS['Сок'] }
    }
    for (const category of MEAL_CATEGORIES) {
      if (category === 'Сок') continue
      const addr = XLSX.utils.encode_cell({
        r: currentRow, c: MEAL_COLUMN_MAP[category],
      })
      sheet[addr] = { t: 's', v: TEMPLATE_CATEGORY_HEADERS[category] }
    }
    currentRow++

    // Data rows: one dish per cell, vertically
    const categories = isMonday
      ? MEAL_CATEGORIES
      : MEAL_CATEGORIES.filter((cat) => cat !== 'Сок')

    for (let i = 0; i < ROWS_PER_DAY; i++) {
      for (const category of categories) {
        const dishes = dayMenu[category]
        if (i < dishes.length) {
          const addr = XLSX.utils.encode_cell({
            r: currentRow, c: MEAL_COLUMN_MAP[category],
          })
          sheet[addr] = { t: 's', v: dishes[i] }
        }
      }
      currentRow++
    }

    // Empty separator row between days (skip after last day)
    if (dayIdx < DAYS_OF_WEEK.length - 1) {
      currentRow++
    }
  }

  // Expand sheet range to cover written columns
  const maxCol = Math.max(
    range.e.c,
    ...Object.values(MEAL_COLUMN_MAP)
  )
  const maxRow = Math.max(range.e.r, currentRow - 1)
  sheet['!ref'] = XLSX.utils.encode_range({
    s: range.s,
    e: { r: maxRow, c: maxCol },
  })

  // Clear previous selections on day sheets (C5:O60)
  clearDaySheets(workbook)

  const output = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  })

  return output as ArrayBuffer
}

/**
 * Clears cells C5:O60 on each weekday sheet (Пн–Пт)
 * to remove previously filled employee selections.
 */
function clearDaySheets(workbook: XLSX.WorkBook): void {
  const startRow = 4  // row 5 (0-indexed)
  const endRow = 59   // row 60 (0-indexed)
  const startCol = 2  // column C
  const endCol = 14   // column O

  for (const sheetName of DAY_SHEET_NAMES) {
    const daySheet = workbook.Sheets[sheetName]
    if (!daySheet) continue

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const addr = XLSX.utils.encode_cell({ r: row, c: col })
        delete daySheet[addr]
      }
    }
  }
}
