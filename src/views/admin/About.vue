<script setup>
import { IconExternalLink, IconBook, IconServer } from '@tabler/icons-vue'

const version = import.meta.env.VITE_APP_VERSION || 'current build'
const apiBase = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/+$/, '')
</script>

<template>
  <div class="space-y-6">
    <header class="bg-white rounded-lg shadow p-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">About ResDesCMS</h1>
        <p class="text-gray-600 mt-1">Version {{ version }} · Admin UI</p>
      </div>
      <div class="flex gap-2">
        <a
          href="https://github.com/"
          target="_blank"
          rel="noopener"
          class="px-4 py-2 text-sm rounded bg-gray-800 text-white hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
        >
          <IconExternalLink :size="16" />
          <span>Project Site</span>
        </a>
        <a
          href="https://github.com/"
          target="_blank"
          rel="noopener"
          class="px-4 py-2 text-sm rounded bg-rd-orange text-white hover:bg-rd-orange-light flex items-center gap-2 cursor-pointer"
        >
          <IconBook :size="16" />
          <span>Documentation</span>
        </a>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <section class="lg:col-span-2 bg-white rounded-lg shadow p-6 space-y-4">
        <h2 class="text-lg font-semibold text-gray-900">What is ResDesCMS?</h2>
        <p class="text-gray-700 leading-relaxed">
          ResDesCMS is a themeable, media-first content management system built for fast authoring and rapid design iteration.
          It ships with scheduled publishing, reusable media metadata, and an admin-focused UI optimized for multi-device workflows.
        </p>
        <div class="grid md:grid-cols-2 gap-3 text-sm">
          <div class="p-3 border rounded bg-gray-50">
            <p class="font-semibold text-gray-900 mb-1">Content</p>
            <p class="text-gray-700">Posts, pages, categories, and structured navigation with scheduling and author attribution.</p>
          </div>
          <div class="p-3 border rounded bg-gray-50">
            <p class="font-semibold text-gray-900 mb-1">Media</p>
            <p class="text-gray-700">Year/month organized uploads, per-instance metadata, and reusable detail modals across the admin.</p>
          </div>
          <div class="p-3 border rounded bg-gray-50">
            <p class="font-semibold text-gray-900 mb-1">Design</p>
            <p class="text-gray-700">Theme controls for palette, typography, and backgrounds with live-preview friendly layouts.</p>
          </div>
          <div class="p-3 border rounded bg-gray-50">
            <p class="font-semibold text-gray-900 mb-1">Extensibility</p>
            <p class="text-gray-700">Plugin-aware admin navigation and structured API endpoints for integrations.</p>
          </div>
        </div>
      </section>

      <section class="bg-white rounded-lg shadow p-6 space-y-3">
        <h2 class="text-lg font-semibold text-gray-900">Environment</h2>
        <div class="flex items-center gap-2 text-sm text-gray-700">
          <IconServer :size="16" />
          <span>API Base:</span>
          <code class="px-2 py-1 bg-gray-100 rounded text-xs">{{ apiBase }}</code>
        </div>
        <div class="text-sm text-gray-700">
          <p class="font-semibold mb-1">Useful links</p>
          <ul class="list-disc list-inside space-y-1">
            <li><a href="https://github.com/" target="_blank" rel="noopener" class="text-rd-orange hover:text-rd-orange-light">Release notes</a></li>
            <li><a href="https://github.com/" target="_blank" rel="noopener" class="text-rd-orange hover:text-rd-orange-light">Issue tracker</a></li>
            <li><a href="https://github.com/" target="_blank" rel="noopener" class="text-rd-orange hover:text-rd-orange-light">Theme developer guide</a></li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>
