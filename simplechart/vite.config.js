import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    minify: false,
    lib: {
      name: "simplechart",
      entry: ['src/chart.js'],
      fileName: (format) => `simplechart.${format}.js`,
      cssFileName: (format) => `simplechart.${format}.css`,
    },
  },
})
