import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/+$/, '')

export const useContentStore = defineStore('content', () => {
  const posts = ref([])
  const pages = ref([])
  const categories = ref([])
  const media = ref([])
  const navigationMenus = ref([])
  const loading = ref(false)

  async function fetchPosts() {
    try {
      loading.value = true
      const response = await axios.get(`${API_BASE_URL}/api/posts`)
      posts.value = response.data
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      loading.value = false
    }
  }

  async function fetchPost(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/posts/${id}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch post:', error)
      return null
    }
  }

  async function createPost(post) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/posts`, post)
      posts.value.push(response.data)
      return response.data
    } catch (error) {
      console.error('Failed to create post:', error)
      throw error
    }
  }

  async function updatePost(id, post) {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/posts/${id}`, post)
      const index = posts.value.findIndex(p => p.id === id)
      if (index > -1) posts.value[index] = response.data
      return response.data
    } catch (error) {
      console.error('Failed to update post:', error)
      throw error
    }
  }

  async function deletePost(id) {
    try {
      await axios.delete(`${API_BASE_URL}/api/posts/${id}`)
      posts.value = posts.value.filter(p => p.id !== id)
    } catch (error) {
      console.error('Failed to delete post:', error)
      throw error
    }
  }

  async function fetchPages() {
    try {
      loading.value = true
      const response = await axios.get(`${API_BASE_URL}/api/pages`)
      pages.value = response.data
    } catch (error) {
      console.error('Failed to fetch pages:', error)
    } finally {
      loading.value = false
    }
  }

  async function fetchPage(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/pages/${id}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch page:', error)
      return null
    }
  }

  async function fetchPageBySlug(slug) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/pages/slug/${slug}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch page by slug:', error)
      return null
    }
  }

  async function createPage(page) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/pages`, page)
      pages.value.push(response.data)
      return response.data
    } catch (error) {
      console.error('Failed to create page:', error)
      throw error
    }
  }

  async function updatePage(id, page) {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/pages/${id}`, page)
      const index = pages.value.findIndex(p => p.id === id)
      if (index > -1) pages.value[index] = response.data
      return response.data
    } catch (error) {
      console.error('Failed to update page:', error)
      throw error
    }
  }

  async function deletePage(id) {
    try {
      await axios.delete(`${API_BASE_URL}/api/pages/${id}`)
      pages.value = pages.value.filter(p => p.id !== id)
    } catch (error) {
      console.error('Failed to delete page:', error)
      throw error
    }
  }

  async function fetchMedia() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/media`)
      media.value = response.data
    } catch (error) {
      console.error('Failed to fetch media:', error)
    }
  }

  async function uploadMedia(file) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await axios.post(`${API_BASE_URL}/api/media/upload`, formData)
      media.value.push(response.data)
      return response.data
    } catch (error) {
      console.error('Failed to upload media:', error)
      throw error
    }
  }

  async function deleteMedia(id) {
    try {
      await axios.delete(`${API_BASE_URL}/api/media/${id}`)
      media.value = media.value.filter(m => m.id !== id)
    } catch (error) {
      console.error('Failed to delete media:', error)
      throw error
    }
  }

  async function fetchNavigationMenus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/navigation`)
      navigationMenus.value = response.data?.menus || []
      return navigationMenus.value
    } catch (error) {
      console.error('Failed to fetch navigation menus:', error)
      return []
    }
  }

  async function createNavigationMenu(menu) {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/navigation`, menu)
      await fetchNavigationMenus()
      return data?.menu || null
    } catch (error) {
      console.error('Failed to create navigation menu:', error)
      throw error
    }
  }

  async function updateNavigationMenu(id, payload) {
    try {
      const { data } = await axios.put(`${API_BASE_URL}/api/navigation/${id}`, payload)
      await fetchNavigationMenus()
      return data?.menu || null
    } catch (error) {
      console.error('Failed to update navigation menu:', error)
      throw error
    }
  }

  async function updateNavigationItems(menuId, items) {
    try {
      const { data } = await axios.put(`${API_BASE_URL}/api/navigation/${menuId}/items`, { items })
      await fetchNavigationMenus()
      return data?.menu || null
    } catch (error) {
      console.error('Failed to update navigation items:', error)
      throw error
    }
  }

  async function deleteNavigationMenu(id) {
    try {
      await axios.delete(`${API_BASE_URL}/api/navigation/${id}`)
      await fetchNavigationMenus()
    } catch (error) {
      console.error('Failed to delete navigation menu:', error)
      throw error
    }
  }

  async function fetchCategories(type) {
    try {
      const url = type ? `${API_BASE_URL}/api/categories/${type}` : `${API_BASE_URL}/api/categories`
      const response = await axios.get(url)
      categories.value = response.data
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  async function createCategory(category) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/categories`, category)
      categories.value.push(response.data)
      return response.data
    } catch (error) {
      console.error('Failed to create category:', error)
      throw error
    }
  }

  async function updateCategory(id, category) {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/categories/${id}`, category)
      const index = categories.value.findIndex(c => c.id === id)
      if (index > -1) categories.value[index] = response.data
      return response.data
    } catch (error) {
      console.error('Failed to update category:', error)
      throw error
    }
  }

  async function deleteCategory(id) {
    try {
      await axios.delete(`${API_BASE_URL}/api/categories/${id}`)
      categories.value = categories.value.filter(c => c.id !== id)
    } catch (error) {
      console.error('Failed to delete category:', error)
      throw error
    }
  }

  return {
    posts,
    pages,
    categories,
    media,
    navigationMenus,
    loading,
    fetchPosts,
    fetchPost,
    fetchPostBySlug,
    createPost,
    updatePost,
    deletePost,
    fetchPages,
    fetchPage,
    fetchPageBySlug,
    createPage,
    updatePage,
    deletePage,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchMedia,
    uploadMedia,
    deleteMedia,
    fetchNavigationMenus,
    createNavigationMenu,
    updateNavigationMenu,
    updateNavigationItems,
    deleteNavigationMenu
  }
})
  async function fetchPostBySlug(slug) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/posts/slug/${slug}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch post by slug:', error)
      return null
    }
  }
