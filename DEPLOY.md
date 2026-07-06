# Desplegar “Mi Camino” en un servidor gratuito (uso personal)

La app es un sitio estático (React + Vite). Puedes usarla:

- **Solo local**: sin configurar nada, guarda todo en el navegador (localStorage) y
  puedes exportar/importar una copia desde ⚙️ Ajustes.
- **Con nube (recomendado para uso a largo plazo)**: sincroniza tu progreso a una base
  de datos gratis (Supabase), para no perderlo y usarlo en PC y teléfono con los mismos
  datos.

---

## 1) Base de datos gratis (Supabase)

1. Crea una cuenta y un proyecto en <https://supabase.com> (plan gratuito).
2. En el editor SQL, ejecuta:

   ```sql
   create table if not exists app_state (
     id text primary key,
     data jsonb not null,
     updated_at timestamptz not null default now()
   );

   alter table app_state enable row level security;

   -- Uso personal: política permisiva. La “seguridad” es que VITE_SYNC_ID
   -- sea largo y secreto. Si quieres seguridad real, activa Supabase Auth
   -- y restringe por auth.uid().
   create policy "personal all" on app_state
     for all using (true) with check (true);
   ```

3. En **Settings → API** copia:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

4. Crea un archivo `.env` (copiando `.env.example`) y rellena esas variables.
   Elige un `VITE_SYNC_ID` largo y secreto (actúa como tu contraseña de sincronización).

> La sincronización es automática: guarda tras cada cambio y carga al abrir la app.
> También tienes botones manuales **Subir / Bajar de la nube** en ⚙️ Ajustes.

---

## 2) Compilar

```bash
npm install
npm run build      # genera /dist
```

## 3) Publicar el sitio (elige uno)

Todos tienen plan gratuito y sirven sitios estáticos. En cada uno define las mismas
variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SYNC_ID`).

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Site settings → Environment variables → añade las 3 variables.

### Vercel

- Framework preset: **Vite**
- Build command: `npm run build`, Output: `dist`
- Project → Settings → Environment Variables → añade las 3 variables.

### GitHub Pages

```bash
npm run build
# sube el contenido de /dist a la rama gh-pages (o usa una GitHub Action)
```

Como `vite.config.ts` usa `base: './'`, funciona en subrutas de GitHub Pages.

---

## 4) Usarla en el teléfono como app

Abre la URL publicada en el navegador del teléfono y elige **“Añadir a pantalla de
inicio”**. Se abrirá a pantalla completa como una app y, con la nube activada,
tendrás tus mismos datos que en la PC.

---

## Notas

- Sin variables de entorno, la app ignora la nube y funciona 100% local.
- El modelo de sincronización es “última escritura gana”. Para un solo usuario es
  suficiente; evita editar en dos dispositivos a la vez sin conexión.
- Haz **Exportar copia** de vez en cuando como respaldo extra.
