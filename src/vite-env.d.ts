/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AWS_REGION: string;
  readonly VITE_AWS_USER_POOL_ID: string;
  readonly VITE_AWS_USER_POOL_CLIENT_ID: string;
  readonly VITE_AWS_IDENTITY_POOL_ID: string;
  readonly VITE_AWS_DYNAMODB_TABLE: string;
  readonly VITE_COGNITO_DOMAIN: string;
  readonly VITE_REDIRECT_URI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
