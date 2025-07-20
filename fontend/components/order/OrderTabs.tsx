"use client";
import { useRouter, usePathname } from "next/navigation";

const tabs = [
  { key: "offline", label: "Đơn hàng offline", path: "/user_info/order" },
  { key: "online", label: "Đơn hàng online", path: "/user_info/order_online" },
];

export default function OrderTabs() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex border-b mb-6">
      {tabs.map(tab => {
        const isActive = pathname === tab.path;
        return (
          <button
            key={tab.key}
            className={`px-6 py-2 -mb-px font-semibold transition-colors border-b-2
              ${isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-primary'}
            `}
            onClick={() => router.push(tab.path)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
} 