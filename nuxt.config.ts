export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  css: ['~/assets/css/variables.css'],
  components: [
    { path: '~/components', pathPrefix: false }
  ],
  runtimeConfig: {
    deepseekApiKey: process.env.DEEPSEEK_API_KEY
  }
})
