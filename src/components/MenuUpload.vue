<script setup lang="ts">
import { computed } from 'vue'

import {
  CheckOutlined,
  CloseOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue'
import { Alert, Card, Spin, UploadDragger, theme } from 'ant-design-vue'
import type { UploadChangeParam } from 'ant-design-vue'

import { useMenuTranslation } from '@/composables/useMenuTranslation'

import { DAYS_OF_WEEK, MEAL_CATEGORIES } from '@/constants/menu'

const {
  translatedMenu,
  isLoading,
  error,
  fileName,
  isFromCache,
  translateFile,
  reset,
} = useMenuTranslation()

const { token } = theme.useToken()

const menuStats = computed(() => {
  if (!translatedMenu.value) return null
  const days = DAYS_OF_WEEK.filter((day) => {
    const dayMenu = translatedMenu.value![day]
    return MEAL_CATEGORIES.some((cat) => dayMenu[cat].length > 0)
  })
  const dishes = DAYS_OF_WEEK.reduce((sum, day) => {
    const dayMenu = translatedMenu.value![day]
    return sum + MEAL_CATEGORIES.reduce(
      (s, cat) => s + dayMenu[cat].length, 0
    )
  }, 0)
  return { days: days.length, dishes }
})

function handleChange(info: UploadChangeParam): void {
  const file = info.file.originFileObj ?? info.file
  if (file instanceof File) {
    translateFile(file)
  }
}
</script>

<template>
  <Card class="menu-upload">
    <template #title>Меню от кейтеринга</template>

    <div class="menu-upload__body">
      <!-- File uploaded / loading state -->
      <template v-if="translatedMenu || error || fileName">
        <div
          class="menu-upload__file-row"
          :style="{ background: token.colorBgLayout }"
        >
          <div
            v-if="isLoading"
            class="menu-upload__file-icon"
            :style="{ background: token.colorPrimaryBg }"
          >
            <Spin :indicator="null" size="small" />
          </div>
          <div
            v-else
            class="menu-upload__file-icon"
            :style="{ background: token.colorSuccessBg }"
          >
            <CheckOutlined
              :style="{ color: token.colorSuccess, fontSize: '14px' }"
            />
          </div>
          <div class="menu-upload__file-info">
            <span class="menu-upload__file-name">{{ fileName }}</span>
            <span
              v-if="isLoading"
              class="menu-upload__file-status"
              :style="{ color: token.colorPrimary }"
            >
              Переводим меню…
            </span>
            <span
              v-else-if="menuStats"
              class="menu-upload__file-meta"
            >
              <template v-if="isFromCache">Из кеша · </template>
              Загружено · {{ menuStats.days }} дней ·
              {{ menuStats.dishes }} блюд
            </span>
          </div>
          <button
            class="menu-upload__file-reset"
            @click="reset"
          >
            <CloseOutlined />
          </button>
        </div>

        <Alert
          v-if="error"
          type="error"
          :message="error"
          show-icon
          class="menu-upload__error"
        />
      </template>

      <!-- Upload dragger -->
      <template v-else>
        <UploadDragger
          accept=".txt,.docx,.doc"
          :max-count="1"
          :before-upload="() => false"
          :show-upload-list="false"
          @change="handleChange"
        >
          <div class="menu-upload__dragger">
            <div
              class="menu-upload__dragger-icon"
              :style="{ background: token.colorBgLayout }"
            >
              <UploadOutlined style="font-size: 14px" />
            </div>
            <p class="menu-upload__dragger-text">
              <strong>Перетащите файл</strong> или нажмите
            </p>
            <p class="menu-upload__dragger-hint">
              .txt, .docx или .doc
            </p>
          </div>
        </UploadDragger>
      </template>
    </div>
  </Card>
</template>

<style scoped>
.menu-upload {
  flex-shrink: 0;
}

.menu-upload__body {
  position: relative;
}

.menu-upload__file-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
}

.menu-upload__file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  flex-shrink: 0;
}

.menu-upload__file-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.menu-upload__file-name {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-upload__file-meta {
  font-size: 11px;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.45));
}

.menu-upload__file-status {
  font-size: 12px;
  font-weight: 500;
}

.menu-upload__file-reset {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  opacity: 0.35;
  padding: 4px;
  font-size: 12px;
  transition: opacity 0.2s;
}

.menu-upload__file-reset:hover {
  opacity: 1;
}

.menu-upload__error {
  margin-top: 8px;
}

.menu-upload__dragger {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
}

.menu-upload__dragger-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
}

.menu-upload__dragger-text {
  margin: 0;
  font-size: 12px;
}

.menu-upload__dragger-hint {
  margin: 0;
  font-size: 11px;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.45));
}
</style>
