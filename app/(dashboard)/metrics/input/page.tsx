"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MetricStatusBadge, getBloodPressureStatus, getBloodSugarStatus, getLDLStatus } from "@/components/metrics/MetricStatusBadge"
import { showXPGain, showLevelUp } from "@/components/gamification/XPGainToast"
import { GLUCOSE_CONTEXT_LABELS } from "@/types"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

function MetricInputForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = searchParams.get("type") ?? "blood_pressure"

  const [activeTab, setActiveTab] = useState(defaultType)
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState("")

  // Blood pressure state
  const [systolic, setSystolic] = useState("")
  const [diastolic, setDiastolic] = useState("")
  const [pulse, setPulse] = useState("")

  // Blood sugar state
  const [glucose, setGlucose] = useState("")
  const [glucoseContext, setGlucoseContext] = useState("fasting")

  // Blood lipids state
  const [ldl, setLdl] = useState("")
  const [hdl, setHdl] = useState("")
  const [totalChol, setTotalChol] = useState("")
  const [triglycerides, setTriglycerides] = useState("")

  // Status preview
  const bpStatus = systolic && diastolic
    ? getBloodPressureStatus(Number(systolic), Number(diastolic))
    : null
  const glucoseStatus = glucose
    ? getBloodSugarStatus(Number(glucose), glucoseContext)
    : null
  const ldlStatus = ldl ? getLDLStatus(Number(ldl)) : null

  async function submit(metricType: string, payload: Record<string, unknown>) {
    setLoading(true)
    try {
      const res = await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metric_type: metricType, ...payload }),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error ?? "記錄失敗")
        return
      }

      const data = await res.json()
      showXPGain(data.xp_awarded, `記錄${metricType === "blood_pressure" ? "血壓" : metricType === "blood_sugar" ? "血糖" : "血脂"}成功`)
      if (data.level_up) {
        showLevelUp(data.new_level, "")
      }
      router.push("/metrics")
    } catch (e) {
      alert("網路錯誤，請稍後再試")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/metrics">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">新增健康記錄</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="blood_pressure">💓 血壓</TabsTrigger>
          <TabsTrigger value="blood_sugar">🩸 血糖</TabsTrigger>
          <TabsTrigger value="blood_lipids">🫀 血脂</TabsTrigger>
        </TabsList>

        {/* Blood Pressure */}
        <TabsContent value="blood_pressure">
          <Card>
            <CardHeader><CardTitle className="text-base">血壓記錄</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>收縮壓（高壓）mmHg</Label>
                  <Input
                    type="number"
                    placeholder="120"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    min={60} max={300}
                  />
                </div>
                <div className="space-y-1">
                  <Label>舒張壓（低壓）mmHg</Label>
                  <Input
                    type="number"
                    placeholder="80"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    min={40} max={200}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>心率（可選）次/分</Label>
                <Input
                  type="number"
                  placeholder="72"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  min={30} max={250}
                />
              </div>

              {bpStatus && <MetricStatusBadge statusInfo={bpStatus} />}

              <div className="space-y-1">
                <Label>備註（可選）</Label>
                <Textarea placeholder="量測時的狀況…" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>

              <Button
                className="w-full"
                disabled={!systolic || !diastolic || loading}
                onClick={() => submit("blood_pressure", {
                  systolic: Number(systolic),
                  diastolic: Number(diastolic),
                  ...(pulse && { pulse: Number(pulse) }),
                  ...(notes && { notes }),
                })}
              >
                {loading ? "記錄中..." : "記錄血壓 (+20 XP)"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blood Sugar */}
        <TabsContent value="blood_sugar">
          <Card>
            <CardHeader><CardTitle className="text-base">血糖記錄</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>量測時間點</Label>
                <Select value={glucoseContext} onValueChange={setGlucoseContext}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GLUCOSE_CONTEXT_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>血糖值 mmol/L</Label>
                <Input
                  type="number"
                  placeholder="5.5"
                  step="0.1"
                  value={glucose}
                  onChange={(e) => setGlucose(e.target.value)}
                  min={1} max={50}
                />
              </div>

              {glucoseStatus && <MetricStatusBadge statusInfo={glucoseStatus} />}

              <div className="space-y-1">
                <Label>備註（可選）</Label>
                <Textarea placeholder="量測時的狀況…" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>

              <Button
                className="w-full"
                disabled={!glucose || loading}
                onClick={() => submit("blood_sugar", {
                  glucose_value: Number(glucose),
                  glucose_context: glucoseContext,
                  ...(notes && { notes }),
                })}
              >
                {loading ? "記錄中..." : "記錄血糖 (+20 XP)"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blood Lipids */}
        <TabsContent value="blood_lipids">
          <Card>
            <CardHeader><CardTitle className="text-base">血脂記錄（至少填一項）</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>總膽固醇 mmol/L</Label>
                  <Input type="number" placeholder="4.5" step="0.1" value={totalChol} onChange={(e) => setTotalChol(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>LDL（壞膽固醇）</Label>
                  <Input type="number" placeholder="2.6" step="0.1" value={ldl} onChange={(e) => setLdl(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>HDL（好膽固醇）</Label>
                  <Input type="number" placeholder="1.3" step="0.1" value={hdl} onChange={(e) => setHdl(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>三酸甘油脂</Label>
                  <Input type="number" placeholder="1.5" step="0.1" value={triglycerides} onChange={(e) => setTriglycerides(e.target.value)} />
                </div>
              </div>

              {ldlStatus && <MetricStatusBadge statusInfo={ldlStatus} />}

              <div className="space-y-1">
                <Label>備註（可選）</Label>
                <Textarea placeholder="量測時的狀況…" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>

              <Button
                className="w-full"
                disabled={!ldl && !hdl && !totalChol && !triglycerides || loading}
                onClick={() => submit("blood_lipids", {
                  ...(totalChol && { total_cholesterol: Number(totalChol) }),
                  ...(ldl && { ldl: Number(ldl) }),
                  ...(hdl && { hdl: Number(hdl) }),
                  ...(triglycerides && { triglycerides: Number(triglycerides) }),
                  ...(notes && { notes }),
                })}
              >
                {loading ? "記錄中..." : "記錄血脂 (+25 XP)"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reference ranges info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <p className="text-xs font-semibold text-blue-700 mb-2">正常參考範圍（成人）</p>
          <div className="text-xs text-blue-600 space-y-1">
            {activeTab === "blood_pressure" && (
              <>
                <p>• 收縮壓 90–119 mmHg，舒張壓 60–79 mmHg</p>
                <p>• ≥140/90 mmHg 為高血壓（二級）</p>
              </>
            )}
            {activeTab === "blood_sugar" && (
              <>
                <p>• 空腹：3.9–6.0 mmol/L</p>
                <p>• 餐後2小時：&lt;7.8 mmol/L</p>
              </>
            )}
            {activeTab === "blood_lipids" && (
              <>
                <p>• LDL &lt;2.6 mmol/L（最佳）</p>
                <p>• HDL &gt;1.0 mmol/L（男）/&gt;1.3（女）</p>
                <p>• 三酸甘油脂 &lt;1.7 mmol/L</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function MetricInputPage() {
  return (
    <Suspense fallback={<div className="p-4">載入中...</div>}>
      <MetricInputForm />
    </Suspense>
  )
}
