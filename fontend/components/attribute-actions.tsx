'use client'

interface DeleteButtonProps {
  attributeId: number;
  attributeName: string;
}

export default function AttributeActions({ attributeId, attributeName }: DeleteButtonProps) {
  const handleDelete = () => {
    console.log(`Delete attribute ${attributeId}: ${attributeName}`);
    // Implement actual delete functionality here
  };

  return (
    <button
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
      onClick={handleDelete}
    >
      Xóa
    </button>
  );
}