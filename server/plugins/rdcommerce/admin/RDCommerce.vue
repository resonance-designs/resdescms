<script setup>
import { onMounted, reactive, ref } from 'vue'
import axios from 'axios'
import { usePluginStore } from '/src/stores/plugins'
import { IconExternalLink } from '@tabler/icons-vue';

const API_BASE_URL = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/+$/, '')
const pluginStore = usePluginStore()

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const form = reactive({
  squareApplicationId: '',
  squareApplicationSecret: '',
  squareAccessToken: '',
  squareLocationId: '',
  squareSandbox: true,
  stripePublishableKey: '',
  stripeSecretKey: '',
  shopifyStoreDomain: '',
  shopifyAccessToken: '',
  paypalClientId: '',
  paypalClientSecret: '',
  selectedProvider: 'square'
})

const squareStatus = reactive({
  connected: false,
  account_name: null,
  hasConfig: false
})

const importForm = reactive({
  dateFrom: '',
  dateTo: '',
  inStockOnly: true
})

const products = ref([])
const showProductForm = ref(false)
const editingProduct = ref(null)
const productForm = reactive({
  title: '',
  content: '',
  sku: '',
  price: '',
  stock: '',
  square_id: ''
})

const loading = ref(false)
const importing = ref(false)
const importResult = ref(null)

onMounted(async () => {
  if (!pluginStore.plugins.length) {
    await pluginStore.fetchPlugins()
  }
  const rdcommerce = pluginStore.plugins.find(p => p.slug === 'rdcommerce')
  if (rdcommerce?.settings) {
    Object.assign(form, rdcommerce.settings)
  }
  await refreshSquareStatus()

  // Check for OAuth success parameter
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('connected') === 'square') {
    // Clear the URL parameter
    const newUrl = window.location.pathname + window.location.hash
    window.history.replaceState({}, document.title, newUrl)
    // Refresh status to show connection
    setTimeout(() => refreshSquareStatus(), 500)
  }
})

async function refreshSquareStatus() {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/api/plugins/rdcommerce/square/status`)
    squareStatus.connected = data.connected
    squareStatus.account_name = data.account_name
    squareStatus.hasConfig = data.hasConfig
  } catch (err) {
    squareStatus.connected = false
    squareStatus.hasConfig = false
  }
}

async function save() {
  loading.value = true
  try {
    // Trim all string values to prevent whitespace issues
    const trimmedForm = {}
    for (const [key, value] of Object.entries(form)) {
      trimmedForm[key] = typeof value === 'string' ? value.trim() : value
    }
    await pluginStore.saveSettings('rdcommerce', trimmedForm)
    await pluginStore.fetchPlugins()
    await refreshSquareStatus()
    alert('RDCommerce settings saved')
  } catch (err) {
    alert('Failed to save RDCommerce settings')
  } finally {
    loading.value = false
  }
}

async function connectSquare() {
  try {
    if (!form.squareApplicationId || !form.squareApplicationSecret) {
      alert('Enter Square Application ID and Application Secret, save settings, then click Connect.')
      return
    }
    await pluginStore.saveSettings('rdcommerce', { ...form })
    const { data } = await axios.get(`${API_BASE_URL}/api/plugins/rdcommerce/square/auth-url`)

    if (data?.sandbox) {
      // Sandbox mode: Direct connection successful
      alert(`Connected to Square sandbox: ${data.account_name}`)
      await refreshSquareStatus()
      await loadProducts()
    } else if (data?.url) {
      // Production mode: OAuth redirect
      window.location.href = data.url
    } else {
      alert('Unexpected response from server')
    }
  } catch (err) {
    const errorMsg = err.response?.data?.error || err.response?.data?.details || 'Failed to connect to Square'
    alert(`Connection failed: ${errorMsg}`)
  }
}

async function importProducts() {
  importing.value = true
  importResult.value = null
  try {
    const { data } = await axios.post(`${API_BASE_URL}/api/plugins/rdcommerce/square/import`, importForm)
    importResult.value = data
    alert(`Import complete: ${data.imported} imported, ${data.skipped} skipped`)
    await loadProducts() // Refresh product list
  } catch (err) {
    alert('Import failed: ' + (err.response?.data?.error || err.message))
  } finally {
    importing.value = false
  }
}

// Product management functions
async function loadProducts() {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/api/posts`)
    products.value = data.filter(post => post.post_type === 'product')
  } catch (err) {
    console.error('Failed to load products:', err)
  }
}

function editProduct(product) {
  editingProduct.value = product
  Object.assign(productForm, {
    title: product.title,
    content: product.content || '',
    sku: product.meta?.sku || '',
    price: product.meta?.price || '',
    stock: product.meta?.stock || '',
    square_id: product.meta?.square_id || ''
  })
  showProductForm.value = true
}

async function saveProduct() {
  try {
    const slug = productForm.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now()
    const productData = {
      title: productForm.title,
      slug,
      content: productForm.content,
      post_type: 'product',
      published: true
    }

    const meta = {
      sku: productForm.sku,
      price: productForm.price,
      stock: productForm.stock,
      square_id: productForm.square_id
    }

    if (editingProduct.value) {
      await axios.put(`${API_BASE_URL}/api/posts/${editingProduct.value.id}`, { ...productData, meta }, { headers: getAuthHeaders() })
    } else {
      await axios.post(`${API_BASE_URL}/api/posts`, { ...productData, meta }, { headers: getAuthHeaders() })
    }

    await loadProducts()
    cancelProductEdit()
    alert(editingProduct.value ? 'Product updated!' : 'Product added!')
  } catch (err) {
    alert('Failed to save product: ' + (err.response?.data?.error || err.message))
  }
}

async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return

  try {
    await axios.delete(`${API_BASE_URL}/api/posts/${productId}`, { headers: getAuthHeaders() })
    await loadProducts()
    alert('Product deleted!')
  } catch (err) {
    alert('Failed to delete product: ' + (err.response?.data?.error || err.message))
  }
}

function cancelProductEdit() {
  showProductForm.value = false
  editingProduct.value = null
  Object.assign(productForm, {
    title: '',
    content: '',
    sku: '',
    price: '',
    stock: '',
    square_id: ''
  })
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-6 space-y-6">
    <h3 class="text-lg font-semibold">RDCommerce</h3>
    <p class="text-sm text-gray-600">
      Ecommerce integrations for Square, Stripe, Shopify, and PayPal. Import products from Square.
    </p>

    <!-- Provider Selection -->
    <div class="border rounded p-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Select Provider</label>
      <div class="flex gap-4">
        <label v-for="provider in ['square', 'stripe', 'shopify', 'paypal']" :key="provider" class="flex items-center">
          <input v-model="form.selectedProvider" type="radio" :value="provider" class="mr-2">
          <span class="capitalize">{{ provider }}</span>
        </label>
      </div>
    </div>

    <!-- Square Settings -->
    <div v-if="form.selectedProvider === 'square'" class="border rounded p-4 space-y-4">
      <h4 class="text-md font-semibold">Square Configuration</h4>
      <p class="text-sm text-gray-600">
        Connect your Square account to import products. Requires OAuth setup in <a class="admin-ext-link" href="https://developer.squareup.com/console/en/apps" target="_blank" rel="noopener noreferrer">Square Developer Dashboard<IconExternalLink size="20" style="float: right;" /></a>.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Application ID</label>
          <input v-model="form.squareApplicationId" type="text" class="w-full border rounded px-3 py-2" placeholder="sq0idp-...">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Application Secret</label>
          <input v-model="form.squareApplicationSecret" type="password" class="w-full border rounded px-3 py-2" placeholder="sq0csp-...">
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
          <input v-model="form.squareAccessToken" type="password" class="w-full border rounded px-3 py-2" placeholder="EAAA...">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Location ID (optional)</label>
          <input v-model="form.squareLocationId" type="text" class="w-full border rounded px-3 py-2" placeholder="Location ID">
        </div>
      </div>

      <div class="flex items-center gap-2">
        <input id="squareSandbox" v-model="form.squareSandbox" type="checkbox" class="h-4 w-4 text-rd-orange border-gray-300 rounded">
        <label for="squareSandbox" class="text-sm text-gray-800">Developer Mode (Sandbox)</label>
        <span class="text-xs text-gray-500">Use sandbox environment for testing</span>
      </div>

      <div class="flex items-center gap-3">
        <button class="bg-blue-600 text-white px-4 py-2 rounded" @click="connectSquare">
          {{ squareStatus.connected ? 'Reconnect Square' : 'Connect Square' }}
        </button>
        <span v-if="squareStatus.connected" class="text-sm text-green-700">
          Connected: {{ squareStatus.account_name }}
          <span v-if="squareStatus.sandbox" class="text-xs text-blue-600">(Sandbox)</span>
        </span>
        <span v-else-if="!squareStatus.hasConfig" class="text-sm text-red-600">
          Add credentials and save first.
          <span v-if="form.squareSandbox" class="block text-xs text-blue-600 mt-1">
            Sandbox mode uses direct API access - no OAuth required.
          </span>
        </span>
      </div>

      <!-- Import Section -->
      <div v-if="squareStatus.connected" class="border-t pt-4 space-y-4">
        <h5 class="text-md font-semibold">Import Products</h5>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input v-model="importForm.dateFrom" type="date" class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input v-model="importForm.dateTo" type="date" class="w-full border rounded px-3 py-2">
          </div>
          <div class="flex items-center">
            <input id="inStockOnly" v-model="importForm.inStockOnly" type="checkbox" class="mr-2">
            <label for="inStockOnly" class="text-sm">In stock only</label>
          </div>
        </div>
        <button class="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50" :disabled="importing" @click="importProducts">
          {{ importing ? 'Importing...' : 'Import Products' }}
        </button>
        <div v-if="importResult" class="text-sm text-gray-700">
          <p>Imported: {{ importResult.imported }}, Skipped: {{ importResult.skipped }}, Total: {{ importResult.total }}</p>
        </div>
      </div>
    </div>

    <!-- Other Providers (placeholder) -->
    <div v-else class="border rounded p-4">
      <h4 class="text-md font-semibold capitalize">{{ form.selectedProvider }} Configuration</h4>
      <p class="text-sm text-gray-600">Configuration for {{ form.selectedProvider }} will be implemented in future updates.</p>
    </div>

    <!-- Product Management Section -->
    <div class="border rounded p-4 space-y-4">
      <h4 class="text-md font-semibold">Product Management</h4>
      <p class="text-sm text-gray-600">
        Manage your imported products. All product operations are handled through this interface.
      </p>

      <!-- Product List -->
      <div v-if="products.length > 0" class="space-y-3">
        <h5 class="text-sm font-semibold text-gray-800">Your Products</h5>
        <div class="space-y-2 max-h-60 overflow-y-auto">
          <div v-for="product in products" :key="product.id" class="flex items-center justify-between p-3 bg-gray-50 rounded border">
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ product.title }}</div>
              <div class="text-sm text-gray-600">
                SKU: {{ product.meta?.sku || 'N/A' }} |
                Price: ${{ product.meta?.price || '0' }} |
                Stock: {{ product.meta?.stock || '0' }}
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="editProduct(product)" class="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
              <button @click="deleteProduct(product.id)" class="text-red-600 hover:text-red-800 text-sm">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Product Form -->
      <div v-if="showProductForm" class="border-t pt-4 space-y-4">
        <h5 class="text-sm font-semibold text-gray-800">{{ editingProduct ? 'Edit Product' : 'Add New Product' }}</h5>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input v-model="productForm.title" type="text" class="w-full px-3 py-2 border rounded" placeholder="Product name">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <input v-model="productForm.sku" type="text" class="w-full px-3 py-2 border rounded" placeholder="Product SKU">
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input v-model="productForm.price" type="number" step="0.01" class="w-full px-3 py-2 border rounded" placeholder="0.00">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input v-model="productForm.stock" type="number" class="w-full px-3 py-2 border rounded" placeholder="0">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Square ID</label>
            <input v-model="productForm.square_id" type="text" class="w-full px-3 py-2 border rounded bg-gray-50" placeholder="Auto-filled" readonly>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea v-model="productForm.content" class="w-full px-3 py-2 border rounded" rows="3" placeholder="Product description"></textarea>
        </div>

        <div class="flex gap-2">
          <button @click="saveProduct" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 transition">
            {{ editingProduct ? 'Update Product' : 'Add Product' }}
          </button>
          <button @click="cancelProductEdit" class="bg-gray-300 text-gray-900 px-4 py-2 rounded hover:bg-gray-400 transition">
            Cancel
          </button>
        </div>
      </div>

      <!-- Add Product Button -->
      <div v-if="!showProductForm" class="flex gap-3">
        <button @click="showProductForm = true" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 transition">
          + Add New Product
        </button>
      </div>

      <div v-if="products.length === 0 && !showProductForm" class="text-center py-8 text-gray-500">
        <p>No products yet. Import from Square or add manually.</p>
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex gap-3">
      <button class="bg-rd-orange text-white px-4 py-2 rounded disabled:opacity-50" :disabled="loading" @click="save">
        {{ loading ? 'Saving...' : 'Save Settings' }}
      </button>
      <a href="/admin/plugins" class="text-sm text-gray-600 hover:text-gray-900">Back to Plugins</a>
    </div>
  </div>
</template>

<style scoped>
    a.admin-ext-link {
        color: #007bff;
        text-decoration: underline;
        display: inline-block;
    }
</style>