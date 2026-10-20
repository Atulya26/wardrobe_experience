import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), {
    name: 'lens-engine-reload',
    // Input/target registries own global listeners. Reload them atomically;
    // partial HMR can leave two render roots and two frame loops alive.
    handleHotUpdate({ file, server }) {
      if (/\/src\/.*\.(ts|tsx)$/.test(file)) {
        server.ws.send({ type: 'full-reload' })
        return []
      }
    },
  }],
  cacheDir: 'node_modules/.vite-flow2',
  resolve: { dedupe: ['react', 'react-dom'] },
  optimizeDeps: { include: ['react', 'react-dom/client', 'framer-motion', 'voice-glow'] },
  server: { port: 5180, strictPort: true },
})
