<template>
  <div class="bg-white rounded-lg shadow-md p-6 border-l-4" :class="borderColor">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-gray-600 text-sm">{{ title }}</p>
        <p class="text-3xl font-bold text-gray-900 mt-2">{{ count }}</p>
      </div>
      <div class="text-4xl">{{ icon }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  count: Number,
  icon: String
})

const borderColor = computed(() => {
  switch (props.title) {
    case 'Posts': return 'border-rd-orange'
    case 'Pages': return 'border-rd-teal'
    case 'Media': return 'border-purple-500'
    default: return 'border-blue-500'
  }
})
</script>
