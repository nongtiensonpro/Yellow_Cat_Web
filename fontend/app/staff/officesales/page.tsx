"use client"
import ProductListSaleOffice from "@/components/sales/officesales/ProductList"
import PurchaseOrder from "@/components/sales/officesales/PurchaseOrder"

import {
    PanelGroup,
    Panel,
    PanelResizeHandle
} from "react-resizable-panels"
import { useEffect, useState } from "react"
import {Card, CardBody, Tab, Tabs} from "@heroui/react"

export default function Page() {
    // Sử dụng state để tránh hydration mismatch với SSR
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    return (
        <PanelGroup direction="horizontal" className="min-h-screen">
            <Panel defaultSize={35} minSize={20} className="accent-red-200">
                <ProductListSaleOffice />
            </Panel>

            <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-400 transition-colors duration-200 cursor-col-resize flex items-center justify-center">
                <div className="w-1 h-8 bg-gray-400 rounded-full"></div>
            </PanelResizeHandle>

            <Panel minSize={20} className="accent-blue-200">
                <Tabs aria-label="Options">
                    <Tab key="photos" title="Phiếu hàng">
                        <Card>
                            <CardBody>
                                <PurchaseOrder/>
                            </CardBody>
                        </Card>
                    </Tab>
                    <Tab key="music" title="Khách hàng">
                        <Card>
                            <CardBody>
                                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
                                ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
                                cillum dolore eu fugiat nulla pariatur.
                            </CardBody>
                        </Card>
                    </Tab>
                </Tabs>
            </Panel>
        </PanelGroup>
    )
}