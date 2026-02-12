import React, { useState, useEffect } from "react";
import { LucideAArrowDown, X } from "lucide-react";
import FloatingField from "./FloatingField";
import {
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export default function Detail({
  title = "Detail Pengajuan PKL",
  fields = [],
  initialData = {},
  onClose,
  size = "half",
  mode = "view",
  onChangeMode,
  onSubmit,
  
}) {
  const [fieldErrors, setFieldErrors] = useState({});
  const isFull = size === "full";
  const isPending =
    initialData?.status === "Pending" ||
    initialData?.status === "pending";

  const isApproveMode = mode === "approve";
  const isRejectMode  = mode === "reject";
  const isViewMode    = mode === "view";
  const [previewImage, setPreviewImage] = useState(null);



  const [formData, setFormData] = useState(initialData || {});

  useEffect(() => {
    setFormData(initialData);
  }, [initialData, fields]);


  const handleSubmit = () => {
    const errors = {};

    fields.forEach((field) => {
      const value = formData[field.name];

      if (
        field.required &&
        (value === undefined || value === null || value === "")
      ) {
        errors[field.name] = `${field.label} wajib diisi`;
      }

      if (field.minLength && value && value.length < field.minLength) {
        errors[field.name] =
          `${field.label} minimal ${field.minLength} karakter`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors); 
      return;
    }

    setFieldErrors({});
    onSubmit(mode, formData);
  };




  return (
    <div className="fixed inset-0  flex items-center justify-end z-[11]">
      
      {/* BACKDROP / PORTAL */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        onClick={(e) => { e.stopPropagation(); onClose(); }}
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
        onClick={(e) => e.stopPropagation()} 
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
                className={`mb-5 border border-gray-200 rounded-xl p-4
                  ${fieldErrors[field.name] ? "border-red-500" : "border-gray-200"}
                  ${field.full && !isFull ? "md:col-span-2" : ""}`}
              >
                {/* VIEW MODE */}
                {isViewMode && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-800 mb-1">
                      {field.icon && <span className="text-gray-400">{field.icon}</span>}
                      <span>{field.label}</span>
                    </div>

                    {/* TAMPILKAN IMAGE JIKA ARRAY URL */}
                    {Array.isArray(initialData[field.name]) && initialData[field.name].every(val => typeof val === "string" && val.startsWith("http")) ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {initialData[field.name].map((url, idx) => (
                          <img
                              key={idx}
                              src={url}
                              alt={`${field.label} ${idx + 1}`}
                              onClick={() => setPreviewImage(url)}
                              className="
                                w-32 h-32 object-cover rounded shadow
                                cursor-pointer
                                hover:opacity-80
                                transition
                              "
                            />

                        ))}
                      </div>
                    ) : (
                      <p className="font-semibold text-gray-800">
                        {initialData[field.name] || "-"}
                      </p>
                    )}
                  </>
                )}

                {(isApproveMode || isRejectMode) && (
                  <FloatingField
                    label={field.label}
                    type={field.type}
                    value={formData[field.name]} 
                    required={field.required}
                    error={fieldErrors[field.name]}
                    options={field.options}   
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field.name]: val,
                      }))
                    }
                  />
                )}
              </div>
            ))}

          </div>
        </div>

        {/* PENDING VIEW */}
        {mode === "view" && isPending && (
          <div className="px-6 py-4 flex justify-end gap-3">
            {/* <button 
               type="button"
              className="!bg-[#EC933A] text-white px-6 py-2 rounded-xl"
              onClick={() => onChangeMode("approve")}
            >
              Terima 
            </button>
            <button
             type="button"
              className="!bg-[#BC2424] text-white px-6 py-2 rounded-xl"
              onClick={() => onChangeMode("reject")}
            >
              Tolak
            </button> */}
          </div>
        )}

        {/* APPROVE */}
        {mode === "approve" && (
          <div className="gap-120 px-6 py-4 flex justify-end">
           {/* BACK */}
            {/* <button
              type="button"
              onClick={() => onChangeMode("view")}
              className="!bg-black flex items-center gap-2 text-white"
            >
              <ArrowLeft className="w-5 h-5" /> Kembali
            </button> */}
            <button type="button"onClick={handleSubmit} className="!bg-[#EC933A] flex items-center gap-2 text-white rounded-xl">
               Proses <ArrowRight 
                /> 
            </button>
          </div>
        )}

        {/* REJECT */}
        {mode === "reject" && (
          <div className="gap-120 px-6 py-4 flex justify-end">
            {/* BACK */}
            {/* <button
              type="button"
              onClick={() => onChangeMode("view")}
              className="!bg-black flex items-center gap-2 text-white"
            >
              <ArrowLeft className="w-5 h-5" /> Kembali
            </button> */}
            <button   type="button" onClick={handleSubmit} className="!bg-[#BC2424] flex items-center gap-2 text-white rounded-xl">
              Proses <ArrowRight />
            </button>
          </div>
        )}

      </div>
      {previewImage && (
        <div
          className="
            fixed inset-0
            bg-black/80
            z-[9999]
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
