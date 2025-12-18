<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  IconPencil,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconChevronLeftPipe,
  IconChevronRightPipe
} from '@tabler/icons-vue'
import { useAuthStore } from '../../stores/auth'
import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/+$/, '')
const authStore = useAuthStore()
const users = ref([])
const loading = ref(false)
const showNewUserForm = ref(false)
const editingUser = ref(null)
const form = ref({
  username: '',
  email: '',
  password: ''
})
const pagination = ref({ page: 1, limit: 10, total: 0, pages: 1 })
const currentPage = ref(1)
const pageInput = ref(1)
const perPage = ref(10)

const currentUser = authStore.user
const totalPages = computed(() => pagination.value.pages || 1)

onMounted(async () => {
  await loadUsers(currentPage.value)
})

async function loadUsers(page = 1) {
  try {
    loading.value = true
    const response = await axios.get(`${API_BASE_URL}/api/users`, {
      params: { page, limit: perPage.value }
    })
    users.value = response.data?.data || []
    pagination.value = response.data?.pagination || { page, limit: users.value.length, total: users.value.length, pages: 1 }
    currentPage.value = pagination.value.page
    pageInput.value = currentPage.value
  } catch (error) {
    console.error('Failed to fetch users:', error)
    alert('Failed to fetch users: ' + (error.response?.data?.error || error.message))
  } finally {
    loading.value = false
  }
}

function applyPerPage() {
  const parsed = parseInt(perPage.value, 10)
  perPage.value = parsed > 0 ? parsed : 10
  pageInput.value = 1
  changePage(1, true)
}

function changePage(page, force = false) {
  const target = Math.min(Math.max(page, 1), totalPages.value)
  if (force || target !== currentPage.value || users.value.length === 0) {
    loadUsers(target)
  }
  pageInput.value = target
}

function applyPageInput() {
  const parsed = parseInt(pageInput.value, 10)
  if (Number.isNaN(parsed)) {
    pageInput.value = currentPage.value
    return
  }
  const target = Math.min(Math.max(parsed, 1), totalPages.value)
  pageInput.value = target
  changePage(target, true)
}

function editUser(user) {
  editingUser.value = user
  form.value = {
    username: user.username,
    email: user.email,
    password: ''
  }
  showNewUserForm.value = true
}

function closeForm() {
  showNewUserForm.value = false
  editingUser.value = null
  form.value = {
    username: '',
    email: '',
    password: ''
  }
}

async function saveUser() {
  try {
    if (editingUser.value) {
      await axios.put(`${API_BASE_URL}/api/users/${editingUser.value.id}`, form.value)
    } else {
      await axios.post(`${API_BASE_URL}/api/users`, form.value)
    }
    await loadUsers(currentPage.value)
    closeForm()
  } catch (error) {
    console.error('Failed to save user:', error)
    alert('Failed to save user: ' + (error.response?.data?.error || error.message))
  }
}

async function deleteUser(id) {
  if (confirm('Are you sure you want to delete this user?')) {
    try {
      const isLastOnPage = users.value.length === 1
      await axios.delete(`${API_BASE_URL}/api/users/${id}`)
      const nextPage = isLastOnPage && currentPage.value > 1 ? currentPage.value - 1 : currentPage.value
      await loadUsers(nextPage)
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Failed to delete user: ' + (error.response?.data?.error || error.message))
    }
  }
}

function formatDate(date) {
  return new Date(date).toLocaleDateString()
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-700">Users per page:</label>
        <input
          v-model.number="perPage"
          type="number"
          min="1"
          class="border rounded px-3 py-2 w-24"
          @keyup.enter.prevent="applyPerPage"
        >
        <button
          @click="applyPerPage"
          class="bg-gray-800 text-white px-3 py-2 rounded hover:bg-gray-700 transition cursor-pointer"
        >
          Apply
        </button>
      </div>
      <button @click="showNewUserForm = true" class="cursor-pointer bg-rd-orange text-white px-4 py-2 rounded hover:bg-rd-orange-light transition">
        + New User
      </button>
    </div>

    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <div v-if="loading" class="p-6 text-center text-gray-600">Loading users...</div>
      <div v-else-if="users.length === 0" class="p-6 text-center text-gray-600">No users yet.</div>
      <table v-else class="w-full">
        <thead class="bg-gray-100 border-b bg-rd-orange">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Username</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 float-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" class="border-b hover:bg-gray-50">
            <td class="px-6 py-4 text-gray-900 font-medium">{{ user.username }}</td>
            <td class="px-6 py-4 text-gray-600 text-sm">{{ user.email || 'N/A' }}</td>
            <td class="px-6 py-4 text-gray-600 text-sm">{{ formatDate(user.created_at) }}</td>
            <td class="px-6 py-4 text-sm space-x-2 float-right">
              <button @click="editUser(user)" class="inline-block cursor-pointer text-rd-orange hover:underline" title="Edit User"><IconPencil stroke={2} /></button>
              <button v-if="user.id !== currentUser?.id" @click="deleteUser(user.id)" class="cursor-pointer text-red-600 hover:underline" title="Delete User"><IconTrash stroke={2} /></button>
              <span v-else class="text-gray-500 text-xs">(current user)</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="users.length > 0" class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 border-t">
        <div class="flex items-center gap-3 text-sm text-gray-600">
          <button
            @click="changePage(1, true)"
            :disabled="currentPage <= 1 || loading"
            class="px-2 py-2 rounded border text-white bg-gray-800 cursor-pointer hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="First page"
          >
            <IconChevronLeftPipe />
          </button>
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage <= 1 || loading"
            class="px-2 py-2 rounded border text-white bg-gray-800 cursor-pointer hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <IconChevronLeft />
          </button>
          <div class="flex items-center gap-2">
            <input
              v-model.number="pageInput"
              @keyup.enter.prevent="applyPageInput"
              @blur="applyPageInput"
              type="number"
              min="1"
              :max="totalPages"
              class="border rounded px-2 py-2 w-20 text-center"
              aria-label="Current page"
            >
            <span>of {{ totalPages }} · {{ pagination.total }} users</span>
          </div>
          <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage >= totalPages || loading"
            class="px-2 py-2 rounded border text-white bg-gray-800 cursor-pointer hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <IconChevronRight />
          </button>
          <button
            @click="changePage(totalPages, true)"
            :disabled="currentPage >= totalPages || loading"
            class="px-2 py-2 rounded border text-white bg-gray-800 cursor-pointer hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Last page"
          >
            <IconChevronRightPipe />
          </button>
        </div>
      </div>
    </div>

    <div v-if="showNewUserForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h3 class="text-xl font-bold mb-4">{{ editingUser ? 'Edit User' : 'New User' }}</h3>
        <form @submit.prevent="saveUser" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input v-model="form.username" type="text" class="w-full px-3 py-2 border border-gray-300 rounded" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input v-model="form.email" type="email" class="w-full px-3 py-2 border border-gray-300 rounded" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input v-model="form.password" type="password" class="w-full px-3 py-2 border border-gray-300 rounded" :required="!editingUser">
            <p v-if="editingUser" class="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
          </div>
          <div class="flex gap-3">
            <button type="submit" class="flex-1 bg-rd-orange text-white px-4 py-2 rounded hover:bg-rd-orange-light transition">
              {{ editingUser ? 'Update' : 'Create' }}
            </button>
            <button type="button" @click="closeForm" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
