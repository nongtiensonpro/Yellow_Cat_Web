'use client'

import { Card, CardBody, Button, Chip } from '@heroui/react'
import { useRouter } from 'next/navigation'

const ChatAIBanner = () => {
  const router = useRouter()

  const handleClick = () => {
    router.push('/chatwithai')
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="shadow-xl border border-default-200 overflow-hidden max-w-xs">
        <CardBody className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-7 4h10M5 20h14a2 2 0 002-2V7a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2v13a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-default-900 truncate">Chat với AI</p>
              <p className="text-[11px] text-default-500 truncate">Tư vấn giày thông minh</p>
            </div>
            <Chip size="sm" color="warning" variant="flat" className="text-[10px]">Mới</Chip>
          </div>
          <Button
            color="primary"
            size="sm"
            className="w-full mt-3"
            onPress={handleClick}
            aria-label="Mở chat với AI"
          >
            Bắt đầu
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}

export default ChatAIBanner


