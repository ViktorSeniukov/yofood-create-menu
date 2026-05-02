# Google Sheets Add-on: Исследование

## Что меняется и что остаётся

Веб-приложение решает задачу в три шага: (1) загрузить меню → (2) сгенерировать .xlsx → (3) вручную загрузить файл в Google Sheets.
Add-on убирает шаги 2 и 3 — он живёт внутри Google Sheets и пишет прямо в открытую таблицу.

---

## Стек

| Слой | Веб-приложение | GAS Add-on |
|------|----------------|------------|
| Язык | TypeScript + Vue 3 | Google Apps Script (ES6-like JS) |
| UI | Ant Design Vue компоненты | HTML Service (sidebar / dialog) — чистый HTML/CSS/JS |
| Claude API | `fetch()` из браузера + заголовок `anthropic-dangerous-direct-browser-access` | `UrlFetchApp.fetch()` на сервере GAS — заголовок не нужен |
| Хранение API-ключа | `localStorage` | `PropertiesService.getUserProperties()` |
| Запись результата | SheetJS → скачать .xlsx | `SpreadsheetApp.getActiveSpreadsheet()` — писать прямо в ячейки |
| Загрузка файла меню | `<input type="file">` → `FileReader` | HTML-форма в sidebar → `google.script.run` → GAS |

---

## Архитектура add-on

```
Sidebar (HTML Service)
│
├── Поле для API-ключа  →  google.script.run.saveApiKey(key)
│                               ↓
│                         PropertiesService.getUserProperties()
│
├── Загрузка файла меню (base64)
│         ↓
│   google.script.run.translateMenu(base64, mimeType)
│         ↓
│   UrlFetchApp → api.anthropic.com/v1/messages
│         ↓
│   JSON.parse(response) → TranslatedMenu
│         ↓
│   SpreadsheetApp.getActiveSpreadsheet()
│         .getSheetByName('Tech')
│         .getRange(row, col).setValue(dish)
│
└── Готово — данные уже в таблице
```

---

## Маппинг существующего кода

### `services/claudeService.ts` → `claudeService.gs`

Почти без изменений по логике. Отличия:
- `fetch()` заменяется на `UrlFetchApp.fetch()`
- Убирается заголовок `anthropic-dangerous-direct-browser-access`
- Весь код работает на стороне GAS-сервера (не в браузере)

```javascript
// GAS-версия
function translateMenu(fileBase64, mimeType, apiKey) {
  const payload = buildClaudeRequest(fileBase64, mimeType)
  const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    payload: JSON.stringify(payload),
  })
  const data = JSON.parse(response.getContentText())
  return JSON.parse(data.content[0].text)
}
```

### `useApiKey.ts` (localStorage) → PropertiesService

```javascript
// Сохранить
function saveApiKey(key) {
  PropertiesService.getUserProperties().setProperty('claude_api_key', key)
}

// Прочитать
function getApiKey() {
  return PropertiesService.getUserProperties().getProperty('claude_api_key')
}
```

Преимущество: ключ привязан к Google-аккаунту пользователя, не теряется при очистке браузера.

### `utils/excelMerge.ts` (SheetJS) → SpreadsheetApp

SheetJS полностью заменяется нативным API Google Sheets. Логика мержа сохраняется, но вместо записи в ячейку буфера — прямой вызов:

```javascript
function writeMenuToSheet(menu) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const tech = ss.getSheetByName('Tech')

  const MEAL_COL = { Завтрак: 7, Суп: 8, Горячее: 9, Гарнир: 10, Салат: 11, Десерт: 12 }
  const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница']
  const data = tech.getDataRange().getValues()

  for (const day of DAYS) {
    // Найти строку-заголовок по подстроке
    const headerRow = data.findIndex(row =>
      String(row[0]).includes(day) || String(row[1]).includes(day)
    )
    if (headerRow === -1) continue

    const dataRow = headerRow + 2 // 1-indexed в GAS + пропуск заголовка

    for (const [category, col] of Object.entries(MEAL_COL)) {
      const dishes = menu[day]?.[category] ?? []
      tech.getRange(dataRow, col).setValue(dishes.join(', '))
    }
  }
}
```

### UI (Vue компоненты) → HTML Service sidebar

Vue не работает в GAS. Sidebar — это обычный HTML/CSS/JS файл (.html) с минимальным UI:
- Input для API-ключа
- `<input type="file">` для загрузки меню
- Кнопка «Перевести и вставить»
- Статус (спиннер / ошибка / успех)

Общение между sidebar и GAS-сервером:
```javascript
// В sidebar (клиент)
google.script.run
  .withSuccessHandler(onSuccess)
  .withFailureHandler(onError)
  .translateAndFill(base64Content, mimeType)
```

---

## Структура проекта add-on (GAS)

```
addon/
├── appsscript.json        ← manifest (OAuth scopes, add-on config)
├── Code.gs                ← точка входа: onOpen(), showSidebar()
├── claudeService.gs       ← вызов Claude API через UrlFetchApp
├── sheetWriter.gs         ← запись результата в Tech лист
├── apiKeyService.gs       ← сохранение/чтение ключа через PropertiesService
└── sidebar.html           ← UI (HTML + inline CSS/JS)
```

---

## Ограничения GAS, о которых нужно знать

| Ограничение | Значение | Влияние |
|-------------|----------|---------|
| Execution time (add-on) | 6 минут | Claude API обычно отвечает < 30 сек — не проблема |
| `UrlFetchApp` response size | 50 MB | Claude ответ << 1 MB — не проблема |
| Размер файла .docx через sidebar | ~1–2 MB base64 в `google.script.run` аргументах | Большие .docx могут упереться в лимит 50 MB данных клиент-сервер |
| Нет npm / node_modules | — | Нельзя использовать SheetJS, axios и т.д. — только GAS API |
| ES6, но нет TypeScript | — | Нужно писать на JS или использовать clasp + TypeScript (транспилирует) |

---

## Инструментарий разработки

**Рекомендуется: [clasp](https://github.com/google/clasp)** — CLI для разработки GAS локально с TypeScript.

```bash
npm install -g @google/clasp
clasp login
clasp create --type sheets  # создать новый add-on проект
clasp push                  # задеплоить изменения
```

С clasp можно:
- Писать на TypeScript (транспилируется в GAS JS)
- Держать код в git
- Использовать нормальный редактор (VS Code)

---

## Что упрощается по сравнению с веб-приложением

1. **Нет шага «скачать + загрузить»** — пишем прямо в таблицу
2. **Нет шаблона для загрузки** — add-on работает с текущей открытой таблицей
3. **Нет `anthropic-dangerous-direct-browser-access`** — запрос идёт с сервера GAS
4. **API-ключ надёжнее** — PropertiesService привязан к аккаунту

## Что усложняется

1. **Нет Vue / компонентного фреймворка** — UI пишется на чистом HTML/JS
2. **Асинхронность иначе** — `google.script.run` работает через callback, не async/await
3. **Деплой** — нужно публиковать через Google Workspace Marketplace или давать доступ по email
4. **Отладка** — GAS Logger + Apps Script dashboard, нет привычного DevTools

---

## Следующие шаги (если двигаться дальше)

1. Настроить clasp + TypeScript окружение в папке `addon/`
2. Портировать `claudeService.ts` → `claudeService.ts` для GAS
3. Написать `sheetWriter.ts` на основе логики `excelMerge.ts`
4. Создать sidebar HTML UI
5. Протестировать на реальной таблице в dev-режиме
6. Опубликовать как Editor Add-on (для личного/командного использования — достаточно без Marketplace)
