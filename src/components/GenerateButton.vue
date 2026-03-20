<script setup lang="ts">
import { Button, Alert } from 'ant-design-vue'

import { useMenuGeneration } from '@/composables/useMenuGeneration'

import type { TranslatedMenu } from '@/types/menu'

interface Props {
  menu: TranslatedMenu | null
  templateBuffer: ArrayBuffer | null
  templateFileName: string
}

const props = defineProps<Props>()

const { isGenerating, error, generate } = useMenuGeneration()

async function handleClick(): Promise<void> {
  if (!props.menu || !props.templateBuffer) return
  await generate(props.menu, props.templateBuffer, props.templateFileName)
}
</script>

<template>
  <div class="generate-button">
    <Alert
      v-if="error"
      type="error"
      :message="error"
      show-icon
      class="generate-button__error"
    />
    <Button
      type="primary"
      size="large"
      block
      :loading="isGenerating"
      :disabled="!menu || !templateBuffer"
      data-testid="generate-btn"
      @click="handleClick"
    >
      {{ isGenerating ? 'Генерация...' : 'Сгенерировать' }}
    </Button>
  </div>
</template>

<style scoped>
.generate-button__error {
  margin-bottom: 12px;
}
</style>
