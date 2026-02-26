import React from "react";

export default function HapusAnggotaModal({
  isOpen,
  onClose,
  onConfirm,
  imageSrc,
  anggotaNama
}) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleBatalClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleHapusClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onConfirm();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl shadow-lg w-[600px] h-[400px] p-15 border-2 border-black">
        <div className="flex justify-center">
          <img src={imageSrc} alt="Hapus" className="h-32 w-auto" />
        </div>

        <p className="mt-6 text-center text-lg font-semibold text-gray-800">
          Hapus Anggota Kelompok
        </p>
        <p className="mt-1 text-center text-sm text-gray-500">
          Apakah Anda yakin ingin menghapus <span className="font-semibold">{anggotaNama}</span> dari kelompok?
        </p>
        <p className="text-center text-sm text-red-500 mt-2">
          Anggota yang dihapus tidak dapat dikembalikan.
        </p>

        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={handleBatalClick}
            className="button-radius"
            style={{
              "--btn-bg": "#3A3D3D",       
              "--btn-active": "#5d6464ff",  
              "--btn-text": "white",      
            }}
            type="button"
          >
            Batal
          </button>
          <button
            onClick={handleHapusClick}
            className="button-radius"
            style={{
              "--btn-bg": "#EC933A",      
              "--btn-active": "#f4d0adff",   
              "--btn-text": "white",       
            }}
            type="button"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}