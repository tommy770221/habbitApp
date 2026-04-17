"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Activity,
  CheckSquare,
  Target,
  Trophy,
  User,
} from "lucide-react"

const navItems = [
  { href: "/", label: "首頁", icon: Home },
  { href: "/metrics", label: "數據", icon: Activity },
  { href: "/habits", label: "打卡", icon: CheckSquare },
  { href: "/missions", label: "任務", icon: Target },
  { href: "/achievements", label: "成就", icon: Trophy },
  { href: "/profile", label: "我的", icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
      <div className="max-w-lg mx-auto flex items-center justify-around px-1 py-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-0",
                isActive
                  ? "text-green-600"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "fill-current opacity-20")} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={cn("text-xs font-medium", isActive && "font-semibold")}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
