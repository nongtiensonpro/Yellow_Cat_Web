// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  extends: ['@nuxt/ui-pro'],
  modules: [
    '@pinia/nuxt',
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxt/image',
  ],
  components: true,
})