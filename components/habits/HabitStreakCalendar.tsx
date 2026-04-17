"use client"

import type { HabitCheckin } from "@/types"

interface HabitStreakCalendarProps {
  checkins: HabitCheckin[]
  weeks?: number
}

export function HabitStreakCalendar({ checkins, weeks = 12 }: HabitStreakCalendarProps) {
  // Build date -> completion count map
  const countByDate: Record<string, number> = {}
  for (const c of checkins) {
    countByDate[c.checkin_date] = (countByDate[c.checkin_date] ?? 0) + 1
  }

  // Generate grid: today going back `weeks` weeks
  const today = new Date()
  const cells: { date: string; count: number; isToday: boolean }[] = []

  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    cells.push({
      date: dateStr,
      count: countByDate[dateStr] ?? 0,
      isToday: i === 0,
    })
  }

  function getCellColor(count: number, isToday: boolean): string {
    if (isToday && count === 0) return "bg-gray-200 ring-2 ring-green-400 ring-offset-1"
    if (count === 0) return "bg-gray-100"
    if (count === 1) return "bg-green-200"
    if (count === 2) return "bg-green-400"
    return "bg-green-600"
  }

  const dayLabels = ["一", "二", "三", "四", "五", "六", "日"]

  // Month labels
  const monthLabels: { label: string; col: number }[] = []
  for (let col = 0; col < weeks; col++) {
    const cell = cells[col * 7]
    if (cell) {
      const d = new Date(cell.date)
      if (d.getDate() <= 7) {
        monthLabels.push({ label: `${d.getMonth() + 1}月`, col })
      }
    }
  }

  return (
    <div className="space-y-2">
      {/* Month labels */}
      <div className="flex gap-1 ml-6 h-4">
        {Array.from({ length: weeks }).map((_, col) => {
          const ml = monthLabels.find((m) => m.col === col)
          return (
            <div key={col} className="w-3 text-xs text-gray-400 leading-none">
              {ml?.label ?? ""}
            </div>
          )
        })}
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <div key={d} className="w-4 h-3 text-xs text-gray-400 leading-none flex items-center justify-center">
              {d % 2 === 0 ? dayLabels[d] : ""}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-1">
          {Array.from({ length: weeks }).map((_, col) => (
            <div key={col} className="flex flex-col gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map((row) => {
                const cell = cells[col * 7 + row]
                if (!cell) return <div key={row} className="w-3 h-3" />
                return (
                  <div
                    key={row}
                    title={`${cell.date}：${cell.count}/3 項完成`}
                    className={`w-3 h-3 rounded-sm ${getCellColor(cell.count, cell.isToday)}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-1 ml-6">
        <span className="text-xs text-gray-400">少</span>
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className={`w-3 h-3 rounded-sm ${n === 0 ? "bg-gray-100" : n === 1 ? "bg-green-200" : n === 2 ? "bg-green-400" : "bg-green-600"}`} />
        ))}
        <span className="text-xs text-gray-400">多</span>
      </div>
    </div>
  )
}
