import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <p className="text-6xl mb-4">🔍</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">頁面不存在</h1>
      <p className="text-gray-500 mb-6">找不到您要尋找的頁面</p>
      <Button asChild>
        <Link href="/">返回首頁</Link>
      </Button>
    </div>
  )
}
