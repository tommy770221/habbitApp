import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BottomNav } from "@/components/layout/BottomNav"
import { TopBar } from "@/components/layout/TopBar"
import { Toaster } from "@/components/ui/sonner"
import type { Profile, UserGamification } from "@/types"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch profile and gamification in parallel
  const [profileResult, gamificationResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("user_gamification").select("*").eq("user_id", user.id).single(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileResult.data as any as Profile | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gamification = gamificationResult.data as any as UserGamification | null

  if (profile && !profile.onboarding_completed) {
    redirect("/onboarding")
  }

  const isAnonymous = user.is_anonymous === true

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar profile={profile} gamification={gamification} />
      {isAnonymous && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm text-center py-2 px-4">
          您正以訪客身份使用。{" "}
          <Link href="/register" className="font-semibold underline">立即註冊</Link>
          {" "}以儲存您的健康記錄。
        </div>
      )}
      <main className="max-w-lg mx-auto pb-24 min-h-screen">
        {children}
      </main>
      <BottomNav />
      <Toaster position="top-center" richColors />
    </div>
  )
}
