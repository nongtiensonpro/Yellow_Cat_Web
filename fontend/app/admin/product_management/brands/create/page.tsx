"use client"
import {Card, CardHeader, CardBody, CardFooter, Divider, Link, Image} from "@heroui/react";
import {Input} from "@heroui/input";
import {CldUploadButton, CldImage} from 'next-cloudinary';
import {useState} from "react";



export interface Brand {
    brand_name: string;
    logo_public_id: string;
    brand_info: string;
}

const createBrand = async (data: Brand) => {

}

export default function Page() {
    const [resource, setResource] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = (result: any) => {
        if (result.event === "success") {
            console.log("Upload thành công:", result.info);
            setResource(result.info);
            setError(null);
        } else {
            setError("Có lỗi xảy ra trong quá trình upload");
            console.error("Lỗi upload:", result);
        }
    };
    return (
        <Card className="xl">
            <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                    <p className="text-md">Thêm mới Brand</p>
                </div>
            </CardHeader>
            <Divider />
            <CardBody>
                <div className="flex w-full flex-wrap md:flex-nowrap gap-4 p-5">
                    <Input label="Tên Brand" placeholder="Vui lòng nhập tên Brand" type="text" />
                </div>
                <Divider />
                <div className="flex w-full flex-wrap md:flex-nowrap gap-4 p-5">
                    <Input label="Thông tin Brand" placeholder="Vui lòng nhập thông tin Brand" type="text" />
                </div>
                <Divider />
                <div className="flex w-full flex-wrap md:flex-nowrap gap-4 p-5">
                    <div>
                        <div
                            className="inline-block w-fit cursor-pointer transition-all bg-blue-500 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
                            <CldUploadButton
                                uploadPreset="YellowCatWeb"
                                onSuccess={(result, {widget}) => {
                                    handleUpload(result);
                                    widget.close();
                                }}
                            >
                                Chọn ảnh để upload
                            </CldUploadButton>
                        </div>


                        {error && (
                            <p style={{color: 'red'}}>{error}</p>
                        )}

                        {resource && (
                            <div>
                                <p>Ảnh đã được upload: {resource.public_id}</p>
                                <CldImage
                                    width={100}
                                    height={100}
                                    src={resource.public_id}
                                    alt="Ảnh đã upload"
                                    sizes="100vw"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}
