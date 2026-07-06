# Desplegar “Mi Camino” gratis (uso personal)

La app es un sitio estático (React + Vite) con **sincronización opcional en la
nube** mediante **Neon** (Postgres gratis) + una **función serverless en Vercel**.

- **Solo local**: sin configurar nada, guarda todo en el navegador (localStorage)
  y puedes exportar/importar una copia desde ⚙️ Ajustes.
- **Con nube (recomendado)**: sincroniza tu progreso a Neon para no perderlo y
  usarlo en PC y teléfono con los mismos datos. La cadena de conexión de la base
  de datos vive **solo en el servidor** (nunca en el navegador).

Arquitectura: navegador → `/api/state` (función en Vercel) → Neon.

---

## 1) Base de datos gratis (Neon)

1. Crea una cuenta y un proyecto en <https://neon.tech> (plan Free).
2. Copia la **cadena de conexión** (Connection string), algo como:
   `postgresql://usuario:password@ep-xxxx.neon.tech/dbname?sslmode=require`

No necesitas crear tablas a mano: la función las crea sola la primera vez.

## 2) Sube el código a GitHub

Usa GitHub Desktop o la terminal. Crea un repo `mi-camino` con este proyecto.

## 3) Publica en Vercel

1. En <https://vercel.com> → *Add New… → Project* → importa tu repo.
2. Vercel detecta **Vite** solo (Build: `npm run build`, Output: `dist`). No lo cambies.
3. En **Environment Variables** añade:

   | Name | Dónde | Valor |
   |------|-------|-------|
   | `DATABASE_URL` | Server | la cadena de conexión de Neon |
   | `VITE_SYNC_ID` | Build/Client | un texto largo y secreto (tu “contraseña” de sync) |
   | `GEMINI_API_KEY` | Server | (opcional) tu API key de Google Gemini, para el asistente y el tutor de ajedrez |

4. **Deploy**. Vercel publica el sitio **y** las funciones `api/state.js` y `api/ai.js` juntas.

> `DATABASE_URL` y `GEMINI_API_KEY` son secretas y quedan en el servidor.
> `VITE_SYNC_ID` se incluye en el sitio (como una llave pública); por eso debe
> ser larga y difícil de adivinar. La función `api/ai.js` exige ese mismo
> `VITE_SYNC_ID` para que nadie use tu cuota de Gemini gratis.

## 4) Verifica

Abre tu URL → ⚙️ Ajustes → sección **Nube** debe decir **“Sincronizado”**.
También hay botones **Subir / Bajar de la nube** manuales.

## 5) En el teléfono

Abre la URL en el navegador del teléfono → **“Añadir a pantalla de inicio”**.
Se abre como app y con los mismos datos que en la PC.

---

## Funciones de IA (Gemini) — opcional pero recomendado

El **asistente de metas** (sugerir XP/monedas, proponer metas, chat) y el **tutor
de ajedrez** (explicaciones en lenguaje natural) usan Google Gemini:

1. Saca una API key **gratis** en <https://aistudio.google.com/apikey> (sin tarjeta).
2. Añádela como variable `GEMINI_API_KEY` (**Server**) en Vercel — y en tu `.env`
   local si usas `vercel dev`.
3. Las funciones de IA aparecen solo si `VITE_SYNC_ID` está configurado (es el
   candado que protege el endpoint). La key **nunca** viaja al navegador.

> El motor de ajedrez (Stockfish) corre **local en el navegador** (`public/engine/`,
> se copia solo antes de cada build) y no consume la cuota de Gemini: solo las
> explicaciones en texto usan la IA.

## Desarrollo local

```bash
npm install
npm run dev        # app en local (sin nube, salvo que uses `vercel dev`)
npm run build      # genera /dist
```

Para probar la función `/api/state` en local necesitas la CLI de Vercel:

```bash
npm i -g vercel
# crea un .env con DATABASE_URL=... y VITE_SYNC_ID=...
vercel dev
```

---

## Notas

- Todo (Neon + Vercel) es **gratis** para uso personal.
- Cada `git push` reconstruye y redespliega en Vercel automáticamente.
- El modelo de sync es “última escritura gana”; para un solo usuario es
  suficiente. Evita editar en dos dispositivos a la vez sin conexión.
- Haz **Exportar copia** de vez en cuando como respaldo extra.
- ¿Prefieres Netlify u otro Postgres? La función `api/state.js` sirve para
  cualquier Postgres (incluido Supabase) — solo cambia `DATABASE_URL`.
