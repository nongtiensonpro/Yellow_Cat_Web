'use client'

import Link from 'next/link';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export default function PaginationControls({ 
  currentPage, 
  totalPages,
  basePath
}: PaginationControlsProps) {
  return (
    <div className="flex justify-center items-center mt-4 gap-2">
      <Link 
        href={`${basePath}?page=${Math.max(0, currentPage - 1)}`}
        className={`px-4 py-2 bg-gray-200 text-gray-700 rounded ${currentPage === 0 ? 'opacity-50 pointer-events-none' : ''}`}
      >
        Trước
      </Link>
      <span className="text-sm">Trang {currentPage + 1}/{totalPages}</span>
      <Link 
        href={`${basePath}?page=${Math.min(totalPages - 1, currentPage + 1)}`}
        className={`px-4 py-2 bg-gray-200 text-gray-700 rounded ${currentPage >= totalPages - 1 ? 'opacity-50 pointer-events-none' : ''}`}
      >
        Sau
      </Link>
    </div>
  );
}