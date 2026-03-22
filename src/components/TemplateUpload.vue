<script setup lang="ts">
import {
  CheckOutlined,
  CloseOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue'
import { Card, UploadDragger, theme } from 'ant-design-vue'
import type { UploadChangeParam } from 'ant-design-vue'

import { useTemplateUpload } from '@/composables/useTemplateUpload'

const { templateFileName, hasTemplate, uploadTemplate, reset } =
  useTemplateUpload()

const { token } = theme.useToken()

function handleChange(info: UploadChangeParam): void {
  const file = info.file.originFileObj ?? info.file
  if (file instanceof File) {
    uploadTemplate(file)
  }
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
          @click="reset"
        >
          <CloseOutlined />
        </button>
      </div>
    </template>

    <template v-else>
      <UploadDragger
        accept=".xlsx"
        :max-count="1"
        :before-upload="() => false"
        :show-upload-list="false"
        @change="handleChange"
      >
        <div class="template-upload__dragger">
          <div
            class="template-upload__dragger-icon"
            :style="{ background: token.colorBgLayout }"
          >
            <UploadOutlined style="font-size: 14px" />
          </div>
          <p class="template-upload__dragger-text">
            <strong>Перетащите файл</strong> или нажмите
          </p>
          <p class="template-upload__dragger-hint">.xlsx</p>
        </div>
      </UploadDragger>
    </template>
  </Card>
</template>

<style scoped>
.template-upload {
  flex-shrink: 0;
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
</style>
