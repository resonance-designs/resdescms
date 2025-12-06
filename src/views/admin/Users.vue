<template>
  <div>
    <div class="mb-6 flex justify-end">
      <button @click="showNewUserForm = true" class="bg-rd-orange text-white px-4 py-2 rounded hover:bg-rd-orange-light transition">
        + New User
      </button>
    </div>

    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <div v-if="loading" class="p-6 text-center text-gray-600">Loading users...</div>
      <div v-else-if="users.length === 0" class="p-6 text-center text-gray-600">No users yet.</div>
      <table v-else class="w-full">
        <thead class="bg-gray-100 border-b">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Username</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" class="border-b hover:bg-gray-50">
            <td class="px-6 py-4 text-gray-900 font-medium">{{ user.username }}</td>
            <td class="px-6 py-4 text-gray-600 text-sm">{{ user.email || 'N/A' }}</td>
            <td class="px-6 py-4 text-gray-600 text-sm">{{ formatDate(user.created_at) }}</td>
            <td class="px-6 py-4 text-sm space-x-2">
              <button @click="editUser(user)" class="text-rd-orange hover:underline">Edit</button>
              <button v-if="user.id !== currentUser?.id" @click="deleteUser(user.id)" class="text-red-600 hover:underline">Delete</button>
              <span v-else class="text-gray-500 text-xs">(current user)</span>
            </td>
          </tr>
        </tbody>
      </table>
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

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import axios from 'axios'

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

const currentUser = authStore.user

onMounted(async () => {
  await fetchUsers()
})

async function fetchUsers() {
  try {
    loading.value = true
    const response = await axios.get('http://localhost:3001/api/users')
    users.value = response.data
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    loading.value = false
  }
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
      await axios.put(`http://localhost:3001/api/users/${editingUser.value.id}`, form.value)
    } else {
      await axios.post('http://localhost:3001/api/users', form.value)
    }
    await fetchUsers()
    closeForm()
  } catch (error) {
    console.error('Failed to save user:', error)
    alert('Failed to save user: ' + (error.response?.data?.error || error.message))
  }
}

async function deleteUser(id) {
  if (confirm('Are you sure you want to delete this user?')) {
    try {
      await axios.delete(`http://localhost:3001/api/users/${id}`)
      await fetchUsers()
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
