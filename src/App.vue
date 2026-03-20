<script setup lang="ts">
import { ConfigProvider, theme } from 'ant-design-vue'

const themeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 6,
  },
}
</script>

<template>
  <ConfigProvider :theme="themeConfig">
    <RouterView />
  </ConfigProvider>
</template>
