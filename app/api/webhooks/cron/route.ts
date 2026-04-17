import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Protected cron endpoint - called by Vercel Cron or external scheduler
// Add to vercel.json: { "crons": [{ "path": "/api/webhooks/cron", "schedule": "0 0 * * 1" }] }
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Use service role client (bypasses RLS for batch operations)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sunday, 1=Monday

  const results: Record<string, unknown> = {}

  // Monday: generate new weekly missions for all users
  if (dayOfWeek === 1) {
    const { data: templates } = await supabase
      .from("mission_templates")
      .select("id, target_count")
      .eq("mission_type", "weekly")
      .eq("is_active", true)

    const { data: users } = await supabase
      .from("profiles")
      .select("id")

    if (templates && users) {
      const periodStart = today.toISOString().split("T")[0]
      const periodEnd = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000)
        .toISOString().split("T")[0]

      // Pick 3 random templates for each user
      const missionInserts = users.flatMap((user) => {
        const shuffled = [...templates].sort(() => Math.random() - 0.5).slice(0, 3)
        return shuffled.map((template) => ({
          user_id: user.id,
          template_id: template.id,
          period_start: periodStart,
          period_end: periodEnd,
          target_count: template.target_count,
          status: "active" as const,
        }))
      })

      const { error } = await supabase
        .from("user_missions")
        .upsert(missionInserts, { onConflict: "user_id,template_id,period_start", ignoreDuplicates: true })

      results.weekly_missions = { generated: missionInserts.length, error: error?.message }
    }
  }

  // Daily: expire past missions
  const { error: expireError } = await supabase
    .from("user_missions")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("period_end", today.toISOString().split("T")[0])

  results.expired_missions = { error: expireError?.message ?? null }

  return NextResponse.json({ ok: true, day_of_week: dayOfWeek, ...results })
}
