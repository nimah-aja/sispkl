import React from "react";
import { X, Edit, Trash2, Printer, Download } from "lucide-react";

export default function DetailReview({ 
  title, 
  initialData, 
  onClose, 
  mode = "view", 
  onChangeMode, 
  fields,
  hideActions = false // Prop baru untuk menyembunyikan aksi
}) {
  const dataEntries = Object.entries(initialData).map(([key, value]) => ({
    label: key,
    value: value,
  }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="!bg-transparent !text-gray-500 hover:!text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-4">
            {dataEntries.map((entry, index) => {
              // Skip if value is empty or undefined
              if (entry.value === undefined || entry.value === null || entry.value === "") {
                return null;
              }

              return (
                <div key={index} className="border-b border-gray-100 pb-3 last:border-0">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {entry.label}
                  </label>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                    {entry.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer dengan tombol Close saja */}
        <div className="flex justify-end gap-3 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 !bg-gray-100 rounded-lg hover:!bg-gray-200"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}