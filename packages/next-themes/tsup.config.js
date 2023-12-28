import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.tsx'],
  sourcemap: false,
  minify: true,
  dts: true,
  format: ['esm', 'cjs'],
  loader: {
    '.js': 'jsx'
  },
  banner: {
    js: `"use client";`
  }
})
