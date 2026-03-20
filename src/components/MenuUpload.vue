<script setup lang="ts">
import { UploadDragger, Alert, Spin } from 'ant-design-vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import type { UploadChangeParam } from 'ant-design-vue'

import { useMenuTranslation } from '@/composables/useMenuTranslation'

import MenuPreview from './MenuPreview.vue'

const { translatedMenu, isLoading, error, translateFile, reset } =
  useMenuTranslation()

function handleChange(info: UploadChangeParam): void {
  const file = info.file.originFileObj ?? info.file
  if (file instanceof File) {
    translateFile(file)
  }
}
</script>

<template>
  <div class="menu-upload">
    <template v-if="isLoading">
      <div class="menu-upload__loading">
        <Spin size="large" tip="Переводим меню..." />
      </div>
    </template>

    <template v-else-if="error">
      <Alert
        type="error"
        :message="error"
        show-icon
        closable
        @close="reset"
      />
    </template>

    <template v-else-if="translatedMenu">
      <MenuPreview :menu="translatedMenu" />
      <a class="menu-upload__reset" @click="reset">
        Загрузить другой файл
      </a>
    </template>

    <template v-else>
      <UploadDragger
        accept=".txt,.docx"
        :max-count="1"
        :before-upload="() => false"
        :show-upload-list="false"
        @change="handleChange"
      >
        <p class="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p class="ant-upload-text">
          Перетащите файл меню сюда
        </p>
        <p class="ant-upload-hint">
          Поддерживаются форматы .txt и .docx
        </p>
      </UploadDragger>
    </template>
  </div>
</template>

<style scoped>
.menu-upload__loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.menu-upload__reset {
  display: block;
  margin-top: 12px;
  text-align: center;
  cursor: pointer;
}
</style>
