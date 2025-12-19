<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { resolveMediaUrl } from '../../utils/media'
import { IconCircleX } from '@tabler/icons-vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  url: { type: String, default: '' },
  media: { type: Object, default: null },
  fields: {
    type: Object,
    default: () => ({ alt: '', title: '', caption: '', description: '' })
  }
})

const emit = defineEmits(['close', 'update:fields', 'delete', 'save'])

const localFields = reactive({
  alt: '',
  title: '',
  caption: '',
  description: ''
})

const dimensions = ref({ width: null, height: null })

const mediaUrl = computed(() => resolveMediaUrl(props.url))

watch(() => props.fields, (val) => {
  localFields.alt = val?.alt || ''
  localFields.title = val?.title || ''
  localFields.caption = val?.caption || ''
  localFields.description = val?.description || ''
}, { deep: true, immediate: true })

watch(() => props.url, () => {
  dimensions.value = { width: null, height: null }
  if (!props.url) return
  const img = new Image()
  img.onload = () => {
    dimensions.value = { width: img.naturalWidth, height: img.naturalHeight }
  }
  img.src = resolveMediaUrl(props.url)
})

function updateField(key, value) {
  localFields[key] = value
  emit('update:fields', { ...localFields })
}

function copyFileUrl() {
  navigator.clipboard?.writeText(mediaUrl.value)
}

function downloadFile() {
  const link = document.createElement('a')
  link.href = mediaUrl.value
  link.target = '_blank'
  link.download = ''
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function deleteImage() {
  emit('delete')
}

function saveChanges() {
  emit('save', { ...localFields })
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
      <div class="px-4 py-3 border-b flex items-center justify-between">
        <h4 class="text-base font-semibold">Media Details</h4>
        <button class="text-sm text-gray-600 hover:text-gray-900 cursor-pointer" @click="$emit('close')" aria-label="Close modal">
          <IconCircleX :size="26" />
        </button>
      </div>
      <div class="flex flex-col lg:flex-row gap-4 p-4 overflow-auto">
        <div class="flex-1 flex items-center justify-center bg-gray-50 border rounded">
          <img :src="mediaUrl" alt="Selected media" class="max-h-[60vh] object-contain">
        </div>
        <div class="w-full lg:w-1/2 space-y-3">
          <div class="grid grid-cols-2 gap-2 text-sm text-gray-700">
            <div><span class="font-semibold">Uploaded On:</span> {{ media?.created_at?.slice(0,10) || '—' }}</div>
            <div><span class="font-semibold">Uploaded By:</span> {{ media?.uploader_name || 'Imported' }}</div>
            <div><span class="font-semibold">File Name:</span> {{ media?.filename || '—' }}</div>
            <div><span class="font-semibold">File Type:</span> {{ media?.mime_type || '—' }}</div>
            <div><span class="font-semibold">File Size:</span> {{ media?.size ? Math.round(media.size / 1024) + ' KB' : '—' }}</div>
            <div><span class="font-semibold">Dimensions:</span> {{ dimensions.width && dimensions.height ? `${dimensions.width} x ${dimensions.height}` : '—' }}</div>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Alt Attribute</label>
            <input :value="localFields.alt" @input="updateField('alt', $event.target.value)" type="text" class="w-full border rounded px-3 py-2">
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Title Attribute</label>
            <input :value="localFields.title" @input="updateField('title', $event.target.value)" type="text" class="w-full border rounded px-3 py-2">
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Caption</label>
            <textarea :value="localFields.caption" @input="updateField('caption', $event.target.value)" class="w-full border rounded px-3 py-2" rows="2"></textarea>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Description</label>
            <textarea :value="localFields.description" @input="updateField('description', $event.target.value)" class="w-full border rounded px-3 py-2" rows="3"></textarea>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">File URL</label>
            <input :value="mediaUrl" readonly class="w-full border rounded px-3 py-2 bg-gray-50 text-sm">
            <div class="flex gap-2">
              <button type="button" class="cursor-pointer px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm text-white" @click="copyFileUrl">Copy URL</button>
              <button type="button" class="cursor-pointer px-3 py-2 rounded bg-rd-orange hover:bg-rd-orange-light text-sm text-white" @click="downloadFile">Download</button>
              <button type="button" class="cursor-pointer px-3 py-2 rounded bg-red-600 hover:bg-red-500 text-sm text-white" @click="deleteImage">Delete</button>
              <button type="button" class="cursor-pointer px-3 py-2 rounded bg-green-700 hover:bg-green-600 text-sm text-white" @click="saveChanges">Save Changes</button>
            </div>
            <p class="text-xs text-gray-500">Changes here apply to this instance; media library defaults are not altered.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
