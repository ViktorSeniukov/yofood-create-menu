<script setup lang="ts">
import { computed, ref } from 'vue'

import { CheckOutlined } from '@ant-design/icons-vue'
import { Button, Card, Input, message, theme } from 'ant-design-vue'

import { useMenuGeneration } from '@/composables/useMenuGeneration'
import { useMenuTranslation } from '@/composables/useMenuTranslation'
import { useTemplateUpload } from '@/composables/useTemplateUpload'

import { DAYS_OF_WEEK, MEAL_CATEGORIES } from '@/constants/menu'

import type { TranslatedMenu } from '@/types/menu'

interface Props {
  menu: TranslatedMenu | null
  templateBuffer: ArrayBuffer | null
  templateFileName: string
}

const props = defineProps<Props>()

function getNextWeekFileName(): string {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + daysUntilMonday)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  const fmt = (d: Date): string =>
    `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`

  return `Meals for ${fmt(monday)}-${fmt(friday)}`
}

const fileName = ref(getNextWeekFileName())

const { isGenerating, error, generate } = useMenuGeneration()
const { translatedMenu } = useMenuTranslation()
const { hasTemplate } = useTemplateUpload()
const { token } = theme.useToken()

const hasMenu = computed(() => translatedMenu.value !== null)

const menuDaysCount = computed(() => {
  if (!translatedMenu.value) return 0
  return DAYS_OF_WEEK.filter((day) => {
    const dayMenu = translatedMenu.value![day]
    return MEAL_CATEGORIES.some((cat) => dayMenu[cat].length > 0)
  }).length
})

const canGenerate = computed(
  () => hasMenu.value && hasTemplate.value
)

const hintText = computed(() => {
  if (!hasMenu.value) return 'Загрузите меню для продолжения'
  if (!hasTemplate.value) return 'Загрузите шаблон для продолжения'
  return ''
})

async function handleClick(): Promise<void> {
  if (!props.menu || !props.templateBuffer) return
  const name = (fileName.value.trim() || getNextWeekFileName()) + '.xlsx'
  try {
    await generate(props.menu, props.templateBuffer, name)
    message.success('Файл готов!')
  } catch {
    message.error('Ошибка генерации файла')
  }
}
</script>

<template>
  <Card class="readiness-card">
    <template #title>Готовность</template>

    <div class="readiness-card__checklist">
      <!-- Menu check -->
      <div class="readiness-card__item">
        <span
          class="readiness-card__icon"
          :style="hasMenu
            ? { background: token.colorSuccessBg }
            : {
                background: token.colorBgLayout,
                border: '1px dashed'
                  + ` ${token.colorBorder}`,
              }
          "
        >
          <CheckOutlined
            v-if="hasMenu"
            :style="{
              color: token.colorSuccess,
              fontSize: '10px',
            }"
          />
        </span>
        <span
          :style="{
            color: hasMenu
              ? undefined
              : token.colorTextSecondary,
          }"
        >
          {{
            hasMenu
              ? `Меню переведено (${menuDaysCount} дней)`
              : 'Меню не загружено'
          }}
        </span>
      </div>

      <!-- Template check -->
      <div class="readiness-card__item">
        <span
          class="readiness-card__icon"
          :style="hasTemplate
            ? { background: token.colorSuccessBg }
            : {
                background: token.colorBgLayout,
                border: '1px dashed'
                  + ` ${token.colorBorder}`,
              }
          "
        >
          <CheckOutlined
            v-if="hasTemplate"
            :style="{
              color: token.colorSuccess,
              fontSize: '10px',
            }"
          />
        </span>
        <span
          :style="{
            color: hasTemplate
              ? undefined
              : token.colorTextSecondary,
          }"
        >
          {{ hasTemplate ? 'Шаблон загружен' : 'Шаблон не загружен' }}
        </span>
      </div>
    </div>
  </Card>

  <div class="generate-block">
    <Input
      v-model:value="fileName"
      addon-after=".xlsx"
      data-testid="file-name-input"
    />
    <Button
      type="primary"
      block
      :loading="isGenerating"
      :disabled="!canGenerate"
      data-testid="generate-btn"
      @click="handleClick"
    >
      Сгенерировать .xlsx
    </Button>
    <p
      v-if="hintText"
      class="generate-block__hint"
    >
      {{ hintText }}
    </p>
    <p
      v-if="error"
      class="generate-block__error"
    >
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.readiness-card {
  flex-shrink: 0;
}

.readiness-card__checklist {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.readiness-card__item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.readiness-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.generate-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.generate-block__hint {
  margin: 0;
  font-size: 11px;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.45));
  text-align: center;
}

.generate-block__error {
  margin: 0;
  font-size: 11px;
  color: var(--ant-color-error, #ff4d4f);
  text-align: center;
}
</style>
