import React, { useState, useEffect } from "react";
import { LucideAArrowDown, X, ExternalLink } from "lucide-react";
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

  const [formData, setFormData] = useState(initialData || {});

  useEffect(() => {
    setFormData(initialData);
  }, [initialData, fields]);

  // Fungsi untuk mengecek apakah nilai adalah URL
  const isUrl = (string) => {
    if (!string || typeof string !== 'string') return false;
    
    // Regex untuk mendeteksi URL
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    
    // Cek apakah string dimulai dengan http://, https://, atau pattern URL
    return string.startsWith('http://') || 
           string.startsWith('https://') || 
           string.startsWith('www.') ||
           urlPattern.test(string);
  };

  // Fungsi untuk membuka link
  const handleLinkClick = (url) => {
    if (!url) return;
    
    // Tambahkan https:// jika tidak ada protocol
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = 'https://' + url;
    }
    
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  // Fungsi untuk memotong teks jika terlalu panjang
  const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Fungsi untuk merender nilai dengan link jika berupa URL
  const renderValue = (value, field) => {
    if (!value || value === "-") return <span className="text-gray-400">-</span>;
    
    if (Array.isArray(value)) {
      return (
        <div className="space-y-2">
          {value.map((item, index) => {
            if (typeof item === 'string' && isUrl(item)) {
              return (
                <div key={index} className="flex items-center gap-2">
                  <button
                    onClick={() => handleLinkClick(item)}
                    className="!bg-transparent text-blue-600 hover:text-blue-800 underline flex items-center gap-1 text-left break-all hover:!bg-transparent"
                  >
                    <ExternalLink size={14} className="flex-shrink-0 text-blue-600 !bg-transparent" />
                    <span className="break-all text-blue-600 !bg-transparent">{truncateText(item, 60)}</span>
                  </button>
                </div>
              );
            }
            return <div key={index} className="break-words">{item}</div>;
          })}
        </div>
      );
    }
    
    if (typeof value === 'string' && isUrl(value)) {
      return (
        <button
          onClick={() => handleLinkClick(value)}
          className="!bg-transparent text-blue-600 hover:text-blue-800 underline flex items-center gap-1 text-left w-full break-all hover:!bg-transparent"
        >
          <ExternalLink size={14} className="flex-shrink-0 text-blue-600 !bg-transparent" />
          <span className="break-all text-blue-600 !bg-transparent">{truncateText(value, 60)}</span>
        </button>
      );
    }
    
    // Jika field name mengandung kata tertentu, tampilkan sebagai link
    if (field) {
      const fieldName = field.name.toLowerCase();
      if (fieldName.includes('dokumen') || fieldName.includes('bukti') || 
          fieldName.includes('url') || fieldName.includes('link') || 
          fieldName.includes('maps') || fieldName.includes('website')) {
        if (typeof value === 'string' && value !== "-" && value !== "") {
          // Cek apakah value adalah URL
          if (isUrl(value)) {
            return (
              <button
                onClick={() => handleLinkClick(value)}
                className="!bg-transparent text-blue-600 hover:text-blue-800 underline flex items-center gap-1 text-left w-full break-all hover:!bg-transparent"
              >
                <ExternalLink size={14} className="flex-shrink-0 text-blue-600 !bg-transparent" />
                <span className="break-all text-blue-600 !bg-transparent">{truncateText(value, 60)}</span>
              </button>
            );
          } else {
            // Jika bukan URL tapi fieldnya adalah link/maps, tampilkan sebagai teks biasa
            return <span className="break-words text-gray-800 !bg-transparent">{value}</span>;
          }
        }
      }
    }
    
    // Untuk teks biasa
    return <span className="break-words whitespace-pre-wrap text-gray-800 !bg-transparent">{value}</span>;
  };

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
    <div className="fixed inset-0 z-60 flex items-center justify-end">
      
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
          cursor-pointer
          hover:bg-gray-100
        "
      >
        <X className="text-black w-5 h-5" />
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
            {fields.map((field) => {
              // Cek apakah field ini adalah array
              const isArray = field.type === "images" || field.name === "dokumen_urls" || field.name === "bukti";
              const value = initialData[field.name];
              
              return (
                <div
                  key={field.name}
                  className={`mb-5 border rounded-xl p-4
                    ${fieldErrors[field.name] ? "border-red-500" : "border-gray-200"}
                    ${field.full && !isFull ? "md:col-span-2" : ""}
                    ${field.type === "images" ? "md:col-span-2" : ""}
                    ${field.type === "textarea" ? "bg-gray-50" : ""}
                  `}
                >
                  {/* VIEW MODE */}
                  {isViewMode && (
                    <>
                      <div className="flex items-center gap-2 text-sm text-gray-800 mb-2">
                        {field.icon && <span className="text-gray-400">{field.icon}</span>}
                        <span className="font-medium">{field.label}</span>
                      </div>
                      
                      {field.type === "images" ? (
                        <div className="space-y-2">
                          {value && value.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {value.map((url, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleLinkClick(url)}
                                  className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden border hover:border-blue-500 transition-all"
                                >
                                  <img
                                    src={url}
                                    alt={`${field.label} ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://via.placeholder.com/150?text=Gambar+Tidak+Ada';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ExternalLink className="text-white" size={24} />
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 italic">Tidak ada gambar</p>
                          )}
                        </div>
                      ) : field.type === "textarea" ? (
                        /* TAMPILAN TEXTAREA YANG MENYERUPAI INPUT ASLI */
                        <div className="w-full min-h-[100px] p-3 bg-white border border-gray-300 rounded-lg shadow-inner focus-within:ring-2 focus-within:ring-[#EC933A] focus-within:border-transparent transition-all">
                          {value ? (
                            <div className="text-gray-800 font-normal leading-relaxed whitespace-pre-wrap break-words !bg-transparent">
                              {renderValue(value, field)}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic !bg-transparent">-</span>
                          )}
                        </div>
                      ) : isArray ? (
                        <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                          {renderValue(value, field)}
                        </div>
                      ) : (
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-gray-800 font-normal break-words !bg-transparent">
                            {renderValue(value, field)}
                          </p>
                        </div>
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
              );
            })}
          </div>
        </div>

        {/* PENDING VIEW */}
        {mode === "view" && isPending && (
          <div className="px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
            <button 
              type="button"
              className="bg-[#EC933A] text-white px-6 py-2 rounded-xl hover:bg-[#d47d2c] transition-colors font-medium"
              onClick={() => onChangeMode("approve")}
            >
              Terima 
            </button>
            <button
              type="button"
              className="bg-[#BC2424] text-white px-6 py-2 rounded-xl hover:bg-[#9e1e1e] transition-colors font-medium"
              onClick={() => onChangeMode("reject")}
            >
              Tolak
            </button>
          </div>
        )}

        {/* APPROVE */}
        {mode === "approve" && (
          <div className="px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => onChangeMode("view")}
              className="bg-gray-500 text-white px-6 py-2 rounded-xl hover:bg-gray-600 transition-colors flex items-center gap-2 font-medium"
            >
              <ArrowLeft size={18} /> Kembali
            </button>
            <button 
              type="button"
              onClick={handleSubmit} 
              className="bg-[#EC933A] flex items-center gap-2 text-white rounded-xl px-6 py-2 hover:bg-[#d47d2c] transition-colors font-medium"
            >
              Proses <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* REJECT */}
        {mode === "reject" && (
          <div className="px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => onChangeMode("view")}
              className="bg-gray-500 text-white px-6 py-2 rounded-xl hover:bg-gray-600 transition-colors flex items-center gap-2 font-medium"
            >
              <ArrowLeft size={18} /> Kembali
            </button>
            <button   
              type="button" 
              onClick={handleSubmit} 
              className="bg-[#BC2424] flex items-center gap-2 text-white rounded-xl px-6 py-2 hover:bg-[#9e1e1e] transition-colors font-medium"
            >
              Proses <ArrowRight size={18} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}