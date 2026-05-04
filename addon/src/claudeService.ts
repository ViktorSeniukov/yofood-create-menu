const CLAUDE_PROMPT = `Ты получаешь файл с меню корпоративного питания на сербском языке.

Твоя задача:
1. Извлечь из файла список блюд, сгруппированных по дням недели и категориям.
2. Перевести каждое блюдо на русский язык.
3. Сохранить оригинальное название на сербской латинице после слеша.
4. Вернуть результат строго в формате JSON.

Дни недели: Понедельник, Вторник, Среда, Четверг, Пятница.
Категории: Завтрак, Суп, Горячее, Гарнир, Салат, Десерт.
Формат блюда: "Русское название / Srpski naziv"

Если для какой-то категории в файле нет блюда — поставь пустой массив [].
Если в категории несколько вариантов блюд — добавь все в массив.

Верни ТОЛЬКО валидный JSON без markdown-обёртки, без пояснений.

Пример формата:
{
  "Понедельник": {
    "Завтрак": ["Омлет с беконом / Omlet sa slaninom"],
    "Суп": ["Телячий суп / Teleća čorba"],
    "Горячее": ["Говяжье рагу / Juneći ragu"],
    "Гарнир": ["Картофельное пюре / Krompir pire"],
    "Салат": ["Салат из свёклы / Cvekla salata"],
    "Десерт": ["Яблочный пирог / Pita sa jabukama"]
  }
}`

function translateMenu(base64Data: string, mimeType: string): TranslatedMenu {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('API-ключ не задан')

  const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data

  type ContentBlock =
    | { type: 'text'; text: string }
    | { type: 'document'; source: { type: 'base64'; media_type: string; data: string } }

  let fileBlock: ContentBlock

  if (mimeType === 'text/plain') {
    const bytes = Utilities.base64Decode(base64)
    const text = Utilities.newBlob(bytes).getDataAsString()
    fileBlock = { type: 'text', text }
  } else if (mimeType === 'application/msword') {
    const text = convertDocToText(base64Data, mimeType)
    fileBlock = { type: 'text', text }
  } else {
    fileBlock = { type: 'document', source: { type: 'base64', media_type: mimeType, data: base64 } }
  }

  const payload = {
    model: CLAUDE_MODEL,
    max_tokens: CLAUDE_MAX_TOKENS,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: CLAUDE_PROMPT },
          fileBlock,
        ],
      },
    ],
  }

  const response = UrlFetchApp.fetch(CLAUDE_API_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  })

  const statusCode = response.getResponseCode()

  if (statusCode === 401) throw new Error('Неверный API-ключ')
  if (statusCode === 429) throw new Error('Превышен лимит запросов, попробуйте позже')
  if (statusCode !== 200) {
    const err = JSON.parse(response.getContentText()) as { error?: { message?: string } }
    throw new Error(err?.error?.message ?? 'Ошибка сервера Claude')
  }

  const data = JSON.parse(response.getContentText()) as {
    content: Array<{ text: string }>
  }

  const menu = JSON.parse(data.content[0].text) as unknown
  return validateMenu(menu)
}

function validateMenu(data: unknown): TranslatedMenu {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Claude вернул не объект')
  }

  const result = data as Record<string, unknown>

  for (const day of DAYS_OF_WEEK) {
    if (!(day in result)) throw new Error(`Отсутствует день: ${day}`)

    const dayData = result[day] as Record<string, unknown>

    for (const category of MEAL_CATEGORIES) {
      if (!(category in dayData)) throw new Error(`Отсутствует категория "${category}" в "${day}"`)
      if (!Array.isArray(dayData[category])) throw new Error(`Категория "${category}" в "${day}" не является массивом`)
    }
  }

  return data as TranslatedMenu
}
