'use client';

import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full mx-4">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">This page could not be found</h2>
        <p className="text-gray-600 mb-8">The page you are looking for might have been removed or is temporarily unavailable.</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
        >
          Go back home
        </button>
      </div>
    </div>
  );
}