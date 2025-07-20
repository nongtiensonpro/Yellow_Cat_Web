'use client';
import { Tab } from '@headlessui/react';
import React from 'react';
import OrderListPage from '../app/admin/order/officesales/page';
import OrdersManagementPage from '../app/admin/orders_management/page';
import { DocumentTextIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const InvoiceTabs = () => {
  return (
    <div className="w-full px-2 py-6 sm:px-0">
      <Tab.Group>
        <div className="flex justify-start">
          <Tab.List className="inline-flex space-x-4 bg-white rounded-xl shadow-lg p-2 border border-gray-200">
            <Tab
              className={({ selected }) =>
                classNames(
                  'flex items-center gap-2 px-6 py-2 text-base font-bold rounded-lg transition-all duration-300',
                  'focus:outline-none',
                  selected
                    ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 shadow-sm'
                )
              }
            >
              <DocumentTextIcon className="w-5 h-5" />
              Hóa đơn Offline
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  'flex items-center gap-2 px-6 py-2 text-base font-bold rounded-lg transition-all duration-300',
                  'focus:outline-none',
                  selected
                    ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 shadow-sm'
                )
              }
            >
              <GlobeAltIcon className="w-5 h-5" />
              Hóa đơn Online
            </Tab>
          </Tab.List>
        </div>
        <Tab.Panels className="mt-4 bg-white rounded-xl shadow-lg border border-gray-100">
          <Tab.Panel className="p-0 rounded-xl">
            <OrderListPage />
          </Tab.Panel>
          <Tab.Panel className="p-0 rounded-xl">
            <OrdersManagementPage />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default InvoiceTabs; 