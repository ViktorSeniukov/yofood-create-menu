<script setup lang="ts">
import { ref } from 'vue'

import { theme } from 'ant-design-vue'

import { useApiKey } from '@/composables/useApiKey'

import AppSettings from './AppSettings.vue'
import mascotUrl from '@/assets/mascot.png'

const { hasApiKey } = useApiKey()
const { token } = theme.useToken()
const isSettingsOpen = ref(false)
</script>

<template>
  <header class="app-header">
    <div class="app-header__brand">
      <img
        :src="mascotUrl"
        alt="YoFood"
        class="app-header__logo"
      />
      <span class="app-header__title">Меню-генератор</span>
    </div>
    <button
      class="app-header__api-btn"
      data-testid="settings-btn"
      @click="isSettingsOpen = true"
    >
      <span
        class="app-header__dot"
        :style="{
          backgroundColor: hasApiKey
            ? token.colorSuccess
            : token.colorError,
        }"
      />
      API-ключ
    </button>
    <AppSettings v-model:open="isSettingsOpen" />
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  flex-shrink: 0;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid var(--ant-color-border, #d9d9d9);
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-header__logo {
  height: 32px;
  width: auto;
  object-fit: contain;
}

.app-header__title {
  font-size: 14px;
  font-weight: 500;
}

.app-header__api-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid var(--ant-color-border, #d9d9d9);
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.app-header__api-btn:hover {
  border-color: var(--ant-color-primary, #1677ff);
}

.app-header__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
