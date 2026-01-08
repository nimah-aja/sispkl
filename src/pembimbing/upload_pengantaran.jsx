import React, { useState, useRef, useEffect } from "react";
import Add from "./components/Add";
import uploadImg from "../assets/upload.svg";
import cloudupload from "../assets/upload.svg";
import toast from "react-hot-toast";

/* =========================
   CloudUpload (INLINE)
========================= */
function CloudUpload({ file, setFile, primaryColor = "#EC933A" }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const validateFile = (selectedFile) => {
    if (selectedFile.size > MAX_SIZE) {
        toast.error("Ukuran file maksimal 5MB");
        return false;
        }

    return true;
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const selectedFile = e.dataTransfer.files?.[0];
    if (!selectedFile) return;

    if (validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const onFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  return (
    <div className="w-full h-full p-10 border-b lg:border-b-0 lg:border-r border-gray-300 flex flex-col justify-center items-center">
      <div
        className={`w-full h-full flex flex-col justify-center items-center transition-all rounded-xl
          ${isDragging ? "bg-orange-50 border-2 border-dashed" : ""}
        `}
        style={{ borderColor: isDragging ? primaryColor : "transparent" }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {file ? (
          <div className="text-center animate-fade-in w-full">
            {/* PREVIEW */}
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="mx-auto mb-4 max-h-[220px] rounded-lg shadow"
              />
            ) : (
              <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-semibold mb-4 inline-block">
                PDF FILE
              </div>
            )}

            <p className="text-gray-800 font-bold text-sm break-all">
              {file.name}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>

            <button
              onClick={() => setFile(null)}
              className="mt-3 text-white text-sm font-semibold  hover:!text-red-700"
            >
              Hapus     
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <img
                src={cloudupload}
                alt="Upload Icon"
                className="w-20 h-20 mx-auto"
              />
            </div>

            <div className="text-center mb-8">
              <p className="text-black text-[16px] font-medium mb-2">
                Drag & drop atau klik pilih file
              </p>
              <p className="text-gray-500 text-[13px]">
                JPG, PNG, PDF (Max 5MB)
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileSelect}
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current.click()}
              style={{ backgroundColor: primaryColor }}
              className="text-white px-10 py-3 rounded-lg font-bold text-[15px] hover:opacity-90 transition-opacity shadow-sm"
            >
              Pilih File
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* =========================
   PAGE
========================= */
export default function UploadBuktiPengantaran() {
  const [file, setFile] = useState(null);

  const fields = [
    {
      name: "tujuan",
      label: "Tujuan",
      type: "select",
      required: true,
      options: [
        { label: "Pengantaran", value: "pengantaran" },
        { label: "Penjemputan", value: "penjemputan" },
      ],
    },
    {
      name: "nama_industri",
      label: "Nama Industri",
      type: "text",
      required: true,
    },
    {
      name: "tanggal_pengantaran",
      label: "Tanggal Pengantaran",
      type: "date",
      required: true,
      width: "full",
    },
    {
      name: "keterangan",
      label: "Keterangan",
      type: "textarea",
      rows: 4,
      width: "full",
    },
  ];

  return (
    <Add
      title="Upload Bukti Pengantaran"
      fields={fields}
      submitText="Upload"
      cancelText="Kembali"
      image={uploadImg}
      leftContent={
        <CloudUpload
          file={file}
          setFile={setFile}
          primaryColor="#EC933A"
        />
      }
      onCancel={() => window.history.back()}
      onSubmit={(formData) => {
        if (!file) {
          alert("File wajib diupload");
          return;
        }
        formData.append("bukti_pengantaran", file);

        console.log("FORM DATA:");
        for (let pair of formData.entries()) {
          console.log(pair[0], pair[1]);
        }
      }}
      containerClassName="w-full max-w-[1200px] max-h-[90vh] bg-white"
    />
  );
}
