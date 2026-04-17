import { createBrowserClient } from "@supabase/ssr"

// Using untyped client until proper Supabase types are generated
// Run: npx supabase gen types typescript --project-id <id> > lib/supabase/database.types.ts
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
