import React, { useEffect, useState } from "react";
import Add from "./components/Add";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { createPerpindahanPKL } from "../utils/services/siswa/perpindahan";
import { getAvailableIndustri } from "../utils/services/siswa/industri";

export default function PengajuanPerpindahanPKL() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [industriOptions, setIndustriOptions] = useState([]);

  // 🔹 FETCH INDUSTRI
  useEffect(() => {
    const fetchIndustri = async () => {
      try {
        const res = await getAvailableIndustri();

        const options = (res?.data || res || []).map((item) => ({
          label: item.name || item.nama,
          value: item.id.toString(),
        }));

        setIndustriOptions(options);
      } catch (error) {
        toast.error("Gagal mengambil data industri");
      }
    };

    fetchIndustri();
  }, []);

  const fields = [
    {
      name: "industri_id",
      label: "Industri Tujuan Baru",
      type: "select",
      width: "full",
      required: true,
      options: industriOptions,
    },
    {
      name: "alasan",
      label: "Alasan Perpindahan",
      type: "textarea",
      width: "full",
      required: true,
    },
    {
      name: "files",
      label: "Unggah Bukti Pendukung (JPG / PNG , max 5MB)",
      type: "file",
      width: "full",
      required: true,
      accept: "image/jpeg,image/png",
      multiple: false, 

      // 🔥 VALIDASI LANGSUNG
      onChange: (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = [
          "image/jpeg",
          "image/png",,
        ];

        if (!allowedTypes.includes(file.type)) {
          toast.error("Hanya JPG, PNG yang diperbolehkan");
          e.target.value = null;
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error("Ukuran file maksimal 5MB");
          e.target.value = null;
        }
      },
    },
  ];

  const handleSubmit = async (formData) => {
    if (isSubmitting) return;

    const industri_id = formData.get("industri_id");
    const alasan = formData.get("alasan");
    const file = formData.get("files");

    if (!file || !file.name) {
      toast.error("Bukti pendukung wajib diunggah");
      return;
    }

    if (!alasan || alasan.length < 10) {
      toast.error("Alasan minimal 10 karakter");
      return;
    }

    setIsSubmitting(true);

    try {
      await createPerpindahanPKL({
        industri_baru_id: industri_id,
        alasan,
        files: [file], // API tetap array
      });

      toast.success("Pengajuan perpindahan PKL berhasil dikirim");
      navigate(-1);
    } catch (err) {
      const backendMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "";

      toast.error(backendMessage || "Gagal mengirim pengajuan");
    } finally {
      setIsSubmitting(false);
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
      isSubmitting={isSubmitting}
    />
  );
}
