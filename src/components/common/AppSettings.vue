<script setup lang="ts">
import { ref, watch } from 'vue'

import { Button, Drawer, InputPassword } from 'ant-design-vue'

import { useApiKey } from '@/composables/useApiKey'

interface Props {
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { apiKey, saveApiKey, clearApiKey } = useApiKey()
const localKey = ref(apiKey.value)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      localKey.value = apiKey.value
    }
  }
)

function handleSave(): void {
  saveApiKey(localKey.value)
  emit('update:open', false)
}

function handleClear(): void {
  clearApiKey()
  localKey.value = ''
}
</script>

<template>
  <Drawer
    title="Настройки"
    :open="open"
    @close="emit('update:open', false)"
  >
    <div class="app-settings">
      <label class="app-settings__label">Claude API ключ</label>
      <InputPassword
        v-model:value="localKey"
        placeholder="sk-ant-..."
        data-testid="api-key-input"
      />
      <div class="app-settings__actions">
        <Button
          type="primary"
          data-testid="save-key-btn"
          @click="handleSave"
        >
          Сохранить
        </Button>
        <Button
          danger
          data-testid="clear-key-btn"
          @click="handleClear"
        >
          Очистить
        </Button>
      </div>
    </div>
  </Drawer>
</template>

<style scoped>
.app-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.app-settings__label {
  font-weight: 500;
}

.app-settings__actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
</style>
