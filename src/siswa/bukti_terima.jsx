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
      name: "jurusan",
      label: "Jurusan",
      type: "text",
      width: "half",
      required: true,
    },
    {
      name: "nomor_industri",
      label: "Nomor Industri",
      type: "text",
      width: "half",
      required: true,
    },
    {
      name: "industri",
      label: "Nama Industri",
      type: "text",
      width: "full",
      required: true,
    },
    {
      name: "alamat_industri",
      label: "Alamat Industri",
      type: "text",
      width: "full",
      required: true,
    },
    {
      name: "bukti_diterima",
      label: "Foto Bukti Diterima",
      type: "file",
      accept: "image/*",
      width: "full",
      required: true,
    },
    {
      name: "tanggal_mulai",
      label: "Tanggal Mulai",
      type: "date",
      width: "half",
      required: true,
    },
    {
      name: "tanggal_selesai",
      label: "Tanggal Selesai",
      type: "date",
      width: "half",
      required: true,
    },
  ];

  const handleSubmit = async (formData) => {
    const payload = new FormData();

    payload.append("nama_siswa", formData.get("nama_siswa"));
    payload.append("kelas", formData.get("kelas"));
    payload.append("jurusan", formData.get("jurusan"));
    payload.append("industri", formData.get("industri"));
    payload.append("nomor_industri", formData.get("nomor_industri"));
    payload.append("alamat_industri", formData.get("alamat_industri"));
    payload.append("bukti_diterima", formData.get("bukti_diterima"));
    payload.append("tanggal_mulai", formData.get("tanggal_mulai"));
    payload.append("tanggal_selesai", formData.get("tanggal_selesai"));

    console.log("DATA DIKIRIM:", Object.fromEntries(payload));

    try {
      // nanti tinggal sambung API multipart/form-data
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
      title="Form Bukti Diterima PKL"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
      backgroundStyle={{ backgroundColor: "#F4EFE6" }}
      containerStyle={{ maxHeight: "650px" }}
    />
  );
}
