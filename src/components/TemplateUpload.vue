<script setup lang="ts">
import {
  UploadDragger,
  Alert,
} from 'ant-design-vue'
import {
  InboxOutlined,
  FileExcelOutlined,
} from '@ant-design/icons-vue'
import type { UploadChangeParam } from 'ant-design-vue'

import { useTemplateUpload } from '@/composables/useTemplateUpload'

const { templateFileName, hasTemplate, uploadTemplate, reset } =
  useTemplateUpload()

function handleChange(info: UploadChangeParam): void {
  const file = info.file.originFileObj ?? info.file
  if (file instanceof File) {
    uploadTemplate(file)
  }
}
</script>

<template>
  <div class="template-upload">
    <template v-if="hasTemplate">
      <Alert type="success" show-icon>
        <template #message>
          <FileExcelOutlined />
          {{ templateFileName }}
        </template>
        <template #description>
          <a @click="reset">Загрузить другой шаблон</a>
        </template>
      </Alert>
    </template>

    <template v-else>
      <UploadDragger
        accept=".xlsx"
        :max-count="1"
        :before-upload="() => false"
        :show-upload-list="false"
        @change="handleChange"
      >
        <p class="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p class="ant-upload-text">
          Перетащите шаблон .xlsx сюда
        </p>
        <p class="ant-upload-hint">
          Excel-файл с листом Tech и именами сотрудников
        </p>
      </UploadDragger>
    </template>
  </div>
</template>
