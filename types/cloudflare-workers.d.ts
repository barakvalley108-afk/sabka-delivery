type D1Value = string | number | boolean | null | ArrayBuffer | Uint8Array;

interface D1Meta {
  changes?: number;
  duration?: number;
  last_row_id?: number;
  rows_read?: number;
  rows_written?: number;
  size_after?: number;
}

interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta: D1Meta;
  error?: string;
}

interface D1PreparedStatement {
  bind(...values: D1Value[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(column?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  raw<T = unknown[]>(): Promise<T[]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(
    statements: D1PreparedStatement[],
  ): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1Result>;
  dump(): Promise<ArrayBuffer>;
}

interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
    OTP_SECRET?: string;
    SMS_WEBHOOK_URL?: string;
    SMS_TOKEN?: string;
    ANDROID_ASSETLINKS_JSON?: string;
    [key: string]: unknown;
  };
}
