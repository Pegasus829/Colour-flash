/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AWS_REGION: string;
  readonly VITE_AWS_IDENTITY_POOL_ID: string;
  readonly VITE_AWS_DYNAMODB_TABLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
