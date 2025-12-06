<template>
  <div class="bg-rd-dark text-white">
    <!-- Hero Section -->
    <div class="w-screen h-screen bg-cover bg-bottom flex flex-col justify-start pt-20" style="background-image: url(/img/bg.png);">
      <div class="flex-1 flex flex-col justify-center items-center text-center px-4">
        <h1 class="font-avant-garde-demi text-4xl md:text-6xl uppercase mb-6">
          Resonance<span class="text-gray-400">Designs</span>
        </h1>
        <img class="w-full max-w-xl mb-8" src="/img/logo.png" alt="Resonance Designs">
        <h2 class="font-avant-garde-demi text-2xl md:text-4xl uppercase">
          <span class="text-gray-400">Web Design</span>&amp;Development
        </h2>
      </div>

      <div class="pb-20 text-center">
        <h3 class="text-xl md:text-2xl mb-4">
          <a href="mailto:info@resonance-designs.com" class="text-rd-orange hover:text-rd-orange-light">info@resonance-designs.com</a>
          |
          <a href="tel:15056709447" class="text-rd-orange hover:text-rd-orange-light">505.670.9447</a>
        </h3>
        <h4 class="text-lg mb-8">In the meantime...</h4>
        <a href="#portfolio" class="inline-block rd-btn-orange">
          View Some Recent Work
          <span class="rd-arrow-down"></span>
        </a>
      </div>
    </div>

    <!-- Portfolio Section -->
    <section id="portfolio" class="w-screen bg-rd-dark py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
        <a v-for="project in projects" :key="project.id" :href="project.url" target="_blank" rel="noopener" class="rd-portfolio relative overflow-hidden aspect-video bg-black">
          <img class="w-full h-full object-cover transition-all duration-800" :src="project.image" :alt="project.name">
          <div class="rd-cover">
            <h3 class="text-white text-center text-2xl font-bold">{{ project.name }}</h3>
          </div>
        </a>
      </div>
    </section>

    <!-- Footer -->
    <footer class="w-screen bg-gradient-to-b from-rd-dark to-gray-600 text-white py-8">
      <div class="max-w-7xl mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div class="col-span-1 md:col-span-3">
            <div class="flex gap-4 mb-4">
              <img class="w-16 h-16 rounded-full border-4 border-rd-teal" src="http://www.gravatar.com/avatar/4ed14ac0dc342459c7ad4c9c7d3b2d42" alt="Gravatar">
              <div class="flex-1">
                <p class="text-sm text-justify">
                  Much of Richard's skill-set was self-taught, though his education spans many courses and certifications in development and design which he combines with over 10 years of commercial experience in responsive web design, front-end (client-side) development, and back-end (server-side) development to produce quality user experiences in both function and design for happy clients all over the planet.
                </p>
                <p class="text-sm mt-2">
                  Web Designer &amp; Developer. Available June 2023.
                  <a href="mailto:info@resonance-designs.com" class="text-rd-teal hover:text-rd-teal-light">Hire Now <span class="rd-arrow-right"></span></a>
                </p>
              </div>
            </div>
          </div>
          <div class="col-span-1">
            <ul class="space-y-3 text-right">
              <li><a href="https://github.com/ResonanceDesign/" target="_blank" rel="noopener" class="text-rd-teal hover:text-rd-teal-light">GitHub ↗</a></li>
              <li><a href="https://stackoverflow.com/users/4994970/richardb" target="_blank" rel="noopener" class="text-rd-teal hover:text-rd-teal-light">Stack Overflow ↗</a></li>
              <li><a href="https://www.linkedin.com/in/richardbakos/" target="_blank" rel="noopener" class="text-rd-teal hover:text-rd-teal-light">LinkedIn ↗</a></li>
              <li><a href="https://twitter.com/ResonanceDesign/" target="_blank" rel="noopener" class="text-rd-teal hover:text-rd-teal-light">Twitter ↗</a></li>
            </ul>
          </div>
        </div>

        <div class="text-right text-xs text-gray-300">
          <p>Unless otherwise stated, content is copyright © 2024 <a href="#" class="text-rd-teal hover:text-rd-teal-light">Resonance Designs</a> and code samples are licensed under <a href="http://www.opensource.org/licenses/mit-license.php" class="text-rd-teal hover:text-rd-teal-light">MIT</a>.</p>
        </div>
      </div>
    </footer>

    <!-- Admin Link -->
    <RouterLink to="/admin/login" class="fixed bottom-4 right-4 text-xs text-gray-500 hover:text-gray-300">Admin</RouterLink>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'

const projects = [
  {
    id: 1,
    name: 'LongHair Records',
    image: '/img/portfolio/longhairrecords.com.png',
    url: 'https://longhairrecords.com/'
  },
  {
    id: 2,
    name: 'Downtown Statesville',
    image: '/img/portfolio/downtownstatesvillenc.org.png',
    url: 'https://www.downtownstatesvillenc.org/'
  },
  {
    id: 3,
    name: 'Resistance Mom',
    image: '/img/portfolio/resistancemom.com.png',
    url: 'https://www.resistancemom.com/'
  },
  {
    id: 4,
    name: 'Visit Statesville',
    image: '/img/portfolio/visitstatesville.org.png',
    url: 'https://www.visitstatesville.org/'
  },
  {
    id: 5,
    name: 'S+J Carolina Scale Co',
    image: '/img/portfolio/sjcarolinascale.com.png',
    url: 'http://h10.b88.myftpupload.com/'
  },
  {
    id: 6,
    name: 'Sales Professors',
    image: '/img/portfolio/sales-professors.com.png',
    url: 'http://www.sales-professors.com/'
  }
]
</script>

<style scoped>
</style>
