import {CldUploadButton, CldImage} from 'next-cloudinary';
import {useState} from 'react';

export default function UploadPage() {
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
        <div>
            <h1>Upload Ảnh</h1>
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
                    <div className="relative drop-shadow-xl w-100 h-64 overflow-hidden rounded-xl ">
                        <div
                            className="absolute flex items-center justify-center text-white z-[1] opacity-90 rounded-xl inset-0.5 ">

                            {resource.public_id && (

                                <CldImage
                                    width={1000}
                                    height={1000}
                                    src={resource.public_id}
                                    alt="Ảnh đã upload"
                                    sizes="100vw"
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}