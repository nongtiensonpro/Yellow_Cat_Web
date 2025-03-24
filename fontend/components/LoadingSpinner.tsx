'use client';

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-12 h-12 rounded-full border-4 border-yellow-200 dark:border-yellow-900 animate-ping absolute"></div>
        {/* Inner spinner */}
        <div className="w-12 h-12 rounded-full border-4 border-yellow-500 dark:border-yellow-400 border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
}