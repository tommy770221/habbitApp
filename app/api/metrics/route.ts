import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { bloodPressureSchema, bloodSugarSchema, bloodLipidsSchema } from "@/lib/validators/metrics"
import { checkAndAwardBadges } from "@/lib/gamification/awards"

const XP_BY_METRIC: Record<string, number> = {
  blood_pressure: 20,
  blood_sugar: 20,
  blood_lipids: 25,
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { metric_type, ...fields } = body

  if (!metric_type || !["blood_pressure", "blood_sugar", "blood_lipids"].includes(metric_type)) {
    return NextResponse.json({ error: "Invalid metric_type" }, { status: 400 })
  }

  // Validate input based on metric type
  let validationResult
  try {
    if (metric_type === "blood_pressure") {
      validationResult = bloodPressureSchema.parse(fields)
    } else if (metric_type === "blood_sugar") {
      validationResult = bloodSugarSchema.parse(fields)
    } else {
      validationResult = bloodLipidsSchema.parse(fields)
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Validation failed", details: err.errors }, { status: 422 })
  }

  // Insert metric record
  const { data: metric, error: insertError } = await supabase
    .from("health_metrics")
    .insert({
      user_id: user.id,
      metric_type,
      recorded_at: validationResult.recorded_at ?? new Date().toISOString(),
      ...validationResult,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Award XP
  const xpAmount = XP_BY_METRIC[metric_type]
  const metricLabels: Record<string, string> = {
    blood_pressure: "記錄血壓",
    blood_sugar: "記錄血糖",
    blood_lipids: "記錄血脂",
  }

  const { data: xpResult } = await supabase.rpc("award_xp", {
    p_user_id: user.id,
    p_xp_amount: xpAmount,
    p_source_type: "metric_input",
    p_source_id: metric.id,
    p_description: metricLabels[metric_type],
  })

  const { awarded: badges, xp_total: badge_xp } = await checkAndAwardBadges(supabase, user.id)

  return NextResponse.json({
    metric,
    xp_awarded: xpAmount,
    level_up: xpResult?.leveled_up ?? false,
    new_level: xpResult?.new_level,
    badges_awarded: badges,
    badge_xp,
  })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const metric_type = searchParams.get("type")
  const days = parseInt(searchParams.get("days") ?? "30")
  const limit = parseInt(searchParams.get("limit") ?? "50")

  const since = new Date()
  since.setDate(since.getDate() - days)

  let query = supabase
    .from("health_metrics")
    .select("*")
    .eq("user_id", user.id)
    .gte("recorded_at", since.toISOString())
    .order("recorded_at", { ascending: false })
    .limit(limit)

  if (metric_type) {
    query = query.eq("metric_type", metric_type)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ metrics: data })
}
