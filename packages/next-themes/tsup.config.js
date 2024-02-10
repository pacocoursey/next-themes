import { defineConfig } from 'tsup'

export default defineConfig({
  sourcemap: false,
  minify: true,
  banner: {
    js: `'use client'`
  },
  dts: true,
  format: ['esm', 'cjs'],
  loader: {
    '.js': 'jsx'
  }
})
