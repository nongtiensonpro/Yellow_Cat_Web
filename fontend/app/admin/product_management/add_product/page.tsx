"use client"
import {Card, CardHeader, CardBody, CardFooter, Divider, Link, Image} from "@heroui/react";

export default function Page() {
    return (
        <Card className="xl">
            <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                    <p className="text-md">Thêm sản phẩm</p>
                    <p className="text-small text-default-500">Cat Cat Cat</p>
                </div>
            </CardHeader>
            <Divider />
            <CardBody>
                <p>Make beautiful websites regardless of your design experience.</p>
            </CardBody>
            <Divider />
            <CardFooter>
                <Link isExternal showAnchorIcon href="https://github.com/heroui-inc/heroui">
                    Visit source code on GitHub.
                </Link>
            </CardFooter>
        </Card>
    );
}
