import React, { useState } from "react";
import { X } from "lucide-react";

export default function Detail({
  title = "Detail Pengajuan PKL",
  fields = [],
  initialData = {},
  onClose,
  size = "half", // "full" | "half"
}) {
  const isFull = size === "full";
  const [previewImage, setPreviewImage] = useState(null);

  return (
    <div className="fixed inset-0 z-[10000000] flex items-center justify-end">
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* CLOSE BUTTON */}
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
                    <span className="text-gray-400">{field.icon}</span>
                  )}
                  <span>{field.label}</span>
                </div>

                {/* IMAGE ARRAY SUPPORT */}
                {Array.isArray(initialData[field.name]) ? (
                  <div className="flex flex-wrap gap-3 mt-2">
                    {initialData[field.name]?.length ? (
                      initialData[field.name].map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`img-${i}`}
                          className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
                          onClick={() => setPreviewImage(url)}
                        />
                      ))
                    ) : (
                      <p>-</p>
                    )}
                  </div>
                ) : (
                  <p className="font-semibold text-gray-800">
                    {initialData[field.name] || "-"}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div
          className="
            fixed inset-0
            bg-black/80
            z-[99999999]
            flex items-center justify-center
          "
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="
              max-w-[90vw]
              max-h-[90vh]
              rounded-xl
              shadow-2xl
            "
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={() => setPreviewImage(null)}
            className="
              absolute top-6 right-6
              !bg-white/20
              hover:bg-white/30
              text-white
              rounded-full
              p-2
            "
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
