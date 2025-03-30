"use client";
import { usePathname } from "next/navigation";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { siteConfig } from "@/config/site";
import {
    Divider,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from "@heroui/react";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";

export default function Page() {
    const pathname = usePathname();

    return (
        <section className="flex min-h-screen">
            {/* Sidebar */}
            <div className="w-64 h-screen fixed bg-gray-100 dark:bg-gray-900 shadow-md transition-colors">
                <div className="p-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        Quản lý sản phẩm
                    </h2>
                </div>
                <ul className="mt-2 space-y-1 px-2">
                    {siteConfig.navMenuItemsProduct.map((item) => (
                        <li key={item.href}>
                            <NextLink
                                href={item.href}
                                className={clsx(
                                    linkStyles({ color: "foreground" }),
                                    "block p-3 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors",
                                    pathname === item.href
                                        ? "bg-gray-300 dark:bg-gray-700 font-medium"
                                        : ""
                                )}
                            >
                                {item.label}
                            </NextLink>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Main Content */}
            <div className="flex-1 ml-64 bg-gray-50 dark:bg-gray-800 transition-colors">
                <Card className="xl bg-white dark:bg-gray-900 shadow-md">
                    <CardHeader>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Danh sách sản phẩm có trong cửa hàng
                        </h1>
                    </CardHeader>
                    <Divider className="bg-gray-200 dark:bg-gray-700" />
                    <CardBody>
                        <Table
                            aria-label="Products table"
                            className="text-gray-900 dark:text-gray-200"
                        >
                            <TableHeader>
                                <TableColumn>ID</TableColumn>
                                <TableColumn>NAME</TableColumn>
                                <TableColumn>BRAND</TableColumn>
                                <TableColumn>CATEGORY</TableColumn>
                                <TableColumn>STATUS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                <TableRow key="1">
                                    <TableCell>1</TableCell>
                                    <TableCell>Samsung Galaxy S23</TableCell>
                                    <TableCell>Samsung</TableCell>
                                    <TableCell>Smartphones</TableCell>
                                    <TableCell>Active</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardBody>
                    <Divider className="bg-gray-200 dark:bg-gray-700" />
                    <CardFooter>

                    </CardFooter>
                </Card>
            </div>
        </section>
    );
}