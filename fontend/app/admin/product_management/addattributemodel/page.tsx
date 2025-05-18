'use client';

import React, { useState } from 'react';

interface AttributeValue {
  id: number;
  value: string;
}

interface AddAttributeModalProps {
  onClose: () => void;
  onSubmit: (attributeName: string, dataType: string, values: string[]) => void;
}

const AddAttributeModal: React.FC<AddAttributeModalProps> = ({ onClose, onSubmit }) => {
  const [attributeName, setAttributeName] = useState<string>('');
  const [dataType, setDataType] = useState<string>('Chuỗi');
  const [values, setValues] = useState<AttributeValue[]>([{ id: 1, value: '' }]);

  const handleAddValue = () => {
    setValues([...values, { id: Date.now(), value: '' }]);
  };

  const handleChangeValue = (id: number, newValue: string) => {
    setValues(values.map(v => (v.id === id ? { ...v, value: newValue } : v)));
  };

  const handleSubmit = () => {
    const validValues = values.map(v => v.value.trim()).filter(v => v !== '');
    if (!attributeName.trim() || validValues.length === 0) {
      alert('Vui lòng nhập tên thuộc tính và ít nhất một giá trị');
      return;
    }

    onSubmit(attributeName.trim(), dataType, validValues);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Thêm thuộc tính mới</h2>
          <button onClick={onClose} className="text-2xl font-bold">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Tên thuộc tính</label>
            <input
              type="text"
              value={attributeName}
              onChange={(e) => setAttributeName(e.target.value)}
              placeholder="Nhập tên thuộc tính"
              className="w-full mt-1 p-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Kiểu dữ liệu</label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-lg"
            >
              <option value="Chuỗi">Chuỗi</option>
              <option value="Số">Số</option>
              <option value="Boolean">Boolean</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Giá trị thuộc tính</label>
            {values.map((v, index) => (
              <input
                key={v.id}
                value={v.value}
                onChange={(e) => handleChangeValue(v.id, e.target.value)}
                placeholder={`Giá trị ${index + 1}`}
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg mb-2"
              />
            ))}
            <button
              type="button"
              onClick={handleAddValue}
              className="text-blue-600 text-sm font-medium"
            >
              + Thêm giá trị
            </button>
          </div>
        </div>

        <div className="flex justify-end mt-6 space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-500 text-white rounded-lg"
          >
            Tạo thuộc tính
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAttributeModal;
