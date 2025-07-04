import { CldUploadButton, CldImage } from 'next-cloudinary';
import { useState } from 'react';
import { Button } from "@heroui/react";
import { Upload, X } from "lucide-react";

interface ProductImageUploadProps {
    onUpload: (imageUrl: string) => void;
    currentImage?: string;
    label?: string;
    className?: string;
    imageClassName?: string;
    showPreview?: boolean;
    onRemove?: () => void;
}

export default function ProductImageUpload({ 
    onUpload, 
    currentImage, 
    label = "Chọn ảnh",
    className = "",
    imageClassName = "w-32 h-32",
    showPreview = true,
    onRemove 
}: ProductImageUploadProps) {
    const [resource, setResource] = useState<any>(currentImage ? { public_id: currentImage } : null);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = (result: any) => {
        if (result.event === "success") {
            console.log("Upload thành công:", result.info);
            setResource(result.info);
            setError(null);
            onUpload(result.info.public_id);
            setIsUploading(false);
        } else {
            setError("Có lỗi xảy ra trong quá trình upload");
            console.error("Lỗi upload:", result);
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        setResource(null);
        if (onRemove) {
            onRemove();
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex gap-2">
                <Button
                    color="primary"
                    variant="bordered"
                    size="sm"
                    startContent={<Upload size={16} />}
                    isLoading={isUploading}
                    className="min-w-fit"
                >
                    <CldUploadButton
                        uploadPreset="YellowCatWeb"
                        onSuccess={(result, { widget }) => {
                            handleUpload(result);
                            widget.close();
                        }}
                        onUpload={() => setIsUploading(true)}
                        className="w-full h-full"
                    >
                        {label}
                    </CldUploadButton>
                </Button>
                
                {resource && (
                    <Button
                        color="danger"
                        variant="light"
                        size="sm"
                        isIconOnly
                        onClick={handleRemove}
                    >
                        <X size={16} />
                    </Button>
                )}
            </div>

            {error && (
                <p className="text-red-500 text-sm">{error}</p>
            )}

            {resource && showPreview && (
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-600">Ảnh đã chọn:</p>
                    <CldImage
                        width={128}
                        height={128}
                        src={resource.public_id}
                        alt="Ảnh đã upload"
                        className={`object-cover rounded-lg border ${imageClassName}`}
                    />
                </div>
            )}
        </div>
    );
} 