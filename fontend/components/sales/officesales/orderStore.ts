import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Payment {
    paymentId: number;
    paymentMethod: string;
    amount: number;
    paymentStatus: string;
    transactionId?: string;
}

interface Order {
    orderId: number;
    orderCode: string;
    phoneNumber: string;
    customerName: string;
    subTotalAmount: number;
    discountAmount: number;
    finalAmount: number;
    orderStatus: string;
    payments?: Payment[];
}

interface OrderItem {
    orderItemId: number;
    orderId: number;
    productVariantId: number;
    quantity: number;
    priceAtPurchase: number;
    totalPrice: number;
    productName?: string;
    variantInfo?: string;
}

interface ProductVariant {
    variantId: number;
    sku: string;
    colorId: number;
    sizeId: number;
    colorName?: string;
    sizeName?: string;
    price: number;
    stockLevel: number;
    imageUrl: string;
    weight: number;
}

interface ProductWithVariants {
    productId: number;
    productName: string;
    description: string;
    purchases: number;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    categoryId: number;
    categoryName: string;
    brandId: number;
    brandName: string;
    brandInfo: string;
    logoPublicId: string;
    minPrice: number;
    totalStock: number;
    thumbnail: string;
    variants: ProductVariant[];
    variantsLoaded: boolean;
}

interface ValidationErrors {
    customerName: string;
    phoneNumber: string;
}

interface OrderState {
    // State
    orders: Order[];
    currentOrder: Order | null;
    loading: boolean;
    error: string | null;
    isCreating: boolean;
    
    // Pagination
    page: number;
    totalPages: number;
    activeTab: string | number;
    
    // View State
    isEditMode: boolean;
    
    // Order Items State
    orderItems: OrderItem[];
    itemsLoading: boolean;
    itemsError: string | null;
    
    // Products State
    products: ProductWithVariants[];
    filteredProducts: ProductWithVariants[];
    productsLoading: boolean;
    productsError: string | null;
    searchTerm: string;
    
    // Edit Form State
    editableOrder: {
        customerName: string;
        phoneNumber: string;
        discountAmount: number;
    };
    validationErrors: ValidationErrors;
    isUpdatingOrder: boolean;
    
    // Actions
    setOrders: (orders: Order[]) => void;
    setCurrentOrder: (order: Order | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setIsCreating: (isCreating: boolean) => void;
    setPage: (page: number) => void;
    setTotalPages: (totalPages: number) => void;
    setActiveTab: (tab: string | number) => void;
    setIsEditMode: (isEdit: boolean) => void;
    
    // Order Items Actions
    setOrderItems: (items: OrderItem[]) => void;
    setItemsLoading: (loading: boolean) => void;
    setItemsError: (error: string | null) => void;
    
    // Products Actions
    setProducts: (products: ProductWithVariants[]) => void;
    setSearchTerm: (term: string) => void;
    filterProducts: () => void;
    
    // Edit Form Actions
    setEditableOrder: (order: any) => void;
    setValidationErrors: (errors: ValidationErrors) => void;
    setIsUpdatingOrder: (updating: boolean) => void;
    
    // API Actions
    fetchOrders: (session: any) => Promise<void>;
    fetchOrderDetail: (orderCode: string, session: any) => Promise<void>;
    createOrder: (session: any) => Promise<void>;
    updateOrder: (orderData: any, session: any) => Promise<void>;
    deleteOrder: (orderId: number, session: any) => Promise<void>;
    cashPayment: (orderCode: string, session: any) => Promise<void>;
    
    // Order Items API Actions
    fetchOrderItems: (session: any) => Promise<void>;
    addVariantToOrder: (variant: ProductVariant, session: any) => Promise<void>;
    updateOrderItemQuantity: (orderItemId: number, newQuantity: number, session: any) => Promise<void>;
    deleteOrderItem: (orderItemId: number, session: any) => Promise<void>;
    
    // Products API Actions
    initializeProductData: () => Promise<void>;
    
    // Validation & Utils
    validateCustomerInfo: () => boolean;
    isPaid: () => boolean;
    calculateOrderTotals: () => { subTotalAmount: number; finalAmount: number; calculatedStatus: string };
    refreshCurrentOrder: (session: any) => Promise<void>;
    forceUpdateCurrentOrder: () => void;
    resetError: () => void;
    openEditOrder: (order: Order) => void;
    closeEditOrder: () => void;
    syncEditableOrderWithCurrent: () => void;
}

export const useOrderStore = create<OrderState>()(
    devtools(
        (set, get) => ({
            // Initial State
            orders: [],
            currentOrder: null,
            loading: true,
            error: null,
            isCreating: false,
            page: 1,
            totalPages: 1,
            activeTab: 'all',
            isEditMode: false,
            
            // Order Items State
            orderItems: [],
            itemsLoading: false,
            itemsError: null,
            
            // Products State
            products: [],
            filteredProducts: [],
            productsLoading: true,
            productsError: null,
            searchTerm: '',
            
            // Edit Form State
            editableOrder: {
                customerName: '',
                phoneNumber: '',
                discountAmount: 0,
            },
            validationErrors: {
                customerName: '',
                phoneNumber: '',
            },
            isUpdatingOrder: false,
            
            // Basic Setters
            setOrders: (orders) => set({ orders }),
            setCurrentOrder: (order) => {
                set({ currentOrder: order });
                if (order) {
                    get().syncEditableOrderWithCurrent();
                }
            },
            setLoading: (loading) => set({ loading }),
            setError: (error) => set({ error }),
            setIsCreating: (isCreating) => set({ isCreating }),
            setPage: (page) => set({ page }),
            setTotalPages: (totalPages) => set({ totalPages }),
            setActiveTab: (tab) => set({ activeTab: tab, page: 1 }),
            setIsEditMode: (isEdit) => set({ isEditMode: isEdit }),
            
            // Order Items Setters
            setOrderItems: (items) => set({ orderItems: items }),
            setItemsLoading: (loading) => set({ itemsLoading: loading }),
            setItemsError: (error) => set({ itemsError: error }),
            
            // Products Setters
            setProducts: (products) => {
                set({ products });
                get().filterProducts();
            },
            setSearchTerm: (term) => {
                set({ searchTerm: term });
                get().filterProducts();
            },
            
            // Edit Form Setters
            setEditableOrder: (order) => set({ editableOrder: order }),
            setValidationErrors: (errors) => set({ validationErrors: errors }),
            setIsUpdatingOrder: (updating) => set({ isUpdatingOrder: updating }),
            
            // API Actions
            fetchOrders: async (session) => {
                if (!session?.accessToken) {
                    set({ loading: false });
                    return;
                }
                
                const { page, activeTab } = get();
                set({ loading: true, error: null });
                
                try {
                    const url = new URL('http://localhost:8080/api/orders');
                    url.searchParams.append('page', `${page - 1}`);
                    url.searchParams.append('size', '10');
                    
                    if (activeTab !== 'all') {
                        url.pathname = '/api/orders/status';
                        url.searchParams.append('status', activeTab.toString());
                    }
                    
                    const res = await fetch(url.toString(), {
                        headers: {
                            'Authorization': `Bearer ${session.accessToken}`,
                        },
                    });
                    
                    if (!res.ok) {
                        throw new Error(`Lỗi ${res.status}: Không thể tải danh sách đơn hàng.`);
                    }
                    
                    const responseData = await res.json();
                    set({
                        orders: responseData?.data?.content || [],
                        totalPages: responseData?.data?.page?.totalPages || 1,
                        loading: false,
                        error: null
                    });
                } catch (err: any) {
                    set({
                        error: err.message,
                        orders: [],
                        loading: false
                    });
                }
            },
            
            fetchOrderDetail: async (orderCode, session) => {
                if (!session?.accessToken) return;
                
                try {
                    const response = await fetch(`http://localhost:8080/api/orders/status/${orderCode}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${session.accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Lỗi ${response.status}: Không thể tải thông tin đơn hàng`);
                    }
                    
                    const result = await response.json();
                    console.log('🔍 fetchOrderDetail response:', result);
                    if (result.success && result.data) {
                        console.log('💰 Order amounts - subTotal:', result.data.subTotalAmount, 'final:', result.data.finalAmount);
                        set({ currentOrder: result.data });
                        get().syncEditableOrderWithCurrent();
                        console.log('📋 Order detail refreshed:', result.data);
                        
                        // Cập nhật order trong danh sách orders nếu có
                        const { orders } = get();
                        const updatedOrders = orders.map(order => 
                            order.orderCode === orderCode ? result.data : order
                        );
                        set({ orders: updatedOrders });
                    }
                } catch (error: any) {
                    console.error('Error fetching order detail:', error);
                    set({ error: `Lỗi tải thông tin đơn hàng: ${error.message}` });
                }
            },
            
            createOrder: async (session) => {
                if (!session?.accessToken) {
                    set({ error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." });
                    return;
                }
                
                set({ isCreating: true, error: null });
                
                try {
                    const res = await fetch('http://localhost:8080/api/orders', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${session.accessToken}`,
                        },
                    });
                    
                    if (!res.ok) {
                        const errorData = await res.json().catch(() => null);
                        const errorMessage = errorData?.message || `Lỗi ${res.status}: Không thể tạo đơn hàng mới.`;
                        throw new Error(errorMessage);
                    }
                    
                    // Reset về tab "all", trang 1 và fetch lại danh sách
                    set({ activeTab: 'all', page: 1 });
                    await get().fetchOrders(session);
                    
                } catch (err: any) {
                    set({ error: err.message });
                } finally {
                    set({ isCreating: false });
                }
            },
            
            updateOrder: async (orderData, session) => {
                if (!session?.accessToken) return;
                
                set({ isUpdatingOrder: true, itemsError: null, error: null });
                set({ validationErrors: { customerName: '', phoneNumber: '' } });
                
                try {
                    const res = await fetch('http://localhost:8080/api/orders', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.accessToken}`,
                        },
                        body: JSON.stringify(orderData),
                    });
                    
                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({ message: `Lỗi ${res.status}` }));
                        throw new Error(errorData.message);
                    }
                    
                    // Refresh current order detail
                    const { currentOrder } = get();
                    if (currentOrder) {
                        await get().fetchOrderDetail(currentOrder.orderCode, session);
                    }
                    
                    // Refresh orders list
                    await get().fetchOrders(session);
                    
                } catch (err: any) {
                    set({ error: `Lỗi cập nhật đơn hàng: ${err.message}` });
                    throw err;
                } finally {
                    set({ isUpdatingOrder: false });
                }
            },
            
            deleteOrder: async (orderId, session) => {
                if (!session?.accessToken) {
                    set({ error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." });
                    return;
                }
                
                try {
                    const res = await fetch(`http://localhost:8080/api/orders/${orderId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${session.accessToken}`,
                        },
                    });
                    
                    if (!res.ok) {
                        throw new Error(`Lỗi ${res.status}: Không thể xóa đơn hàng.`);
                    }
                    
                    // Reset về tab "all", trang 1 và fetch lại danh sách
                    set({ activeTab: 'all', page: 1 });
                    await get().fetchOrders(session);
                    
                } catch (err: any) {
                    set({ error: err.message });
                }
            },
            
            cashPayment: async (orderCode, session) => {
                if (!session?.accessToken) return;
                
                // Kiểm tra có sản phẩm trong đơn hàng không
                const { orderItems } = get();
                if (orderItems.length === 0) {
                    throw new Error('Không thể thanh toán: Đơn hàng chưa có sản phẩm');
                }
                
                try {
                    const response = await fetch(`http://localhost:8080/api/orders/cash-checkin/${orderCode}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${session.accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ message: `Lỗi ${response.status}` }));
                        throw new Error(errorData.message || 'Không thể xử lý thanh toán tiền mặt');
                    }
                    
                    const result = await response.json();
                    console.log('💰 Cash payment result:', result);
                    
                    // Cập nhật currentOrder với data từ response
                    if (result.data) {
                        console.log('💰 Updating currentOrder with payment result:', result.data);
                        set({ currentOrder: result.data });
                    }
                    
                    // Refresh tất cả data để cập nhật trạng thái real-time
                    console.log('🔄 Refreshing all data after cash payment...');
                    await Promise.all([
                        get().fetchOrderDetail(orderCode, session),
                        get().fetchOrders(session),
                        get().fetchOrderItems(session)
                    ]);
                    console.log('✅ Cash payment refresh completed');
                    
                    set({ error: null });
                    
                } catch (error: any) {
                    console.error('Cash payment error:', error);
                    set({ error: `Lỗi thanh toán tiền mặt: ${error.message}` });
                    throw error;
                }
            },
            
            // Order Items API Actions
            fetchOrderItems: async (session) => {
                const { currentOrder } = get();
                if (!currentOrder || !session?.accessToken) return;
                
                set({ itemsLoading: true, itemsError: null });
                
                try {
                    const url = new URL(`http://localhost:8080/api/order-items`);
                    url.searchParams.append('orderId', currentOrder.orderId.toString());
                    url.searchParams.append('page', '0');
                    url.searchParams.append('size', '100');

                    const res = await fetch(url.toString(), {
                        headers: { 'Authorization': `Bearer ${session.accessToken}` },
                    });
                    
                    if (!res.ok) throw new Error(`Lỗi ${res.status}: Không thể tải chi tiết đơn hàng.`);
                    
                    const responseData = await res.json();
                    const items = responseData?.data?.content || [];
                    
                    // Enrich with product info
                    const { products } = get();
                    const variantMap = new Map<number, { productName: string; variantInfo: string }>();
                    products.forEach(p => {
                        (p.variants || []).forEach(v => {
                            variantMap.set(v.variantId, {
                                productName: p.productName,
                                variantInfo: `${v.colorName} - ${v.sizeName}`
                            });
                        });
                    });

                    const enrichedItems = items.map((item: any) => {
                        const details = variantMap.get(item.productVariantId);
                        return {
                            ...item,
                            productName: details?.productName || 'Không tìm thấy sản phẩm',
                            variantInfo: details?.variantInfo || `ID Biến thể: ${item.productVariantId}`
                        };
                    });
                    
                    set({ orderItems: enrichedItems });
                } catch (err: any) {
                    set({ itemsError: err.message });
                } finally {
                    set({ itemsLoading: false });
                }
            },
            
            addVariantToOrder: async (variant, session) => {
                const { currentOrder, orderItems } = get();
                if (!currentOrder || !session?.accessToken) return;
                
                set({ itemsError: null });
                
                const existingItem = orderItems.find(item => item.productVariantId === variant.variantId);
                
                if (existingItem) {
                    await get().updateOrderItemQuantity(existingItem.orderItemId, existingItem.quantity + 1, session);
                } else {
                    try {
                        console.log('➕ Adding new variant to order:', variant.variantId);
                        const res = await fetch('http://localhost:8080/api/order-items', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.accessToken}` },
                            body: JSON.stringify({ orderId: currentOrder.orderId, productVariantId: variant.variantId, quantity: 1 }),
                        });
                        
                        if (!res.ok) {
                            const errorData = await res.json();
                            throw new Error(errorData.message || `Lỗi ${res.status}`);
                        }
                        
                        console.log('🔄 Refreshing order items, order details, and orders list...');
                        await Promise.all([
                            get().fetchOrderItems(session),
                            get().refreshCurrentOrder(session),
                            get().fetchOrders(session) // Refresh orders list để PurchaseOrder cập nhật
                        ]);
                        console.log('✅ Order refresh completed');
                        
                    } catch (err: any) {
                        set({ itemsError: `Lỗi thêm sản phẩm: ${err.message}` });
                    }
                }
            },
            
            updateOrderItemQuantity: async (orderItemId, newQuantity, session) => {
                if (newQuantity <= 0) {
                    await get().deleteOrderItem(orderItemId, session);
                    return;
                }

                if (!session?.accessToken) return;
                set({ itemsError: null });

                try {
                    console.log('📝 Updating quantity for item:', orderItemId, 'to:', newQuantity);
                    const res = await fetch('http://localhost:8080/api/order-items', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.accessToken}` },
                        body: JSON.stringify({ orderItemId, newQuantity }),
                    });

                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({ message: `Lỗi ${res.status}` }));
                        throw new Error(errorData.message);
                    }

                    console.log('🔄 Refreshing order items, order details, and orders list...');
                    await Promise.all([
                        get().fetchOrderItems(session),
                        get().refreshCurrentOrder(session),
                        get().fetchOrders(session) // Refresh orders list để PurchaseOrder cập nhật
                    ]);
                    console.log('✅ Order refresh completed');
                    
                } catch (err: any) {
                    set({ itemsError: `Lỗi cập nhật số lượng: ${err.message}` });
                }
            },
            
            deleteOrderItem: async (orderItemId, session) => {
                if (!session?.accessToken) return;
                set({ itemsError: null });

                try {
                    console.log('🗑️ Deleting order item:', orderItemId);
                    const res = await fetch(`http://localhost:8080/api/order-items/${orderItemId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${session.accessToken}` },
                    });

                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({ message: `Lỗi ${res.status}` }));
                        throw new Error(errorData.message);
                    }

                    console.log('🔄 Refreshing order items, order details, and orders list...');
                    await Promise.all([
                        get().fetchOrderItems(session),
                        get().refreshCurrentOrder(session),
                        get().fetchOrders(session) // Refresh orders list để PurchaseOrder cập nhật
                    ]);
                    console.log('✅ Order refresh completed');
                    
                } catch (err: any) {
                    set({ itemsError: `Lỗi xóa sản phẩm: ${err.message}` });
                }
            },
            
            // Products API Actions
            initializeProductData: async () => {
                set({ productsLoading: true });
                
                try {
                    const [colorsRes, sizesRes, productsRes] = await Promise.all([
                        fetch(`http://localhost:8080/api/colors?page=0&size=1000`).then(res => res.json()),
                        fetch(`http://localhost:8080/api/sizes?page=0&size=1000`).then(res => res.json()),
                        fetch(`http://localhost:8080/api/products/management`).then(res => res.json())
                    ]);

                    const fetchedColors: any[] = colorsRes?.data?.content || [];
                    const fetchedSizes: any[] = sizesRes?.data?.content || [];
                    const baseProducts: any[] = productsRes?.data?.content || [];

                    const variantPromises = baseProducts.map(p =>
                        fetch(`http://localhost:8080/api/products/${p.productId}`).then(res => res.json())
                    );
                    const detailResponses: any[] = await Promise.all(variantPromises);

                    const productsWithVariants = baseProducts.map(p => {
                        const detail = detailResponses.find(dr => dr.data?.productId === p.productId)?.data;
                        const variants = detail?.variants.map((variant: any) => ({
                            ...variant,
                            colorName: fetchedColors.find(c => c.id === variant.colorId)?.name || 'N/A',
                            sizeName: fetchedSizes.find(s => s.id === variant.sizeId)?.name || 'N/A',
                        })) || [];
                        return { ...p, variants, variantsLoaded: true };
                    });

                    set({ products: productsWithVariants, productsError: null });
                    get().filterProducts();
                } catch (err: any) {
                    set({ productsError: err.message || "Lỗi tải dữ liệu sản phẩm" });
                } finally {
                    set({ productsLoading: false });
                }
            },
            
            // Helper function to filter products
            filterProducts: () => {
                const { products, searchTerm } = get();
                if (searchTerm.trim() === "") {
                    set({ filteredProducts: products });
                } else {
                    const lowercasedFilter = searchTerm.toLowerCase();
                    const filtered = products.filter(p =>
                        p.productName.toLowerCase().includes(lowercasedFilter) ||
                        p.categoryName.toLowerCase().includes(lowercasedFilter) ||
                        p.brandName.toLowerCase().includes(lowercasedFilter)
                    );
                    set({ filteredProducts: filtered });
                }
            },
            
            // Validation & Utils
            validateCustomerInfo: () => {
                const { editableOrder, orderItems } = get();
                const errors = {
                    customerName: '',
                    phoneNumber: '',
                };
                
                let isValid = true;
                
                // Kiểm tra có sản phẩm trong đơn hàng không
                if (orderItems.length === 0) {
                    console.warn('⚠️ Cannot validate customer info: No order items');
                    return false;
                }
                
                if (!editableOrder.customerName.trim()) {
                    errors.customerName = 'Vui lòng nhập tên khách hàng';
                    isValid = false;
                }
                
                if (!editableOrder.phoneNumber.trim()) {
                    errors.phoneNumber = 'Vui lòng nhập số điện thoại';
                    isValid = false;
                } else {
                    // Regex để validate số điện thoại Việt Nam
                    const PHONE_REGEX = /^(0|\+84)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/;
                    const phone = editableOrder.phoneNumber.replace(/[\s\-\(\)\.]/g, '').trim();
                    if (!PHONE_REGEX.test(phone)) {
                        errors.phoneNumber = 'Số điện thoại không đúng định dạng Việt Nam (VD: 0987654321 hoặc +84987654321)';
                        isValid = false;
                    }
                }
                
                set({ validationErrors: errors });
                return isValid;
            },
            
            isPaid: () => {
                const { currentOrder } = get();
                if (!currentOrder) return false;
                
                return currentOrder.orderStatus.toUpperCase() === 'PAID' || 
                       currentOrder.orderStatus.toUpperCase() === 'COMPLETED';
            },
            
            calculateOrderTotals: () => {
                const { orderItems, editableOrder, currentOrder } = get();
                
                // Tính subTotalAmount từ orderItems
                const subTotalAmount = orderItems.reduce((total, item) => {
                    return total + (item.totalPrice || 0);
                }, 0);
                
                // Tính finalAmount = subTotalAmount - discountAmount
                const finalAmount = Math.max(0, subTotalAmount - (editableOrder.discountAmount || 0));
                
                // Tính trạng thái thanh toán dựa trên payments
                let calculatedStatus = 'Pending';
                
                // Nếu không có orderItems thì luôn là Pending
                if (orderItems.length === 0) {
                    calculatedStatus = 'Pending';
                } else if (finalAmount === 0 && subTotalAmount > 0) {
                    // Nếu finalAmount = 0 và có orderItems thì coi như đã thanh toán (do giảm giá 100%)
                    calculatedStatus = 'Paid';
                } else if (currentOrder?.payments && currentOrder.payments.length > 0) {
                    const totalPaid = currentOrder.payments
                        .filter(p => p.paymentStatus.toUpperCase() === 'COMPLETED' || p.paymentStatus.toUpperCase() === 'SUCCESS')
                        .reduce((sum, p) => sum + p.amount, 0);
                    
                    console.log('💳 Payment calculation:', {
                        totalPaid,
                        finalAmount,
                        payments: currentOrder.payments.map(p => ({
                            method: p.paymentMethod,
                            amount: p.amount,
                            status: p.paymentStatus
                        }))
                    });
                    
                    if (totalPaid >= finalAmount && finalAmount > 0) {
                        calculatedStatus = 'Paid';
                    } else if (totalPaid > 0) {
                        calculatedStatus = 'Partial';
                    }
                } else if (finalAmount === 0 && subTotalAmount === 0) {
                    // Đơn hàng trống
                    calculatedStatus = 'Pending';
                }
                
                // Fallback: Nếu không tính được trạng thái, sử dụng trạng thái từ backend
                if (calculatedStatus === 'Pending' && currentOrder?.orderStatus) {
                    const backendStatus = currentOrder.orderStatus;
                    if (['Paid', 'Partial', 'PAID', 'PARTIAL', 'COMPLETED'].includes(backendStatus.toUpperCase())) {
                        calculatedStatus = backendStatus;
                    }
                }
                
                console.log('🧮 Calculated totals:', {
                    subTotalAmount,
                    finalAmount,
                    calculatedStatus,
                    backendStatus: currentOrder?.orderStatus,
                    orderItemsCount: orderItems.length,
                    paymentsCount: currentOrder?.payments?.length || 0
                });
                
                return {
                    subTotalAmount: Math.max(0, subTotalAmount),
                    finalAmount: Math.max(0, finalAmount),
                    calculatedStatus
                };
            },
            
            refreshCurrentOrder: async (session) => {
                const { currentOrder } = get();
                if (currentOrder && session?.accessToken) {
                    console.log('🔄 Refreshing current order:', currentOrder.orderCode);
                    await get().fetchOrderDetail(currentOrder.orderCode, session);
                }
            },
            
            forceUpdateCurrentOrder: () => {
                const { currentOrder } = get();
                if (currentOrder) {
                    console.log('🔄 Force updating currentOrder to trigger re-render');
                    set({ currentOrder: { ...currentOrder } });
                }
            },
            
            resetError: () => set({ error: null }),
            
            openEditOrder: (order) => {
                console.log('📂 Opening edit order:', order.orderCode);
                set({ 
                    currentOrder: order, 
                    isEditMode: true 
                });
                get().syncEditableOrderWithCurrent();
            },
            
            closeEditOrder: () => {
                console.log('📋 Closing edit order');
                set({ 
                    currentOrder: null, 
                    isEditMode: false,
                    orderItems: [],
                    searchTerm: '',
                    editableOrder: {
                        customerName: '',
                        phoneNumber: '',
                        discountAmount: 0,
                    },
                    validationErrors: {
                        customerName: '',
                        phoneNumber: '',
                    }
                });
            },
            
            syncEditableOrderWithCurrent: () => {
                const { currentOrder } = get();
                if (currentOrder) {
                    set({
                        editableOrder: {
                            customerName: currentOrder.customerName || '',
                            phoneNumber: currentOrder.phoneNumber || '',
                            discountAmount: currentOrder.discountAmount || 0,
                        }
                    });
                }
            },
        }),
        {
            name: 'order-store',
        }
    )
);

export default useOrderStore;