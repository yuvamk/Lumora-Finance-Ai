import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  CLAUDE_API_KEY: z.string().min(1, "CLAUDE_API_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

// Parse process.env. In Next.js, this runs on the server side.
// We only check client-safe variables on the client side to avoid exposing service role keys.
const isServer = typeof window === "undefined";

const envCheck = () => {
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
  const isDev = process.env.NODE_ENV === "development";
  const isFallbackAllowed = isBuildPhase || isDev;

  const getEnvVar = (name: string, fallback: string) => {
    const value = process.env[name];
    if (!value && isDev && name !== "NEXT_PUBLIC_APP_URL") {
      console.warn(`⚠️ Warning: Missing env variable ${name}. Using development fallback.`);
    }
    return value || (isFallbackAllowed ? fallback : undefined);
  };

  try {
    if (isServer) {
      return envSchema.parse({
        NEXT_PUBLIC_SUPABASE_URL: getEnvVar("NEXT_PUBLIC_SUPABASE_URL", "https://dummy-url.supabase.co"),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", "dummy-anon-key"),
        SUPABASE_SERVICE_ROLE_KEY: getEnvVar("SUPABASE_SERVICE_ROLE_KEY", "dummy-service-key"),
        CLAUDE_API_KEY: getEnvVar("CLAUDE_API_KEY", "dummy-claude-key"),
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      });
    } else {
      // Client-only subset
      const clientSchema = envSchema.pick({
        NEXT_PUBLIC_SUPABASE_URL: true,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
        NEXT_PUBLIC_APP_URL: true,
      });
      return clientSchema.parse({
        NEXT_PUBLIC_SUPABASE_URL: getEnvVar("NEXT_PUBLIC_SUPABASE_URL", "https://dummy-url.supabase.co"),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", "dummy-anon-key"),
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
      const errorMessage = `❌ Invalid environment variables:\n${missingVars}\n\nPlease check your .env.local file.`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    throw error;
  }
};

export const env = envCheck();
export type Env = z.infer<typeof envSchema>;
