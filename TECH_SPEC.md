# Техническая спецификация: Генератор меню

**Версия:** 1.0
**Продуктовая спецификация:** [SPEC.md](SPEC.md)
**Стек:** Vue 3 + TypeScript + Ant Design Vue + Vite
**Код-стайл:** [CODE_STYLE.md](CODE_STYLE.md)

---

## 1. Структура проекта

> Базовая структура определена в CODE_STYLE.md §2

```
src/
├── assets/
│   └── styles/
│       └── global.css
├── components/
│   ├── common/
│   │   ├── AppHeader.vue
│   │   └── AppSettings.vue
│   ├── MenuUpload.vue
│   ├── MenuPreview.vue
│   ├── TemplateUpload.vue
│   └── GenerateButton.vue
├── composables/
│   ├── useApiKey.ts
│   ├── useMenuTranslation.ts
│   ├── useTemplateUpload.ts
│   └── useMenuGeneration.ts
├── layouts/
│   └── DefaultLayout.vue
├── pages/
│   └── HomePage.vue
├── router/
│   ├── routes.ts
│   └── index.ts
├── services/
│   └── claudeService.ts
├── types/
│   ├── menu.ts
│   └── claude.ts
├── utils/
│   └── excelMerge.ts
├── constants/
│   └── menu.ts
├── App.vue
└── main.ts
```

---

## 2. Типы

> Связь: SPEC.md §5 (формат JSON), §6 (структура Excel)

### 2.1 types/menu.ts

```typescript
type DayOfWeek =
  | 'Понедельник'
  | 'Вторник'
  | 'Среда'
  | 'Четверг'
  | 'Пятница'

type MealCategory =
  | 'Завтрак'
  | 'Суп'
  | 'Горячее'
  | 'Гарнир'
  | 'Салат'
  | 'Десерт'

/** Одно блюдо: "Русское название / Srpski naziv" */
type DishItem = string

/** Меню одного дня — категория → список блюд */
type DayMenu = Record<MealCategory, DishItem[]>

/** Полное недельное меню — день → меню дня */
type TranslatedMenu = Record<DayOfWeek, DayMenu>
```

### 2.2 types/claude.ts

```typescript
interface ClaudeMessageRequest {
  model: string
  max_tokens: number
  messages: ClaudeMessage[]
}

interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string | ClaudeContentBlock[]
}

interface ClaudeTextBlock {
  type: 'text'
  text: string
}

interface ClaudeDocumentBlock {
  type: 'document'
  source: {
    type: 'base64'
    media_type: string
    data: string
  }
}

type ClaudeContentBlock = ClaudeTextBlock | ClaudeDocumentBlock

interface ClaudeMessageResponse {
  id: string
  content: ClaudeTextBlock[]
  stop_reason: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}
```

---

## 3. Константы

> Связь: SPEC.md §5 (ключи), §6 (столбцы)

### 3.1 constants/menu.ts

```typescript
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

/**
 * Маппинг категорий на столбцы в листе Tech.
 * Столбец F (индекс 5) — Соки/напитки (не заполняется из меню).
 * Столбцы G–L (индексы 6–11) — категории блюд.
 */
const MEAL_COLUMN_MAP: Record<MealCategory, number> = {
  'Завтрак': 6,  // G
  'Суп':     7,  // H
  'Горячее': 8,  // I
  'Гарнир':  9,  // J
  'Салат':   10, // K
  'Десерт':  11, // L
}

const TECH_SHEET_NAME = 'Tech'

const CLAUDE_MODEL = 'claude-sonnet-4-6'
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MAX_TOKENS = 4096

const LOCAL_STORAGE_API_KEY = 'claude_api_key'
```

---

## 4. Сервис Claude API

> Связь: SPEC.md §5 (задача модели, формат ответа), §7 (интеграция)

### 4.1 services/claudeService.ts

**Ответственность:** Единственная точка взаимодействия с Claude API.

**Публичный интерфейс:**

```typescript
async function translateMenu(
  fileContent: string,
  fileType: 'txt' | 'docx',
  apiKey: string
): Promise<TranslatedMenu>
```

**Логика отправки файла:**

| Тип файла | Формат передачи | Content block |
|-----------|-----------------|---------------|
| `.txt`    | Текст в `content` | `{ type: 'text', text: содержимое }` |
| `.docx`   | Base64 в `document` block | `{ type: 'document', source: { type: 'base64', media_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', data: base64 } }` |

**Запрос к API:**

```
POST https://api.anthropic.com/v1/messages
Headers:
  x-api-key: <ключ пользователя>
  anthropic-version: 2023-06-01
  content-type: application/json
  anthropic-dangerous-direct-browser-access: true
```

**Промпт:**

```
Ты получаешь файл с меню корпоративного питания на сербском языке.

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
}
```

**Обработка ответа:**

1. Взять `response.content[0].text`
2. `JSON.parse()` → `TranslatedMenu`
3. Валидация: проверить наличие всех 5 дней, наличие всех 6 категорий в каждом дне
4. При ошибке парсинга или валидации — выбросить типизированную ошибку

**Обработка ошибок:**

| HTTP статус | Действие |
|-------------|----------|
| 401 | Ошибка: «Неверный API-ключ» |
| 429 | Ошибка: «Превышен лимит запросов, попробуйте позже» |
| 400 | Ошибка: «Ошибка запроса» + `response.error.message` |
| Иное | Ошибка: «Ошибка сервера Claude» |

---

## 5. Утилита мержа Excel

> Связь: SPEC.md §6 (структура Tech, алгоритм мержа)

### 5.1 utils/excelMerge.ts

**Публичный интерфейс:**

```typescript
function mergeMenuIntoTemplate(
  templateBuffer: ArrayBuffer,
  menu: TranslatedMenu
): ArrayBuffer
```

**Алгоритм поиска строк-заголовков:**

1. Открыть workbook: `XLSX.read(templateBuffer, { type: 'array' })`
2. Получить лист `Tech`: `workbook.Sheets['Tech']`
3. Пройти по столбцу A (или B) сверху вниз
4. Для каждой ячейки проверить: содержит ли текст название дня (`Понедельник`, `Вторник`, ...) — поиск по подстроке, case-insensitive
5. Запомнить номер строки-заголовка для каждого дня

**Алгоритм вставки блюд:**

Для каждого дня:
1. Начальная строка = строка-заголовок + 1 (первая строка данных после заголовка)
2. Для каждой категории (`Завтрак`...`Десерт`):
   - Определить столбец по `MEAL_COLUMN_MAP`
   - Значение ячейки = `menu[день][категория].join(', ')` (если несколько блюд — через запятую)
   - Записать в ячейку: `sheet[XLSX.utils.encode_cell({ r: row, c: col })] = { t: 's', v: value }`
3. Повторить для всех строк сотрудников (от строки-заголовок+1 до следующего заголовка или конца данных)

**Важно:** Блюда вставляются одинаково во ВСЕ строки сотрудников внутри блока дня. Это данные для формирования выпадающих списков (data validation), а не индивидуальный выбор.

**Генерация файла:**

```typescript
XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
```

---

## 6. Composables

> Связь: CODE_STYLE.md §6 (правила composables)

### 6.1 useApiKey

```typescript
function useApiKey(): {
  apiKey: Ref<string>
  hasApiKey: ComputedRef<boolean>
  saveApiKey: (key: string) => void
  clearApiKey: () => void
}
```

- Читает/пишет в `localStorage` по ключу `LOCAL_STORAGE_API_KEY`
- `apiKey` инициализируется из `localStorage` при создании
- `saveApiKey` обновляет и ref, и localStorage
- `clearApiKey` удаляет из обоих

### 6.2 useMenuTranslation

```typescript
function useMenuTranslation(): {
  translatedMenu: Ref<TranslatedMenu | null>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  translateFile: (file: File) => Promise<void>
  reset: () => void
}
```

- `translateFile`: читает файл через `FileReader` (`.txt` → `readAsText`, `.docx` → `readAsDataURL` → base64), вызывает `claudeService.translateMenu`
- Получает `apiKey` из `useApiKey` внутри себя
- При отсутствии API-ключа — `error = 'API-ключ не задан'`

### 6.3 useTemplateUpload

```typescript
function useTemplateUpload(): {
  templateBuffer: Ref<ArrayBuffer | null>
  templateFileName: Ref<string>
  hasTemplate: ComputedRef<boolean>
  uploadTemplate: (file: File) => Promise<void>
  reset: () => void
}
```

- `uploadTemplate`: читает `.xlsx` через `FileReader.readAsArrayBuffer`

### 6.4 useMenuGeneration

```typescript
function useMenuGeneration(): {
  isGenerating: Ref<boolean>
  error: Ref<string | null>
  canGenerate: ComputedRef<boolean>
  generate: (
    menu: TranslatedMenu,
    templateBuffer: ArrayBuffer,
    fileName: string
  ) => Promise<void>
}
```

- `canGenerate` — `true` когда `menu !== null && templateBuffer !== null`
- `generate`: вызывает `mergeMenuIntoTemplate`, создаёт `Blob`, триггерит скачивание через `URL.createObjectURL` + `<a>` click

---

## 7. Компоненты

> Связь: SPEC.md §4 (экраны), CODE_STYLE.md §3 (правила компонентов)

### 7.1 AppHeader

- Заголовок приложения: «Генератор меню»
- Иконка настроек (Ant Design `SettingOutlined`) → открывает `AppSettings`

### 7.2 AppSettings

- Ant Design `Drawer` или `Modal`
- Поле ввода API-ключа (Input.Password для маскировки)
- Кнопка «Сохранить» / «Очистить»
- Использует `useApiKey`

### 7.3 MenuUpload

- Ant Design `Upload.Dragger`
- Accept: `.txt, .docx`
- После выбора файла — автоматически вызывает `translateFile`
- Показывает состояние: загрузка (Spin) / ошибка (Alert) / успех (→ MenuPreview)
- Использует `useMenuTranslation`

### 7.4 MenuPreview

- Props: `menu: TranslatedMenu`
- Ant Design `Table` или `Collapse` — превью переведённого меню по дням
- Кнопка «Скачать JSON» — `JSON.stringify` + download

### 7.5 TemplateUpload

- Ant Design `Upload.Dragger`
- Accept: `.xlsx`
- Показывает имя загруженного файла и статус
- Использует `useTemplateUpload`

### 7.6 GenerateButton

- Ant Design `Button`, type `primary`, размер `large`
- `disabled` когда `!canGenerate`
- По клику: вызывает `generate`
- Показывает Spin во время генерации
- Использует `useMenuGeneration`

### 7.7 HomePage

- Собирает зоны A, B, C последовательно через `Steps` или визуальные карточки
- Передаёт данные между компонентами через composables

### 7.8 DefaultLayout

- `AppHeader` сверху
- `<RouterView />` ниже
- Максимальная ширина контента: 800px, центрирование

---

## 8. Зависимости

### Добавить:

| Пакет | Назначение |
|-------|-----------|
| `xlsx` | Чтение и запись .xlsx на фронтенде (SheetJS) |
| `@ant-design/icons-vue` | Иконки для Ant Design (SettingOutlined и др.) |

### Уже установлены:

| Пакет | Версия |
|-------|--------|
| `vue` | ^3.5.13 |
| `vue-router` | ^4.5.0 |
| `ant-design-vue` | ^4.2.6 |
| `vitest` | ^3.0.0 |
| `@vue/test-utils` | ^2.4.6 |

---

## 9. Валидация ответа Claude

> Связь: SPEC.md §9 (открытые вопросы — решено: да, валидация нужна)

Функция `validateTranslatedMenu(data: unknown): TranslatedMenu` в `services/claudeService.ts`:

1. Проверить что `data` — объект
2. Проверить наличие всех 5 ключей-дней
3. Для каждого дня — проверить наличие всех 6 категорий
4. Для каждой категории — проверить что значение является массивом строк
5. При несоответствии — выбросить ошибку с описанием, что именно не так

---

## 10. Обработка edge cases

> Связь: SPEC.md §8, §9

| Ситуация | Поведение |
|----------|-----------|
| API-ключ не задан | Показать предупреждение, блокировать загрузку меню |
| Claude вернул невалидный JSON | Показать ошибку, предложить повторить |
| В меню нет блюда для категории | Claude вернёт `[]`, при мерже ячейка остаётся пустой |
| Лист Tech не найден в шаблоне | Показать ошибку: «Лист Tech не найден в загруженном файле» |
| Заголовок дня не найден в Tech | Пропустить день, показать предупреждение |
| Файл не .txt и не .docx | Upload не примет (фильтр accept), ошибка если обошли |
| Сетевая ошибка при запросе | Показать ошибку, предложить повторить |

---

## 11. Безопасность

- API-ключ хранится только в `localStorage`, не логируется, не отправляется никуда кроме `api.anthropic.com`
- Заголовок `anthropic-dangerous-direct-browser-access: true` — обязателен для прямых запросов из браузера
- Файлы обрабатываются только в памяти браузера
- Нет серверной части, нет хранения данных
