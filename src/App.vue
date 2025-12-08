<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useThemeStore } from './stores/theme'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.loadActiveTheme()
})
</script>

<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<style scoped>
</style>
