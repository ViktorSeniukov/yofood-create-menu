# План реализации

**Техническая спецификация:** [TECH_SPEC.md](TECH_SPEC.md)
**Продуктовая спецификация:** [SPEC.md](SPEC.md)

---

## Шаг 1. Инфраструктура и типы

**Цель:** Подготовить проект к разработке — зависимости, типы, константы.

### Задачи:

- [ ] Установить `xlsx` и `@ant-design/icons-vue`
  → TECH_SPEC §8
- [ ] Создать `src/types/menu.ts` — типы `DayOfWeek`, `MealCategory`, `DayMenu`, `TranslatedMenu`
  → TECH_SPEC §2.1, SPEC §5 (формат JSON)
- [ ] Создать `src/types/claude.ts` — типы запроса/ответа Claude API
  → TECH_SPEC §2.2
- [ ] Создать `src/constants/menu.ts` — дни, категории, маппинг столбцов, конфиг API
  → TECH_SPEC §3.1, SPEC §5 (ключи), §6 (столбцы)
- [ ] Удалить placeholder-код: `src/types/user.ts`, `src/types/api.ts`, содержимое `HomePage.vue`
- [ ] Проверить что проект собирается: `vue-tsc -b && vite build`

---

## Шаг 2. Сервис Claude API

**Цель:** Реализовать единственную точку взаимодействия с Claude.

### Задачи:

- [ ] Создать `src/services/claudeService.ts`
  → TECH_SPEC §4 (публичный интерфейс, промпт, обработка ошибок)
- [ ] Реализовать `translateMenu(fileContent, fileType, apiKey)` — формирование запроса, отправка, парсинг ответа
  → TECH_SPEC §4.1 (формат передачи: text для .txt, document block для .docx)
- [ ] Реализовать `validateTranslatedMenu(data)` — валидация структуры JSON от Claude
  → TECH_SPEC §9, SPEC §9 (открытый вопрос — решён)
- [ ] Обработка HTTP-ошибок: 401, 429, 400, прочие
  → TECH_SPEC §4.1 (таблица ошибок)

---

## Шаг 3. Утилита мержа Excel

**Цель:** Реализовать вставку переведённого меню в xlsx-шаблон.

### Задачи:

- [ ] Создать `src/utils/excelMerge.ts`
  → TECH_SPEC §5 (алгоритм)
- [ ] Реализовать поиск строк-заголовков дней в листе Tech
  → TECH_SPEC §5.1 (алгоритм поиска), SPEC §6 (структура листа Tech)
- [ ] Реализовать вставку блюд в столбцы G–L
  → TECH_SPEC §5.1 (алгоритм вставки), TECH_SPEC §3.1 (MEAL_COLUMN_MAP)
- [ ] Генерация итогового файла через `XLSX.write`
  → TECH_SPEC §5.1 (генерация файла)

---

## Шаг 4. Composables

**Цель:** Реализовать бизнес-логику в реактивных хуках.

### Задачи:

- [ ] Создать `src/composables/useApiKey.ts` — чтение/запись ключа в localStorage
  → TECH_SPEC §6.1, SPEC §4.1 (настройки)
- [ ] Создать `src/composables/useMenuTranslation.ts` — загрузка файла → вызов Claude → хранение результата
  → TECH_SPEC §6.2, SPEC §3 (шаги 3–4 флоу)
- [ ] Создать `src/composables/useTemplateUpload.ts` — загрузка xlsx в ArrayBuffer
  → TECH_SPEC §6.3, SPEC §3 (шаг 5 флоу)
- [ ] Создать `src/composables/useMenuGeneration.ts` — мерж + скачивание
  → TECH_SPEC §6.4, SPEC §3 (шаг 6 флоу)

---

## Шаг 5. UI-компоненты

**Цель:** Реализовать все компоненты интерфейса.

### Задачи:

- [ ] Создать `src/components/common/AppHeader.vue` — заголовок + кнопка настроек
  → TECH_SPEC §7.1
- [ ] Создать `src/components/common/AppSettings.vue` — drawer/модалка с полем API-ключа
  → TECH_SPEC §7.2, SPEC §4.1 (настройки)
- [ ] Создать `src/components/MenuUpload.vue` — дроп-зона + запуск перевода
  → TECH_SPEC §7.3, SPEC §4.2 (Зона A)
- [ ] Создать `src/components/MenuPreview.vue` — превью переведённого меню
  → TECH_SPEC §7.4, SPEC §4.2 (Зона A — превью)
- [ ] Создать `src/components/TemplateUpload.vue` — дроп-зона для xlsx
  → TECH_SPEC §7.5, SPEC §4.2 (Зона B)
- [ ] Создать `src/components/GenerateButton.vue` — кнопка генерации
  → TECH_SPEC §7.6, SPEC §4.2 (Зона C)

---

## Шаг 6. Сборка страниц и лейаут

**Цель:** Собрать компоненты в готовые страницы.

### Задачи:

- [ ] Обновить `src/layouts/DefaultLayout.vue` — AppHeader + RouterView + стили контейнера
  → TECH_SPEC §7.8
- [ ] Обновить `src/pages/HomePage.vue` — три зоны (A, B, C) + связка composables
  → TECH_SPEC §7.7, SPEC §4.2 (главный экран)
- [ ] Проверить полный флоу визуально: загрузка файла → превью → загрузка шаблона → генерация
  → SPEC §3 (пользовательский флоу)

---

## Шаг 7. Тесты

**Цель:** Покрыть тестами критическую логику.

### Задачи:

- [ ] `__tests__/services/claudeService.spec.ts` — формирование запроса, парсинг ответа, валидация, ошибки
  → TECH_SPEC §4, §9
- [ ] `__tests__/utils/excelMerge.spec.ts` — поиск заголовков, вставка блюд, edge cases
  → TECH_SPEC §5
- [ ] `__tests__/composables/useApiKey.spec.ts` — localStorage read/write/clear
  → TECH_SPEC §6.1
- [ ] `__tests__/composables/useMenuTranslation.spec.ts` — вызов сервиса, состояния, ошибки
  → TECH_SPEC §6.2
- [ ] `__tests__/components/MenuUpload.spec.ts` — рендер, загрузка файла, состояния
  → TECH_SPEC §7.3

---

## Шаг 8. Финализация

**Цель:** Убедиться что всё работает и соответствует стандартам.

### Задачи:

- [ ] Прогнать `vue-tsc -b` — нет TS-ошибок
- [ ] Прогнать `vite build` — сборка успешна
- [ ] Прогнать `vitest run` — все тесты проходят
- [ ] Проверить соответствие CODE_STYLE.md: порядок импортов, нет `any`, BEM в стилях
- [ ] Ручной прогон полного флоу
  → SPEC §3

---

## Порядок выполнения и зависимости

```
Шаг 1 (типы, константы, зависимости)
  ↓
  ├── Шаг 2 (Claude сервис) ─── зависит от типов
  ├── Шаг 3 (Excel мерж) ────── зависит от типов + xlsx
  │
  ↓
Шаг 4 (composables) ─────────── зависит от шагов 2, 3
  ↓
Шаг 5 (UI-компоненты) ───────── зависит от шага 4
  ↓
Шаг 6 (сборка страниц) ──────── зависит от шага 5
  ↓
Шаг 7 (тесты) ───────────────── можно начинать параллельно с шага 4
  ↓
Шаг 8 (финализация)
```

> Шаги 2 и 3 можно выполнять параллельно — они независимы друг от друга.
