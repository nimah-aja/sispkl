import React, { useState } from "react";
import Add from "./components/Add";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import dayjs from "dayjs";

import { createIzin } from "../utils/services/siswa/izin";


export default function PengajuanPKL() {
  const [showDetail, setShowDetail] = useState(false);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fields = [
    {
      name: "jenis",
      label: "Jenis Izin",
      type: "select",
      width: "full",
      required: true,
      options: [
        { label: "Sakit", value: "Sakit" },
        { label: "Izin", value: "Izin" },
        { label: "Dispen", value: "Dispen" },
      ],
    },
    {
      name: "keterangan",
      label: "Keterangan",
      type: "textarea",
      width: "full",
      required: true,
    },
    {
      name: "files",
      label: "Unggah Bukti (JPG/PNG maksimal 5MB)",
      type: "file",
      width: "full",
      required: true,
      accept: "image/jpeg,image/png",
      multiple: true,

      // 🔥 VALIDASI LANGSUNG SAAT PILIH FILE
      onChange: (e) => {
        const selectedFiles = Array.from(e.target.files);
        const allowedTypes = ["image/jpeg", "image/png"];

        for (const file of selectedFiles) {
          if (!allowedTypes.includes(file.type)) {
            toast.error("File Excel, PDF, atau selain JPG/PNG tidak didukung.");
            e.target.value = null;
            return;
          }

          if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran file maksimal 5MB.");
            e.target.value = null;
            return;
          }
        }
      },
    },
  ];

  const handleSubmit = async (formData) => {
    if (isSubmitting) return;

    const formFiles = formData.getAll("files");

    if (!formFiles.length || !formFiles[0].name) {
      toast.error("Minimal unggah 1 gambar");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png"];

    for (const file of formFiles) {
      if (!allowedTypes.includes(file.type)) {
        toast.error("Format file tidak valid. Hanya JPG atau PNG.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await createIzin({
        tanggal: dayjs().format("YYYY-MM-DD"),
        jenis: formData.get("jenis"),
        keterangan: formData.get("keterangan"),
        files: formFiles,
      });

      toast.success("Pengajuan izin berhasil dikirim");
      navigate(-1);
    } catch (err) {
      const backendMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "";

      if (backendMessage.toLowerCase().includes("sudah ada izin")) {
        toast.error("Sudah ada izin yang diajukan untuk tanggal tersebut");
      } else {
        toast.error(backendMessage || "Gagal mengirim izin");
      }
    } finally {
      setIsSubmitting(false);
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
      isSubmitting={isSubmitting}
    />
  );
}
