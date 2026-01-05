import React from "react";
import { X } from "lucide-react";


export default function Detail({
  title = "Detail Pengajuan PKL",
  fields = [],
  initialData = {},
  onClose,
  size = "half", // "full" | "half"
}) {
  const isFull = size === "full";

  return (
    <div className="fixed inset-0 z-[10000000] flex items-center justify-end">
      
      {/* BACKDROP / PORTAL */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        onClick={onClose}
        className="
          absolute
          top-[10px]
          right-[790px]
          z-50
          w-10
          h-10
          flex
          items-center
          justify-center
          rounded-full
          bg-white
          shadow-lg
          transition
        "
      >
        <X className="text-black w-5 h-5 " />
      </div>

      {/* SIDE PANEL */}
      <div
        className={`
          relative bg-white shadow-2xl
          rounded-2xl
          m-2
          h-[calc(104vh-3rem)]
          ${isFull ? "w-[calc(100%-3rem)]" : "w-full max-w-3xl"}
        `}
      >
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="!text-2xl font-bold">{title}</h2>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto h-[calc(100%-150px)]">
          <div
            className={`grid gap-4 ${
              isFull ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
            }`}
          >
            {fields.map((field) => (
              <div
                key={field.name}
                className={`border border-gray-200 rounded-xl p-4 ${
                  field.full && !isFull ? "md:col-span-2" : ""
                }`}
              >
                <div className="flex items-center gap-2 text-sm text-gray-800 mb-1">
                  {field.icon && (
                    <span className="text-gray-400">
                      {field.icon}
                    </span>
                  )}
                  <span>{field.label}</span>
                </div>

                <p className="font-semibold text-gray-800">
                  {initialData[field.name] || "-"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        {/* <div className="border-gray-200 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="w-full !bg-[#EC933A] hover:bg-[#EC933A]-900 text-white py-2.5 rounded-xl transition"
          >
            Tutup
          </button>
        </div> */}

      </div>
    </div>
  );
}
