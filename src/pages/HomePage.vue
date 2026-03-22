<script setup lang="ts">
import { useMenuTranslation } from '@/composables/useMenuTranslation'
import { useTemplateUpload } from '@/composables/useTemplateUpload'

import MenuUpload from '@/components/MenuUpload.vue'
import MenuPreview from '@/components/MenuPreview.vue'
import TemplateUpload from '@/components/TemplateUpload.vue'
import GenerateButton from '@/components/GenerateButton.vue'

const { translatedMenu } = useMenuTranslation()
const { templateBuffer, templateFileName } = useTemplateUpload()
</script>

<template>
  <div class="home-page">
    <div class="home-page__left">
      <MenuUpload />
      <MenuPreview :menu="translatedMenu" />
    </div>
    <div class="home-page__right">
      <TemplateUpload />
      <GenerateButton
        :menu="translatedMenu"
        :template-buffer="templateBuffer"
        :template-file-name="templateFileName"
      />
    </div>
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  gap: 16px;
  height: 100%;
  overflow: hidden;
}

.home-page__left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.home-page__right {
  width: 272px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
