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

function createTestTemplate(): ArrayBuffer {
  const wb = XLSX.utils.book_new()
  const rows: (string | null)[][] = []

  const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница']

  for (const day of days) {
    // Header row: day name in column A
    const header: (string | null)[] = [day]
    rows.push(header)

    // 3 employee rows
    for (let i = 1; i <= 3; i++) {
      const row: (string | null)[] = [null, `Name${i}`, `Surname${i}`]
      rows.push(row)
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Tech')

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return buf as ArrayBuffer
}

describe('mergeMenuIntoTemplate', () => {
  it('inserts meals into correct cells for each day', () => {
    const template = createTestTemplate()
    const result = mergeMenuIntoTemplate(template, validMenu)

    const wb = XLSX.read(result, { type: 'array' })
    const sheet = wb.Sheets['Tech']!

    // Понедельник header is row 0, data rows 1-3
    // Check Завтрак (col G=6) in row 1
    const cell = sheet[XLSX.utils.encode_cell({ r: 1, c: MEAL_COLUMN_MAP['Завтрак'] })]
    expect(cell?.v).toBe('Омлет / Omlet')
  })

  it('fills all employee rows within a day block', () => {
    const template = createTestTemplate()
    const result = mergeMenuIntoTemplate(template, validMenu)

    const wb = XLSX.read(result, { type: 'array' })
    const sheet = wb.Sheets['Tech']!

    // Понедельник: rows 1, 2, 3 should all have the same Суп value
    for (let row = 1; row <= 3; row++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: MEAL_COLUMN_MAP['Суп'] })]
      expect(cell?.v).toBe('Борщ / Borš')
    }
  })

  it('writes empty string when category has no dishes', () => {
    const template = createTestTemplate()
    const result = mergeMenuIntoTemplate(template, validMenu)

    const wb = XLSX.read(result, { type: 'array' })
    const sheet = wb.Sheets['Tech']!

    // Вторник header is row 4, data rows 5-7
    // Завтрак is empty for Вторник
    const cell = sheet[XLSX.utils.encode_cell({ r: 5, c: MEAL_COLUMN_MAP['Завтрак'] })]
    expect(cell?.v).toBe('')
  })

  it('joins multiple dishes with comma', () => {
    const menuWithMultiple: TranslatedMenu = {
      ...validMenu,
      'Понедельник': {
        ...validMenu['Понедельник'],
        'Завтрак': ['Омлет / Omlet', 'Каша / Kaša'],
        'Сок': ['Апельсиновый / Ceđena pomorandža'],
      },
    }

    const template = createTestTemplate()
    const result = mergeMenuIntoTemplate(template, menuWithMultiple)

    const wb = XLSX.read(result, { type: 'array' })
    const sheet = wb.Sheets['Tech']!

    const cell = sheet[XLSX.utils.encode_cell({ r: 1, c: MEAL_COLUMN_MAP['Завтрак'] })]
    expect(cell?.v).toBe('Омлет / Omlet, Каша / Kaša')
  })

  it('throws if Tech sheet is missing', () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([['data']])
    XLSX.utils.book_append_sheet(wb, ws, 'Other')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer

    expect(() => mergeMenuIntoTemplate(buf, validMenu))
      .toThrow('Лист "Tech" не найден')
  })

  it('throws if no day headers found', () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([['No days here'], ['Just data']])
    XLSX.utils.book_append_sheet(wb, ws, 'Tech')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer

    expect(() => mergeMenuIntoTemplate(buf, validMenu))
      .toThrow('Не найдены заголовки дней')
  })

  it('handles all five days correctly', () => {
    const template = createTestTemplate()
    const result = mergeMenuIntoTemplate(template, validMenu)

    const wb = XLSX.read(result, { type: 'array' })
    const sheet = wb.Sheets['Tech']!

    // Пятница header is row 16, data rows 17-19
    const cell = sheet[XLSX.utils.encode_cell({ r: 17, c: MEAL_COLUMN_MAP['Горячее'] })]
    expect(cell?.v).toBe('Свинина / Svinjetina')
  })
})
