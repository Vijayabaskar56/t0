import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from "@cloudflare/vite-plugin";

const config = defineConfig({
  plugins: [
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart({
      sitemap: {
        enabled: true,
        host: 'https://tanstack-faster.tancn.dev/',
      },
      // TODO: Need to Figure out how to generate dynamic sitemap without pre-rendering
      pages: [
        {
          path: '/',
          sitemap: {
            priority: 1.0,
          }
        },
        {
          path: '/order',
          sitemap: {
            priority: 0.7,
          }
        },
        {
          path: '/order-history',
          sitemap: {
            priority: 0.6,
          }
        },
      ]
    }),
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
})

export default config
