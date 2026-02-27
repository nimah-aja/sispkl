// src/pages/siswa/components/BatalkanPengajuanModal.jsx
import React from "react";
import { Ban } from "lucide-react";

export default function BatalkanPengajuanModal({
  isOpen,
  onClose,
  onConfirm,
  groupName
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

  const handleConfirmClick = (e) => {
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
          <Ban size={128} className="text-red-500" />
        </div>

        <p className="mt-6 text-center text-lg font-semibold text-gray-800">
          Batalkan Pengajuan Kelompok
        </p>
        <p className="mt-1 text-center text-sm text-gray-500">
          Apakah Anda yakin ingin membatalkan pengajuan kelompok ini?
        </p>
        <p className="text-center text-sm text-red-500 mt-2 font-semibold">
          {groupName}
        </p>
        <p className="text-center text-sm text-gray-500 mt-4">
          Kelompok akan kembali ke status Draf dan dapat diedit kembali.
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
            Tidak
          </button>
          <button
            onClick={handleConfirmClick}
            className="button-radius"
            style={{
              "--btn-bg": "#EC933A",      
              "--btn-active": "#f4d0adff",   
              "--btn-text": "white",       
            }}
            type="button"
          >
            Ya, Batalkan
          </button>
        </div>
      </div>
    </div>
  );
}