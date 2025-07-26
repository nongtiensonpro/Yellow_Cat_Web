"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function NotFound() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-auto text-center px-6">
        <div className="mb-8">
          {/* 404 Number */}
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            404
          </h1>
          
          {/* Cat Icon */}
          <div className="text-6xl mb-4">🐱</div>
          
          {/* Error Message */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Trang không tồn tại
          </h2>
          <p className="text-gray-600 mb-8">
            Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            Về trang chủ
          </Link>
          
          <button
            onClick={() => router.back()}
            className="inline-block w-full bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-all duration-300"
          >
            Quay lại trang trước
          </button>
        </div>

        {/* Auto redirect countdown */}
        <div className="mt-8 text-sm text-gray-500">
          Tự động chuyển về trang chủ trong {countdown} giây
        </div>

        {/* Additional Links */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Hoặc bạn có thể:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/products" className="text-blue-600 hover:text-blue-800 hover:underline">
              Xem sản phẩm
            </Link>
            <Link href="/contact" className="text-blue-600 hover:text-blue-800 hover:underline">
              Liên hệ
            </Link>
            <Link href="/about" className="text-blue-600 hover:text-blue-800 hover:underline">
              Về chúng tôi
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}