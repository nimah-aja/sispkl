import React from "react";

export default function LogoutModal({ isOpen, onClose, onConfirm, imageSrc }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999999999999] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-[600px]  h-[400px] p-15 border-2 border-blac">
        {/* Icon */}
        <div className="flex justify-center">
          <img src={imageSrc} alt="Logout" className="h-32 w-auto" />
        </div>

        {/* Text */}
        <p className="mt-6 text-center text-lg font-semibold text-gray-800">
          Apakah Anda yakin ingin keluar?
        </p>
        <p className="mt-1 text-center text-sm text-gray-500">
          Anda akan kembali ke halaman login.
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
            onClick={onConfirm}
            className="button-radius"
            style={{
              "--btn-bg": "#EC933A",
              "--btn-active": "#f4d0adff",
              "--btn-text": "white",
            }}
          >
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
