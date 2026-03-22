<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  DownloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons-vue'
import { Button, Card, Tabs, TabPane, theme } from 'ant-design-vue'

import { DAYS_OF_WEEK, MEAL_CATEGORIES } from '@/constants/menu'
import { DAY_SHEET_NAMES } from '@/constants/menu'
import { buildMenuWorkbook } from '@/utils/excelMerge'

import type { TranslatedMenu, DayOfWeek, MealCategory } from '@/types/menu'

interface Props {
  menu: TranslatedMenu | null
}

const props = defineProps<Props>()

const { token } = theme.useToken()
const activeDay = ref<string>(DAY_SHEET_NAMES[0])

const availableDays = computed(() => {
  if (!props.menu) return []
  return DAYS_OF_WEEK
    .map((day, idx) => ({ full: day, short: DAY_SHEET_NAMES[idx] }))
    .filter(({ full }) => {
      const dayMenu = props.menu![full]
      return MEAL_CATEGORIES.some((cat) => dayMenu[cat].length > 0)
    })
})

/** Порядок категорий для превью: соки в конце (одинаковые на все дни) */
const PREVIEW_CATEGORIES: MealCategory[] = [
  'Завтрак', 'Суп', 'Горячее', 'Гарнир', 'Салат', 'Десерт', 'Сок',
]

function categoriesForDay(
  day: DayOfWeek
): { name: MealCategory; items: string[] }[] {
  if (!props.menu) return []
  return PREVIEW_CATEGORIES
    .filter((cat) => props.menu![day][cat].length > 0)
    .map((cat) => ({
      name: cat,
      items: props.menu![day][cat],
    }))
}

function parseDish(dish: string): { ru: string; original: string } {
  const parts = dish.split(' / ')
  return {
    ru: parts[0] ?? dish,
    original: parts.length > 1 ? parts.slice(1).join(' / ') : '',
  }
}

function downloadXlsx(): void {
  if (!props.menu) return
  const buffer = buildMenuWorkbook(props.menu)
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument'
      + '.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'menu.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <!-- Empty state -->
  <Card v-if="!menu" class="menu-preview">
    <div class="menu-preview__empty">
      <FileTextOutlined class="menu-preview__empty-icon" />
      <p class="menu-preview__empty-text">
        Загрузите меню для отображения результата
      </p>
    </div>
  </Card>

  <!-- Translated menu -->
  <Card v-else class="menu-preview">
    <template #title>
      <span>Результат перевода</span>
    </template>
    <template #extra>
      <Button size="small" @click="downloadXlsx">
        <template #icon>
          <DownloadOutlined />
        </template>
        Скачать таблицу
      </Button>
    </template>

    <Tabs
      v-model:activeKey="activeDay"
      type="line"
      class="menu-preview__tabs"
    >
      <TabPane
        v-for="day in availableDays"
        :key="day.short"
        :tab="day.short"
      >
        <div class="menu-preview__scroll">
          <div
            v-for="cat in categoriesForDay(day.full)"
            :key="cat.name"
            class="menu-preview__section"
          >
            <div class="menu-preview__section-head">
              <span
                class="menu-preview__badge"
                :style="{ background: token.colorBgLayout }"
              >
                {{ cat.name }}
              </span>
              <span class="menu-preview__count">
                {{ cat.items.length }} позиций
              </span>
            </div>
            <div class="menu-preview__section-items">
              <div
                v-for="(dish, idx) in cat.items"
                :key="idx"
                class="menu-preview__dish"
              >
                <span class="menu-preview__dish-ru">
                  {{ parseDish(dish).ru }}
                </span>
                <span
                  v-if="parseDish(dish).original"
                  class="menu-preview__dish-original"
                >
                  {{ parseDish(dish).original }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </TabPane>
    </Tabs>
  </Card>
</template>

<style scoped>
.menu-preview {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.menu-preview :deep(.ant-card-body) {
  flex: 1;
  min-height: 0;
  overflow: hidden scroll;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.menu-preview :deep(.ant-card-head) {
  flex-shrink: 0;
}

.menu-preview__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 48px 16px;
  gap: 8px;
}

.menu-preview__empty-icon {
  font-size: 32px;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.45));
}

.menu-preview__empty-text {
  margin: 0;
  font-size: 13px;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.45));
  text-align: center;
}

.menu-preview__tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.menu-preview__tabs :deep(.ant-tabs-nav) {
  flex-shrink: 0;
  margin-bottom: 0;
  padding: 0 14px;
}

.menu-preview__tabs :deep(.ant-tabs-content) {
  flex: 1;
  min-height: 0;
}

.menu-preview__tabs :deep(.ant-tabs-tabpane) {
  height: 100%;
}

.menu-preview__scroll {
  height: 100%;
  overflow-y: auto;
}

.menu-preview__section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px 6px;
}

.menu-preview__badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.45));
}

.menu-preview__count {
  font-size: 11px;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.45));
}

.menu-preview__section-items {
  padding: 0 14px 10px;
}

.menu-preview__dish {
  display: flex;
  flex-direction: column;
  padding: 5px 0;
  border-bottom: 1px solid var(--ant-color-border, #d9d9d9);
}

.menu-preview__dish:last-child {
  border-bottom: none;
}

.menu-preview__dish-ru {
  font-size: 12px;
  line-height: 1.45;
}

.menu-preview__dish-original {
  font-size: 11px;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.45));
  margin-top: 1px;
}
</style>
