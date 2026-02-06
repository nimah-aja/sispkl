import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import Add from "./components/Add";
import { useLocation, useNavigate } from "react-router-dom";

import uploadImg from "../assets/upload.svg";
import cloudupload from "../assets/upload.svg";

import { uploadImage } from "../utils/services/pembimbing/upload";
import { submitRealisasiKegiatan } from "../utils/services/pembimbing/realisasi";

// Icon components
const TrashIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

// Format ukuran file
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/* CloudUpload (INLINE)  */
function CloudUpload({ images, setImages, setAllUploaded }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const MAX_SIZE = 5 * 1024 * 1024;
  const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  const validateFile = (file) => {
    if (!ALLOWED_FORMATS.includes(file.type.toLowerCase())) {
      toast.error(`${file.name}: Format tidak didukung. Gunakan JPEG, PNG, WebP, atau GIF`);
      return false;
    }
    
    if (file.size > MAX_SIZE) {
      toast.error(`${file.name}: Ukuran maksimal 5MB`);
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

    const files = Array.from(e.dataTransfer.files || []);
    handleFiles(files);
  };

  const onFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    e.target.value = ""; 
  };

  const handleFiles = async (files) => {
    if (!files.length) return;

    // Validasi semua file
    const validFiles = files.filter(validateFile);
    if (validFiles.length === 0) return;

    // Jika ada file yang valid, proses upload satu per satu
    setUploading(true);
    
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const index = images.length + i; 
      
      try {
        // Set progress awal
        setUploadProgress(prev => ({
          ...prev,
          [index]: {
            filename: file.name,
            size: file.size,
            progress: 0,
            status: 'uploading'
          }
        }));

        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [index]: {
            ...prev[index],
            progress: 50
          }
        }));

        // Upload gambar
        const res = await uploadImage(file);
        
        // Buat object gambar dengan semua informasi
        const imageData = {
          ...res,
          originalName: file.name,
          originalSize: file.size,
          fileType: file.type,
          preview: URL.createObjectURL(file), 
          uploadedAt: new Date().toISOString()
        };

        // Tambahkan ke state images
        setImages(prev => [...prev, imageData]);
        
        // Update progress to success
        setUploadProgress(prev => ({
          ...prev,
          [index]: {
            ...prev[index],
            progress: 100,
            status: 'success'
          }
        }));
        
        toast.success(`${file.name}: Berhasil diupload`);
        
      } catch (err) {
        console.error(err);
        toast.error(`${file.name}: Upload gagal`);
        setUploadProgress(prev => ({
          ...prev,
          [index]: {
            ...prev[index],
            progress: 100,
            status: 'error',
            error: err.message
          }
        }));
      }
    }

    // Clear progress setelah 2 detik
    setTimeout(() => {
      setUploadProgress({});
    }, 2000);

    setUploading(false);
  };

  const removeImage = (indexToRemove) => {
    // Revoke object URL untuk menghindari memory leak
    if (images[indexToRemove]?.preview) {
      URL.revokeObjectURL(images[indexToRemove].preview);
    }
    
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    toast.success("Gambar dihapus");
  };

  // Update allUploaded status
  useEffect(() => {
    const hasActiveUploads = Object.keys(uploadProgress).length > 0 || uploading;
    const allUploadedSuccessfully = images.length > 0 && !hasActiveUploads;
    setAllUploaded(allUploadedSuccessfully);
  }, [uploadProgress, uploading, images, setAllUploaded]);

  return (
    <div className="w-full h-full p-6 flex flex-col">
      {/* Upload Area */}
      <div className="mb-6">
        <div
          className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all
            ${isDragging ? 'bg-orange-50 border-orange-400' : 'border-gray-300 hover:border-orange-300'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileSelect}
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
          />

          {images.length === 0 ? (
            <>
              <div className="mb-4">
                <UploadIcon/>
              </div>
              <div className="text-center">
                <p className="text-black text-lg font-medium mb-2">
                  {uploading ? 'Sedang Upload...' : 'Drag & drop atau klik pilih file'}
                </p>
                <p className="text-gray-500 text-sm">
                  JPG, PNG, WebP, GIF (Max 5MB per file)
                </p>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="ml-26"><UploadIcon className="mb-3" /></div>
              <p className="text-black font-medium">
                Klik untuk tambah gambar lagi
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {images.length} gambar terupload
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Status Upload</h3>
          <div className="space-y-2">
            {Object.entries(uploadProgress).map(([index, progress]) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium truncate">{progress.filename}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    progress.status === 'success' ? 'bg-green-100 text-green-800' :
                    progress.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {progress.status === 'success' ? 'Selesai' :
                     progress.status === 'error' ? 'Gagal' :
                     'Uploading...'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      progress.status === 'success' ? 'bg-green-500' :
                      progress.status === 'error' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                {progress.error && (
                  <p className="text-red-600 text-xs mt-1">{progress.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Images Gallery */}
      {images.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-700">
              Gambar Terupload ({images.length})
            </h3>
            {Object.keys(uploadProgress).length === 0 && !uploading && (
              <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                <CheckIcon /> Siap dikirim
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-1 pr-2">
            {images.map((img, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                {/* Image Preview */}
                <div className="relative aspect-square bg-gray-100">
                  <img
                    src={img.preview || img.url}
                    alt={img.originalName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://via.placeholder.com/300x300/cccccc/ffffff?text=Gambar+${index + 1}`;
                    }}
                  />
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 !bg-transparent !p-0 !m-0 !border-0 !shadow-none opacity-0 hover:opacity-100"
                    title="Hapus gambar"
                    style={{ 
                      background: 'transparent !important',
                      border: 'none !important',
                      boxShadow: 'none !important',
                      outline: 'none !important'
                    }}
                  >
                    
                    <div className="text-white hover:text-white bg-transparent">
                      <TrashIcon />
                    </div>
                  </button>
                  
                  {/* Upload Status Badge */}
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckIcon className="w-3 h-3" /> Uploaded
                  </div>
                </div>
                
                {/* File Information */}
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-800 truncate" title={img.originalName}>
                    {img.originalName || img.filename}
                  </p>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-600">
                    <span>{formatFileSize(img.originalSize)}</span>
                    <span className="text-green-600 font-medium">✓</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-1" title={img.url}>
                    {img.url?.substring(0, 40)}...
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-gray-600">Total: </span>
                <span className="font-semibold">{images.length} gambar</span>
              </div>
              <div>
                <span className="text-gray-600">Ukuran total: </span>
                <span className="font-semibold">
                  {formatFileSize(images.reduce((sum, img) => sum + (img.originalSize || 0), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && Object.keys(uploadProgress).length === 0 && !uploading && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="ml-20"><UploadIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" /></div>
            <p className="font-medium text-gray-500">Belum ada gambar</p>
            <p className="text-sm mt-1">Pilih gambar untuk mulai upload</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* PAGE*/
export default function UploadBuktiPengantaran() {
  const [images, setImages] = useState([]);
  const [formKey, setFormKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [allImagesUploaded, setAllImagesUploaded] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const navigate = useNavigate(); 
   const location = useLocation();
   const { 
    tugas, 
    id_kegiatan, 
    id_industri 
  } = location.state || {};

  const fields = [
    {
      name: "keterangan",
      label: "Catatan",
      type: "textarea",
      rows: 4,
      width: "full",
      placeholder: "Tambahkan catatan atau deskripsi kegiatan..."
    },
  ];

  // Cek apakah bisa submit
  useEffect(() => {
    const hasImages = images.length > 0;
    const readyToSubmit = hasImages && allImagesUploaded;
    setCanSubmit(readyToSubmit);

    // Status feedback
    if (hasImages && !allImagesUploaded) {
      toast.loading("Sedang memproses gambar...", { id: "upload-status" });
    } else if (readyToSubmit) {
      toast.success("Semua gambar siap dikirim!", { id: "upload-status", duration: 3000 });
    } else if (!hasImages) {
      toast.dismiss("upload-status");
    }
  }, [images, allImagesUploaded]);

  const handleSubmit = async (formData) => {
    if (!canSubmit) {
      toast.error("Harap tunggu semua gambar selesai diupload");
      return;
    }

    if (images.length === 0) {
      toast.error("Minimal 1 gambar");
      return;
    }

    try {
      setLoading(true);
      const toastId = toast.loading("Mengirim bukti pengantaran...");

      await submitRealisasiKegiatan({
        kegiatan_id: id_kegiatan,
        industri_id: id_industri,
        catatan: formData.get("keterangan") || "",
        bukti_foto_urls: images.map(img => img.url),
        tanggal_realisasi: new Date().toISOString().split("T")[0]
      });

      toast.success("Bukti pengantaran berhasil dikirim!", { id: toastId });

      // Cleanup preview URLs
      images.forEach(img => {
        if (img.preview && img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });

      // Reset state
      setImages([]);
      setAllImagesUploaded(false);
      setFormKey((k) => k + 1);

      //  NAVIGASI KEMBALI KE HALAMAN SEBELUMNYA
      navigate(-1); 

    } catch (err) {
      console.error(err);
      toast.error("Gagal mengirim bukti pengantaran");

      if (err.response?.data?.message) {
        toast.error(`Error: ${err.response.data.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (images.length > 0) {
      const confirmReset = window.confirm(
        `Yakin ingin reset? ${images.length} gambar yang sudah diupload akan dihapus.`
      );
      if (!confirmReset) return;
      
      // Cleanup preview URLs
      images.forEach(img => {
        if (img.preview && img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
    }
    
    setImages([]);
    setAllImagesUploaded(false);
    setFormKey((k) => k + 1);
    toast.success("Form telah direset");
  };

  return (
    <Add
  key={formKey}
  title="Upload Bukti Pengantaran"
  fields={fields}
  submitText={loading ? "Mengirim..." : "Kirim"}
  cancelText="Reset"
  image={uploadImg}
  leftContent={
    <CloudUpload 
      images={images} 
      setImages={setImages} 
      setAllUploaded={setAllImagesUploaded}
    />
  }
  onCancel={handleCancel}
  onSubmit={handleSubmit}
  containerClassName="w-full max-w-[1400px] max-h-[90vh] bg-white rounded-2xl shadow-xl"
  submitButtonProps={{
    disabled: !canSubmit || loading,
    className: !canSubmit || loading 
      ? "opacity-50 cursor-not-allowed button-radius" 
      : "hover:border-orange-500 hover:bg-transparent transition-colors text-white button-radius",
    style: {
      '--btn-bg': '#EC933A', // Warna background orange
      '--btn-active': '#EC933A', // Warna saat active
      '--btn-text': 'white', // Warna text putih
      border: '2px solid #EC933A', // Tambah border
      backgroundColor: '#EC933A', // Background orange
    }
  }}
/>
  );
}