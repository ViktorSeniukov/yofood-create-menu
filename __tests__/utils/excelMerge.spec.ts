import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'

import { mergeMenuIntoTemplate } from '@/utils/excelMerge'
import { MEAL_COLUMN_MAP } from '@/constants/menu'
import type { TranslatedMenu } from '@/types/menu'

const validMenu: TranslatedMenu = {
  'Понедельник': {
    'Сок': ['Апельсиновый / Ceđena pomorandža'],
    'Завтрак': ['Омлет / Omlet'],
    'Суп': ['Борщ / Borš'],
    'Горячее': ['Стейк / Stejk'],
    'Гарнир': ['Рис / Pirinač'],
    'Салат': ['Цезарь / Cezar'],
    'Десерт': ['Торт / Torta'],
  },
  'Вторник': {
    'Сок': ['Апельсиновый / Ceđena pomorandža'],
    'Завтрак': [],
    'Суп': ['Щи / Šči'],
    'Горячее': ['Котлета / Kotlet'],
    'Гарнир': ['Гречка / Heljda'],
    'Салат': [],
    'Десерт': [],
  },
  'Среда': {
    'Сок': ['Апельсиновый / Ceđena pomorandža'],
    'Завтрак': ['Каша / Kaša'],
    'Суп': [],
    'Горячее': ['Рыба / Riba'],
    'Гарнир': ['Пюре / Pire'],
    'Салат': ['Греческий / Grčka'],
    'Десерт': ['Пудинг / Puding'],
  },
  'Четверг': {
    'Сок': ['Апельсиновый / Ceđena pomorandža'],
    'Завтрак': ['Блины / Palačinke'],
    'Суп': ['Грибной / Gljiva čorba'],
    'Горячее': ['Курица / Piletina'],
    'Гарнир': ['Макароны / Makaroni'],
    'Салат': [],
    'Десерт': [],
  },
  'Пятница': {
    'Сок': ['Апельсиновый / Ceđena pomorandža'],
    'Завтрак': ['Сырники / Sirnice'],
    'Суп': [],
    'Горячее': ['Свинина / Svinjetina'],
    'Гарнир': ['Картофель / Krompir'],
    'Салат': ['Винегрет / Vinegret'],
    'Десерт': ['Мороженое / Sladoled'],
  },
}

/**
 * Each day block = 1 header + 1 category + 10 data + 1 separator = 13 rows.
 * Last day has no separator = 12 rows.
 * Row layout:
 *   Mon: 0 (header), 1 (categories), 2–11 (data)
 *   Tue: 13 (header), 14 (categories), 15–24 (data)
 *   Wed: 26, 27, 28–37
 *   Thu: 39, 40, 41–50
 *   Fri: 52, 53, 54–63
 */

function createTestTemplate(): ArrayBuffer {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([['Employee data placeholder']])
  XLSX.utils.book_append_sheet(wb, ws, 'Tech')
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
}

describe('mergeMenuIntoTemplate', () => {
  it('writes day header in G–L for Monday (row 0)', async () => {
    const template = createTestTemplate()
    const result = await mergeMenuIntoTemplate(template, validMenu)

    const wb = XLSX.read(result, { type: 'array' })
    const sheet = wb.Sheets['Tech']!

    // Row 0: day header — G1 through L1 should be "Понедельник"
    for (let col = MEAL_COLUMN_MAP['Завтрак']; col <= MEAL_COLUMN_MAP['Десерт']; col++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: col })]
      expect(cell?.v).toBe('Понедельник')
    }
  })

  it('writes category headers in row 1', async () => {
    const template = createTestTemplate()
    const result = await mergeMenuIntoTemplate(template, validMenu)

    const wb = XLSX.read(result, { type: 'array' })
    const sheet = wb.Sheets['Tech']!

    // Row 1: category headers
    expect(sheet[XLSX.utils.encode_cell({ r: 1, c: MEAL_COLUMN_MAP['Сок'] })]?.v)
      .toBe('Соки')
    expect(sheet[XLSX.utils.encode_cell({ r: 1, c: MEAL_COLUMN_MAP['Завтрак'] })]?.v)
      .toBe('Завтрак')
    expect(sheet[XLSX.utils.encode_cell({ r: 1, c: MEAL_COLUMN_MAP['Десерт'] })]?.v)
      .toBe('Десерт')
  })

  it('writes dishes vertically starting at row 2', async () => {
    const template = createTestTemplate()
    const result = await mergeMenuIntoTemplate(template, validMenu)

    const wb = XLSX.read(result, { type: 'array' })
    const sheet = wb.Sheets['Tech']!

    // Monday data starts at row 2
    const cell = sheet[XLSX.utils.encode_cell({ r: 2, c: MEAL_COLUMN_MAP['Завтрак'] })]
    expect(cell?.v).toBe('Омлет / Omlet')
  })

  it('leaves cells empty when category has no dishes', async () => {
    const template = createTestTemplate()
    const result = await mergeMenuIntoTemplate(template, validMenu)

    const wb = XLSX.read(result, { type: 'array' })
    const sheet = wb.Sheets['Tech']!

    // Tuesday: row 13 header, 14 categories, 15+ data
    // Завтрак is empty for Tuesday
    const cell = sheet[XLSX.utils.encode_cell({ r: 15, c: MEAL_COLUMN_MAP['Завтрак'] })]
    expect(cell).toBeUndefined()
  })

  it('writes multiple dishes in separate rows', async () => {
    const menuWithMultiple: TranslatedMenu = {
      ...validMenu,
      'Понедельник': {
        ...validMenu['Понедельник'],
        'Завтрак': ['Омлет / Omlet', 'Каша / Kaša'],
      },
    }

    const template = createTestTemplate()
    const result = await mergeMenuIntoTemplate(template, menuWithMultiple)

    const wb = XLSX.read(result, { type: 'array' })
    const sheet = wb.Sheets['Tech']!

    // Row 2: first dish, Row 3: second dish
    const cell1 = sheet[XLSX.utils.encode_cell({ r: 2, c: MEAL_COLUMN_MAP['Завтрак'] })]
    const cell2 = sheet[XLSX.utils.encode_cell({ r: 3, c: MEAL_COLUMN_MAP['Завтрак'] })]
    expect(cell1?.v).toBe('Омлет / Omlet')
    expect(cell2?.v).toBe('Каша / Kaša')
  })

  it('throws if Tech sheet is missing', async () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([['data']])
    XLSX.utils.book_append_sheet(wb, ws, 'Other')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer

    await expect(mergeMenuIntoTemplate(buf, validMenu))
      .rejects.toThrow('Лист "Tech" не найден')
  })

  it('handles all five days correctly', async () => {
    const template = createTestTemplate()
    const result = await mergeMenuIntoTemplate(template, validMenu)

    const wb = XLSX.read(result, { type: 'array' })
    const sheet = wb.Sheets['Tech']!

    // Friday: header at row 48, categories at 49, data at 50+
    const headerCell = sheet[XLSX.utils.encode_cell({ r: 48, c: MEAL_COLUMN_MAP['Завтрак'] })]
    expect(headerCell?.v).toBe('Пятница')

    const dataCell = sheet[XLSX.utils.encode_cell({ r: 50, c: MEAL_COLUMN_MAP['Горячее'] })]
    expect(dataCell?.v).toBe('Свинина / Svinjetina')
  })

  it('writes juices only for Monday', async () => {
    const template = createTestTemplate()
    const result = await mergeMenuIntoTemplate(template, validMenu)

    const wb = XLSX.read(result, { type: 'array' })
    const sheet = wb.Sheets['Tech']!

    // Monday juice data at row 2, col F (5)
    const juiceCell = sheet[XLSX.utils.encode_cell({ r: 2, c: MEAL_COLUMN_MAP['Сок'] })]
    expect(juiceCell?.v).toBe('Апельсиновый / Ceđena pomorandža')

    // Tuesday juice header should NOT exist (row 14, col F)
    const tuesdayJuiceHeader = sheet[XLSX.utils.encode_cell({ r: 14, c: MEAL_COLUMN_MAP['Сок'] })]
    expect(tuesdayJuiceHeader).toBeUndefined()
  })
})
