<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  username: '',
  password: ''
})

const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    const success = await authStore.login(form.value.username, form.value.password)
    if (success) {
      router.push({ name: 'admin' })
    } else {
      error.value = 'Invalid credentials'
    }
  } catch (err) {
    error.value = 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-rd-dark to-gray-800 flex items-center justify-center">
    <div class="w-full max-w-md">
      <div class="bg-gray-900 rounded-lg shadow-2xl p-8">
        <h1 class="text-3xl font-avant-garde-demi text-white text-center mb-2">Resonance</h1>
        <h2 class="text-lg text-gray-400 text-center mb-8">CMS Admin</h2>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-gray-300 text-sm font-medium mb-2">Username</label>
            <input
              v-model="form.username"
              type="text"
              class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-rd-orange"
              placeholder="Enter username"
            >
          </div>

          <div>
            <label class="block text-gray-300 text-sm font-medium mb-2">Password</label>
            <input
              v-model="form.password"
              type="password"
              class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-rd-orange"
              placeholder="Enter password"
            >
          </div>

          <div v-if="error" class="p-4 bg-red-900 border border-red-700 rounded text-red-200 text-sm">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2 bg-rd-orange text-white rounded font-medium hover:bg-rd-orange-light transition duration-200 disabled:opacity-50"
          >
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
