"use client";
import {
    Navbar as HeroUINavbar,
    NavbarContent,
    NavbarItem,
} from "@heroui/navbar";

import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { siteConfig } from "@/config/site";
import {Divider, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@heroui/react";
import {Card, CardBody, CardFooter, CardHeader} from "@heroui/card";


export default function Page() {
    return (
        <section>
            <Card className="xl">
                <CardHeader className="flex gap-3">
                    <HeroUINavbar maxWidth="xl">
                        <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
                            <ul className="hidden lg:flex gap-4 justify-start ml-2">
                                {siteConfig.navMenuItemsProduct.map((item) => (
                                    <NavbarItem key={item.href}>
                                        <NextLink
                                            className={clsx(
                                                linkStyles({ color: "foreground" }),
                                                "data-[active=true]:text-primary data-[active=true]:font-medium",
                                            )}
                                            color="foreground"
                                            href={item.href}
                                        >
                                            {item.label}
                                        </NextLink>
                                    </NavbarItem>
                                ))}
                            </ul>
                        </NavbarContent>
                    </HeroUINavbar>
                </CardHeader>
                <Divider />
                <CardBody>
                    <Table aria-label="Example static collection table">
                        <TableHeader>
                            <TableColumn>NAME</TableColumn>
                            <TableColumn>ROLE</TableColumn>
                            <TableColumn>STATUS</TableColumn>
                        </TableHeader>
                        <TableBody>
                            <TableRow key="1">
                                <TableCell>Tony Reichert</TableCell>
                                <TableCell>CEO</TableCell>
                                <TableCell>Active</TableCell>
                            </TableRow>
                            <TableRow key="2">
                                <TableCell>Zoey Lang</TableCell>
                                <TableCell>Technical Lead</TableCell>
                                <TableCell>Paused</TableCell>
                            </TableRow>
                            <TableRow key="3">
                                <TableCell>Jane Fisher</TableCell>
                                <TableCell>Senior Developer</TableCell>
                                <TableCell>Active</TableCell>
                            </TableRow>
                            <TableRow key="4">
                                <TableCell>William Howard</TableCell>
                                <TableCell>Community Manager</TableCell>
                                <TableCell>Vacation</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardBody>
                <Divider />
                <CardFooter>

                </CardFooter>
            </Card>

        </section>
    );
}