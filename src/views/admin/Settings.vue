<script setup>
import { ref } from 'vue'

const settings = ref({
  site_title: 'Resonance Designs',
  site_description: 'Web Design & Development',
  contact_email: 'info@resonancedesigns.dev',
  contact_phone: '716.220.7618',
  theme: 'default',
  home_page_slug: 'posts'
})

function saveSettings() {
  localStorage.setItem('cms_settings', JSON.stringify(settings.value))
  alert('Settings saved successfully!')
}

function resetAdminPassword() {
  if (confirm('Are you sure? This will reset the admin password to the default.')) {
    alert('Admin password has been reset to: i4Vc$oUU%AR!WK3W')
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-lg font-semibold mb-6">Site Settings</h3>

      <form @submit.prevent="saveSettings" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Site Title</label>
          <input v-model="settings.site_title" type="text" class="w-full px-4 py-2 border rounded" placeholder="Resonance Designs">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Site Description</label>
          <textarea v-model="settings.site_description" class="w-full px-4 py-2 border rounded" rows="3" placeholder="Your site description"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Contact Email</label>
          <input v-model="settings.contact_email" type="email" class="w-full px-4 py-2 border rounded" placeholder="info@example.com">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Contact Phone</label>
          <input v-model="settings.contact_phone" type="tel" class="w-full px-4 py-2 border rounded" placeholder="+1 (555) 123-4567">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Default Theme</label>
          <select v-model="settings.theme" class="w-full px-4 py-2 border rounded">
            <option value="default">Default (Resonance)</option>
            <option value="minimal">Minimal</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Home Page Slug</label>
          <input v-model="settings.home_page_slug" type="text" class="w-full px-4 py-2 border rounded" placeholder="posts">
          <p class="text-xs text-gray-500">Slug of the page rendered at /. Overrides any theme default.</p>
        </div>

        <div class="flex gap-4">
          <button type="submit" class="bg-rd-orange text-white px-6 py-2 rounded hover:bg-rd-orange-light transition">
            Save Settings
          </button>
        </div>
      </form>
    </div>

    <div class="bg-white rounded-lg shadow-md p-6 mt-6">
      <h3 class="text-lg font-semibold mb-6 text-red-600">Danger Zone</h3>

      <p class="text-gray-600 text-sm mb-4">Resetting the admin password will set it back to the default.</p>
      <button @click="resetAdminPassword" class="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700">
        Reset Admin Password
      </button>
    </div>
  </div>
</template>
