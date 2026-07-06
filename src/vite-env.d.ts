/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Secret identifier for your cloud copy. Set it to enable sync. */
  readonly VITE_SYNC_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
