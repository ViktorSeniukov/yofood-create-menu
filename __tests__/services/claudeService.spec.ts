import { describe, it, expect, vi, beforeEach } from 'vitest'

import { validateTranslatedMenu, translateMenu } from '@/services/claudeService'
import type { TranslatedMenu } from '@/types/menu'

const validMenu: TranslatedMenu = {
  'Понедельник': {
    'Завтрак': ['Омлет / Omlet'],
    'Суп': ['Борщ / Borš'],
    'Горячее': ['Стейк / Stejk'],
    'Гарнир': ['Рис / Pirinač'],
    'Салат': ['Цезарь / Cezar'],
    'Десерт': ['Торт / Torta'],
  },
  'Вторник': {
    'Завтрак': [],
    'Суп': ['Щи / Šči'],
    'Горячее': ['Котлета / Kotlet'],
    'Гарнир': ['Гречка / Heljda'],
    'Салат': [],
    'Десерт': [],
  },
  'Среда': {
    'Завтрак': ['Каша / Kaša'],
    'Суп': [],
    'Горячее': ['Рыба / Riba'],
    'Гарнир': ['Пюре / Pire'],
    'Салат': ['Греческий / Grčka'],
    'Десерт': ['Пудинг / Puding'],
  },
  'Четверг': {
    'Завтрак': ['Блины / Palačinke'],
    'Суп': ['Грибной / Gljiva čorba'],
    'Горячее': ['Курица / Piletina'],
    'Гарнир': ['Макароны / Makaroni'],
    'Салат': [],
    'Десерт': [],
  },
  'Пятница': {
    'Завтрак': ['Сырники / Sirnice'],
    'Суп': [],
    'Горячее': ['Свинина / Svinjetina'],
    'Гарнир': ['Картофель / Krompir'],
    'Салат': ['Винегрет / Vinegret'],
    'Десерт': ['Мороженое / Sladoled'],
  },
}

describe('validateTranslatedMenu', () => {
  it('returns valid menu as TranslatedMenu', () => {
    const result = validateTranslatedMenu(validMenu)
    expect(result).toEqual(validMenu)
  })

  it('throws if data is not an object', () => {
    expect(() => validateTranslatedMenu(null)).toThrow('не является объектом')
    expect(() => validateTranslatedMenu('string')).toThrow('не является объектом')
    expect(() => validateTranslatedMenu(42)).toThrow('не является объектом')
  })

  it('throws if a day is missing', () => {
    const incomplete = { ...validMenu }
    delete (incomplete as Record<string, unknown>)['Пятница']
    expect(() => validateTranslatedMenu(incomplete)).toThrow('Отсутствует день: Пятница')
  })

  it('throws if day data is not an object', () => {
    const broken = { ...validMenu, 'Понедельник': 'not an object' }
    expect(() => validateTranslatedMenu(broken)).toThrow('не являются объектом')
  })

  it('throws if a category is missing', () => {
    const broken = {
      ...validMenu,
      'Понедельник': {
        'Завтрак': [],
        'Суп': [],
        'Горячее': [],
        'Гарнир': [],
        'Салат': [],
        // missing Десерт
      },
    }
    expect(() => validateTranslatedMenu(broken)).toThrow('Отсутствует категория "Десерт"')
  })

  it('throws if a category value is not an array', () => {
    const broken = {
      ...validMenu,
      'Понедельник': {
        ...validMenu['Понедельник'],
        'Завтрак': 'not array',
      },
    }
    expect(() => validateTranslatedMenu(broken)).toThrow('не является массивом')
  })

  it('throws if a dish is not a string', () => {
    const broken = {
      ...validMenu,
      'Понедельник': {
        ...validMenu['Понедельник'],
        'Завтрак': [123],
      },
    }
    expect(() => validateTranslatedMenu(broken)).toThrow('не является строкой')
  })
})

describe('translateMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends correct request with text content', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: 'msg_1',
        content: [{ type: 'text', text: JSON.stringify(validMenu) }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 200 },
      }),
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response)

    const result = await translateMenu('menu content', 'sk-test-key')

    expect(globalThis.fetch).toHaveBeenCalledOnce()
    const callArgs = vi.mocked(globalThis.fetch).mock.calls[0]
    expect(callArgs[0]).toBe('https://api.anthropic.com/v1/messages')

    const body = JSON.parse(callArgs[1]?.body as string)
    expect(body.messages[0].content[1]).toEqual({
      type: 'text',
      text: 'menu content',
    })

    expect(result).toEqual(validMenu)
  })

  it('throws on 401 error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response)

    await expect(translateMenu('text', 'bad-key'))
      .rejects.toThrow('Неверный API-ключ')
  })

  it('throws on 429 error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 429,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response)

    await expect(translateMenu('text', 'key'))
      .rejects.toThrow('Превышен лимит запросов')
  })

  it('throws on 400 error with message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({
        error: { message: 'invalid model' },
      }),
    } as unknown as Response)

    await expect(translateMenu('text', 'key'))
      .rejects.toThrow('Ошибка запроса: invalid model')
  })

  it('throws on invalid JSON from Claude', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: 'msg_1',
        content: [{ type: 'text', text: 'not json {{{' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 10 },
      }),
    } as unknown as Response)

    await expect(translateMenu('text', 'key'))
      .rejects.toThrow('невалидный JSON')
  })

  it('throws on empty response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: 'msg_1',
        content: [],
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 0 },
      }),
    } as unknown as Response)

    await expect(translateMenu('text', 'key'))
      .rejects.toThrow('пустой ответ')
  })
})
