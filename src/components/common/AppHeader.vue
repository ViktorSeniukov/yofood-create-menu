<script setup lang="ts">
import { ref } from 'vue'

import { SettingOutlined } from '@ant-design/icons-vue'
import { Button } from 'ant-design-vue'

import AppSettings from './AppSettings.vue'

const isSettingsOpen = ref(false)
</script>

<template>
  <header class="app-header">
    <h1 class="app-header__title">Генератор меню</h1>
    <Button
      type="text"
      data-testid="settings-btn"
      @click="isSettingsOpen = true"
    >
      <template #icon>
        <SettingOutlined />
      </template>
    </Button>
    <AppSettings v-model:open="isSettingsOpen" />
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}

.app-header__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
</style>
