<script setup lang="ts">
import { Collapse, CollapsePanel, Tag, Button } from 'ant-design-vue'
import { DownloadOutlined } from '@ant-design/icons-vue'

import { DAYS_OF_WEEK, MEAL_CATEGORIES } from '@/constants/menu'

import type { TranslatedMenu } from '@/types/menu'

interface Props {
  menu: TranslatedMenu
}

const props = defineProps<Props>()

function downloadJson(): void {
  const json = JSON.stringify(props.menu, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'menu.json'
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="menu-preview">
    <div class="menu-preview__header">
      <h3 class="menu-preview__title">Переведённое меню</h3>
      <Button size="small" @click="downloadJson">
        <template #icon>
          <DownloadOutlined />
        </template>
        Скачать JSON
      </Button>
    </div>
    <Collapse>
      <CollapsePanel
        v-for="day in DAYS_OF_WEEK"
        :key="day"
        :header="day"
      >
        <div
          v-for="category in MEAL_CATEGORIES"
          :key="category"
          class="menu-preview__category"
        >
          <Tag color="blue">{{ category }}</Tag>
          <span
            v-if="menu[day][category].length > 0"
            class="menu-preview__dishes"
          >
            {{ menu[day][category].join(', ') }}
          </span>
          <span v-else class="menu-preview__empty">—</span>
        </div>
      </CollapsePanel>
    </Collapse>
  </div>
</template>

<style scoped>
.menu-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.menu-preview__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.menu-preview__category {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
}

.menu-preview__dishes {
  font-size: 14px;
}

.menu-preview__empty {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.25);
}
</style>
