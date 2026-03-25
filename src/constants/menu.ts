import type { DayOfWeek, MealCategory } from '@/types/menu'

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
]

export const MEAL_CATEGORIES: MealCategory[] = [
  'Сок',
  'Завтрак',
  'Суп',
  'Горячее',
  'Гарнир',
  'Салат',
  'Десерт',
]

/**
 * Маппинг категорий на столбцы в листе Tech.
 * Столбец F (индекс 5) — Соки/напитки (не заполняется из меню).
 * Столбцы G–L (индексы 6–11) — категории блюд.
 */
export const MEAL_COLUMN_MAP: Record<MealCategory, number> = {
  'Сок':     5,  // F
  'Завтрак': 6,  // G
  'Суп':     7,  // H
  'Горячее': 8,  // I
  'Гарнир':  9,  // J
  'Салат':   10, // K
  'Десерт':  11, // L
}

/**
 * Маппинг категорий на столбцы в превью-файле меню.
 * Столбец A (0) — Соки (не из JSON), B–G (1–6) — категории блюд.
 */
export const PREVIEW_COLUMN_MAP: Record<MealCategory, number> = {
  'Сок':     0,  // A
  'Завтрак': 1,  // B
  'Суп':     2,  // C
  'Горячее': 3,  // D
  'Гарнир':  4,  // E
  'Салат':   5,  // F
  'Десерт':  6,  // G
}

/** Заголовки категорий для превью-файла (включая Соки в столбце A) */
export const PREVIEW_CATEGORY_HEADERS = [
  'Соки', 'Завтрак', 'Суп', 'Горячее', 'Гарнир', 'Салат', 'Десерт',
] as const

export const TECH_SHEET_NAME = 'Tech'

/** Sheet names for weekday order forms */
export const DAY_SHEET_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'] as const

export const CLAUDE_MODEL = 'claude-sonnet-4-6'
export const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
export const CLAUDE_MAX_TOKENS = 16384

export const LOCAL_STORAGE_API_KEY = 'claude_api_key'
export const LOCAL_STORAGE_CONVERT_API_KEY = 'convert_api_key'
