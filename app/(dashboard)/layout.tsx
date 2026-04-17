import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
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

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar profile={profile} gamification={gamification} />
      <main className="max-w-lg mx-auto pb-24 min-h-screen">
        {children}
      </main>
      <BottomNav />
      <Toaster position="top-center" richColors />
    </div>
  )
}
