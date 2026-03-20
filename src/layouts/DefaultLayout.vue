<script setup lang="ts">
import { Layout } from 'ant-design-vue'

import AppHeader from '@/components/common/AppHeader.vue'
</script>

<template>
  <Layout class="default-layout">
    <Layout.Content class="default-layout__content">
      <AppHeader />
      <RouterView />
    </Layout.Content>
  </Layout>
</template>

<style scoped>
.default-layout {
  min-height: 100vh;
}

.default-layout__content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
}
</style>
