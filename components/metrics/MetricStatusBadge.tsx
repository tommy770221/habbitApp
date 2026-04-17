import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { MetricStatusInfo } from "@/types"

// WHO/AHA Clinical reference ranges
export function getBloodPressureStatus(systolic: number, diastolic: number): MetricStatusInfo {
  if (systolic >= 180 || diastolic >= 120) {
    return { status: "危險", color: "red", bgClass: "bg-red-100", textClass: "text-red-700", message: "高血壓危象，建議立即就醫" }
  }
  if (systolic >= 140 || diastolic >= 90) {
    return { status: "偏高", color: "orange", bgClass: "bg-orange-100", textClass: "text-orange-700", message: "二級高血壓，請諮詢醫師" }
  }
  if (systolic >= 130 || diastolic >= 80) {
    return { status: "警告", color: "yellow", bgClass: "bg-yellow-100", textClass: "text-yellow-700", message: "一級高血壓，注意飲食與運動" }
  }
  if (systolic >= 120 && diastolic < 80) {
    return { status: "警告", color: "yellow", bgClass: "bg-yellow-50", textClass: "text-yellow-600", message: "血壓偏高前期，建議改善生活習慣" }
  }
  if (systolic < 90 || diastolic < 60) {
    return { status: "偏低", color: "blue", bgClass: "bg-blue-100", textClass: "text-blue-700", message: "血壓偏低，注意水分攝取" }
  }
  return { status: "正常", color: "green", bgClass: "bg-green-100", textClass: "text-green-700", message: "血壓正常，繼續保持！" }
}

export function getBloodSugarStatus(glucose: number, context: string): MetricStatusInfo {
  if (context === "fasting") {
    if (glucose >= 7.0) {
      return { status: "偏高", color: "orange", bgClass: "bg-orange-100", textClass: "text-orange-700", message: "空腹血糖偏高，達糖尿病標準" }
    }
    if (glucose >= 6.1) {
      return { status: "警告", color: "yellow", bgClass: "bg-yellow-100", textClass: "text-yellow-700", message: "空腹血糖略高（糖尿病前期）" }
    }
    if (glucose < 3.9) {
      return { status: "偏低", color: "blue", bgClass: "bg-blue-100", textClass: "text-blue-700", message: "血糖偏低，請及時補充碳水化合物" }
    }
    return { status: "正常", color: "green", bgClass: "bg-green-100", textClass: "text-green-700", message: "空腹血糖正常範圍（3.9–6.0）" }
  }
  if (context === "after_meal_2h") {
    if (glucose >= 11.1) {
      return { status: "危險", color: "red", bgClass: "bg-red-100", textClass: "text-red-700", message: "餐後血糖過高，達糖尿病標準" }
    }
    if (glucose >= 7.8) {
      return { status: "警告", color: "yellow", bgClass: "bg-yellow-100", textClass: "text-yellow-700", message: "餐後血糖略高（糖耐量異常）" }
    }
    return { status: "正常", color: "green", bgClass: "bg-green-100", textClass: "text-green-700", message: "餐後2小時血糖正常（<7.8）" }
  }
  // General ranges for other contexts
  if (glucose > 10) {
    return { status: "偏高", color: "orange", bgClass: "bg-orange-100", textClass: "text-orange-700", message: "血糖偏高，注意監測" }
  }
  if (glucose < 3.9) {
    return { status: "偏低", color: "blue", bgClass: "bg-blue-100", textClass: "text-blue-700", message: "血糖偏低" }
  }
  return { status: "正常", color: "green", bgClass: "bg-green-100", textClass: "text-green-700", message: "血糖在正常範圍內" }
}

export function getLDLStatus(ldl: number): MetricStatusInfo {
  if (ldl >= 4.9) {
    return { status: "危險", color: "red", bgClass: "bg-red-100", textClass: "text-red-700", message: "LDL 嚴重偏高，高心血管風險" }
  }
  if (ldl >= 3.4) {
    return { status: "偏高", color: "orange", bgClass: "bg-orange-100", textClass: "text-orange-700", message: "LDL 偏高，建議改善飲食" }
  }
  if (ldl >= 2.6) {
    return { status: "警告", color: "yellow", bgClass: "bg-yellow-100", textClass: "text-yellow-700", message: "LDL 略高，保持注意" }
  }
  return { status: "正常", color: "green", bgClass: "bg-green-100", textClass: "text-green-700", message: "LDL 膽固醇正常" }
}

interface MetricStatusBadgeProps {
  statusInfo: MetricStatusInfo
  compact?: boolean
}

export function MetricStatusBadge({ statusInfo, compact = false }: MetricStatusBadgeProps) {
  if (compact) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full", statusInfo.bgClass, statusInfo.textClass)}>
        {statusInfo.status}
      </span>
    )
  }

  return (
    <div className={cn("rounded-xl px-4 py-3", statusInfo.bgClass)}>
      <div className="flex items-center gap-2 mb-1">
        <span className={cn("font-bold text-base", statusInfo.textClass)}>{statusInfo.status}</span>
      </div>
      <p className={cn("text-sm", statusInfo.textClass)}>{statusInfo.message}</p>
    </div>
  )
}
