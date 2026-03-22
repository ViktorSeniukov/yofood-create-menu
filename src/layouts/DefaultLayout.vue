<script setup lang="ts">
import AppHeader from '@/components/common/AppHeader.vue'
</script>

<template>
  <div class="app-layout">
    <AppHeader />
    <main class="app-layout__main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 16px);
  overflow: hidden;
}

.app-layout__main {
  flex: 1;
  overflow: hidden;
  padding: 16px;
}
</style>
