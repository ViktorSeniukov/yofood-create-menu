# VERSIONING.md — Флоу версионирования

> Единственный источник правды о версии — `package.json` → поле `version`.

---

## Схема версий

Используем **Semantic Versioning**: `MAJOR.MINOR.PATCH`

| Сегмент | Когда поднимать | Пример |
|---------|-----------------|--------|
| `PATCH` | Баг-фикс, мелкий UI-твик, правка текста | `0.1.0` → `0.1.1` |
| `MINOR` | Новая фича, улучшение UX, новый шаг флоу | `0.1.1` → `0.2.0` |
| `MAJOR` | Кардинальный редизайн, смена архитектуры | `0.9.0` → `1.0.0` |

---

## Флоу при каждом изменении

```
1. Создать ветку от master: git checkout -b feat/название или fix/название
2. Сделать изменения в коде
3. Поднять версию последним коммитом в ветке (npm version patch/minor/major --no-git-tag-version)
4. Закоммитить: feat/fix/chore: описание — bump vX.Y.Z
5. Открыть PR в master
6. CI проходит (lint + type-check + test)
7. Смержить PR → git tag vX.Y.Z на master после мержа
```

### Именование веток

| Тип изменения | Формат ветки | Пример |
|---------------|--------------|--------|
| Новая фича | `feat/название` | `feat/version-display` |
| Баг-фикс | `fix/название` | `fix/translation-truncation` |
| Зависимости, конфиг | `chore/название` | `chore/update-deps` |

### Команды: создать ветку и поднять версию

```bash
# 1. Создать ветку
git checkout -b feat/my-feature

# 2. ... сделать изменения ...

# 3. Поднять версию (без автокоммита — коммитим сами с осмысленным сообщением)
npm version patch --no-git-tag-version
# или minor / major

# 4. Закоммитить всё включая package.json
git add package.json
git commit -m "feat: my feature — bump v0.2.0"

# 5. Пуш и PR
git push -u origin feat/my-feature
```

После мержа в master — вручную поставить тег:
```bash
git checkout master && git pull
git tag v0.2.0
git push origin v0.2.0
```

---

## Отображение версии в интерфейсе

Версия читается из `package.json` через Vite и отображается в хедере приложения.

### Как подключить в Vite

В `vite.config.ts` добавить:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [vue()],
})
```

В `src/env.d.ts` добавить глобальный тип:

```typescript
declare const __APP_VERSION__: string
```

В `AppHeader.vue` отображать рядом с заголовком:

```vue
<span class="app-header__version">v{{ appVersion }}</span>

<script setup lang="ts">
const appVersion = __APP_VERSION__
</script>
```

---

## Правила

- ❌ Коммитить напрямую в `master` — запрещено, только через ветку + PR
- ❌ Мержить PR без поднятия версии — запрещено
- ❌ Ставить git-тег до мержа в `master`
- ✅ Каждая ветка = одно изменение = один бамп версии
- ✅ Версия поднимается последним коммитом в ветке перед PR
- ✅ Git-теги ставятся на `master` после мержа
- ✅ Версия в хедере всегда актуальна (берётся из `package.json` на этапе сборки)

---

## Примеры коммит-сообщений при бампе

```
feat: add ingredient grouping — bump v0.2.0
fix: correct translation truncation — bump v0.1.5
chore: update deps — bump v0.1.4
```

---

## Текущая версия

Смотреть в [package.json](package.json) → поле `version`.
