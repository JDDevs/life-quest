// Copies the single-threaded Stockfish build into public/engine so it is served
// same-origin as a classic Web Worker (no COOP/COEP headers required).
// Runs automatically before `dev` and `build` (see package.json). Idempotent.
import { existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'node_modules', 'stockfish', 'bin')
const destDir = join(root, 'public', 'engine')
const files = ['stockfish-18-lite-single.js', 'stockfish-18-lite-single.wasm']

mkdirSync(destDir, { recursive: true })

for (const f of files) {
  const src = join(srcDir, f)
  const dest = join(destDir, f)
  if (existsSync(src)) {
    copyFileSync(src, dest)
    console.log('[copy-engine] copied', f)
  } else if (existsSync(dest)) {
    console.log('[copy-engine] source missing, keeping existing', f)
  } else {
    console.warn('[copy-engine] WARNING: could not find', f, '— run `npm install stockfish`.')
  }
}
