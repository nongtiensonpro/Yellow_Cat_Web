"use client";
import {usePathname} from "next/navigation";
import {link as linkStyles} from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import {siteConfig} from "@/config/site";
import ProductView from "@/components/product/product_view"
import {Tooltip} from "@heroui/react";

export default function Page() {
    const pathname = usePathname();

    return (
        <section className="flex min-h-screen">
            {/* Sidebar */}
            <div className="w-64 h-screen fixed bg-gray-100 dark:bg-gray-900 shadow-md transition-colors">
                {/*<div className="p-4">*/}
                {/*    <h2 className="text-xl font-bold text-gray-800 dark:text-white">*/}
                {/*        Quản lý sản phẩm*/}
                {/*    </h2>*/}
                {/*</div>*/}
                <ul className="mt-2 space-y-1 px-2">
                    {siteConfig.navMenuItemsProduct.map((item) => (
                        <li key={item.href}>
                            <NextLink
                                href={item.href}
                                className={clsx(
                                    linkStyles({color: "foreground"}),
                                    "block p-3 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors",
                                    pathname === item.href
                                        ? "bg-gray-300 dark:bg-gray-700 font-medium"
                                        : ""
                                )}
                            >
                            <Tooltip content={item.toot_tip}>
                                {item.label}
                            </Tooltip>
                            </NextLink>

                        </li>
                    ))}
                </ul>
            </div>

            {/* Main Content */}
            <div className="flex-1 ml-64 bg-gray-50 dark:bg-gray-800 transition-colors">
                <ProductView/>
            </div>
        </section>
    );
}