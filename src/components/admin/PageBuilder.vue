<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useContentStore } from '../../stores/content'

const model = defineModel({ type: Object, default: () => ({ cols: 4, rows: 4, gap: 16, blocks: [] }) })
const contentStore = useContentStore()

const gridRef = ref(null)
const selectedId = ref(null)
const selectedElementId = ref(null)
const dragging = reactive({ active: false, id: null, startX: 0, startY: 0, startColSpan: 1, startRowSpan: 1 })
const moving = reactive({ active: false, id: null, startX: 0, startY: 0, startCol: 1, startRow: 1 })
const draggingElement = reactive({ blockId: null, elementId: null })

const cols = computed({
  get: () => model.value?.cols || 4,
  set: (v) => { model.value = { ...model.value, cols: Number(v) || 1 } }
})
const rows = computed({
  get: () => model.value?.rows || 4,
  set: (v) => { model.value = { ...model.value, rows: Number(v) || 1 } }
})
const gap = computed({
  get: () => model.value?.gap ?? 16,
  set: (v) => { model.value = { ...model.value, gap: Number(v) || 0 } }
})

const blocks = computed({
  get: () => model.value?.blocks || [],
  set: (v) => { model.value = { ...model.value, blocks: v } }
})

const selectedBlock = computed(() => blocks.value.find(b => b.id === selectedId.value))
const selectedElement = computed(() => selectedBlock.value?.elements?.find(el => el.id === selectedElementId.value))
const mediaModal = reactive({ open: false, mode: 'single' })
const mediaSelection = reactive(new Set())

const cells = computed(() => Array.from({ length: rows.value * cols.value }, (_, i) => ({
  row: Math.floor(i / cols.value) + 1,
  col: (i % cols.value) + 1
})))

function addBlockAt(row, col) {
  const id = crypto.randomUUID()
  const newBlock = {
    id,
    title: `Block ${blocks.value.length + 1}`,
    row,
    col,
    rowSpan: 1,
    colSpan: 1,
    customId: '',
    customClass: '',
    elements: []
  }
  // prevent overlap
  if (hasCollision(newBlock, blocks.value)) return
  blocks.value = [...blocks.value, newBlock]
  selectedId.value = id
  selectedElementId.value = null
}

function onGridClick(cell) {
  // Avoid placing on top of an existing block
  const occupied = blocks.value.some(b =>
    rowWithin(cell.row, b) && colWithin(cell.col, b)
  )
  if (!occupied) addBlockAt(cell.row, cell.col)
}

function rowWithin(row, block) {
  return row >= block.row && row < block.row + block.rowSpan
}

function colWithin(col, block) {
  return col >= block.col && col < block.col + block.colSpan
}

function selectBlock(id) {
  selectedId.value = id
  selectedElementId.value = null
}

function removeSelected() {
  if (!selectedId.value) return
  blocks.value = blocks.value.filter(b => b.id !== selectedId.value)
  selectedId.value = null
  selectedElementId.value = null
}

function updateBlock(partial) {
  if (!selectedId.value) return
  blocks.value = blocks.value.map(b => b.id === selectedId.value ? { ...b, ...partial } : b)
}

function startResize(evt, block) {
  dragging.active = true
  dragging.id = block.id
  dragging.startX = evt.clientX
  dragging.startY = evt.clientY
  dragging.startColSpan = block.colSpan
  dragging.startRowSpan = block.rowSpan
  window.addEventListener('pointermove', onResize)
  window.addEventListener('pointerup', stopResize)
}

function onResize(evt) {
  if (!dragging.active) return
  const grid = gridRef.value
  if (!grid) return
  const rect = grid.getBoundingClientRect()
  const cellWidth = rect.width / cols.value
  const cellHeight = rect.height / rows.value
  const deltaX = evt.clientX - dragging.startX
  const deltaY = evt.clientY - dragging.startY
  const addCols = Math.round(deltaX / cellWidth)
  const addRows = Math.round(deltaY / cellHeight)
  blocks.value = blocks.value.map(b => {
    if (b.id !== dragging.id) return b
    const candidate = {
      ...b,
      colSpan: Math.max(1, Math.min(cols.value - b.col + 1, dragging.startColSpan + addCols)),
      rowSpan: Math.max(1, Math.min(rows.value - b.row + 1, dragging.startRowSpan + addRows))
    }
    return hasCollision(candidate, blocks.value.filter(o => o.id !== b.id)) ? b : candidate
  })
}

function stopResize() {
  dragging.active = false
  dragging.id = null
  window.removeEventListener('pointermove', onResize)
  window.removeEventListener('pointerup', stopResize)
}

onBeforeUnmount(() => stopResize())
onMounted(async () => {
  if (!contentStore.categories.length) {
    await contentStore.fetchCategories()
  }
})

function startMove(evt, block) {
  moving.active = true
  moving.id = block.id
  moving.startX = evt.clientX
  moving.startY = evt.clientY
  moving.startCol = block.col
  moving.startRow = block.row
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopMove)
}

function onMove(evt) {
  if (!moving.active) return
  const grid = gridRef.value
  if (!grid) return
  const rect = grid.getBoundingClientRect()
  const cellWidth = rect.width / cols.value
  const cellHeight = rect.height / rows.value
  const deltaX = evt.clientX - moving.startX
  const deltaY = evt.clientY - moving.startY
  const addCols = Math.round(deltaX / cellWidth)
  const addRows = Math.round(deltaY / cellHeight)
  blocks.value = blocks.value.map(b => {
    if (b.id !== moving.id) return b
    const next = {
      ...b,
      col: Math.min(Math.max(1, moving.startCol + addCols), cols.value - b.colSpan + 1),
      row: Math.min(Math.max(1, moving.startRow + addRows), rows.value - b.rowSpan + 1)
    }
    return hasCollision(next, blocks.value.filter(o => o.id !== b.id)) ? b : next
  })
}

function stopMove() {
  moving.active = false
  moving.id = null
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopMove)
}

function hasCollision(target, others) {
  return others.some(o => rectanglesIntersect(target, o))
}

function rectanglesIntersect(a, b) {
  const aEndCol = a.col + a.colSpan - 1
  const bEndCol = b.col + b.colSpan - 1
  const aEndRow = a.row + a.rowSpan - 1
  const bEndRow = b.row + b.rowSpan - 1
  const colOverlap = a.col <= bEndCol && aEndCol >= b.col
  const rowOverlap = a.row <= bEndRow && aEndRow >= b.row
  return colOverlap && rowOverlap
}

watch([cols, rows], ([c, r]) => {
  // clamp blocks into new grid
  blocks.value = blocks.value.map(b => ({
    ...b,
    col: Math.min(b.col, c),
    row: Math.min(b.row, r),
    colSpan: Math.min(b.colSpan, c - b.col + 1),
    rowSpan: Math.min(b.rowSpan, r - b.row + 1)
  }))
})

// Elements logic
const elementOptions = [
  { value: 'text', label: 'Text' },
  { value: 'media', label: 'Media' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'custom', label: 'Custom Code (HTML)' },
  { value: 'contact', label: 'Contact Form' },
  { value: 'posts', label: 'Posts' }
]

const pendingElementType = ref('text')

function addElementToBlock() {
  if (!selectedBlock.value) return
  const elem = {
    id: crypto.randomUUID(),
    type: pendingElementType.value || 'text',
    data: {}
  }
  if (elem.type === 'posts') {
    elem.data = { categoryId: 'all', perPage: 5, displayMode: 'medium', icon: '' }
  }
  updateBlock({
    elements: [...(selectedBlock.value.elements || []), elem]
  })
  selectedElementId.value = elem.id
}

function selectElement(elementId) {
  selectedElementId.value = elementId
}

function updateElementData(data) {
  if (!selectedBlock.value || !selectedElement.value) return
  updateBlock({
    elements: (selectedBlock.value.elements || []).map(el =>
      el.id === selectedElement.value.id ? { ...el, data: { ...el.data, ...data } } : el
    )
  })
}

function reorderElements(blockId, sourceId, targetId) {
  const block = blocks.value.find(b => b.id === blockId)
  if (!block || sourceId === targetId) return
  const list = [...(block.elements || [])]
  const from = list.findIndex(el => el.id === sourceId)
  const to = list.findIndex(el => el.id === targetId)
  if (from === -1 || to === -1) return
  const [moved] = list.splice(from, 1)
  list.splice(to, 0, moved)
  updateBlock({ elements: list })
}

async function handleMediaUpload(file) {
  if (!file) return
  await contentStore.uploadMedia(file)
  await contentStore.fetchMedia()
}

async function onUploadMedia(evt) {
  const file = evt.target.files?.[0]
  if (!file) return
  await handleMediaUpload(file)
  const latest = contentStore.media[contentStore.media.length - 1]
  if (latest) updateElementData({ url: latest.url, type: latest.mime_type, name: latest.filename })
}

async function openMediaLibrary(mode = 'single') {
  mediaSelection.clear()
  mediaModal.mode = mode
  mediaModal.open = true
  if (!contentStore.media.length) {
    await contentStore.fetchMedia()
  }
}

function toggleMediaItem(id) {
  if (mediaSelection.has(id)) mediaSelection.delete(id)
  else {
    if (mediaModal.mode === 'single') mediaSelection.clear()
    mediaSelection.add(id)
  }
}

function confirmMediaSelection() {
  const items = contentStore.media.filter(m => mediaSelection.has(m.id))
  if (!items.length) {
    mediaModal.open = false
    return
  }
  if (mediaModal.mode === 'single') {
    const file = items[0]
    updateElementData({ url: file.url, type: file.mime_type, name: file.filename })
  } else {
    updateElementData({
      items: items.map(f => ({ url: f.url, name: f.filename, type: f.mime_type }))
    })
  }
  mediaModal.open = false
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-4 items-end">
      <div>
        <label class="text-sm text-gray-700">Columns</label>
        <input type="number" min="1" max="12" class="border rounded px-3 py-2 w-24" v-model.number="cols" />
      </div>
      <div>
        <label class="text-sm text-gray-700">Rows</label>
        <input type="number" min="1" max="20" class="border rounded px-3 py-2 w-24" v-model.number="rows" />
      </div>
      <div>
        <label class="text-sm text-gray-700">Gap (px)</label>
        <input type="number" min="0" class="border rounded px-3 py-2 w-24" v-model.number="gap" />
      </div>
      <button type="button" class="ml-auto text-sm text-red-600 hover:underline" @click="removeSelected" :disabled="!selectedId">
        Remove selected
      </button>
    </div>

    <div class="grid-container bg-gray-50 border rounded relative" ref="gridRef" :style="{
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${rows}, 80px)`,
      gap: `${gap}px`
    }">
      <div
        v-for="cell in cells"
        :key="`${cell.row}-${cell.col}`"
        class="border border-dashed border-gray-200 hover:bg-gray-100 cursor-crosshair"
        @click="onGridClick(cell)"
      />

      <div
        v-for="block in blocks"
        :key="block.id"
        class="block-item"
        :style="{
          gridColumn: `${block.col} / span ${block.colSpan}`,
          gridRow: `${block.row} / span ${block.rowSpan}`
        }"
      >
        <div
          class="relative h-full w-full bg-white border-2"
          :class="selectedId === block.id ? 'border-rd-orange shadow-lg' : 'border-gray-300 shadow-sm'"
          @click.stop="selectBlock(block.id)"
        >
          <div class="text-xs px-2 py-1 bg-gray-100 border-b flex justify-between items-center cursor-move" @pointerdown.prevent="startMove($event, block)">
            <span class="space-x-2">
              <span>{{ block.title }}</span>
              <span class="text-red-600 font-semibold" v-if="block.customId">CSS ID: {{ block.customId }}</span>
              <span class="text-green-600 font-semibold" v-if="block.customClass">CSS Class: {{ block.customClass }}</span>
            </span>
          </div>
          <div class="p-3 text-xs text-gray-500 h-[calc(100%-28px)]">
            <div class="flex flex-wrap gap-1 mb-2">
              <button
                v-for="el in block.elements || []"
                :key="el.id"
                type="button"
                class="text-[10px] px-2 py-1 rounded border"
                :class="selectedElementId === el.id ? 'border-rd-orange text-rd-orange' : 'border-gray-300 text-gray-600'"
                draggable="true"
                @dragstart.stop="draggingElement.blockId = block.id; draggingElement.elementId = el.id"
                @dragover.prevent
                @drop.stop="reorderElements(block.id, draggingElement.elementId, el.id); draggingElement.blockId=null; draggingElement.elementId=null"
                @click.stop="selectBlock(block.id); selectElement(el.id)"
              >
                {{ el.type }}
              </button>
            </div>
          </div>
          <span
            class="resize-handle"
            @pointerdown.prevent="startResize($event, block)"
            title="Drag to resize"
          />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="border rounded p-4">
        <h4 class="text-sm font-semibold mb-2">Selection</h4>
        <p v-if="!selectedBlock" class="text-sm text-gray-500">Click a block to edit its settings.</p>
        <div v-else class="space-y-3">
          <div>
            <label class="text-xs text-gray-600">Title</label>
            <input type="text" class="w-full border rounded px-3 py-2" v-model="selectedBlock.title" @input="updateBlock({ title: selectedBlock.title })" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-600">Row</label>
              <input type="number" class="w-full border rounded px-3 py-2" min="1" :max="rows" v-model.number="selectedBlock.row" @input="updateBlock({ row: selectedBlock.row })" />
            </div>
            <div>
              <label class="text-xs text-gray-600">Column</label>
              <input type="number" class="w-full border rounded px-3 py-2" min="1" :max="cols" v-model.number="selectedBlock.col" @input="updateBlock({ col: selectedBlock.col })" />
            </div>
            <div>
              <label class="text-xs text-gray-600">Row Span</label>
              <input type="number" class="w-full border rounded px-3 py-2" min="1" :max="rows" v-model.number="selectedBlock.rowSpan" @input="updateBlock({ rowSpan: selectedBlock.rowSpan })" />
            </div>
            <div>
              <label class="text-xs text-gray-600">Col Span</label>
              <input type="number" class="w-full border rounded px-3 py-2" min="1" :max="cols" v-model.number="selectedBlock.colSpan" @input="updateBlock({ colSpan: selectedBlock.colSpan })" />
            </div>
          </div>
          <div>
            <label class="text-xs text-gray-600">Custom ID</label>
            <input type="text" class="w-full border rounded px-3 py-2" v-model="selectedBlock.customId" @input="updateBlock({ customId: selectedBlock.customId })" />
          </div>
          <div>
            <label class="text-xs text-gray-600">Custom Class</label>
            <input type="text" class="w-full border rounded px-3 py-2" v-model="selectedBlock.customClass" @input="updateBlock({ customClass: selectedBlock.customClass })" />
          </div>
        </div>
      </div>

      <div class="border rounded p-4">
        <h4 class="text-sm font-semibold mb-2">Elements</h4>
        <div class="space-y-3" v-if="selectedBlock">
          <div class="flex gap-2 items-end">
            <div class="flex-1">
              <label class="text-xs text-gray-600">Element Type</label>
              <select class="w-full border rounded px-3 py-2" v-model="pendingElementType">
                <option v-for="opt in elementOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <button type="button" class="bg-rd-orange text-white px-3 py-2 rounded text-sm" @click="addElementToBlock">
              Add
            </button>
          </div>

          <div v-if="selectedElement">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold">{{ selectedElement.type }} settings</p>
            </div>

            <div v-if="selectedElement.type === 'text'" class="space-y-2">
              <label class="text-xs text-gray-600">Text</label>
              <textarea class="w-full border rounded px-3 py-2" rows="3" :value="selectedElement.data?.text || ''" @input="updateElementData({ text: $event.target.value })" />
              <button type="button" class="bg-gray-800 text-white px-3 py-1 rounded text-xs" @click="updateElementData({ savedAt: Date.now() })">
                Save Text
              </button>
            </div>

            <div v-else-if="selectedElement.type === 'media'" class="space-y-2">
              <div class="flex gap-2">
                <button type="button" class="bg-gray-800 text-white px-3 py-2 rounded text-sm" @click="openMediaLibrary('single')">
                  Select Media
                </button>
                <button type="button" class="bg-rd-orange text-white px-3 py-2 rounded text-sm" @click="$refs.mediaUploader.click()">
                  Upload Media
                </button>
                <input type="file" class="hidden" ref="mediaUploader" @change="onUploadMedia($event)" />
              </div>
              <p class="text-xs text-gray-500">Images open in lightbox, video/audio will use appropriate players when rendered.</p>
              <div v-if="selectedElement.data?.url" class="text-xs text-gray-700 break-all">
                Selected: {{ selectedElement.data.url }}
              </div>
            </div>

            <div v-else-if="selectedElement.type === 'gallery'" class="space-y-2">
              <button type="button" class="bg-gray-800 text-white px-3 py-2 rounded text-sm" @click="openMediaLibrary('gallery')">
                Select From Library
              </button>
              <p class="text-xs text-gray-500">Gallery will render as a carousel/lightbox with the selected media.</p>
              <ul class="text-xs text-gray-700 list-disc ml-4" v-if="selectedElement.data?.items?.length">
                <li v-for="item in selectedElement.data.items" :key="item.url">{{ item.url }}</li>
              </ul>
            </div>

            <div v-else-if="selectedElement.type === 'posts'" class="space-y-2">
              <div>
                <label class="text-xs text-gray-600">Category</label>
                <select class="w-full border rounded px-3 py-2" :value="selectedElement.data?.categoryId || 'all'" @change="updateElementData({ categoryId: $event.target.value || 'all' })">
                  <option value="all">All</option>
                  <option v-for="cat in contentStore.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-gray-600">Per page</label>
                <input type="number" min="1" class="w-full border rounded px-3 py-2" :value="selectedElement.data?.perPage || 5" @input="updateElementData({ perPage: Number($event.target.value) || 1 })" />
              </div>
              <div>
                <label class="text-xs text-gray-600">Display mode</label>
                <select class="w-full border rounded px-3 py-2" :value="selectedElement.data?.displayMode || 'medium'" @change="updateElementData({ displayMode: $event.target.value })">
                  <option value="full">Full</option>
                  <option value="medium">Medium Snippet</option>
                  <option value="small">Small Snippet</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-gray-600">Icon override (optional)</label>
                <input type="text" class="w-full border rounded px-3 py-2" :value="selectedElement.data?.icon || ''" @input="updateElementData({ icon: $event.target.value })" />
                <p class="text-[10px] text-gray-500">Defaults come from design/theme settings; this overrides per block.</p>
              </div>
              <p class="text-xs text-gray-500">Posts element will render and paginate according to these settings.</p>
            </div>

            <div v-else-if="selectedElement.type === 'custom'" class="space-y-2">
              <label class="text-xs text-gray-600">HTML</label>
              <textarea class="w-full border rounded px-3 py-2" rows="4" :value="selectedElement.data?.html || ''" @input="updateElementData({ html: $event.target.value })" />
            </div>

            <div v-else-if="selectedElement.type === 'contact'" class="space-y-2">
              <p class="text-xs text-gray-600">Contact form will render with default fields. You can add a custom form id or heading.</p>
              <label class="text-xs text-gray-600">Form ID</label>
              <input type="text" class="w-full border rounded px-3 py-2" :value="selectedElement.data?.formId || ''" @input="updateElementData({ formId: $event.target.value })" />
            </div>

            <div v-else>
              <p class="text-xs text-gray-500">Element settings not yet available for this type.</p>
            </div>
          </div>
          <p v-else class="text-xs text-gray-500">Select a block element badge to edit its settings.</p>
        </div>
        <p v-else class="text-sm text-gray-500">Select a block to choose an element type.</p>
      </div>
    </div>

    <div v-if="mediaModal.open" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div class="px-4 py-3 border-b flex items-center justify-between">
          <h4 class="text-base font-semibold">Media Library</h4>
          <button class="text-sm text-gray-600 hover:text-gray-900" @click="mediaModal.open = false">Close</button>
        </div>
        <div class="p-4 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            v-for="file in contentStore.media"
            :key="file.id"
            type="button"
            class="border rounded overflow-hidden text-left"
            :class="mediaSelection.has(file.id) ? 'border-rd-orange ring-2 ring-rd-orange/40' : 'border-gray-200'"
            @click="toggleMediaItem(file.id)"
          >
            <div class="h-32 bg-gray-100 flex items-center justify-center">
              <img v-if="file.mime_type?.startsWith('image/')" :src="file.url" class="object-cover h-full w-full" />
              <div v-else class="text-xs text-gray-600 px-2">{{ file.filename || file.url }}</div>
            </div>
            <div class="px-2 py-1 text-xs text-gray-700 truncate">{{ file.filename || file.url }}</div>
          </button>
        </div>
        <div class="px-4 py-3 border-t flex justify-end gap-2">
          <button class="px-3 py-2 text-sm rounded border border-gray-300" @click="mediaModal.open = false">Cancel</button>
          <button class="px-3 py-2 text-sm rounded bg-rd-orange text-white" @click="confirmMediaSelection">Add Selected</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-container {
  display: grid;
  position: relative;
  min-height: 320px;
}

.block-item {
  display: block;
}

.resize-handle {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 12px;
  height: 12px;
  background: #e06e26;
  cursor: se-resize;
  border-radius: 2px;
}
</style>
