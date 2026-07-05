import { canonicalSiteUrl } from "../config/site.js";

// src/lib/env.ts
export const env = {
  SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY!,
  SITE_URL: canonicalSiteUrl,
  NODE_ENV: process.env.NODE_ENV || 'development'
}
