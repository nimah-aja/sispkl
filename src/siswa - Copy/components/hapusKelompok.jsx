// src/pages/siswa/components/HapusKelompokModal.jsx
import React, { useState, useRef } from "react";
import { deleteGroup } from "../../utils/services/siswa/group";
import hapusIcon from "../../assets/deleteGrafik.svg";

export default function HapusKelompokModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  groupId, 
  groupName 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasSubmitted = useRef(false); // Untuk mencegah double submit

  const handleDelete = async () => {
    // Cegah double submit
    if (hasSubmitted.current) return;
    
    setIsSubmitting(true);
    hasSubmitted.current = true;
    
    try {
      await deleteGroup(groupId);
      await onConfirm(groupId);
      // onClose akan dipanggil di parent via onConfirm
    } catch (error) {
      console.error("Gagal menghapus kelompok:", error);
      alert(error?.response?.data?.message || error?.message || "Gagal menghapus kelompok. Silakan coba lagi.");
      hasSubmitted.current = false; // Reset jika error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset hasSubmitted ketika modal ditutup
  React.useEffect(() => {
    if (!isOpen) {
      hasSubmitted.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-[600px] h-[400px] p-15 border-2 border-black">
        <div className="flex justify-center">
          <img src={hapusIcon} alt="Hapus" className="h-32 w-auto" />
        </div>

        <p className="mt-6 text-center text-lg font-semibold text-gray-800">
          Apakah anda yakin untuk menghapus kelompok ini?
        </p>
        <p className="mt-1 text-center text-sm text-gray-500">
          Kelompok "{groupName}" akan dihapus dan tidak dapat kembali lagi.
        </p>

        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
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
            onClick={handleDelete}
            disabled={isSubmitting}
            className="button-radius"
            style={{
              "--btn-bg": "#EC933A",      
              "--btn-active": "#f4d0adff",   
              "--btn-text": "white",       
            }}
          >
            {isSubmitting ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}