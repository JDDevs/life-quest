// Publica una versión nueva de la app de escritorio en UN comando:
//   1) build firmado (lee la clave privada de ~/.tauri/lifequest_updater.key)
//   2) sube instalador + latest.json a R2 (scripts/publish-update.mjs)
//
//   node scripts/release.mjs      (o: npm run release)
//
// Antes de correrlo: sube el número de `version` en src-tauri/tauri.conf.json
// (y package.json). Requiere cargo en el PATH y credenciales de R2 en .env.local.
import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const keyPath = join(homedir(), '.tauri', 'lifequest_updater.key')
if (!existsSync(keyPath)) {
  console.error('No encuentro la clave de firma en:\n  ' + keyPath + '\nGenérala con: npm run tauri signer generate -- --ci -w "%USERPROFILE%\\.tauri\\lifequest_updater.key"')
  process.exit(1)
}

const env = {
  ...process.env,
  TAURI_SIGNING_PRIVATE_KEY: readFileSync(keyPath, 'utf8'),
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD: '',
}

console.log('› Compilando build firmado…')
execSync('npm run tauri build', { stdio: 'inherit', env })
console.log('\n› Publicando a R2…')
execSync('node scripts/publish-update.mjs', { stdio: 'inherit', env })
console.log('\n✔ Release completo. Los usuarios lo verán en Ajustes → Buscar actualización.')
