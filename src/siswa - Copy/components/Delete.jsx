import React from "react";

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onDelete,
  imageSrc, 
}) {
  if (!isOpen) return null;

  return (
    // Overlay hitam transparan
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-[600px]  h-[400px] p-15 border-2 border-black">
        {/* Icon / Gambar */}
        <div className="flex justify-center">
          <img src={imageSrc} alt="Hapus" className="h-32 w-auto" />
        </div>

        {/* Teks */}
        <p className="mt-6 text-center text-lg font-semibold text-gray-800">
          Apakah anda yakin untuk menghapus data ini?
        </p>
        <p className="mt-1 text-center text-sm text-gray-500">
          data tidak akan kembali lagi setelah terhapus.
        </p>

        {/* Tombol */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={onClose}
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
            onClick={onDelete}
            className="button-radius"
            style={{
              "--btn-bg": "#EC933A",      
              "--btn-active": "#f4d0adff",   
              "--btn-text": "white",       
            }}
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
