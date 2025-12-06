<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="flex-1 overflow-auto">
      <div class="bg-white shadow-sm p-6 border-b">
        <h2 class="text-3xl font-bold text-gray-900">{{ title }}</h2>
      </div>

      <div class="p-6">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import Sidebar from './Sidebar.vue'

defineProps({
  title: {
    type: String,
    required: true
  }
})
</script>
