import React, { useEffect, useState } from "react";
import Add from "./components/Add";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { uploadDokumenPKL } from "../utils/services/siswa/dokumen";

export default function BuktiDiterima() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  
  // Ambil pklId dari state yang dikirim oleh QuickActions
  const { pklId } = location.state || {};

  useEffect(() => {
    console.log("BuktiDiterima mounted with pklId:", pklId);
    
    if (!pklId) {
      toast.error("Tidak ada data PKL yang dipilih");
      navigate(-1);
    }
  }, [pklId, navigate]);

  const fields = [
    {
      name: "bukti_diterima",
      label: "Foto Bukti Diterima",
      type: "file",
      accept: "image/jpeg,image/png,image/webp",
      multiple: true,
      maxFiles: 3,
      maxSize: 5 * 1024 * 1024, // 5MB
      width: "full",
      required: true,
      helperText: "Upload 1-3 file (JPEG/PNG/WebP, max 5MB per file)",
    },
  ];

  const handleSubmit = async (formData) => {
    // Validasi file
    const files = formData.getAll("bukti_diterima");
    
    console.log("Files to upload:", files);
    console.log("Target PKL ID:", pklId);
    
    if (files.length === 0) {
      toast.error("Minimal 1 file harus diupload");
      return;
    }

    if (files.length > 3) {
      toast.error("Maksimal 3 file yang dapat diupload");
      return;
    }

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    for (let file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} harus berformat JPEG/PNG/WebP`);
        return;
      }
      
      // Validasi ukuran file (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} melebihi batas 5MB`);
        return;
      }
    }

    setLoading(true);
    const uploadToast = toast.loading("Mengupload dokumen...");

    try {
      // Panggil API upload dokumen dengan application_id
      const response = await uploadDokumenPKL(pklId, files);
      
      console.log("Upload response:", response);
      
      toast.dismiss(uploadToast);
      toast.success("Bukti diterima berhasil diupload", {
        duration: 4000,
      });
      
      // Redirect kembali ke dashboard
      navigate("/siswa");
    } catch (error) {
      console.error("Upload error:", error);
      
      toast.dismiss(uploadToast);
      
      // Tampilkan pesan error dari server jika ada
      const errorMessage = error?.message || 
                          error?.error || 
                          "Gagal mengupload bukti diterima";
      toast.error(errorMessage, {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Jika tidak ada pklId, jangan render form
  if (!pklId) {
    return null;
  }

  return (
    <Add
      title="Upload Bukti Diterima PKL"
      description={`Upload dokumen bukti diterima untuk aplikasi PKL #${pklId}`}
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
      backgroundStyle={{ backgroundColor: "#F4EFE6" }}
      containerStyle={{ maxHeight: "650px" }}
      submitButtonText={loading ? "Mengupload..." : "Upload Bukti"}
      disableSubmit={loading}
    />
  );
}