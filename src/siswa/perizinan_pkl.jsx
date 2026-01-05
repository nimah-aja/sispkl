import React from "react";
import Add from "./components/Add";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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
      name: "tanggal",
      label: "Tanggal",
      type: "date",
      width: "full",
      required: true,
    },
    {
      name: "alasan",
      label: "Alasan",
      type: "textarea",
      width: "full",
      required: true,
    },
  ];

  const handleSubmit = async (formData) => {
    const payload = {
      nama_siswa: formData.get("nama_siswa"),
      kelas: formData.get("kelas"),
      tanggal: formData.get("tanggal"),
      alasan: formData.get("alasan"),
    };

    console.log("DATA DIKIRIM:", payload);

    try {
      // nanti tinggal sambung API
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
      title="Tambah Perizinan"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
      backgroundStyle={{ backgroundColor: "#F4EFE6" }}
      containerStyle={{ maxHeight: "600px" }}
    />
  );
}
