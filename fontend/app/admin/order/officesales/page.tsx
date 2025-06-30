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
// const TABS = [
//     { label: 'Tất cả', value: '' },
//     { label: 'Chờ xác nhận', value: 'Pending' },
//     { label: 'Đã xác nhận', value: 'Confirmed' },
//     { label: 'Chờ vận chuyển', value: 'WaitingForShipment' },
//     { label: 'Đang vận chuyển', value: 'Shipping' },
//     { label: 'Đã thanh toán', value: 'Paid' },
//     { label: 'Đã hoàn thành', value: 'Completed' },
//     { label: 'Đã huỷ', value: 'Cancelled' },
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
//         let url = `http://localhost:8080/api/orders?`;
//         const params: string[] = [];
//         if (status) params.push(`status=${status}`);
//         if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
//         if (orderType) params.push(`orderType=${orderType}`);
//         if (params.length > 0) url += params.join('&');
//
//         const res = await fetch(url, {
//             headers: {
//                 Authorization: `Bearer ${session.accessToken}`,
//             },
//         });
//         if (!res.ok) {
//             console.error('❌ Lỗi', res.status);
//             return;
//         }
//         const data = await res.json();
//         console.log('✅ Dữ liệu API:', data);
//         setOrders(data.data?.content || []);
//     };
//
//     useEffect(() => {
//         fetchOrders();
//     }, [session, status]); // 💡 Quan trọng: status thay đổi => refetch
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
//     const mapStatus = (status: string) => {
//         switch (status) {
//             case 'Pending':
//                 return 'Chờ xác nhận';
//             case 'Confirmed':
//                 return 'Đã xác nhận';
//             case 'WaitingForShipment':
//                 return 'Chờ vận chuyển';
//             case 'Shipping':
//                 return 'Đang vận chuyển';
//             case 'Paid':
//                 return 'Đã thanh toán';
//             case 'Completed':
//                 return 'Đã hoàn thành';
//             case 'Cancelled':
//                 return 'Đã huỷ';
//             default:
//                 return status;
//         }
//     };
//
//     return (
//         <div className="p-6">
//             <h1 className="text-2xl font-bold mb-4">Danh sách hóa đơn</h1>
//
//             {/* Bộ lọc KHÔNG CÓ NGÀY */}
//             <div className="bg-gray-50 p-4 rounded-md mb-6">
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                     <div>
//                         <label className="block mb-1 text-sm font-medium text-gray-700">Tìm kiếm</label>
//                         <input
//                             type="text"
//                             value={keyword}
//                             onChange={(e) => setKeyword(e.target.value)}
//                             className="w-full border border-gray-300 rounded px-3 py-2"
//                             placeholder="Tìm kiếm theo mã hóa đơn..."
//                         />
//                     </div>
//                     <div>
//                         <label className="block mb-1 text-sm font-medium text-gray-700">Loại đơn</label>
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
//                 <div className="flex space-x-4">
//                     <button
//                         onClick={handleSearch}
//                         className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
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
//             {/* Tabs trạng thái */}
//             <div className="flex flex-wrap gap-2 mb-4">
//                 {TABS.map((tab) => (
//                     <button
//                         key={tab.value}
//                         onClick={() => setStatus(tab.value)}
//                         className={`px-4 py-2 rounded-full ${
//                             status === tab.value ? 'bg-red-600 text-white' : 'bg-gray-200'
//                         }`}
//                     >
//                         {tab.label}
//                     </button>
//                 ))}
//             </div>
//
//             {/* Bảng */}
//             <table className="w-full border border-gray-200">
//                 <thead className="bg-gray-100">
//                 <tr>
//                     <th className="p-2 border">STT</th>
//                     <th className="p-2 border">Mã hóa đơn</th>
//                     <th className="p-2 border">Khách hàng</th>
//                     <th className="p-2 border">Số điện thoại</th>
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
//                             <td className="p-2 border">{new Date(o.orderDate).toLocaleDateString()}</td>
//                             <td className="p-2 border">{o.finalAmount.toLocaleString('vi-VN')} ₫</td>
//                             <td className="p-2 border">{mapStatus(o.orderStatus)}</td>
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
// const TABS = [
//     { label: 'Tất cả', value: '' },
//     { label: 'Chờ xác nhận', value: 'Pending' },
//     { label: 'Đã xác nhận', value: 'Confirmed' },
//     { label: 'Đang xử lý', value: 'Processing' },
//     { label: 'Chờ vận chuyển', value: 'WaitingForShipment' },
//     { label: 'Đang vận chuyển', value: 'Shipping' },
//     { label: 'Đã gửi hàng', value: 'Shipped' },
//     { label: 'Đã giao', value: 'Delivered' },
//     { label: 'Đã thanh toán', value: 'Paid' },
//     { label: 'Đã hoàn thành', value: 'Completed' },
//     { label: 'Đã huỷ', value: 'Cancelled' },
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
//         let url = `http://localhost:8080/api/orders?`;
//         const params: string[] = [];
//         if (status) params.push(`status=${status}`);
//         if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
//         if (orderType) params.push(`orderType=${orderType}`);
//         if (params.length > 0) url += params.join('&');
//
//         const res = await fetch(url, {
//             headers: {
//                 Authorization: `Bearer ${session.accessToken}`,
//             },
//         });
//         if (!res.ok) {
//             console.error('❌ Lỗi', res.status);
//             return;
//         }
//         const data = await res.json();
//         console.log('✅ Dữ liệu API:', data);
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
//     const mapStatus = (status: string) => {
//         switch (status) {
//             case 'Pending':
//                 return 'Chờ xác nhận';
//             case 'Confirmed':
//                 return 'Đã xác nhận';
//             case 'Processing':
//                 return 'Đang xử lý';
//             case 'WaitingForShipment':
//                 return 'Chờ vận chuyển';
//             case 'Shipping':
//                 return 'Đang vận chuyển';
//             case 'Shipped':
//                 return 'Đã gửi hàng';
//             case 'Delivered':
//                 return 'Đã giao';
//             case 'Paid':
//                 return 'Đã thanh toán';
//             case 'Completed':
//                 return 'Đã hoàn thành';
//             case 'Cancelled':
//                 return 'Đã huỷ';
//             default:
//                 return status;
//         }
//     };
//
//     return (
//         <div className="p-6">
//             <h1 className="text-2xl font-bold mb-4">Danh sách hóa đơn</h1>
//
//             <div className="bg-gray-50 p-4 rounded-md mb-6">
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                     <div>
//                         <label className="block mb-1 text-sm font-medium text-gray-700">Tìm kiếm</label>
//                         <input
//                             type="text"
//                             value={keyword}
//                             onChange={(e) => setKeyword(e.target.value)}
//                             className="w-full border border-gray-300 rounded px-3 py-2"
//                             placeholder="Tìm kiếm theo mã hóa đơn..."
//                         />
//                     </div>
//                     <div>
//                         <label className="block mb-1 text-sm font-medium text-gray-700">Loại đơn</label>
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
//                 <div className="flex space-x-4">
//                     <button
//                         onClick={handleSearch}
//                         className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
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
//                             status === tab.value ? 'bg-red-600 text-white' : 'bg-gray-200'
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
//                     <th className="p-2 border">Số điện thoại</th>
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
//                             <td className="p-2 border">{new Date(o.orderDate).toLocaleDateString()}</td>
//                             <td className="p-2 border">{o.finalAmount.toLocaleString('vi-VN')} ₫</td>
//                             <td className="p-2 border">{mapStatus(o.orderStatus)}</td>
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
// const TABS = [
//     { label: 'Tất cả', value: '' },
//     { label: 'Chờ xác nhận', value: 'Pending' },
//     { label: 'Đã xác nhận', value: 'Confirmed' },
//     { label: 'Chờ vận chuyển', value: 'WaitingForShipment' },
//     { label: 'Đang vận chuyển', value: 'Shipping' },
//     { label: 'Đã thanh toán', value: 'Paid' },
//     { label: 'Đã hoàn thành', value: 'Completed' },
//     { label: 'Đã huỷ', value: 'Cancelled' },
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
//         let url = `http://localhost:8080/api/orders?`;
//         const params: string[] = [];
//         if (status) params.push(`status=${status}`);
//         if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
//         if (orderType) params.push(`orderType=${orderType}`);
//         if (params.length > 0) url += params.join('&');
//
//         const res = await fetch(url, {
//             headers: {
//                 Authorization: `Bearer ${session.accessToken}`,
//             },
//         });
//         if (!res.ok) {
//             console.error('❌ Lỗi', res.status);
//             return;
//         }
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
//     const mapStatus = (status: string) => {
//         switch (status) {
//             case 'Pending':
//                 return 'Chờ xác nhận';
//             case 'Confirmed':
//                 return 'Đã xác nhận';
//             case 'WaitingForShipment':
//                 return 'Chờ vận chuyển';
//             case 'Shipping':
//                 return 'Đang vận chuyển';
//             case 'Paid':
//                 return 'Đã thanh toán';
//             case 'Completed':
//                 return 'Đã hoàn thành';
//             case 'Cancelled':
//                 return 'Đã huỷ';
//             default:
//                 return status;
//         }
//     };
//
//     return (
//         <div className="p-6">
//             <h1 className="text-2xl font-bold mb-4">Danh sách hóa đơn</h1>
//
//             <div className="bg-gray-50 p-4 rounded-md mb-6">
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                     <div>
//                         <label className="block mb-1 text-sm font-medium text-gray-700">Tìm kiếm</label>
//                         <input
//                             type="text"
//                             value={keyword}
//                             onChange={(e) => setKeyword(e.target.value)}
//                             className="w-full border border-gray-300 rounded px-3 py-2"
//                             placeholder="Tìm kiếm theo mã hóa đơn..."
//                         />
//                     </div>
//                     <div>
//                         <label className="block mb-1 text-sm font-medium text-gray-700">Loại đơn</label>
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
//                 <div className="flex space-x-4">
//                     <button
//                         onClick={handleSearch}
//                         className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
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
//                             status === tab.value ? 'bg-red-600 text-white' : 'bg-gray-200'
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
//                     <th className="p-2 border">Số điện thoại</th>
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
//                             <td className="p-2 border">{new Date(o.orderDate).toLocaleDateString()}</td>
//                             <td className="p-2 border">{o.finalAmount.toLocaleString('vi-VN')} ₫</td>
//                             <td className="p-2 border">{mapStatus(o.orderStatus)}</td>
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

interface OrderDTO {
    orderId: number;
    orderCode: string;
    customerName: string | null;
    phoneNumber: string | null;
    orderType: string;
    orderDate: string;
    finalAmount: number;
    orderStatus: string; // DB đã Tiếng Việt
}

const TABS = [
    { label: 'Tất cả', value: '' },
    { label: 'Chờ xác nhận', value: 'Chờ xác nhận' },
    { label: 'Đã xác nhận', value: 'Đã xác nhận' },
    { label: 'Chờ vận chuyển', value: 'Chờ vận chuyển' },
    { label: 'Đang vận chuyển', value: 'Đang vận chuyển' },
    { label: 'Đã thanh toán', value: 'Đã thanh toán' },
    { label: 'Đã hoàn thành', value: 'Đã hoàn thành' },
    { label: 'Đã hủy', value: 'Đã hủy' },
];

export default function OrderListPage() {
    const { data: session } = useSession();
    const [orders, setOrders] = useState<OrderDTO[]>([]);
    const [status, setStatus] = useState('');
    const [keyword, setKeyword] = useState('');
    const [orderType, setOrderType] = useState('');

    const fetchOrders = async () => {
        if (!session?.accessToken) return;

        let url = `http://localhost:8080/api/orders?`;
        const params: string[] = [];
        if (status) params.push(`status=${encodeURIComponent(status)}`);
        if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
        if (orderType) params.push(`orderType=${orderType}`);
        if (params.length > 0) url += params.join('&');

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
    };

    useEffect(() => {
        fetchOrders();
    }, [session, status]);

    const handleSearch = () => {
        fetchOrders();
    };

    const handleReset = () => {
        setKeyword('');
        setOrderType('');
        setStatus('');
        fetchOrders();
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Danh sách hóa đơn</h1>

            <div className="bg-gray-50 p-4 rounded-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Tìm kiếm</label>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            placeholder="Tìm kiếm theo mã hóa đơn..."
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Loại đơn</label>
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
                        className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
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
                {TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setStatus(tab.value)}
                        className={`px-4 py-2 rounded-full ${
                            status === tab.value ? 'bg-red-600 text-white' : 'bg-gray-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <table className="w-full border border-gray-200">
                <thead className="bg-gray-100">
                <tr>
                    <th className="p-2 border">STT</th>
                    <th className="p-2 border">Mã hóa đơn</th>
                    <th className="p-2 border">Khách hàng</th>
                    <th className="p-2 border">Số điện thoại</th>
                    <th className="p-2 border">Loại đơn</th>
                    <th className="p-2 border">Ngày tạo</th>
                    <th className="p-2 border">Tổng tiền</th>
                    <th className="p-2 border">Trạng thái</th>
                </tr>
                </thead>
                <tbody>
                {orders.length === 0 ? (
                    <tr>
                        <td colSpan={8} className="text-center p-4">
                            Không có dữ liệu
                        </td>
                    </tr>
                ) : (
                    orders.map((o, idx) => (
                        <tr key={o.orderId} className="border">
                            <td className="p-2 border">{idx + 1}</td>
                            <td className="p-2 border">{o.orderCode}</td>
                            <td className="p-2 border">{o.customerName || 'Khách lẻ'}</td>
                            <td className="p-2 border">{o.phoneNumber || 'Không có'}</td>
                            <td className="p-2 border">{o.orderType}</td>
                            <td className="p-2 border">{new Date(o.orderDate).toLocaleDateString()}</td>
                            <td className="p-2 border">{o.finalAmount.toLocaleString('vi-VN')} ₫</td>
                            <td className="p-2 border">{o.orderStatus}</td> {/* ✔️ Không cần mapStatus nữa */}
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
    );
}
