/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SQUAREFLO_API_URL?: string;
  readonly VITE_SQUAREFLO_API_KEY?: string;
  readonly VITE_SQUAREFLO_DRAFT_KEY?: string;
  readonly VITE_SQUAREFLO_PROXY_URL?: string;
  readonly VITE_SQUAREFLO_CONTACT_FORM_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
