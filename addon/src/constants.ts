const DAYS_OF_WEEK: DayOfWeek[] = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
]

const MEAL_CATEGORIES: MealCategory[] = [
  'Завтрак',
  'Суп',
  'Горячее',
  'Гарнир',
  'Салат',
  'Десерт',
]

// Column indices (1-based, as used by SpreadsheetApp)
// F(6) — Juice (not filled from menu), G(7)–L(12) — meal categories
const MEAL_COLUMN_MAP: Record<MealCategory, number> = {
  'Завтрак': 7,  // G
  'Суп':     8,  // H
  'Горячее': 9,  // I
  'Гарнир':  10, // J
  'Салат':   11, // K
  'Десерт':  12, // L
}

const TECH_SHEET_NAME = 'Tech'

const CLAUDE_MODEL = 'claude-sonnet-4-6'
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MAX_TOKENS = 4096

const PROPS_API_KEY = 'claude_api_key'
const PROPS_CLOUDCONVERT_KEY = 'cloudconvert_api_key'

const CLOUDCONVERT_API_URL = 'https://api.cloudconvert.com/v2'
const CLOUDCONVERT_POLL_INTERVAL_MS = 2000
const CLOUDCONVERT_MAX_POLLS = 30
