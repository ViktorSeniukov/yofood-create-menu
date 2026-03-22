# Code Style Guide — Vue 3 + TypeScript

> Версия 1.2 | Руководство для Claude при написании кода проекта

---

## 1. Общие принципы

- Код пишется **на английском** (переменные, функции, комментарии в коде)
- Комментарии к сложной логике — обязательны
- Предпочитай **явное** неявному: типы, названия, структура
- Максимальная длина строки — **100 символов**
- Отступы — **2 пробела**

---

## 2. Структура проекта

```
src/
├── assets/               # Статика: изображения, шрифты, глобальные стили
├── components/           # Переиспользуемые компоненты
│   ├── ui/               # Обёртки над Ant Design: UiButton, UiModal и т.д.
│   └── common/           # Составные компоненты: AppHeader, AppSidebar и т.д.
├── composables/          # useXxx хуки
├── layouts/              # Лейауты страниц
├── pages/                # Страницы (соответствуют роутам)
├── router/
│   ├── routes.ts         # Единый файл со всеми роутами
│   └── index.ts          # createRouter + export
├── services/             # API-слой, внешние сервисы
├── types/                # Глобальные TypeScript типы и интерфейсы
├── utils/                # Чистые утилитарные функции
└── App.vue
```

### Структура `router/`

Весь роутинг описывается в одном файле `routes.ts`. Файл `index.ts` только создаёт и экспортирует экземпляр роутера.

```typescript
// router/routes.ts
import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/pages/HomePage.vue'),
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/pages/UsersPage.vue'),
      },
      {
        path: 'users/:id',
        name: 'user-detail',
        component: () => import('@/pages/UserDetailPage.vue'),
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue'),
  },
]
```

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
```

- Имена роутов — **kebab-case**: `'user-detail'`, `'order-list'`
- Все компоненты страниц — **ленивая загрузка** через `() => import(...)`
- Группировка роутов — через **вложенные children** с layout-компонентами

---

## 3. Компоненты Vue

### 3.1 Синтаксис

- Всегда использовать **`<script setup lang="ts">`**
- Порядок блоков: `<script setup>` → `<template>` → `<style scoped>`

```vue
<script setup lang="ts">
// imports
// types/interfaces (локальные)
// props & emits
// composables
// reactive state
// computed
// watchers
// lifecycle hooks
// methods
</script>

<template>
  <!-- разметка -->
</template>

<style scoped>
/* стили */
</style>
```

### 3.2 Props и Emits

```typescript
// Props — всегда с типами, без withDefaults если не нужны дефолты
interface Props {
  title: string
  count?: number
  isActive?: boolean
}

const props = defineProps<Props>()

// С дефолтами
const props = withDefaults(defineProps<Props>(), {
  count: 0,
  isActive: false,
})

// Emits
const emit = defineEmits<{
  submit: [value: string]
  close: []
  update: [id: number, data: UserData]
}>()
```

### 3.3 Именование компонентов

| Тип | Формат | Пример |
|-----|--------|--------|
| Файл компонента | PascalCase | `UserCard.vue` |
| Использование в шаблоне | PascalCase | `<UserCard />` |
| UI-обёртки (Ant Design) | Префикс `Ui` | `UiButton.vue`, `UiModal.vue` |
| Общие составные компоненты | Префикс `App` | `AppHeader.vue`, `AppSidebar.vue` |
| Компоненты страниц | Суффикс `Page` | `ProfilePage.vue` |
| Лейауты | Суффикс `Layout` | `DefaultLayout.vue` |

---

## 4. Ant Design (ant-design-vue)

### 4.1 Использование компонентов

- Ant Design компоненты импортируются напрямую там, где используются
- **Не создавать обёртку** вокруг каждого AntD компонента — только если нужна кастомная логика или унификация поведения

```vue
<script setup lang="ts">
// ✅ Прямой импорт — компонент используется as-is
import { Button, Table, Modal } from 'ant-design-vue'

// ✅ Обёртка — если нужна кастомная логика
import UiConfirmButton from '@/components/ui/UiConfirmButton.vue'
</script>
```

### 4.2 Когда создавать UI-обёртку (`components/ui/`)

Создавать `Ui`-компонент если:
- Нужны проектные дефолты, повторяющиеся в 3+ местах
- Нужна дополнительная логика поверх AntD (confirmation, form binding)
- Нужно скрыть сложность составного паттерна (Popconfirm + Button)

```vue
<!-- components/ui/UiConfirmButton.vue -->
<script setup lang="ts">
import { Button, Popconfirm } from 'ant-design-vue'

interface Props {
  confirmTitle?: string
  loading?: boolean
  danger?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmTitle: 'Are you sure?',
  loading: false,
  danger: false,
})

const emit = defineEmits<{
  confirm: []
}>()
</script>

<template>
  <Popconfirm :title="confirmTitle" @confirm="emit('confirm')">
    <Button :loading="loading" :danger="danger">
      <slot />
    </Button>
  </Popconfirm>
</template>
```

### 4.3 Темизация

- Кастомизация — только через токены темы в `ConfigProvider`, не через CSS
- `ConfigProvider` оборачивает приложение в `App.vue`

```typescript
// App.vue
import { ConfigProvider, theme } from 'ant-design-vue'

const themeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 6,
  },
}
```

### 4.4 Формы

- Использовать `Form` + `Form.Item` с `v-model:value`
- Валидация — через `rules` в `Form.Item`, не вручную в скрипте

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { Form, FormItem, Input, InputPassword } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'

interface FormState {
  email: string
  password: string
}

const formState = reactive<FormState>({
  email: '',
  password: '',
})

const rules: Record<keyof FormState, Rule[]> = {
  email: [
    { required: true, message: 'Email is required' },
    { type: 'email', message: 'Invalid email format' },
  ],
  password: [
    { required: true, message: 'Password is required' },
    { min: 8, message: 'Minimum 8 characters' },
  ],
}
</script>

<template>
  <Form :model="formState" :rules="rules" layout="vertical">
    <FormItem name="email" label="Email">
      <Input v-model:value="formState.email" />
    </FormItem>
    <FormItem name="password" label="Password">
      <InputPassword v-model:value="formState.password" />
    </FormItem>
  </Form>
</template>
```

---

## 5. TypeScript

### 5.1 Основные правила

- **Запрещён `any`** — использовать `unknown` с narrowing или конкретные типы
- Всегда явно типизировать возвращаемые значения функций
- Предпочитать `interface` для объектов, `type` для union/intersection

```typescript
// ✅ Хорошо
interface User {
  id: number
  name: string
  email: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

function getUser(id: number): Promise<User> { ... }

// ❌ Плохо
const getUser = async (id: any) => { ... }
```

### 5.2 Типы для API

```typescript
// src/types/user.ts
export interface User {
  id: number
  name: string
  email: string
  createdAt: string
}

export interface CreateUserDto {
  name: string
  email: string
  password: string
}

export interface UpdateUserDto {
  name?: string
  email?: string
}
```

### 5.3 Generics

```typescript
// src/types/api.ts
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}
```

---

## 6. Composables

- Имя всегда начинается с **`use`**
- Файл: `useXxx.ts` в `src/composables/`
- Возвращает объект с именованными свойствами

```typescript
// src/composables/useUsers.ts
import { ref } from 'vue'
import { userService } from '@/services/userService'
import type { User } from '@/types/user'

export function useUsers() {
  const users = ref<User[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchUsers(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      users.value = await userService.getAll()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      isLoading.value = false
    }
  }

  return { users, isLoading, error, fetchUsers }
}
```

---

## 7. Services (API-слой)

- Вся работа с API — только через сервисы, не напрямую в компонентах
- Файл: `src/services/xxxService.ts`

```typescript
// src/services/userService.ts
import { apiClient } from './apiClient'
import type { User, CreateUserDto, UpdateUserDto } from '@/types/user'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

export const userService = {
  async getById(id: number): Promise<User> {
    const { data } = await apiClient.get<ApiResponse<User>>(`/users/${id}`)
    return data.data
  },

  async getAll(page = 1, limit = 20): Promise<PaginatedResponse<User>> {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<User>>>('/users', {
      params: { page, limit },
    })
    return data.data
  },

  async create(dto: CreateUserDto): Promise<User> {
    const { data } = await apiClient.post<ApiResponse<User>>('/users', dto)
    return data.data
  },

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const { data } = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, dto)
    return data.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/users/${id}`)
  },
}
```

---

## 8. Тесты

Используется **Vitest** + **@vue/test-utils**.

### 8.1 Структура файлов

Тесты зеркалируют структуру `src/` в папке `__tests__/`:

```
src/
├── components/
│   └── UserCard.vue
├── composables/
│   └── useUsers.ts
└── utils/
    └── formatDate.ts

__tests__/
├── components/
│   └── UserCard.spec.ts
├── composables/
│   └── useUsers.spec.ts
└── utils/
    └── formatDate.spec.ts
```

### 8.2 UI-тесты (компоненты)

Тестируем **поведение с точки зрения пользователя**, а не детали реализации.

```typescript
// __tests__/components/UserCard.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UserCard from '@/components/UserCard.vue'
import type { User } from '@/types/user'

const mockUser: User = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: '2024-01-01',
}

describe('UserCard', () => {
  it('renders user name and email', () => {
    const wrapper = mount(UserCard, {
      props: { user: mockUser },
    })

    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('john@example.com')
  })

  it('emits edit event when edit button is clicked', async () => {
    const wrapper = mount(UserCard, {
      props: { user: mockUser, canEdit: true },
    })

    await wrapper.find('[data-testid="edit-btn"]').trigger('click')

    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')![0]).toEqual([mockUser])
  })

  it('shows compact name when isCompact is true', () => {
    const wrapper = mount(UserCard, {
      props: { user: mockUser, isCompact: true },
    })

    expect(wrapper.text()).toContain('John')
    expect(wrapper.text()).not.toContain('John Doe')
  })
})
```

**Правила UI-тестов:**
- Использовать `data-testid` атрибуты для поиска интерактивных элементов
- Не тестировать внутренние переменные — только DOM и emits
- Мокать сервисы через `vi.mock`, не делать реальные HTTP-запросы
- Каждый `it` — одно поведение / один сценарий

### 8.3 Функциональные тесты (composables, utils, services)

```typescript
// __tests__/composables/useUsers.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUsers } from '@/composables/useUsers'
import { userService } from '@/services/userService'
import type { User } from '@/types/user'

vi.mock('@/services/userService')

const mockUsers: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com', createdAt: '2024-01-01' },
  { id: 2, name: 'Bob', email: 'bob@example.com', createdAt: '2024-01-02' },
]

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets isLoading during fetch and clears it after', async () => {
    vi.mocked(userService.getAll).mockResolvedValue(mockUsers)

    const { isLoading, fetchUsers } = useUsers()

    const promise = fetchUsers()
    expect(isLoading.value).toBe(true)

    await promise
    expect(isLoading.value).toBe(false)
  })

  it('populates users on successful fetch', async () => {
    vi.mocked(userService.getAll).mockResolvedValue(mockUsers)

    const { users, fetchUsers } = useUsers()
    await fetchUsers()

    expect(users.value).toEqual(mockUsers)
  })

  it('sets error message on fetch failure', async () => {
    vi.mocked(userService.getAll).mockRejectedValue(new Error('Network error'))

    const { error, fetchUsers } = useUsers()
    await fetchUsers()

    expect(error.value).toBe('Network error')
  })
})
```

```typescript
// __tests__/utils/formatDate.spec.ts
import { describe, it, expect } from 'vitest'
import { formatDate } from '@/utils/formatDate'

describe('formatDate', () => {
  it('formats ISO string to DD.MM.YYYY', () => {
    expect(formatDate('2024-03-15')).toBe('15.03.2024')
  })

  it('returns empty string for null input', () => {
    expect(formatDate(null)).toBe('')
  })
})
```

**Правила функциональных тестов:**
- Тестировать все публичные случаи: happy path + edge cases + ошибки
- `beforeEach` — сброс моков через `vi.clearAllMocks()`
- Моки объявлять через `vi.mock(...)` на уровне модуля
- Тестировать контракт функции, а не её внутреннюю реализацию

### 8.4 Общие правила тестов

| Правило | Детали |
|---------|--------|
| Именование | `it('does X when Y')` — глагол + условие |
| Группировка | `describe` по компоненту/функции, вложенный `describe` по сценарию |
| Изоляция | Каждый тест независим, не полагается на порядок выполнения |
| TypeScript | Те же правила — нет `any`, типизированные моки |
| Покрытие | Обязательно: happy path, пустые/нулевые данные, ошибки |

---

## 9. Именование

### Переменные и функции

| Что | Формат | Пример |
|-----|--------|--------|
| Переменная | camelCase | `userName`, `isLoading` |
| Константа | camelCase | `maxRetries` |
| Глобальная константа | SCREAMING_SNAKE | `API_BASE_URL` |
| Функция | camelCase, глагол | `fetchUser()`, `handleSubmit()` |
| Булевая переменная | `is/has/can/should` prefix | `isActive`, `hasError` |
| Обработчик события | `handle` prefix | `handleClick`, `handleSubmit` |
| Async функция | без суффикса Async | `fetchUser()`, не `fetchUserAsync()` |

### CSS классы

- Методология **BEM** для всех компонентных стилей
- `data-testid` — только для тестов, не использовать в CSS-селекторах

```html
<div class="user-card">
  <div class="user-card__header">
    <span class="user-card__name user-card__name--highlighted">John</span>
  </div>
  <button class="user-card__action" data-testid="edit-btn">Edit</button>
</div>
```

---

## 10. Шаблоны (Template)

```vue
<template>
  <!-- Самозакрывающие теги для компонентов без слотов -->
  <UserCard />

  <!-- v-if/v-else — не смешивать с v-for на одном элементе -->
  <template v-if="isLoading">
    <Spin />
  </template>
  <template v-else>
    <UserList :users="users" />
  </template>

  <!-- v-for всегда с :key -->
  <UserCard
    v-for="user in users"
    :key="user.id"
    :user="user"
    @click="handleUserClick(user)"
  />

  <!-- Сложные условия — выносить в computed -->
  <div v-if="canShowAdminPanel">...</div>
</template>

<script setup lang="ts">
const canShowAdminPanel = computed(
  () => currentUser.value?.role === 'admin' && isAuthenticated.value
)
</script>
```

---

## 11. Обработка ошибок

```typescript
async function fetchData(): Promise<void> {
  isLoading.value = true
  error.value = null

  try {
    data.value = await someService.getData()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
    console.error('[fetchData]', err)
  } finally {
    isLoading.value = false
  }
}
```

---

## 12. Импорты

Порядок групп (разделены пустой строкой):

```typescript
// 1. Vue и экосистема
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// 2. Сторонние библиотеки (включая Ant Design)
import { Button, Table, Modal } from 'ant-design-vue'
import { format } from 'date-fns'

// 3. Composables
import { useNotification } from '@/composables/useNotification'

// 4. Services
import { userService } from '@/services/userService'

// 5. Компоненты
import UserCard from '@/components/UserCard.vue'
import UiConfirmButton from '@/components/ui/UiConfirmButton.vue'

// 6. Типы (всегда import type)
import type { User } from '@/types/user'
```

**Алиас `@` всегда вместо относительных путей** (кроме файлов в той же директории).

---

## 13. CSS / Стили

- **`<style scoped>`** — по умолчанию для всех компонентов
- Глобальные стили — только в `src/assets/styles/`
- Не переопределять стили Ant Design через CSS — только через токены темы
- Порядок свойств: позиционирование → размеры → отступы → оформление → текст → прочее

```vue
<style scoped>
.user-card {
  /* Позиционирование */
  display: flex;
  align-items: center;

  /* Размеры */
  width: 100%;

  /* Отступы */
  padding: 16px;
  gap: 12px;

  /* Оформление */
  background-color: var(--color-surface);
  border-radius: 8px;

  /* Текст */
  font-size: 14px;
  color: var(--color-text-primary);
}
</style>
```

---

## 14. CI / Проверки перед мержем в master

Пуш и мерж в ветку `master` **запрещены без прохождения** трёх обязательных проверок: линтер, тайпчек и тесты. Все три запускаются автоматически в CI и должны завершаться с кодом `0`.

### 14.1 Обязательные проверки

| Проверка | Команда | Что проверяет |
|----------|---------|---------------|
| Линтер | `npm run lint` | Стиль кода, ESLint-правила, vue-specific правила |
| Тайпчек | `npm run type-check` | Корректность TypeScript без компиляции (`vue-tsc --noEmit`) |
| Тесты | `npm run test` | Все юнит-тесты через Vitest |

### 14.2 Конфигурация CI (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  check:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Test
        run: npm run test
```

### 14.3 Скрипты в `package.json`

```json
{
  "scripts": {
    "lint": "eslint . --ext .vue,.ts,.tsx --max-warnings 0",
    "type-check": "vue-tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- `--max-warnings 0` — предупреждения ESLint трактуются как ошибки, CI падает
- `vue-tsc --noEmit` — тайпчек включает `.vue` файлы, не только `.ts`
- `vitest run` — однократный запуск без watch-режима, подходит для CI

### 14.4 Локальная проверка перед пушем

Перед пушем в `master` (или открытием PR) обязательно запустить все три проверки локально:

```bash
npm run lint && npm run type-check && npm run test
```

Для автоматизации можно настроить `pre-push` хук через **Husky**:

```bash
npx husky init
echo "npm run lint && npm run type-check && npm run test" > .husky/pre-push
```

### 14.5 Правила

- ❌ Мержить в `master` при красном CI — запрещено
- ❌ Отключать или пропускать проверки через `--no-verify` или `skipCI` — запрещено
- ❌ Коммитить код с `@ts-ignore` / `@ts-expect-error` без объяснительного комментария рядом
- ✅ Все три проверки зелёные — обязательное условие для мержа
- ✅ PR в `master` защищён branch protection rule: требует прохождения CI

---

## 15. Что запрещено

- ❌ `any` — использовать `unknown` или конкретный тип
- ❌ `Options API` — только Composition API + `<script setup>`
- ❌ Мутация props напрямую
- ❌ Прямые вызовы `fetch`/`axios` в компонентах — только через сервисы
- ❌ Логика в шаблоне (сложные выражения) — выносить в `computed`
- ❌ `console.log` в продакшн-коде (только `console.error` с контекстом)
- ❌ Магические числа и строки без констант
- ❌ Относительные импорты за пределами текущей директории (`../../`)
- ❌ Переопределение стилей Ant Design через CSS (только через токены темы)
- ❌ Несколько файлов с роутами — все роуты только в `router/routes.ts`
- ❌ `data-testid` в CSS-селекторах — только для тестов
- ❌ Мержить в `master` при красном CI — см. раздел 14

---

## 16. Пример полного компонента

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from 'ant-design-vue'
import UiConfirmButton from '@/components/ui/UiConfirmButton.vue'
import type { User } from '@/types/user'

interface Props {
  user: User
  isCompact?: boolean
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isCompact: false,
  canEdit: false,
})

const emit = defineEmits<{
  edit: [user: User]
  delete: [userId: number]
}>()

const isDeleting = ref(false)

const displayName = computed(() =>
  props.isCompact ? props.user.name.split(' ')[0] : props.user.name
)

async function handleDelete(): Promise<void> {
  isDeleting.value = true
  try {
    emit('delete', props.user.id)
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="user-card" :class="{ 'user-card--compact': isCompact }">
    <span class="user-card__name">{{ displayName }}</span>
    <span class="user-card__email">{{ user.email }}</span>

    <template v-if="canEdit">
      <Button data-testid="edit-btn" @click="emit('edit', user)">
        Edit
      </Button>
      <UiConfirmButton
        data-testid="delete-btn"
        danger
        confirm-title="Delete this user?"
        :loading="isDeleting"
        @confirm="handleDelete"
      >
        Delete
      </UiConfirmButton>
    </template>
  </div>
</template>

<style scoped>
.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: var(--color-surface);
  border-radius: 8px;
}

.user-card--compact {
  padding: 8px;
}

.user-card__name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.user-card__email {
  font-size: 13px;
  color: var(--color-text-secondary);
}
</style>
```