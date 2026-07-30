import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("https://dummy-url.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default("dummy-anon-key"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default("dummy-service-key"),
  CLAUDE_API_KEY: z.string().min(1).default("dummy-claude-key"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

// Statically reference all environment variables to ensure compatibility on both Server and Client (browser hydration)
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy-url.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy-service-key",
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || "dummy-claude-key",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

export type Env = z.infer<typeof envSchema>;
