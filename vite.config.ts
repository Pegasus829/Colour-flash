import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The package "browser" map points "./dist-es/index" at "./dist-es/index.browser",
// but Vite matches that against the "module" field "./dist-es/index.js" and misses.
// The Node entry re-exports @aws-sdk/credential-provider-login, whose named
// `promises` import from node:fs fails the browser build. Use the browser entry.
const credentialProvidersBrowser = fileURLToPath(
  new URL(
    './node_modules/@aws-sdk/credential-providers/dist-es/index.browser.js',
    import.meta.url,
  ),
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Colour-flash/',
  resolve: {
    alias: [
      {
        find: /^@aws-sdk\/credential-providers$/,
        replacement: credentialProvidersBrowser,
      },
    ],
  },
})
