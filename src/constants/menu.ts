import type { DayOfWeek, MealCategory } from '@/types/menu'

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
]

export const MEAL_CATEGORIES: MealCategory[] = [
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
  'Завтрак': 6,  // G
  'Суп':     7,  // H
  'Горячее': 8,  // I
  'Гарнир':  9,  // J
  'Салат':   10, // K
  'Десерт':  11, // L
}

export const TECH_SHEET_NAME = 'Tech'

export const CLAUDE_MODEL = 'claude-sonnet-4-6'
export const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
export const CLAUDE_MAX_TOKENS = 8192

export const LOCAL_STORAGE_API_KEY = 'claude_api_key'
