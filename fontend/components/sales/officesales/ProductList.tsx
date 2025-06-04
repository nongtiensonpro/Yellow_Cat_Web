"use client"


import {Card, CardHeader, CardBody, Image, Input, CardFooter} from "@heroui/react";
export default function ProductListSaleOffice(){
    return(
        <div>
            <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
                <Input label="Tìm kiếm sản phẩm" type="text" />
            </div>
            <div className={"grid grid-cols-3 gap-2"}>
                <Card className="py-4">
                    <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                        <p className="text-tiny uppercase font-bold">Tên biến thể sản phẩm 1</p>
                    </CardHeader>
                    <CardBody className="overflow-visible py-2">
                        <Image
                            alt="Card background"
                            className="object-cover rounded-xl"
                            src="https://heroui.com/images/hero-card-complete.jpeg"
                            width={270}
                        />
                    </CardBody>
                    <CardFooter>
                        <small className="text-default-500">Màu sắc</small>
                        <h4 className="font-bold text-large">Size</h4>
                    </CardFooter>
                </Card>
                <Card className="py-4">
                    <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                        <p className="text-tiny uppercase font-bold">Tên biến thể sản phẩm 2</p>
                    </CardHeader>
                    <CardBody className="overflow-visible py-2">
                        <Image
                            alt="Card background"
                            className="object-cover rounded-xl"
                            src="https://heroui.com/images/hero-card-complete.jpeg"
                            width={270}
                        />
                    </CardBody>
                    <CardFooter>
                        <small className="text-default-500">Màu sắc</small>
                        <h4 className="font-bold text-large">Size</h4>
                    </CardFooter>
                </Card>
                <Card className="py-4">
                    <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                        <p className="text-tiny uppercase font-bold">Tên biến thể sản phẩm 3</p>
                    </CardHeader>
                    <CardBody className="overflow-visible py-2">
                        <Image
                            alt="Card background"
                            className="object-cover rounded-xl"
                            src="https://heroui.com/images/hero-card-complete.jpeg"
                            width={270}
                        />
                    </CardBody>
                    <CardFooter>
                        <small className="text-default-500">Màu sắc</small>
                        <h4 className="font-bold text-large">Size</h4>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}