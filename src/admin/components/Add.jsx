import React, { useState, useRef } from "react";
import { ArrowLeft } from "lucide-react";

// import asset
import addSidebar from "../../assets/addSidebar.svg";

// function add sekaligus bisa untuk edit
export default function Add({
  title,
  fields = [],
  onCancel,
  onSubmit,
  image,
  containerClassName = "",
  containerStyle = {},
  existingData = [],    // validasi data sudah ada
  backgroundStyle = {},
  initialData = {},   // data awal saat display edit
}) {
  // inisialisasi variabel
  const [fieldErrors, setFieldErrors] = useState({});
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [focusedIdx, setFocusedIdx] = useState(null);
  const inputRefs = useRef([]);

  //handler submit
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const errors = {};

    fields.forEach((field) => {
      const value = formData.get(field.name) || "";

      // validasi required
      if (!value) {
        errors[field.name] = `Kolom ${field.label} harus diisi.`;
        return;
      }

      // validasi minLength
      if (field.minLength && value.length < field.minLength) {
        errors[field.name] = `Kolom ${field.label} minimal ${field.minLength} karakter. Kurang ${
          field.minLength - value.length
        } karakter.`;
      }

      // validasi duplikat (untuk mode edit kita bisa skip pengecekan pada data yang sama)
      if (
        existingData.some(
          (item) =>
            item[field.name] === value &&
            // jika sedang edit, tidak dianggap duplikat pada item yang sama
            (!initialData || item.id !== initialData.id)
        )
      ) {
        errors[field.name] = `Kolom ${field.label} dengan nilai "${value}" sudah ada.`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (onSubmit) onSubmit(formData, setFieldErrors);
    setFieldErrors({});
  };

  // handler enter 
  const handleKeyDown = (e, idx) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextInput = inputRefs.current[idx + 1];
      if (nextInput) {
        nextInput.focus();
      } else {
        document.getElementById("addForm").requestSubmit();
      }
    }
  };

  return (
    <div
      className={`flex h-screen w-screen justify-center items-center`}
      style={backgroundStyle}
    >
      {/* main container */}
      <div
        className={`flex flex-col rounded-2xl shadow-lg overflow-hidden ${containerClassName}`}
        style={containerStyle}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b">
          <div
            onClick={onCancel}
            className="p-2 rounded-full bg-[#EC933A] hover:bg-orange-600 text-white cursor-pointer"
          >
            <ArrowLeft size={20} />
          </div>
          <h1 className="!text-2xl font-bold">{title}</h1>
        </div>

        {/* Body */}
        <div className="flex flex-1">
          {/* Kiri: gambar */}
          <div className="hidden md:flex w-1/2 items-center justify-center border-r">
            <img
              src={image || addSidebar}
              alt="addSidebar"
              className="max-w-[70%] max-h-[70%] object-contain"
            />
          </div>

          {/* Kanan: form */}
          <div className="flex w-full md:w-1/2 items-start justify-center p-8">
            <form
              id="addForm"
              onSubmit={handleSubmit}
              className="w-full grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {fields.map((field, idx) => {
                const showTip =
                  (hoveredIdx === idx || focusedIdx === idx) &&
                  !fieldErrors[field.name] &&
                  !inputRefs.current[idx]?.value;

                // input area
                return (
                  <div
                    key={idx}
                    className={
                      field.width === "full"
                        ? "col-span-2 relative"
                        : "col-span-1 relative"
                    }
                  >
                    <label className="block mb-2 text-sm font-bold text-gray-700">
                      {field.label}
                    </label>

                    {field.type === "textarea" ? (
                      <textarea
                        name={field.name}
                        rows={field.rows || 3}
                        placeholder=""
                        ref={(el) => (inputRefs.current[idx] = el)}
                        defaultValue={initialData[field.name] || ""}  // <-- isi awal textarea
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        onFocus={() => setFocusedIdx(idx)}
                        onBlur={() => setFocusedIdx(null)}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:outline-none ${
                          fieldErrors[field.name]
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-orange-500"
                        }`}
                      />
                    ) : field.type === "select" ? (
                      <select
                        name={field.name}
                        defaultValue={initialData[field.name] || ""}
                        ref={(el) => (inputRefs.current[idx] = el)}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        onFocus={() => setFocusedIdx(idx)}
                        onBlur={() => setFocusedIdx(null)}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:outline-none ${
                          fieldErrors[field.name]
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-orange-500"
                        }`}
                      >
                        <option value="" disabled>
                          {field.placeholder || `Pilih ${field.label}`}
                        </option>
                        {field.options?.map((opt, i) => (
                          <option key={i} value={opt.value || opt}>
                            {opt.label || opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        name={field.name}
                        type={field.type || "text"}
                        placeholder=""
                        ref={(el) => (inputRefs.current[idx] = el)}
                        defaultValue={initialData[field.name] || ""}  // <-- isi awal input
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        onFocus={() => setFocusedIdx(idx)}
                        onBlur={() => setFocusedIdx(null)}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:outline-none ${
                          fieldErrors[field.name]
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-orange-500"
                        }`}
                      />
                    )}

                    {/* Tooltip hover/fokus */}
                    {showTip && (
                      <div className="absolute top-full mt-1 left-0 bg-yellow-100 text-yellow-900 text-xs px-2 py-1 rounded shadow-md z-10">
                        Silahkan masukkan inputan di kolom {field.label} terlebih dahulu
                      </div>
                    )}

                    {/* Pesan error */}
                    {fieldErrors[field.name] && (
                      <p className="text-red-500 text-sm mt-1">
                        {fieldErrors[field.name]}
                      </p>
                    )}
                  </div>
                );
              })}
            </form>
          </div>
        </div>

        {/* Garis bawah */}
        <div className="border-t"></div>

        {/* Tombol aksi */}
        <div className="flex justify-end gap-4 px-8 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="button-radius"
            style={{
              "--btn-bg": "#3A3D3D",
              "--btn-active": "#5d6464ff",
              "--btn-text": "white",
            }}
          >
            Batal
          </button>
          <button
            type="submit"
            form="addForm"
            className="button-radius"
            style={{
              "--btn-bg": "#EC933A",
              "--btn-active": "#f4d0adff",
              "--btn-text": "white",
            }}
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
