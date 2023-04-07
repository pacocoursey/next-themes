// vite.config.js
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        react(),
        dts({
            insertTypesEntry: true,
        }),
    ],
    build: {
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: path.resolve(__dirname, 'src/index.tsx'),
            name: 'next-themes',
            // the proper extensions will be added
            fileName: (format) => `index.${format}.js`,
            formats: ['es', 'cjs', 'umd'],
        },
        minify: 'terser',
        rollupOptions: {
            // make sure to externalize deps that shouldn't be bundled
            // into your library
            external: [
                'react',
                'react-dom',
            ],
            output: {
                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',

                },
            },
        },
    },
})