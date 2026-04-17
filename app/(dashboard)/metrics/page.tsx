import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetricsTrendChart } from "@/components/metrics/MetricsTrendChart"
import { MetricStatusBadge, getBloodPressureStatus, getBloodSugarStatus, getLDLStatus } from "@/components/metrics/MetricStatusBadge"
import { formatDate, formatTime } from "@/lib/utils"
import { Plus } from "lucide-react"
import { GLUCOSE_CONTEXT_LABELS } from "@/types"
import type { HealthMetric } from "@/types"

export default async function MetricsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch 90 days of each metric type
  const since = new Date()
  since.setDate(since.getDate() - 90)

  const { data: allMetrics } = await supabase
    .from("health_metrics")
    .select("*")
    .eq("user_id", user.id)
    .gte("recorded_at", since.toISOString())
    .order("recorded_at", { ascending: false })

  const bpMetrics = (allMetrics ?? []).filter((m) => m.metric_type === "blood_pressure") as HealthMetric[]
  const sugarMetrics = (allMetrics ?? []).filter((m) => m.metric_type === "blood_sugar") as HealthMetric[]
  const lipidMetrics = (allMetrics ?? []).filter((m) => m.metric_type === "blood_lipids") as HealthMetric[]

  function BPItem({ m }: { m: HealthMetric }) {
    const status = m.systolic && m.diastolic ? getBloodPressureStatus(m.systolic, m.diastolic) : null
    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
        <div>
          <p className="font-semibold text-gray-900">{m.systolic}/{m.diastolic} mmHg</p>
          <p className="text-xs text-gray-500">
            {formatDate(m.recorded_at)} {formatTime(m.recorded_at)}
            {m.pulse && ` · 心率 ${m.pulse}`}
          </p>
        </div>
        {status && <MetricStatusBadge statusInfo={status} compact />}
      </div>
    )
  }

  function SugarItem({ m }: { m: HealthMetric }) {
    const status = m.glucose_value ? getBloodSugarStatus(m.glucose_value, m.glucose_context ?? "fasting") : null
    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
        <div>
          <p className="font-semibold text-gray-900">{m.glucose_value} mmol/L</p>
          <p className="text-xs text-gray-500">
            {formatDate(m.recorded_at)} · {GLUCOSE_CONTEXT_LABELS[m.glucose_context as keyof typeof GLUCOSE_CONTEXT_LABELS] ?? ""}
          </p>
        </div>
        {status && <MetricStatusBadge statusInfo={status} compact />}
      </div>
    )
  }

  function LipidItem({ m }: { m: HealthMetric }) {
    const status = m.ldl ? getLDLStatus(m.ldl) : null
    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            {[m.ldl && `LDL ${m.ldl}`, m.hdl && `HDL ${m.hdl}`, m.triglycerides && `TG ${m.triglycerides}`]
              .filter(Boolean).join(" · ")} mmol/L
          </p>
          <p className="text-xs text-gray-500">{formatDate(m.recorded_at)}</p>
        </div>
        {status && <MetricStatusBadge statusInfo={status} compact />}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">健康數據</h1>
        <Button asChild size="sm">
          <Link href="/metrics/input">
            <Plus className="w-4 h-4 mr-1" /> 新增記錄
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="blood_pressure">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="blood_pressure">💓 血壓</TabsTrigger>
          <TabsTrigger value="blood_sugar">🩸 血糖</TabsTrigger>
          <TabsTrigger value="blood_lipids">🫀 血脂</TabsTrigger>
        </TabsList>

        <TabsContent value="blood_pressure" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">近90天趨勢</CardTitle>
            </CardHeader>
            <CardContent>
              <MetricsTrendChart metrics={bpMetrics} metricType="blood_pressure" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-700">歷史記錄（{bpMetrics.length} 筆）</CardTitle>
                <Link href="/metrics/input?type=blood_pressure">
                  <Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5 mr-1" />新增</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {bpMetrics.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">尚無記錄</p>
              ) : (
                bpMetrics.slice(0, 20).map((m) => <BPItem key={m.id} m={m as HealthMetric} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blood_sugar" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">近90天趨勢</CardTitle>
            </CardHeader>
            <CardContent>
              <MetricsTrendChart metrics={sugarMetrics} metricType="blood_sugar" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-700">歷史記錄（{sugarMetrics.length} 筆）</CardTitle>
                <Link href="/metrics/input?type=blood_sugar">
                  <Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5 mr-1" />新增</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {sugarMetrics.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">尚無記錄</p>
              ) : (
                sugarMetrics.slice(0, 20).map((m) => <SugarItem key={m.id} m={m as HealthMetric} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blood_lipids" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">近90天趨勢</CardTitle>
            </CardHeader>
            <CardContent>
              <MetricsTrendChart metrics={lipidMetrics} metricType="blood_lipids" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-700">歷史記錄（{lipidMetrics.length} 筆）</CardTitle>
                <Link href="/metrics/input?type=blood_lipids">
                  <Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5 mr-1" />新增</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {lipidMetrics.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">尚無記錄</p>
              ) : (
                lipidMetrics.slice(0, 20).map((m) => <LipidItem key={m.id} m={m as HealthMetric} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
