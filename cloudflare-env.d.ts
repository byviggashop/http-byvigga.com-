declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    GMAIL_SHARED_SECRET?: string;
    BYVIGGA_SHARED_SECRET?: string;
    ADMIN_EMAIL?: string;
    GMAIL_SCRIPT_URL?: string;
  }
}
