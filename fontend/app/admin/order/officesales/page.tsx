// //
// //
// //
// // 'use client';
// //
// // import { useEffect, useState } from 'react';
// // import { useSession } from 'next-auth/react';
// //
// // interface OrderDTO {
// //     orderId: number;
// //     orderCode: string;
// //     customerName: string | null;
// //     phoneNumber: string | null;
// //     orderType: string;
// //     orderDate: string;
// //     finalAmount: number;
// //     orderStatus: string;
// // }
// //
// // const STATUS_MAP: Record<string, string> = {
// //     Pending: 'Chờ xác nhận',
// //     Confirmed: 'Đã xác nhận',
// //     Processing: 'Chờ vận chuyển',
// //     Shipped: 'Đang vận chuyển',
// //     Delivered: 'Đã hoàn thành',
// //     Cancelled: 'Đã hủy',
// // };
// //
// // // Tabs & Combobox dùng giá trị EN, label VI
// // const TABS = [
// //     { label: 'Tất cả', value: '' },
// //     { label: 'Chờ xác nhận', value: 'Pending' },
// //     { label: 'Đã xác nhận', value: 'Confirmed' },
// //     { label: 'Chờ vận chuyển', value: 'Processing' },
// //     { label: 'Đang vận chuyển', value: 'Shipped' },
// //     { label: 'Đã hoàn thành', value: 'Delivered' },
// //     { label: 'Đã hủy', value: 'Cancelled' },
// // ];
// //
// // export default function OrderListPage() {
// //     const { data: session } = useSession();
// //     const [orders, setOrders] = useState<OrderDTO[]>([]);
// //     const [status, setStatus] = useState('');
// //     const [keyword, setKeyword] = useState('');
// //     const [orderType, setOrderType] = useState('');
// //
// //     const fetchOrders = async () => {
// //         if (!session?.accessToken) return;
// //
// //         let url = `http://localhost:8080/api/orders?`;
// //         const params: string[] = [];
// //         if (status) params.push(`status=${encodeURIComponent(status)}`);
// //         if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
// //         if (orderType) params.push(`orderType=${orderType}`);
// //         if (params.length > 0) url += params.join('&');
// //
// //         const res = await fetch(url, {
// //             headers: {
// //                 Authorization: `Bearer ${session.accessToken}`,
// //             },
// //         });
// //
// //         if (!res.ok) {
// //             console.error('❌ Lỗi', res.status);
// //             return;
// //         }
// //
// //         const data = await res.json();
// //         setOrders(data.data?.content || []);
// //     };
// //
// //     useEffect(() => {
// //         fetchOrders();
// //     }, [session, status]);
// //
// //     const handleSearch = () => {
// //         fetchOrders();
// //     };
// //
// //     const handleReset = () => {
// //         setKeyword('');
// //         setOrderType('');
// //         setStatus('');
// //         fetchOrders();
// //     };
// //
// //     return (
// //         <div className="p-6">
// //             <h1 className="text-2xl font-bold mb-4">Danh sách hóa đơn</h1>
// //
// //             <div className="bg-gray-50 p-4 rounded-md mb-6">
// //                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
// //                     <div>
// //                         <label className="block mb-1 text-sm font-medium text-gray-700">
// //                             Tìm kiếm
// //                         </label>
// //                         <input
// //                             type="text"
// //                             value={keyword}
// //                             onChange={(e) => setKeyword(e.target.value)}
// //                             className="w-full border border-gray-300 rounded px-3 py-2"
// //                             placeholder="Tìm kiếm theo mã hóa đơn..."
// //                         />
// //                     </div>
// //                     <div>
// //                         <label className="block mb-1 text-sm font-medium text-gray-700">
// //                             Loại đơn
// //                         </label>
// //                         <select
// //                             value={orderType}
// //                             onChange={(e) => setOrderType(e.target.value)}
// //                             className="w-full border border-gray-300 rounded px-3 py-2"
// //                         >
// //                             <option value="">Tất cả</option>
// //                             <option value="Retail">Tại quầy</option>
// //                             <option value="Online">Online</option>
// //                         </select>
// //                     </div>
// //                     <div>
// //                         <label className="block mb-1 text-sm font-medium text-gray-700">
// //                             Trạng thái đơn hàng
// //                         </label>
// //                         <select
// //                             value={status}
// //                             onChange={(e) => setStatus(e.target.value)}
// //                             className="w-full border border-gray-300 rounded px-3 py-2"
// //                         >
// //                             {TABS.map((tab) => (
// //                                 <option key={tab.value} value={tab.value}>
// //                                     {tab.label}
// //                                 </option>
// //                             ))}
// //                         </select>
// //                     </div>
// //                 </div>
// //
// //                 <div className="flex space-x-4">
// //                     <button
// //                         onClick={handleSearch}
// //                         className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
// //                     >
// //                         Tìm kiếm
// //                     </button>
// //                     <button
// //                         onClick={handleReset}
// //                         className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
// //                     >
// //                         Làm mới
// //                     </button>
// //                 </div>
// //             </div>
// //
// //             <div className="flex flex-wrap gap-2 mb-4">
// //                 {TABS.map((tab) => (
// //                     <button
// //                         key={tab.value}
// //                         onClick={() => setStatus(tab.value)}
// //                         className={`px-4 py-2 rounded-full ${
// //                             status === tab.value
// //                                 ? 'bg-blue-500 text-white'
// //                                 : 'bg-gray-200 text-gray-800'
// //                         }`}
// //                     >
// //                         {tab.label}
// //                     </button>
// //                 ))}
// //             </div>
// //
// //             <table className="w-full border border-gray-200">
// //                 <thead className="bg-gray-100">
// //                 <tr>
// //                     <th className="p-2 border">STT</th>
// //                     <th className="p-2 border">Mã hóa đơn</th>
// //                     <th className="p-2 border">Khách hàng</th>
// //                     <th className="p-2 border">SĐT</th>
// //                     <th className="p-2 border">Loại đơn</th>
// //                     <th className="p-2 border">Ngày tạo</th>
// //                     <th className="p-2 border">Tổng tiền</th>
// //                     <th className="p-2 border">Trạng thái</th>
// //                 </tr>
// //                 </thead>
// //                 <tbody>
// //                 {orders.length === 0 ? (
// //                     <tr>
// //                         <td colSpan={8} className="text-center p-4">
// //                             Không có dữ liệu
// //                         </td>
// //                     </tr>
// //                 ) : (
// //                     orders.map((o, idx) => (
// //                         <tr key={o.orderId} className="border">
// //                             <td className="p-2 border">{idx + 1}</td>
// //                             <td className="p-2 border">{o.orderCode}</td>
// //                             <td className="p-2 border">
// //                                 {o.customerName || 'Khách lẻ'}
// //                             </td>
// //                             <td className="p-2 border">{o.phoneNumber || 'Không có'}</td>
// //                             <td className="p-2 border">{o.orderType}</td>
// //                             <td className="p-2 border">
// //                                 {new Date(o.orderDate).toLocaleDateString()}
// //                             </td>
// //                             <td className="p-2 border">
// //                                 {o.finalAmount.toLocaleString('vi-VN')} ₫
// //                             </td>
// //                             <td className="p-2 border">
// //                                 {STATUS_MAP[o.orderStatus] || o.orderStatus}
// //                             </td>
// //                         </tr>
// //                     ))
// //                 )}
// //                 </tbody>
// //             </table>
// //         </div>
// //     );
// // }
//
//
// 'use client';
//
// import { useEffect, useState } from 'react';
// import { useSession } from 'next-auth/react';
//
// interface OrderDTO {
//     orderId: number;
//     orderCode: string;
//     customerName: string | null;
//     phoneNumber: string | null;
//     orderType: string;
//     orderDate: string;
//     finalAmount: number;
//     orderStatus: string;
// }
//
// const STATUS_MAP: Record<string, string> = {
//     Pending: 'Chờ xác nhận',
//     Confirmed: 'Đã xác nhận',
//     Processing: 'Chờ vận chuyển',
//     Shipped: 'Đang vận chuyển',
//     Delivered: 'Đã hoàn thành',
//     Cancelled: 'Đã hủy',
// };
//
// const TABS = [
//     { label: 'Tất cả', value: '' },
//     { label: 'Chờ xác nhận', value: 'Pending' },
//     { label: 'Đã xác nhận', value: 'Confirmed' },
//     { label: 'Chờ vận chuyển', value: 'Processing' },
//     { label: 'Đang vận chuyển', value: 'Shipped' },
//     { label: 'Đã hoàn thành', value: 'Delivered' },
//     { label: 'Đã hủy', value: 'Cancelled' },
// ];
//
// export default function OrderListPage() {
//     const { data: session } = useSession();
//     const [orders, setOrders] = useState<OrderDTO[]>([]);
//     const [status, setStatus] = useState('');
//     const [keyword, setKeyword] = useState('');
//     const [orderType, setOrderType] = useState('');
//
//     const fetchOrders = async () => {
//         if (!session?.accessToken) return;
//
//         // Chọn URL phù hợp
//         let url = `http://localhost:8080/api/orders?`;
//         const params: string[] = [];
//
//         if (status) {
//             url = `http://localhost:8080/api/orders/status?`;
//             params.push(`status=${encodeURIComponent(status)}`);
//         }
//
//         if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
//         if (orderType) params.push(`orderType=${orderType}`);
//
//         if (params.length > 0) url += params.join('&');
//
//         console.log('📡 Gọi API URL:', url);
//
//         const res = await fetch(url, {
//             headers: {
//                 Authorization: `Bearer ${session.accessToken}`,
//             },
//         });
//
//         if (!res.ok) {
//             console.error('❌ Lỗi', res.status);
//             return;
//         }
//
//         const data = await res.json();
//         setOrders(data.data?.content || []);
//     };
//
//     useEffect(() => {
//         fetchOrders();
//     }, [session, status]);
//
//     const handleSearch = () => {
//         fetchOrders();
//     };
//
//     const handleReset = () => {
//         setKeyword('');
//         setOrderType('');
//         setStatus('');
//         fetchOrders();
//     };
//
//     return (
//         <div className="p-6">
//             <h1 className="text-2xl font-bold mb-4">Danh sách hóa đơn</h1>
//
//             <div className="bg-gray-50 p-4 rounded-md mb-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                     <div>
//                         <label className="block mb-1 text-sm font-medium text-gray-700">
//                             Tìm kiếm
//                         </label>
//                         <input
//                             type="text"
//                             value={keyword}
//                             onChange={(e) => setKeyword(e.target.value)}
//                             className="w-full border border-gray-300 rounded px-3 py-2"
//                             placeholder="Tìm kiếm theo mã hóa đơn..."
//                         />
//                     </div>
//                     <div>
//                         <label className="block mb-1 text-sm font-medium text-gray-700">
//                             Loại đơn
//                         </label>
//                         <select
//                             value={orderType}
//                             onChange={(e) => setOrderType(e.target.value)}
//                             className="w-full border border-gray-300 rounded px-3 py-2"
//                         >
//                             <option value="">Tất cả</option>
//                             <option value="Retail">Tại quầy</option>
//                             <option value="Online">Online</option>
//                         </select>
//                     </div>
//                 </div>
//
//                 <div className="flex space-x-4">
//                     <button
//                         onClick={handleSearch}
//                         className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//                     >
//                         Tìm kiếm
//                     </button>
//                     <button
//                         onClick={handleReset}
//                         className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
//                     >
//                         Làm mới
//                     </button>
//                 </div>
//             </div>
//
//             <div className="flex flex-wrap gap-2 mb-4">
//                 {TABS.map((tab) => (
//                     <button
//                         key={tab.value}
//                         onClick={() => setStatus(tab.value)}
//                         className={`px-4 py-2 rounded-full ${
//                             status === tab.value
//                                 ? 'bg-blue-500 text-white'
//                                 : 'bg-gray-200 text-gray-800'
//                         }`}
//                     >
//                         {tab.label}
//                     </button>
//                 ))}
//             </div>
//
//             <table className="w-full border border-gray-200">
//                 <thead className="bg-gray-100">
//                 <tr>
//                     <th className="p-2 border">STT</th>
//                     <th className="p-2 border">Mã hóa đơn</th>
//                     <th className="p-2 border">Khách hàng</th>
//                     <th className="p-2 border">SĐT</th>
//                     <th className="p-2 border">Loại đơn</th>
//                     <th className="p-2 border">Ngày tạo</th>
//                     <th className="p-2 border">Tổng tiền</th>
//                     <th className="p-2 border">Trạng thái</th>
//                 </tr>
//                 </thead>
//                 <tbody>
//                 {orders.length === 0 ? (
//                     <tr>
//                         <td colSpan={8} className="text-center p-4">
//                             Không có dữ liệu
//                         </td>
//                     </tr>
//                 ) : (
//                     orders.map((o, idx) => (
//                         <tr key={o.orderId} className="border">
//                             <td className="p-2 border">{idx + 1}</td>
//                             <td className="p-2 border">{o.orderCode}</td>
//                             <td className="p-2 border">{o.customerName || 'Khách lẻ'}</td>
//                             <td className="p-2 border">{o.phoneNumber || 'Không có'}</td>
//                             <td className="p-2 border">{o.orderType}</td>
//                             <td className="p-2 border">
//                                 {new Date(o.orderDate).toLocaleDateString()}
//                             </td>
//                             <td className="p-2 border">
//                                 {o.finalAmount.toLocaleString('vi-VN')} ₫
//                             </td>
//                             <td className="p-2 border">
//                                 {STATUS_MAP[o.orderStatus] || o.orderStatus}
//                             </td>
//                         </tr>
//                     ))
//                 )}
//                 </tbody>
//             </table>
//         </div>
//     );
// }

//
// 'use client';
//
// import { useEffect, useState } from 'react';
// import { useSession } from 'next-auth/react';
//
// interface OrderDTO {
//     orderId: number;
//     orderCode: string;
//     customerName: string | null;
//     phoneNumber: string | null;
//     orderType: string;
//     orderDate: string;
//     finalAmount: number;
//     orderStatus: string;
// }
//
// const STATUS_MAP: Record<string, string> = {
//     Pending: 'Chờ xác nhận',
//     Confirmed: 'Đã xác nhận',
//     Processing: 'Chờ vận chuyển',
//     Shipped: 'Đang vận chuyển',
//     Delivered: 'Đã hoàn thành',
//     Cancelled: 'Đã hủy',
// };
//
// const TABS = [
//     { label: 'Tất cả', value: '' },
//     { label: 'Chờ xác nhận', value: 'Pending' },
//     { label: 'Đã xác nhận', value: 'Confirmed' },
//     { label: 'Chờ vận chuyển', value: 'Processing' },
//     { label: 'Đang vận chuyển', value: 'Shipped' },
//     { label: 'Đã hoàn thành', value: 'Delivered' },
//     { label: 'Đã hủy', value: 'Cancelled' },
// ];
//
// export default function OrderListPage() {
//     const { data: session } = useSession();
//     const [orders, setOrders] = useState<OrderDTO[]>([]);
//     const [status, setStatus] = useState('');
//     const [keyword, setKeyword] = useState('');
//     const [orderType, setOrderType] = useState('');
//     const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
//
//     // Gọi API lấy đơn hàng
//     const fetchOrders = async () => {
//         if (!session?.accessToken) return;
//
//         let url = `http://localhost:8080/api/orders?`;
//         const params: string[] = [];
//
//         if (status) {
//             url = `http://localhost:8080/api/orders/status?`;
//             params.push(`status=${encodeURIComponent(status)}`);
//         }
//
//         if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
//         if (orderType) params.push(`orderType=${orderType}`);
//
//         if (params.length > 0) url += params.join('&');
//
//         console.log('📡 Gọi API URL:', url);
//
//         const res = await fetch(url, {
//             headers: {
//                 Authorization: `Bearer ${session.accessToken}`,
//             },
//         });
//
//         if (!res.ok) {
//             console.error('❌ Lỗi', res.status);
//             return;
//         }
//
//         const data = await res.json();
//         setOrders(data.data?.content || []);
//     };
//
//     // Gọi API đếm số lượng đơn theo trạng thái
//     const fetchStatusCounts = async () => {
//         if (!session?.accessToken) return;
//
//         const res = await fetch(`http://localhost:8080/api/orders/status-counts`, {
//             headers: {
//                 Authorization: `Bearer ${session.accessToken}`,
//             },
//         });
//
//         if (!res.ok) {
//             console.error('❌ Lỗi đếm status:', res.status);
//             return;
//         }
//
//         const data = await res.json();
//         setStatusCounts(data.data || {});
//     };
//
//     // Gọi khi session hoặc status đổi
//     useEffect(() => {
//         fetchOrders();
//     }, [session, status]);
//
//     // Gọi 1 lần để đếm status
//     useEffect(() => {
//         fetchStatusCounts();
//     }, [session]);
//
//     const handleSearch = () => {
//         fetchOrders();
//     };
//
//     const handleReset = () => {
//         setKeyword('');
//         setOrderType('');
//         setStatus('');
//         fetchOrders();
//     };
//
//     // Tính tổng tất cả
//     const totalCount = Object.values(statusCounts).reduce((acc, val) => acc + val, 0);
//
//     return (
//         <div className="p-6">
//             <h1 className="text-2xl font-bold mb-4">Danh sách hóa đơn</h1>
//
//             <div className="bg-gray-50 p-4 rounded-md mb-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                     <div>
//                         <label className="block mb-1 text-sm font-medium text-gray-700">
//                             Tìm kiếm
//                         </label>
//                         <input
//                             type="text"
//                             value={keyword}
//                             onChange={(e) => setKeyword(e.target.value)}
//                             className="w-full border border-gray-300 rounded px-3 py-2"
//                             placeholder="Tìm kiếm theo mã hóa đơn..."
//                         />
//                     </div>
//                     <div>
//                         <label className="block mb-1 text-sm font-medium text-gray-700">
//                             Loại đơn
//                         </label>
//                         <select
//                             value={orderType}
//                             onChange={(e) => setOrderType(e.target.value)}
//                             className="w-full border border-gray-300 rounded px-3 py-2"
//                         >
//                             <option value="">Tất cả</option>
//                             <option value="Retail">Tại quầy</option>
//                             <option value="Online">Online</option>
//                         </select>
//                     </div>
//                 </div>
//
//                 <div className="flex space-x-4">
//                     <button
//                         onClick={handleSearch}
//                         className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//                     >
//                         Tìm kiếm
//                     </button>
//                     <button
//                         onClick={handleReset}
//                         className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
//                     >
//                         Làm mới
//                     </button>
//                 </div>
//             </div>
//
//             <div className="flex flex-wrap gap-2 mb-4">
//                 {TABS.map((tab) => {
//                     const count = tab.value === ''
//                         ? totalCount
//                         : statusCounts[tab.value] || 0;
//                     return (
//                         <button
//                             key={tab.value}
//                             onClick={() => setStatus(tab.value)}
//                             className={`px-4 py-2 rounded-full ${
//                                 status === tab.value
//                                     ? 'bg-blue-500 text-white'
//                                     : 'bg-gray-200 text-gray-800'
//                             }`}
//                         >
//                             {tab.label} ({count})
//                         </button>
//                     );
//                 })}
//             </div>
//
//             <table className="w-full border border-gray-200">
//                 <thead className="bg-gray-100">
//                 <tr>
//                     <th className="p-2 border">STT</th>
//                     <th className="p-2 border">Mã hóa đơn</th>
//                     <th className="p-2 border">Khách hàng</th>
//                     <th className="p-2 border">SĐT</th>
//                     <th className="p-2 border">Loại đơn</th>
//                     <th className="p-2 border">Ngày tạo</th>
//                     <th className="p-2 border">Tổng tiền</th>
//                     <th className="p-2 border">Trạng thái</th>
//                 </tr>
//                 </thead>
//                 <tbody>
//                 {orders.length === 0 ? (
//                     <tr>
//                         <td colSpan={8} className="text-center p-4">
//                             Không có dữ liệu
//                         </td>
//                     </tr>
//                 ) : (
//                     orders.map((o, idx) => (
//                         <tr key={o.orderId} className="border">
//                             <td className="p-2 border">{idx + 1}</td>
//                             <td className="p-2 border">{o.orderCode}</td>
//                             <td className="p-2 border">{o.customerName || 'Khách lẻ'}</td>
//                             <td className="p-2 border">{o.phoneNumber || 'Không có'}</td>
//                             <td className="p-2 border">{o.orderType}</td>
//                             <td className="p-2 border">
//                                 {new Date(o.orderDate).toLocaleDateString()}
//                             </td>
//                             <td className="p-2 border">
//                                 {o.finalAmount.toLocaleString('vi-VN')} ₫
//                             </td>
//                             <td className="p-2 border">
//                                 {STATUS_MAP[o.orderStatus] || o.orderStatus}
//                             </td>
//                         </tr>
//                     ))
//                 )}
//                 </tbody>
//             </table>
//         </div>
//     );
// }

//
// 'use client';
//
// import { useEffect, useState } from 'react';
// import { useSession } from 'next-auth/react';
// import Link from 'next/link';
// import { EyeIcon } from '@heroicons/react/24/outline'; // ✅ Import EyeIcon
//
// interface OrderDTO {
//     orderId: number;
//     orderCode: string;
//     customerName: string | null;
//     phoneNumber: string | null;
//     orderType: string;
//     orderDate: string;
//     finalAmount: number;
//     orderStatus: string;
// }
//
// const STATUS_MAP: Record<string, string> = {
//     Pending: 'Chờ xác nhận',
//     Confirmed: 'Đã xác nhận',
//     Processing: 'Chờ vận chuyển',
//     Shipped: 'Đang vận chuyển',
//     Delivered: 'Đã hoàn thành',
//     Cancelled: 'Đã hủy',
// };
//
// const TABS = [
//     { label: 'Tất cả', value: '' },
//     { label: 'Chờ xác nhận', value: 'Pending' },
//     { label: 'Đã xác nhận', value: 'Confirmed' },
//     { label: 'Chờ vận chuyển', value: 'Processing' },
//     { label: 'Đang vận chuyển', value: 'Shipped' },
//     { label: 'Đã hoàn thành', value: 'Delivered' },
//     { label: 'Đã hủy', value: 'Cancelled' },
// ];
//
// export default function OrderListPage() {
//     const { data: session } = useSession();
//     const [orders, setOrders] = useState<OrderDTO[]>([]);
//     const [status, setStatus] = useState('');
//     const [keyword, setKeyword] = useState('');
//     const [orderType, setOrderType] = useState('');
//     const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
//
//     const fetchOrders = async () => {
//         if (!session?.accessToken) return;
//
//         let url = `http://localhost:8080/api/orders?`;
//         const params: string[] = [];
//
//         if (status) {
//             url = `http://localhost:8080/api/orders/status?`;
//             params.push(`status=${encodeURIComponent(status)}`);
//         }
//
//         if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
//         if (orderType) params.push(`orderType=${orderType}`);
//
//         if (params.length > 0) url += params.join('&');
//
//         console.log('📡 Gọi API URL:', url);
//
//         const res = await fetch(url, {
//             headers: {
//                 Authorization: `Bearer ${session.accessToken}`,
//             },
//         });
//
//         if (!res.ok) {
//             console.error('❌ Lỗi', res.status);
//             return;
//         }
//
//         const data = await res.json();
//         setOrders(data.data?.content || []);
//     };
//
//     const fetchStatusCounts = async () => {
//         if (!session?.accessToken) return;
//
//         const res = await fetch(`http://localhost:8080/api/orders/status-counts`, {
//             headers: {
//                 Authorization: `Bearer ${session.accessToken}`,
//             },
//         });
//
//         if (!res.ok) {
//             console.error('❌ Lỗi đếm status:', res.status);
//             return;
//         }
//
//         const data = await res.json();
//         setStatusCounts(data.data || {});
//     };
//
//     useEffect(() => {
//         fetchOrders();
//     }, [session, status]);
//
//     useEffect(() => {
//         fetchStatusCounts();
//     }, [session]);
//
//     const handleSearch = () => {
//         fetchOrders();
//     };
//
//     const handleReset = () => {
//         setKeyword('');
//         setOrderType('');
//         setStatus('');
//         fetchOrders();
//     };
//
//     const totalCount = Object.values(statusCounts).reduce((acc, val) => acc + val, 0);
//
//     return (
//         <div className="p-6">
//             <h1 className="text-2xl font-bold mb-4">Danh sách hóa đơn</h1>
//
//             <div className="bg-gray-50 p-4 rounded-md mb-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                     <div>
//                         <label className="block mb-1 text-sm font-medium text-gray-700">
//                             Tìm kiếm
//                         </label>
//                         <input
//                             type="text"
//                             value={keyword}
//                             onChange={(e) => setKeyword(e.target.value)}
//                             className="w-full border border-gray-300 rounded px-3 py-2"
//                             placeholder="Tìm kiếm theo mã hóa đơn..."
//                         />
//                     </div>
//                     <div>
//                         <label className="block mb-1 text-sm font-medium text-gray-700">
//                             Loại đơn
//                         </label>
//                         <select
//                             value={orderType}
//                             onChange={(e) => setOrderType(e.target.value)}
//                             className="w-full border border-gray-300 rounded px-3 py-2"
//                         >
//                             <option value="">Tất cả</option>
//                             <option value="Retail">Tại quầy</option>
//                             <option value="Online">Online</option>
//                         </select>
//                     </div>
//                 </div>
//
//                 <div className="flex space-x-4">
//                     <button
//                         onClick={handleSearch}
//                         className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//                     >
//                         Tìm kiếm
//                     </button>
//                     <button
//                         onClick={handleReset}
//                         className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
//                     >
//                         Làm mới
//                     </button>
//                 </div>
//             </div>
//
//             <div className="flex flex-wrap gap-2 mb-4">
//                 {TABS.map((tab) => {
//                     const count = tab.value === '' ? totalCount : statusCounts[tab.value] || 0;
//                     return (
//                         <button
//                             key={tab.value}
//                             onClick={() => setStatus(tab.value)}
//                             className={`px-4 py-2 rounded-full ${
//                                 status === tab.value
//                                     ? 'bg-blue-500 text-white'
//                                     : 'bg-gray-200 text-gray-800'
//                             }`}
//                         >
//                             {tab.label} ({count})
//                         </button>
//                     );
//                 })}
//             </div>
//
//             <table className="w-full border border-gray-200">
//                 <thead className="bg-gray-100">
//                 <tr>
//                     <th className="p-2 border">STT</th>
//                     <th className="p-2 border">Mã hóa đơn</th>
//                     <th className="p-2 border">Khách hàng</th>
//                     <th className="p-2 border">SĐT</th>
//                     <th className="p-2 border">Loại đơn</th>
//                     <th className="p-2 border">Ngày tạo</th>
//                     <th className="p-2 border">Tổng tiền</th>
//                     <th className="p-2 border">Trạng thái</th>
//                     <th className="p-2 border">Hành động</th> {/* ✅ Thêm cột hành động */}
//                 </tr>
//                 </thead>
//                 <tbody>
//                 {orders.length === 0 ? (
//                     <tr>
//                         <td colSpan={9} className="text-center p-4">
//                             Không có dữ liệu
//                         </td>
//                     </tr>
//                 ) : (
//                     orders.map((o, idx) => (
//                         <tr key={o.orderId} className="border">
//                             <td className="p-2 border">{idx + 1}</td>
//                             <td className="p-2 border">{o.orderCode}</td>
//                             <td className="p-2 border">{o.customerName || 'Khách lẻ'}</td>
//                             <td className="p-2 border">{o.phoneNumber || 'Không có'}</td>
//                             <td className="p-2 border">{o.orderType}</td>
//                             <td className="p-2 border">
//                                 {new Date(o.orderDate).toLocaleDateString()}
//                             </td>
//                             <td className="p-2 border">
//                                 {o.finalAmount.toLocaleString('vi-VN')} ₫
//                             </td>
//                             <td className="p-2 border">
//                                 {STATUS_MAP[o.orderStatus] || o.orderStatus}
//                             </td>
//                             <td className="p-2 border text-center">
//                                 <Link href={`/orders/${o.orderId}`}>
//                                     <EyeIcon className="w-5 h-5 text-blue-500 hover:text-blue-700 cursor-pointer inline" />
//                                 </Link>
//                             </td>
//                         </tr>
//                     ))
//                 )}
//                 </tbody>
//             </table>
//         </div>
//     );
// }

//
// 'use client';
//
// import { useEffect, useState } from 'react';
// import { useSession } from 'next-auth/react';
// import Link from 'next/link';
// import { useSearchParams } from 'next/navigation';
// import { EyeIcon } from '@heroicons/react/24/outline';
//
// interface OrderDTO {
//     orderId: number;
//     orderCode: string;
//     customerName: string | null;
//     phoneNumber: string | null;
//     orderType: string;
//     orderDate: string;
//     finalAmount: number;
//     orderStatus: string;
// }
//
// const STATUS_MAP: Record<string, string> = {
//     Pending: 'Chờ xác nhận',
//     Confirmed: 'Đã xác nhận',
//     Processing: 'Chờ vận chuyển',
//     Shipped: 'Đang vận chuyển',
//     Delivered: 'Đã hoàn thành',
//     Cancelled: 'Đã hủy',
//     Paid: 'Đã thanh toán',
// };
//
// const TABS = [
//     { label: 'Tất cả', value: '' },
//     { label: 'Chờ xác nhận', value: 'Pending' },
//     { label: 'Đã xác nhận', value: 'Confirmed' },
//     { label: 'Chờ vận chuyển', value: 'Processing' },
//     { label: 'Đang vận chuyển', value: 'Shipped' },
//     { label: 'Đã hoàn thành', value: 'Delivered' },
//     { label: 'Đã thanh toán', value: 'Paid' },
//     { label: 'Đã hủy', value: 'Cancelled' },
// ];
//
// export default function OrderListPage() {
//     const { data: session } = useSession();
//     const searchParams = useSearchParams();
//     const newOrderCode = searchParams.get('newOrderCode');
//
//     const [orders, setOrders] = useState<OrderDTO[]>([]);
//     const [status, setStatus] = useState('');
//     const [keyword, setKeyword] = useState('');
//     const [orderType, setOrderType] = useState('');
//     const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
//
//     const fetchOrders = async () => {
//         if (!session?.accessToken) return;
//
//         let url = `http://localhost:8080/api/orders?`;
//         const params: string[] = [];
//
//         if (status) {
//             url = `http://localhost:8080/api/orders/status?`;
//             params.push(`status=${encodeURIComponent(status)}`);
//         }
//
//         if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
//         if (orderType) params.push(`orderType=${orderType}`);
//
//         if (params.length > 0) url += params.join('&');
//
//         console.log('📡 Gọi API URL:', url);
//
//         const res = await fetch(url, {
//             headers: {
//                 Authorization: `Bearer ${session.accessToken}`,
//             },
//         });
//
//         if (!res.ok) {
//             console.error('❌ Lỗi', res.status);
//             return;
//         }
//
//         const data = await res.json();
//         setOrders(data.data?.content || []);
//     };
//
//     const fetchStatusCounts = async () => {
//         if (!session?.accessToken) return;
//
//         const res = await fetch(`http://localhost:8080/api/orders/status-counts`, {
//             headers: {
//                 Authorization: `Bearer ${session.accessToken}`,
//             },
//         });
//
//         if (!res.ok) {
//             console.error('❌ Lỗi đếm status:', res.status);
//             return;
//         }
//
//         const data = await res.json();
//         setStatusCounts(data.data || {});
//     };
//
//     useEffect(() => {
//         fetchOrders();
//     }, [session, status]);
//
//     useEffect(() => {
//         fetchStatusCounts();
//     }, [session]);
//
//     // ✅ Tự tìm nếu có newOrderCode
//     useEffect(() => {
//         if (newOrderCode && session?.accessToken) {
//             console.log('🔍 Có newOrderCode:', newOrderCode);
//             setKeyword(newOrderCode);
//             setStatus('');
//             fetchOrders();
//         }
//     }, [newOrderCode, session]);
//
//     const handleSearch = () => {
//         fetchOrders();
//     };
//
//     const handleReset = () => {
//         setKeyword('');
//         setOrderType('');
//         setStatus('');
//         fetchOrders();
//     };
//
//     const totalCount = Object.values(statusCounts).reduce((acc, val) => acc + val, 0);
//
//     return (
//         <div className="p-6">
//             <h1 className="text-2xl font-bold mb-4">Danh sách hóa đơn</h1>
//
//             <div className="bg-gray-50 p-4 rounded-md mb-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                     <div>
//                         <label className="block mb-1 text-sm font-medium text-gray-700">
//                             Tìm kiếm
//                         </label>
//                         <input
//                             type="text"
//                             value={keyword}
//                             onChange={(e) => setKeyword(e.target.value)}
//                             className="w-full border border-gray-300 rounded px-3 py-2"
//                             placeholder="Tìm kiếm theo mã hóa đơn..."
//                         />
//                     </div>
//                     <div>
//                         <label className="block mb-1 text-sm font-medium text-gray-700">
//                             Loại đơn
//                         </label>
//                         <select
//                             value={orderType}
//                             onChange={(e) => setOrderType(e.target.value)}
//                             className="w-full border border-gray-300 rounded px-3 py-2"
//                         >
//                             <option value="">Tất cả</option>
//                             <option value="Retail">Tại quầy</option>
//                             <option value="Online">Online</option>
//                         </select>
//                     </div>
//                 </div>
//
//                 <div className="flex space-x-4">
//                     <button
//                         onClick={handleSearch}
//                         className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//                     >
//                         Tìm kiếm
//                     </button>
//                     <button
//                         onClick={handleReset}
//                         className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
//                     >
//                         Làm mới
//                     </button>
//                 </div>
//             </div>
//
//             <div className="flex flex-wrap gap-2 mb-4">
//                 {TABS.map((tab) => {
//                     const count = tab.value === '' ? totalCount : statusCounts[tab.value] || 0;
//                     return (
//                         <button
//                             key={tab.value}
//                             onClick={() => setStatus(tab.value)}
//                             className={`px-4 py-2 rounded-full ${
//                                 status === tab.value
//                                     ? 'bg-blue-500 text-white'
//                                     : 'bg-gray-200 text-gray-800'
//                             }`}
//                         >
//                             {tab.label} ({count})
//                         </button>
//                     );
//                 })}
//             </div>
//
//             <table className="w-full border border-gray-200">
//                 <thead className="bg-gray-100">
//                 <tr>
//                     <th className="p-2 border">STT</th>
//                     <th className="p-2 border">Mã hóa đơn</th>
//                     <th className="p-2 border">Khách hàng</th>
//                     <th className="p-2 border">SĐT</th>
//                     <th className="p-2 border">Loại đơn</th>
//                     <th className="p-2 border">Ngày tạo</th>
//                     <th className="p-2 border">Tổng tiền</th>
//                     <th className="p-2 border">Trạng thái</th>
//                     <th className="p-2 border">Hành động</th>
//                 </tr>
//                 </thead>
//                 <tbody>
//                 {orders.length === 0 ? (
//                     <tr>
//                         <td colSpan={9} className="text-center p-4">
//                             Không có dữ liệu
//                         </td>
//                     </tr>
//                 ) : (
//                     orders.map((o, idx) => (
//                         <tr
//                             key={o.orderId}
//                             className={`border ${o.orderCode === newOrderCode ? 'bg-green-50' : ''}`}
//                         >
//                             <td className="p-2 border">{idx + 1}</td>
//                             <td className="p-2 border">{o.orderCode}</td>
//                             <td className="p-2 border">{o.customerName || 'Khách lẻ'}</td>
//                             <td className="p-2 border">{o.phoneNumber || 'Không có'}</td>
//                             <td className="p-2 border">{o.orderType}</td>
//                             <td className="p-2 border">
//                                 {new Date(o.orderDate).toLocaleDateString()}
//                             </td>
//                             <td className="p-2 border">
//                                 {o.finalAmount.toLocaleString('vi-VN')} ₫
//                             </td>
//                             <td className="p-2 border">
//                                 {STATUS_MAP[o.orderStatus] || o.orderStatus}
//                             </td>
//                             <td className="p-2 border text-center">
//                                 <Link
//                                     href={`/admin/order/officesales/${o.orderId}`}
//                                     title="Xem chi tiết đơn hàng"
//                                     aria-label={`Xem chi tiết đơn hàng ${o.orderId}`}
//                                     className="inline-flex items-center justify-center text-gray-600 hover:text-primary transition"
//                                 >
//                                     <EyeIcon className="w-5 h-5" />
//                                 </Link>
//
//                             </td>
//                         </tr>
//                     ))
//                 )}
//                 </tbody>
//             </table>
//         </div>
//     );
// }


'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { EyeIcon } from '@heroicons/react/24/outline';

interface OrderDTO {
    orderId: number;
    orderCode: string;
    customerName: string | null;
    phoneNumber: string | null;
    orderType: string;
    orderDate: string;
    finalAmount: number;
    orderStatus: string;
}

const STATUS_MAP: Record<string, string> = {
    Pending: 'Chờ xác nhận',
    Confirmed: 'Đã xác nhận',
    Processing: 'Chờ vận chuyển',
    Shipped: 'Đang vận chuyển',
    Delivered: 'Đã hoàn thành',
    Cancelled: 'Đã hủy',
    Paid: 'Đã thanh toán',
};

const TABS = [
    { label: 'Tất cả', value: '' },
    { label: 'Chờ xác nhận', value: 'Pending' },
    { label: 'Đã xác nhận', value: 'Confirmed' },
    { label: 'Chờ vận chuyển', value: 'Processing' },
    { label: 'Đang vận chuyển', value: 'Shipped' },
    { label: 'Đã hoàn thành', value: 'Delivered' },
    { label: 'Đã thanh toán', value: 'Paid' },
    { label: 'Đã hủy', value: 'Cancelled' },
];

export default function OrderListPage() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const newOrderCode = searchParams.get('newOrderCode');

    const [orders, setOrders] = useState<OrderDTO[]>([]);
    const [status, setStatus] = useState('');
    const [keyword, setKeyword] = useState('');
    const [orderType, setOrderType] = useState('');
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

    // 👇 Phân trang
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchOrders = async () => {
        if (!session?.accessToken) return;

        let url = `http://localhost:8080/api/orders?`;
        const params: string[] = [`page=${page}`, `size=10`];

        if (status) {
            url = `http://localhost:8080/api/orders/status?`;
            params.push(`status=${encodeURIComponent(status)}`);
        }

        if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
        if (orderType) params.push(`orderType=${orderType}`);

        if (params.length > 0) url += params.join('&');

        console.log('📡 Gọi API URL:', url);

        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
            },
        });

        if (!res.ok) {
            console.error('❌ Lỗi', res.status);
            return;
        }

        const data = await res.json();
        setOrders(data.data?.content || []);
        setTotalPages(data.data?.totalPages || 0);
    };

    const fetchStatusCounts = async () => {
        if (!session?.accessToken) return;

        const res = await fetch(`http://localhost:8080/api/orders/status-counts`, {
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
            },
        });

        if (!res.ok) {
            console.error('❌ Lỗi đếm status:', res.status);
            return;
        }

        const data = await res.json();
        setStatusCounts(data.data || {});
    };

    useEffect(() => {
        fetchOrders();
    }, [session, status, page]);

    useEffect(() => {
        fetchStatusCounts();
    }, [session]);

    // ✅ Tự tìm nếu có newOrderCode
    useEffect(() => {
        if (newOrderCode && session?.accessToken) {
            console.log('🔍 Có newOrderCode:', newOrderCode);
            setKeyword(newOrderCode);
            setStatus('');
            setPage(0);
            fetchOrders();
        }
    }, [newOrderCode, session]);

    const handleSearch = () => {
        setPage(0); // reset về trang 0 khi tìm kiếm mới
        fetchOrders();
    };

    const handleReset = () => {
        setKeyword('');
        setOrderType('');
        setStatus('');
        setPage(0);
        fetchOrders();
    };

    const totalCount = Object.values(statusCounts).reduce((acc, val) => acc + val, 0);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Danh sách hóa đơn</h1>

            <div className="bg-gray-50 p-4 rounded-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                            Tìm kiếm
                        </label>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            placeholder="Tìm kiếm theo mã hóa đơn..."
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                            Loại đơn
                        </label>
                        <select
                            value={orderType}
                            onChange={(e) => setOrderType(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                            <option value="">Tất cả</option>
                            <option value="Retail">Tại quầy</option>
                            <option value="Online">Online</option>
                        </select>
                    </div>
                </div>

                <div className="flex space-x-4">
                    <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Tìm kiếm
                    </button>
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                        Làm mới
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {TABS.map((tab) => {
                    const count = tab.value === '' ? totalCount : statusCounts[tab.value] || 0;
                    return (
                        <button
                            key={tab.value}
                            onClick={() => {
                                setStatus(tab.value);
                                setPage(0);
                            }}
                            className={`px-4 py-2 rounded-full ${
                                status === tab.value
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-800'
                            }`}
                        >
                            {tab.label} ({count})
                        </button>
                    );
                })}
            </div>

            <table className="w-full border border-gray-200">
                <thead className="bg-gray-100">
                <tr>
                    <th className="p-2 border">STT</th>
                    <th className="p-2 border">Mã hóa đơn</th>
                    <th className="p-2 border">Khách hàng</th>
                    <th className="p-2 border">SĐT</th>
                    <th className="p-2 border">Loại đơn</th>
                    <th className="p-2 border">Ngày tạo</th>
                    <th className="p-2 border">Tổng tiền</th>
                    <th className="p-2 border">Trạng thái</th>
                    <th className="p-2 border">Hành động</th>
                </tr>
                </thead>
                <tbody>
                {orders.length === 0 ? (
                    <tr>
                        <td colSpan={9} className="text-center p-4">
                            Không có dữ liệu
                        </td>
                    </tr>
                ) : (
                    orders.map((o, idx) => (
                        <tr
                            key={o.orderId}
                            className={`border ${o.orderCode === newOrderCode ? 'bg-green-50' : ''}`}
                        >
                            <td className="p-2 border">{idx + 1 + page * 10}</td>
                            <td className="p-2 border">{o.orderCode}</td>
                            <td className="p-2 border">{o.customerName || 'Khách lẻ'}</td>
                            <td className="p-2 border">{o.phoneNumber || 'Không có'}</td>
                            <td className="p-2 border">{o.orderType || 'Không có'}</td>
                            <td className="p-2 border">
                                {o.orderDate
                                    ? new Date(o.orderDate).toLocaleDateString('vi-VN')
                                    : '--'}
                            </td>
                            <td className="p-2 border">
                                {o.finalAmount.toLocaleString('vi-VN')} ₫
                            </td>
                            <td className="p-2 border">
                                {STATUS_MAP[o.orderStatus] || o.orderStatus}
                            </td>
                            <td className="p-2 border text-center">
                                <Link
                                    href={`/admin/order/officesales/${o.orderId}`}
                                    title="Xem chi tiết đơn hàng"
                                    aria-label={`Xem chi tiết đơn hàng ${o.orderId}`}
                                    className="inline-flex items-center justify-center text-gray-600 hover:text-primary transition"
                                >
                                    <EyeIcon className="w-5 h-5" />
                                </Link>
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>

            <div className="flex justify-between items-center mt-4">
                <button
                    onClick={() => page > 0 && setPage(page - 1)}
                    disabled={page === 0}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                >
                    Trang trước
                </button>

                <span>
          Trang {page + 1} / {totalPages}
        </span>

                <button
                    onClick={() => page + 1 < totalPages && setPage(page + 1)}
                    disabled={page + 1 >= totalPages}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                >
                    Trang tiếp
                </button>
            </div>
        </div>
    );
}
