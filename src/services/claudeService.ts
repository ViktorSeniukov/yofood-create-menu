import {
  CLAUDE_API_URL,
  CLAUDE_MAX_TOKENS,
  CLAUDE_MODEL,
  DAYS_OF_WEEK,
  MEAL_CATEGORIES,
} from '@/constants/menu'
import type { ClaudeMessageResponse, ClaudeTextBlock } from '@/types/claude'
import type { TranslatedMenu } from '@/types/menu'

const SYSTEM_PROMPT = `Ты получаешь файл с меню корпоративного питания на сербском языке.

Твоя задача:
1. Извлечь из файла список блюд, сгруппированных по дням недели и категориям.
2. Перевести каждое блюдо на русский язык.
3. Сохранить оригинальное название на сербской латинице после слеша.
4. Вернуть результат строго в формате JSON.

Дни недели: Понедельник, Вторник, Среда, Четверг, Пятница.
Категории: Завтрак, Сок, Суп, Горячее, Гарнир, Салат, Десерт.
Формат блюда: "Русское название / Srpski naziv"

Если для какой-то категории в файле нет блюда — поставь пустой массив [].
Если в категории несколько вариантов блюд — добавь все в массив.

ВАЖНО: Верни ТОЛЬКО чистый JSON. Без \`\`\`json, без markdown, без пояснений до или после.

Пример формата:
{
  "Понедельник": {
    "Завтрак": ["Омлет с беконом / Omlet sa slaninom"],
    "Суп": ["Телячий суп / Teleća čorba"],
    "Сок": ["Апельсиновый сок / Pomoranda sokovi"],
    "Горячее": ["Говяжье рагу / Juneći ragu"],
    "Гарнир": ["Картофельное пюре / Krompir pire"],
    "Салат": ["Салат из свёклы / Cvekla salata"],
    "Десерт": ["Яблочный пирог / Pita sa jabukama"]
  }
}`

/** Strip markdown code fences (```json ... ```) if present */
function stripMarkdownCodeFence(text: string): string {
  const trimmed = text.trim()
  const match = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/)
  return match?.[1]?.trim() ?? trimmed
}

function buildContentBlocks(text: string): ClaudeTextBlock[] {
  return [
    { type: 'text', text: SYSTEM_PROMPT },
    { type: 'text', text },
  ]
}

function getHttpErrorMessage(status: number, body: unknown): string {
  switch (status) {
    case 401:
      return 'Неверный API-ключ'
    case 429:
      return 'Превышен лимит запросов, попробуйте позже'
    case 400: {
      const msg =
        body !== null &&
        typeof body === 'object' &&
        'error' in body &&
        body.error !== null &&
        typeof body.error === 'object' &&
        'message' in body.error
          ? String((body.error as { message: unknown }).message)
          : 'Неизвестная ошибка'
      return `Ошибка запроса: ${msg}`
    }
    default:
      return 'Ошибка сервера Claude'
  }
}

export function validateTranslatedMenu(data: unknown): TranslatedMenu {
  if (data === null || typeof data !== 'object') {
    throw new Error('Ответ Claude не является объектом')
  }

  const record = data as Record<string, unknown>

  for (const day of DAYS_OF_WEEK) {
    if (!(day in record)) {
      throw new Error(`Отсутствует день: ${day}`)
    }

    const dayData = record[day]
    if (dayData === null || typeof dayData !== 'object') {
      throw new Error(`Данные дня "${day}" не являются объектом`)
    }

    const dayRecord = dayData as Record<string, unknown>

    for (const category of MEAL_CATEGORIES) {
      if (!(category in dayRecord)) {
        throw new Error(
          `Отсутствует категория "${category}" в дне "${day}"`
        )
      }

      const dishes = dayRecord[category]
      if (!Array.isArray(dishes)) {
        throw new Error(
          `Категория "${category}" в дне "${day}" не является массивом`
        )
      }

      for (let i = 0; i < dishes.length; i++) {
        if (typeof dishes[i] !== 'string') {
          throw new Error(
            `Блюдо [${i}] в "${day}" → "${category}" не является строкой`
          )
        }
      }
    }
  }

  return data as TranslatedMenu
}

export async function translateMenu(
  text: string,
  apiKey: string
): Promise<TranslatedMenu> {
  const content = buildContentBlocks(text)

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      messages: [{ role: 'user', content }],
    }),
  })

  if (!response.ok) {
    let body: unknown = null
    try {
      body = await response.json()
    } catch {
      // ignore parse error
    }
    throw new Error(getHttpErrorMessage(response.status, body))
  }

  const result: ClaudeMessageResponse = await response.json()
  const responseText = result.content[0]?.text

  if (!responseText) {
    throw new Error('Claude вернул пустой ответ')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(stripMarkdownCodeFence(responseText))
  } catch {
    throw new Error('Claude вернул невалидный JSON')
  }

  return validateTranslatedMenu(parsed)
}
