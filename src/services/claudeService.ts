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
2. Перевести КАЖДОЕ блюдо на русский язык, включая все ингредиенты и описания.
3. Сохранить оригинал на сербской латинице после слеша — тоже с ингредиентами.
4. Вернуть результат строго в формате JSON.

Дни недели: Понедельник, Вторник, Среда, Четверг, Пятница.
Категории: Завтрак, Сок, Суп, Горячее, Гарнир, Салат, Десерт.

ФОРМАТ КАЖДОГО БЛЮДА: "Название на русском (ингредиенты на русском) / Naziv na srpskom (sastojci na srpskom)"

Правила перевода:
- Название блюда — переведи на русский.
- Ингредиенты в скобках — переведи на русский, сохраняя скобки.
- После слеша "/" — оригинал на сербском: и название, и ингредиенты.
- Если в оригинале ингредиенты перечислены через запятую без скобок — оберни их в скобки.
- Если блюдо без ингредиентов — просто "Русское название / Srpski naziv".

Если для какой-то категории в файле нет блюда — поставь пустой массив [].
Если в категории несколько вариантов блюд — добавь все в массив.

ВАЖНО:
- Верни ТОЛЬКО чистый JSON. Без \`\`\`json, без markdown, без пояснений до или после.
- НИКОГДА не используй кавычки (", „, ") внутри значений строк. Если в оригинале есть кавычки — замени на « » или убери совсем.
- ОБЯЗАТЕЛЬНО переводи ВСЕ слова, включая ингредиенты. Не оставляй сербские слова в русской части.

Пример формата:
{
  "Понедельник": {
    "Завтрак": ["Омлет с беконом и шпинатом (яйца, бекон, шпинат, сыр) / Omlet sa slaninom i spanaćem (jaja, slanina, spanać, sir)"],
    "Сок": ["Апельсиновый сок / Sok od pomorandže"],
    "Суп": ["Телячий суп с овощами (телятина, морковь, лапша) / Teleća čorba sa povrćem (teletina, šargarepa, rezanci)"],
    "Горячее": ["Мусака (мясной фарш, картофель, бешамель) / Musaka (mleveno meso, krompir, bešamel)"],
    "Гарнир": ["Картофельное пюре / Krompir pire"],
    "Салат": ["Салат из свёклы с грецким орехом / Salata od cvekle sa orasima"],
    "Десерт": ["Яблочный пирог с корицей / Pita sa jabukama i cimetom"]
  }
}`

/** Replace typographic quotes „..." that break JSON parsing with «...» */
function sanitizeQuotes(text: string): string {
  return text
    .replace(/\u201E([^"]*?)"/g, '«$1»')
    .replace(/\u201E([^"]*?)\u201C/g, '«$1»')
}

/** Extract JSON from Claude response: strip code fences, preamble text, etc. */
function extractJson(text: string): string {
  const trimmed = text.trim()

  // Strip markdown code fences (```json ... ```)
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (fenceMatch?.[1]) {
    return sanitizeQuotes(fenceMatch[1].trim())
  }

  // If text starts with '{', it's already clean JSON
  if (trimmed.startsWith('{')) {
    return sanitizeQuotes(trimmed)
  }

  // Find the first '{' and last '}' to extract the JSON object
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return sanitizeQuotes(trimmed.slice(firstBrace, lastBrace + 1))
  }

  return sanitizeQuotes(trimmed)
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
    parsed = JSON.parse(extractJson(responseText))
  } catch {
    throw new Error('Claude вернул невалидный JSON')
  }

  return validateTranslatedMenu(parsed)
}
