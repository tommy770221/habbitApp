import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Protected cron endpoint - called by Vercel Cron or external scheduler
// vercel.json: { "crons": [{ "path": "/api/webhooks/cron", "schedule": "0 0 * * *" }] }
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date()
  const dayOfWeek = today.getDay()   // 0=Sunday, 1=Monday
  const dayOfMonth = today.getDate()
  const todayStr = today.toISOString().split("T")[0]

  const results: Record<string, unknown> = {}

  // EVERY DAY: generate all 6 daily missions for all users
  {
    const [{ data: templates }, { data: users }] = await Promise.all([
      supabase.from("mission_templates").select("id, target_count")
        .eq("mission_type", "daily").eq("is_active", true),
      supabase.from("profiles").select("id"),
    ])

    if (templates && users) {
      const inserts = users.flatMap((user) =>
        templates.map((t) => ({
          user_id: user.id,
          template_id: t.id,
          period_start: todayStr,
          period_end: todayStr,
          target_count: t.target_count,
          status: "active" as const,
        }))
      )

      const { error } = await supabase
        .from("user_missions")
        .upsert(inserts, { onConflict: "user_id,template_id,period_start", ignoreDuplicates: true })

      results.daily_missions = { generated: inserts.length, error: error?.message ?? null }
    }
  }

  // MONDAY: generate new weekly missions for all users
  if (dayOfWeek === 1) {
    const [{ data: templates }, { data: users }] = await Promise.all([
      supabase.from("mission_templates").select("id, target_count")
        .eq("mission_type", "weekly").eq("is_active", true),
      supabase.from("profiles").select("id"),
    ])

    if (templates && users) {
      const periodEnd = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000)
        .toISOString().split("T")[0]

      const missionInserts = users.flatMap((user) => {
        const shuffled = [...templates].sort(() => Math.random() - 0.5).slice(0, 3)
        return shuffled.map((template) => ({
          user_id: user.id,
          template_id: template.id,
          period_start: todayStr,
          period_end: periodEnd,
          target_count: template.target_count,
          status: "active" as const,
        }))
      })

      const { error } = await supabase
        .from("user_missions")
        .upsert(missionInserts, { onConflict: "user_id,template_id,period_start", ignoreDuplicates: true })

      results.weekly_missions = { generated: missionInserts.length, error: error?.message ?? null }
    }
  }

  // 1ST OF MONTH: generate all monthly missions for all users
  if (dayOfMonth === 1) {
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString().split("T")[0]

    const [{ data: templates }, { data: users }] = await Promise.all([
      supabase.from("mission_templates").select("id, target_count")
        .eq("mission_type", "monthly").eq("is_active", true),
      supabase.from("profiles").select("id"),
    ])

    if (templates && users) {
      const inserts = users.flatMap((user) =>
        templates.map((t) => ({
          user_id: user.id,
          template_id: t.id,
          period_start: todayStr,
          period_end: monthEnd,
          target_count: t.target_count,
          status: "active" as const,
        }))
      )

      const { error } = await supabase
        .from("user_missions")
        .upsert(inserts, { onConflict: "user_id,template_id,period_start", ignoreDuplicates: true })

      results.monthly_missions = { generated: inserts.length, error: error?.message ?? null }
    }
  }

  // DAILY: expire past missions
  const { error: expireError } = await supabase
    .from("user_missions")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("period_end", todayStr)

  results.expired_missions = { error: expireError?.message ?? null }

  return NextResponse.json({ ok: true, day_of_week: dayOfWeek, day_of_month: dayOfMonth, ...results })
}
