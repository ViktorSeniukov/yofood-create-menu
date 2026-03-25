<script setup lang="ts">
import { ref } from 'vue'
import {
  CheckOutlined,
  CloseOutlined,
  LoadingOutlined,
} from '@ant-design/icons-vue'
import { Alert, Button, Card, Input, theme } from 'ant-design-vue'

import { useTemplateUpload } from '@/composables/useTemplateUpload'
import { isValidGoogleSheetUrl } from '@/utils/googleSheets'

const {
  templateFileName,
  hasTemplate,
  isLoading,
  error,
  fetchFromGoogleSheets,
  reset,
} = useTemplateUpload()

const { token } = theme.useToken()

const sheetUrl = ref('')

function handleFetchSheet(): void {
  if (isValidGoogleSheetUrl(sheetUrl.value)) {
    fetchFromGoogleSheets(sheetUrl.value)
  }
}

function handleReset(): void {
  reset()
  sheetUrl.value = ''
}
</script>

<template>
  <Card class="template-upload">
    <template #title>Шаблон .xlsx</template>

    <template v-if="hasTemplate">
      <div
        class="template-upload__file-row"
        :style="{ background: token.colorBgLayout }"
      >
        <div
          class="template-upload__file-icon"
          :style="{ background: token.colorSuccessBg }"
        >
          <CheckOutlined
            :style="{ color: token.colorSuccess, fontSize: '14px' }"
          />
        </div>
        <div class="template-upload__file-info">
          <span class="template-upload__file-name">
            {{ templateFileName }}
          </span>
          <span class="template-upload__file-meta">Загружено</span>
        </div>
        <button
          class="template-upload__file-reset"
          @click="handleReset"
        >
          <CloseOutlined />
        </button>
      </div>
    </template>

    <template v-else>
      <div class="template-upload__link-form">
        <Input
          v-model:value="sheetUrl"
          placeholder="https://docs.google.com/spreadsheets/d/..."
          :status="
            sheetUrl && !isValidGoogleSheetUrl(sheetUrl)
              ? 'error'
              : undefined
          "
          @press-enter="handleFetchSheet"
        />
        <Button
          type="primary"
          :disabled="!sheetUrl || !isValidGoogleSheetUrl(sheetUrl)"
          :loading="isLoading"
          @click="handleFetchSheet"
        >
          <template v-if="isLoading" #icon>
            <LoadingOutlined />
          </template>
          Загрузить
        </Button>
      </div>
      <p class="template-upload__link-hint">
        Таблица должна быть доступна по ссылке
      </p>

      <Alert
        v-if="error"
        type="error"
        :message="error"
        show-icon
        closable
        class="template-upload__error"
      />
    </template>
  </Card>
</template>

<style scoped>
.template-upload {
  flex-shrink: 0;
}

.template-upload__mode-switch {
  display: flex;
  gap: 0;
  margin-bottom: 12px;
  border: 1px solid var(--ant-color-border, #d9d9d9);
  border-radius: 6px;
  overflow: hidden;
}

.template-upload__mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 1;
  padding: 6px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.45));
  transition: all 0.2s;
}

.template-upload__mode-btn + .template-upload__mode-btn {
  border-left: 1px solid var(--ant-color-border, #d9d9d9);
}

.template-upload__mode-btn--active {
  background: var(--ant-color-primary-bg, #e6f4ff);
  font-weight: 500;
}

.template-upload__file-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
}

.template-upload__file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  flex-shrink: 0;
}

.template-upload__file-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.template-upload__file-name {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-upload__file-meta {
  font-size: 11px;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.45));
}

.template-upload__file-reset {
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

.template-upload__file-reset:hover {
  opacity: 1;
}

.template-upload__dragger {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
}

.template-upload__dragger-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
}

.template-upload__dragger-text {
  margin: 0;
  font-size: 12px;
}

.template-upload__dragger-hint {
  margin: 0;
  font-size: 11px;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.45));
}

.template-upload__link-form {
  display: flex;
  gap: 8px;
}

.template-upload__link-hint {
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.45));
}

.template-upload__error {
  margin-top: 12px;
}
</style>
