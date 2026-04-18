"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 fields
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Step 2 fields
  const [hasHypertension, setHasHypertension] = useState(false)
  const [hasDiabetes, setHasDiabetes] = useState(false)
  const [hasHyperlipidemia, setHasHyperlipidemia] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    if (step === 1) {
      if (password.length < 8) {
        setError("密碼至少需要8個字元")
        return
      }
      setError(null)
      setStep(2)
      return
    }

    // Step 2: Create account
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Update profile with health conditions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (supabase as any)
        .from("profiles")
        .update({
          display_name: displayName,
          has_hypertension: hasHypertension,
          has_diabetes: hasDiabetes,
          has_hyperlipidemia: hasHyperlipidemia,
          onboarding_completed: false,
        })
        .eq("id", data.user.id)

      if (profileError) {
        console.error("Profile update error:", profileError)
      }
    }

    router.push("/onboarding")
    router.refresh()
  }

  const conditions = [
    {
      id: "hypertension",
      label: "高血壓",
      emoji: "💓",
      desc: "血壓高於 140/90 mmHg",
      checked: hasHypertension,
      onChange: setHasHypertension,
    },
    {
      id: "diabetes",
      label: "高血糖（糖尿病）",
      emoji: "🩸",
      desc: "空腹血糖高於 7.0 mmol/L",
      checked: hasDiabetes,
      onChange: setHasDiabetes,
    },
    {
      id: "hyperlipidemia",
      label: "高血脂",
      emoji: "🫀",
      desc: "LDL 膽固醇或三酸甘油脂偏高",
      checked: hasHyperlipidemia,
      onChange: setHasHyperlipidemia,
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌱</div>
          <h1 className="text-2xl font-bold text-gray-900">開始健康之旅</h1>
          <p className="text-gray-500 mt-1 text-sm">建立帳號，開始管理三高健康習慣</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center mb-6">
          <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-green-500" : "bg-gray-200"}`} />
          <div className="w-4" />
          <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-green-500" : "bg-gray-200"}`} />
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">
              {step === 1 ? "建立帳號" : "健康狀況設定"}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? "填寫基本資料以建立帳號"
                : "選擇您目前的健康狀況（可多選），系統將為您個人化推薦"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">姓名 / 暱稱</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="請輸入您的名字"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">電子郵件</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">密碼（至少8個字元）</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  {conditions.map((c) => (
                    <label
                      key={c.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        c.checked
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={c.checked}
                        onChange={(e) => c.onChange(e.target.checked)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{c.emoji}</span>
                          <span className="font-medium text-gray-900">{c.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
                      </div>
                    </label>
                  ))}
                  <p className="text-xs text-gray-400 text-center">
                    * 此資訊僅用於個人化您的健康習慣建議
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                {step === 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    上一步
                  </Button>
                )}
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "建立中..." : step === 1 ? "下一步" : "開始使用"}
                </Button>
              </div>

              {step === 1 && (
                <p className="text-center text-sm text-gray-600">
                  已有帳號？{" "}
                  <Link href="/login" className="text-green-600 font-medium hover:underline">
                    立即登入
                  </Link>
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
