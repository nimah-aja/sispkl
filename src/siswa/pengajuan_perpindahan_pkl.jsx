import React from "react";
import Add from "./components/Add";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// 🔜 kalau nanti ada API
// import { submitPengajuanPKL } from "../utils/services/siswa/pengajuan_pkl";

export default function PengajuanPKL() {
  const navigate = useNavigate();

  const fields = [
    {
      name: "nama_siswa",
      label: "Nama Siswa",
      type: "text",
      width: "half",
      required: true,
    },
    {
      name: "kelas",
      label: "Kelas",
      type: "text",
      width: "half",
      required: true,
    },
    {
      name: "jurusan",
      label: "Jurusan",
      type: "text",
      width: "half",
      required: true,
    },
    {
      name: "industri_lama",
      label: "Nama Industri Lama",
      type: "text",
      width: "half",
      required: false,
    },
    {
      name: "industri_baru",
      label: "Nama Industri Baru",
      type: "text",
      width: "half",
      required: true,
    },
    {
      name: "telp_industri_baru",
      label: "No. Telp Industri Baru",
      type: "text",
      width: "half",
      required: true,
    },
    {
      name: "alamat_industri_baru",
      label: "Alamat Industri Baru",
      type: "text",
      width: "full",
      required: true,
    },
    {
      name: "keterangan",
      label: "Keterangan",
      type: "textarea",
      width: "full",
      required: false,
    },
  ];

  const handleSubmit = async (formData) => {
    const payload = {
      nama_siswa: formData.get("nama_siswa"),
      kelas: formData.get("kelas"),
      jurusan: formData.get("jurusan"),
      industri_lama: formData.get("industri_lama"),
      industri_baru: formData.get("industri_baru"),
      alamat_industri_baru: formData.get("alamat_industri_baru"),
      telp_industri_baru: formData.get("telp_industri_baru"),
      keterangan: formData.get("keterangan"),
    };

    console.log("DATA DIKIRIM:", payload);

    try {
      // 🔜 kalau sudah ada backend
      // await submitPengajuanPKL(payload);

      toast.success("Pengajuan PKL berhasil dikirim");
      navigate(-1);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengirim pengajuan PKL");
    }
  };

  return (
    <Add
      title="Pengajuan Perpindahan PKL"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
      backgroundStyle={{ backgroundColor: "#F4EFE6" }}
      containerStyle={{ maxHeight: "600px" }}
    />
  );
}
