"use client"

import {useEffect} from 'react';
import { useOrderStore } from './orderStore';
import AddProductsToOrder from './AddProductsToOrder';
import PaymentCalculation from './PaymentCalculation';
import InvoiceView from './InvoiceView';

export default function EditOrderManager() {
    const { currentScreen, currentOrder, calculateOrderTotals, setCurrentScreen } = useOrderStore();

    // Auto-switch to invoice view when order is paid
    useEffect(() => {
        if (currentOrder && currentScreen !== 'invoice') {
            const totals = calculateOrderTotals();
            const isPaid = totals.calculatedStatus.toUpperCase() === 'PAID';
            
            if (isPaid) {
                console.log('🎉 Order is paid, switching to invoice view');
                setCurrentScreen('invoice');
            }
        }
    }, [currentOrder, currentScreen, calculateOrderTotals, setCurrentScreen]);

    switch (currentScreen) {
        case 'addProducts':
            return <AddProductsToOrder />;
        case 'payment':
            return <PaymentCalculation />;
        case 'invoice':
            return <InvoiceView />;
        default:
            return <AddProductsToOrder />;
    }
}