<script setup lang="ts">
import { Card, Typography } from 'ant-design-vue'

import { useMenuTranslation } from '@/composables/useMenuTranslation'
import { useTemplateUpload } from '@/composables/useTemplateUpload'

import MenuUpload from '@/components/MenuUpload.vue'
import TemplateUpload from '@/components/TemplateUpload.vue'
import GenerateButton from '@/components/GenerateButton.vue'

const { translatedMenu } = useMenuTranslation()
const { templateBuffer, templateFileName } = useTemplateUpload()
</script>

<template>
  <div class="home-page">
    <Card class="home-page__zone">
      <Typography.Title :level="4">
        1. Загрузите меню
      </Typography.Title>
      <MenuUpload />
    </Card>

    <Card class="home-page__zone">
      <Typography.Title :level="4">
        2. Загрузите шаблон Excel
      </Typography.Title>
      <TemplateUpload />
    </Card>

    <Card class="home-page__zone">
      <Typography.Title :level="4">
        3. Сгенерируйте файл
      </Typography.Title>
      <GenerateButton
        :menu="translatedMenu"
        :template-buffer="templateBuffer"
        :template-file-name="templateFileName"
      />
    </Card>
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 0;
}
</style>
