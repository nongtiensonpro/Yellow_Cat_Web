'use client'

import { Input, Button } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const SearchBar = () => {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')

  const handleSubmit = useCallback(() => {
    const q = keyword.trim()
    if (!q) {
      router.push('/products')
      return
    }
    const params = new URLSearchParams({ search: q })
    router.push(`/products?${params.toString()}`)
  }, [keyword, router])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 pt-6">
      <div className="bg-white rounded-xl shadow-sm border border-default-200 p-3">
        <div className="flex items-center gap-2">
          <Input
            aria-label="Tìm kiếm sản phẩm"
            placeholder="Tìm tên sản phẩm, thương hiệu, danh mục..."
            value={keyword}
            onValueChange={setKeyword}
            onKeyDown={handleKeyDown}
            startContent={<MagnifyingGlassIcon className="w-5 h-5 text-default-400" />}
            classNames={{ inputWrapper: 'bg-default-50' }}
          />
          <Button color="primary" onPress={handleSubmit} className="shrink-0">Tìm</Button>
        </div>
      </div>
    </div>
  )
}

export default SearchBar


