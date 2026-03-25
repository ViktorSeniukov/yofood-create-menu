<script setup lang="ts">
import { ref, watch } from 'vue'

import { CheckOutlined } from '@ant-design/icons-vue'
import { Button, Drawer, InputPassword, theme } from 'ant-design-vue'

import { useApiKey } from '@/composables/useApiKey'
import { useConvertApiKey } from '@/composables/useConvertApiKey'

interface Props {
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { apiKey, hasApiKey, saveApiKey } = useApiKey()
const {
  convertApiKey,
  hasConvertApiKey,
  saveConvertApiKey,
} = useConvertApiKey()
const { token } = theme.useToken()
const localKey = ref(apiKey.value)
const localConvertKey = ref(convertApiKey.value)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      localKey.value = apiKey.value
      localConvertKey.value = convertApiKey.value
    }
  }
)

function handleSave(): void {
  saveApiKey(localKey.value)
  saveConvertApiKey(localConvertKey.value)
  emit('update:open', false)
}
</script>

<template>
  <Drawer
    title="Настройки API"
    placement="right"
    :width="300"
    :open="open"
    @close="emit('update:open', false)"
  >
    <div class="api-drawer">
      <label class="api-drawer__label">Claude API ключ</label>
      <InputPassword
        v-model:value="localKey"
        placeholder="sk-ant-api03-..."
        autocomplete="off"
        data-testid="api-key-input"
      />
      <p class="api-drawer__hint">
        Ключ сохраняется только в localStorage вашего браузера
        и никуда не отправляется. Получить ключ можно у администратора сервиса.
      </p>
      <div
        v-if="hasApiKey"
        class="api-drawer__status"
        :style="{
          background: token.colorSuccessBg,
        }"
      >
        <CheckOutlined :style="{ color: token.colorSuccess }" />
        <span>Ключ сохранён и активен</span>
      </div>

      <div class="api-drawer__divider" />

      <label class="api-drawer__label">
        ConvertAPI ключ
        <span class="api-drawer__label-hint">
          (для .doc файлов)
        </span>
      </label>
      <InputPassword
        v-model:value="localConvertKey"
        placeholder="secret_..."
        autocomplete="off"
        data-testid="convert-api-key-input"
      />
      <p class="api-drawer__hint">
        Ключ сохраняется только в localStorage вашего браузера
        и никуда не отправляется. Нужен только для загрузки файлов
        в формате .doc. Получить ключ можно у администратора сервиса.
      </p>
      <div
        v-if="hasConvertApiKey"
        class="api-drawer__status"
        :style="{
          background: token.colorSuccessBg,
        }"
      >
        <CheckOutlined :style="{ color: token.colorSuccess }" />
        <span>Ключ сохранён и активен</span>
      </div>
    </div>

    <template #footer>
      <Button
        type="primary"
        block
        data-testid="save-key-btn"
        @click="handleSave"
      >
        Сохранить
      </Button>
    </template>
  </Drawer>
</template>

<style scoped>
.api-drawer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.api-drawer__label {
  font-size: 12px;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.45));
}

.api-drawer__hint {
  margin: 0;
  font-size: 11px;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.45));
}

.api-drawer__status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 12px;
}

.api-drawer__divider {
  height: 1px;
  margin: 8px 0;
  background: var(--ant-color-border, rgba(0, 0, 0, 0.06));
}

.api-drawer__label-hint {
  font-weight: 400;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.45));
}
</style>
