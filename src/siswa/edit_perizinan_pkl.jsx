import React, { useState } from "react";
import Add from "./components/Add";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import dayjs from "dayjs";

import { updateIzin } from "../utils/services/siswa/izin";

export default function EditPengajuanPKL() {
  const navigate = useNavigate();
  const location = useLocation();
  const izin = location.state?.izin; // data dikirim dari halaman sebelumnya

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!izin) {
    toast.error("Data izin tidak ditemukan");
    navigate(-1);
    return null;
  }

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
      label: "Unggah Bukti Baru (opsional)",
      type: "file",
      width: "full",
      required: true,
      accept: "image/jpeg,image/png",
      multiple: true,
      onChange: (e) => {
        const selectedFiles = Array.from(e.target.files);
        const allowedTypes = ["image/jpeg", "image/png"];

        for (const file of selectedFiles) {
          if (!allowedTypes.includes(file.type)) {
            toast.error("Hanya file JPG atau PNG yang diperbolehkan");
            e.target.value = null;
            return;
          }

          if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran file maksimal 5MB");
            e.target.value = null;
            return;
          }
        }
      },
    },
  ];

  const handleSubmit = async (formData) => {
    if (isSubmitting) return;

    const files = formData.getAll("files").filter((f) => f?.name);

    setIsSubmitting(true);

    try {
      await updateIzin(izin.id, {
        tanggal: dayjs(izin.tanggal).format("YYYY-MM-DD"),
        jenis: formData.get("jenis"),
        keterangan: formData.get("keterangan"),
        files: files.length ? files : undefined,
      });

      toast.success("Pengajuan izin berhasil diperbarui");
      navigate(-1);
    } catch (err) {
      const backendMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "";

      toast.error(backendMessage || "Gagal memperbarui izin");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Add
      title="Ubah Pengajuan Izin"
      fields={fields}
      initialData={{
        jenis: izin.jenis,
        keterangan: izin.keterangan,
      }}
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
      backgroundStyle={{ backgroundColor: "#F4EFE6" }}
      containerStyle={{ maxHeight: "600px" }}
      isSubmitting={isSubmitting}
    />
  );
}
