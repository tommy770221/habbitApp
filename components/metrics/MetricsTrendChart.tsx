"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { HealthMetric } from "@/types"
import { formatDate } from "@/lib/utils"

interface MetricsTrendChartProps {
  metrics: HealthMetric[]
  metricType: "blood_pressure" | "blood_sugar" | "blood_lipids"
}

export function MetricsTrendChart({ metrics, metricType }: MetricsTrendChartProps) {
  const sorted = [...metrics].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  )

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        暫無數據，請開始記錄
      </div>
    )
  }

  if (metricType === "blood_pressure") {
    const data = sorted.map((m) => ({
      date: formatDate(m.recorded_at, { month: "2-digit", day: "2-digit" }),
      systolic: m.systolic,
      diastolic: m.diastolic,
      pulse: m.pulse,
    }))

    return (
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[50, 200]} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(value, name) => [
              `${value} mmHg`,
              name === "systolic" ? "收縮壓" : name === "diastolic" ? "舒張壓" : "心率",
            ]}
          />
          <ReferenceLine y={140} stroke="#f97316" strokeDasharray="4 2" label={{ value: "140", position: "right", fontSize: 10, fill: "#f97316" }} />
          <ReferenceLine y={90} stroke="#eab308" strokeDasharray="4 2" label={{ value: "90", position: "right", fontSize: 10, fill: "#eab308" }} />
          <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="systolic" />
          <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="diastolic" />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (metricType === "blood_sugar") {
    const data = sorted.map((m) => ({
      date: formatDate(m.recorded_at, { month: "2-digit", day: "2-digit" }),
      glucose: m.glucose_value,
    }))

    return (
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[2, 15]} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(value) => [`${value} mmol/L`, "血糖"]}
          />
          <ReferenceLine y={7.0} stroke="#f97316" strokeDasharray="4 2" label={{ value: "7.0", position: "right", fontSize: 10, fill: "#f97316" }} />
          <ReferenceLine y={3.9} stroke="#3b82f6" strokeDasharray="4 2" label={{ value: "3.9", position: "right", fontSize: 10, fill: "#3b82f6" }} />
          <Line type="monotone" dataKey="glucose" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  // Blood lipids
  const data = sorted.map((m) => ({
    date: formatDate(m.recorded_at, { month: "2-digit", day: "2-digit" }),
    ldl: m.ldl,
    hdl: m.hdl,
    triglycerides: m.triglycerides,
  }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 8]} tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(value, name) => [
            `${value} mmol/L`,
            name === "ldl" ? "LDL" : name === "hdl" ? "HDL" : "三酸甘油脂",
          ]}
        />
        <ReferenceLine y={3.4} stroke="#f97316" strokeDasharray="4 2" label={{ value: "LDL警戒", position: "right", fontSize: 9, fill: "#f97316" }} />
        <Line type="monotone" dataKey="ldl" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="ldl" />
        <Line type="monotone" dataKey="hdl" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="hdl" />
        <Line type="monotone" dataKey="triglycerides" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="triglycerides" />
      </LineChart>
    </ResponsiveContainer>
  )
}
