"use client";

export default function Loading() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white z-50">
            <h1 className="text-3xl font-bold animate-pulse">Đang tải...</h1>
        </div>
    );
}
