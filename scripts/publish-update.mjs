// Publica el instalador de escritorio + un feed `latest.json` a Cloudflare R2,
// para que la app se auto-actualice (Ajustes → Buscar actualización).
//
// Flujo de un release:
//   1) Bump de version en src-tauri/tauri.conf.json (y package.json).
//   2) Build firmado:
//        $env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "$HOME/.tauri/lifequest_updater.key" -Raw
//        $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""
//        npm run tauri build
//   3) Publicar:  node scripts/publish-update.mjs
//
// Lee las credenciales de R2 de .env.local / .env (las mismas que usa api/upload-url.js).
import { AwsClient } from 'aws4fetch'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Carga variables de .env.local y .env sin pisar las ya definidas en el entorno.
for (const f of ['.env.local', '.env']) {
  const p = join(root, f)
  if (!existsSync(p)) continue
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (!m) continue
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = process.env
const missing = Object.entries({ R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL })
  .filter(([, v]) => !v)
  .map(([k]) => k)
if (missing.length) {
  console.error('Faltan credenciales de R2 en .env.local/.env: ' + missing.join(', '))
  process.exit(1)
}
const publicBase = R2_PUBLIC_URL.replace(/\/+$/, '')

const bundleDir = join(root, 'src-tauri/target/release/bundle/nsis')
// Pick the most recently built installer (robust to version-source mismatches).
const setups = existsSync(bundleDir)
  ? readdirSync(bundleDir)
      .filter((f) => /_x64-setup\.exe$/.test(f))
      .map((f) => ({ f, t: statSync(join(bundleDir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)
  : []
if (!setups.length) {
  console.error('No encuentro ningún instalador en:\n  ' + bundleDir + '\nCorre `npm run tauri build` primero.')
  process.exit(1)
}
const setupPath = join(bundleDir, setups[0].f)
const sigPath = setupPath + '.sig'
if (!existsSync(sigPath)) {
  console.error('No encuentro la firma .sig:\n  ' + sigPath + '\nBuildea con TAURI_SIGNING_PRIVATE_KEY seteado.')
  process.exit(1)
}
const vm = setups[0].f.match(/_(\d+\.\d+\.\d+)_x64-setup\.exe$/)
const version = vm ? vm[1] : JSON.parse(readFileSync(join(root, 'src-tauri/tauri.conf.json'), 'utf8')).version

const signature = readFileSync(sigPath, 'utf8').trim()
const installer = readFileSync(setupPath)

// Clave sin espacios para una URL limpia.
const installerKey = `updates/LifeQuest_${version}_x64-setup.exe`
const installerUrl = `${publicBase}/${installerKey}`

const latest = {
  version,
  notes: process.env.RELEASE_NOTES || `Life Quest ${version}`,
  pub_date: new Date().toISOString(),
  platforms: {
    'windows-x86_64': { signature, url: installerUrl },
  },
}

const client = new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: 's3', region: 'auto' })
async function put(key, body, contentType) {
  const url = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${key}`
  const res = await client.fetch(url, { method: 'PUT', body, headers: { 'content-type': contentType } })
  if (!res.ok) throw new Error(`PUT ${key} -> ${res.status} ${await res.text()}`)
  console.log('subido:', key)
}

await put(installerKey, installer, 'application/octet-stream')
await put('updates/latest.json', JSON.stringify(latest, null, 2), 'application/json')

console.log('\nPublicado v' + version)
console.log('Feed:       ' + `${publicBase}/updates/latest.json`)
console.log('Instalador: ' + installerUrl)
