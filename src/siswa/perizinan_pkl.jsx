import React, { useState } from "react";
import Add from "./components/Add";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function PengajuanPKL() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);

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
    {
      name: "surat_dokter",
      label: "Upload Surat Dokter",
      type: "file",
      width: "full",
      required: true,
      accept: ".pdf,.jpg,.png",
      onChange: (e) => setFile(e.target.files[0]),
    },
  ];

  const handleSubmit = async (formData) => {
    if (!file) {
      toast.error("Surat dokter wajib diupload");
      return;
    }

    const payload = {
      nama_siswa: formData.get("nama_siswa"),
      kelas: formData.get("kelas"),
      tanggal: formData.get("tanggal"),
      alasan: formData.get("alasan"),
      surat_dokter: file,
    };

    console.log("DATA DIKIRIM:", payload);
    toast.success("Pengajuan PKL berhasil dikirim");
    navigate(-1);
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