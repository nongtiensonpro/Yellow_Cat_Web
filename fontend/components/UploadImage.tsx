import {CldUploadButton, CldImage} from 'next-cloudinary';
import {useState} from 'react';

// Interface cho thông tin resource sau khi upload
interface ResourceInfo {
    public_id: string;
    [key: string]: unknown;
}

// Interface cho upload result
interface UploadResult {
    event: string;
    info: ResourceInfo;
}

export default function UploadPage() {
    const [resource, setResource] = useState<ResourceInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = (result: UploadResult) => {
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
        <div>
            <div
                className="inline-block w-fit cursor-pointer transition-all bg-blue-500 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
                <CldUploadButton
                    uploadPreset="YellowCatWeb"
                    onSuccess={(result) => {
                        handleUpload(result as UploadResult);
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
    );
}