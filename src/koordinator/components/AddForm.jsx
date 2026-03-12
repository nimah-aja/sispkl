import React, { useState } from "react";
import toast from "react-hot-toast";

// Components
import Add from "./Add";

// Services
import { createFormPenilaian } from "../../utils/services/koordinator/penilaian";

// Assets
import formImage from "../../assets/add.svg";

export default function AddFormPenilaian({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const fields = [
    {
      name: "nama",
      label: "Nama Form Penilaian",
      type: "text",
      placeholder: "Masukkan nama form penilaian",
      width: "full",
      required: true
    },
    {
      name: "tujuan_pembelajaran_1",
      label: "Tujuan Pembelajaran 1",
      type: "textarea",
      rows: 3,
      placeholder: "Masukkan tujuan pembelajaran pertama",
      width: "full",
      required: true
    },
    {
      name: "tujuan_pembelajaran_2",
      label: "Tujuan Pembelajaran 2",
      type: "textarea",
      rows: 3,
      placeholder: "Masukkan tujuan pembelajaran kedua (opsional)",
      width: "full"
    },
    {
      name: "tujuan_pembelajaran_3",
      label: "Tujuan Pembelajaran 3",
      type: "textarea",
      rows: 3,
      placeholder: "Masukkan tujuan pembelajaran ketiga (opsional)",
      width: "full"
    },
    {
      name: "tujuan_pembelajaran_4",
      label: "Tujuan Pembelajaran 4",
      type: "textarea",
      rows: 3,
      placeholder: "Masukkan tujuan pembelajaran keempat (opsional)",
      width: "full"
    },
    {
      name: "tujuan_pembelajaran_5",
      label: "Tujuan Pembelajaran 5",
      type: "textarea",
      rows: 3,
      placeholder: "Masukkan tujuan pembelajaran kelima (opsional)",
      width: "full"
    }
  ];

  const handleSubmit = async (formData, setFieldErrors) => {
    try {
      setLoading(true);
      
      // Ambil nilai dari formData
      const nama = formData.get("nama");
      
      // Kumpulkan tujuan pembelajaran yang tidak kosong
      const items = [];
      for (let i = 1; i <= 5; i++) {
        const tp = formData.get(`tujuan_pembelajaran_${i}`);
        if (tp && tp.trim() !== "") {
          items.push({
            tujuan_pembelajaran: tp,
            urutan: i
          });
        }
      }

      // Validasi minimal 1 item
      if (items.length === 0) {
        setFieldErrors({
          tujuan_pembelajaran_1: "Minimal 1 tujuan pembelajaran harus diisi"
        });
        return;
      }

      const payload = {
        nama,
        items
      };

      await createFormPenilaian(payload);
      
      toast.success("Form penilaian berhasil dibuat!");
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error("Gagal create form:", error);
      toast.error(error.message || "Gagal membuat form penilaian");
      
      // Handle validation errors dari backend
      if (error.errors) {
        const errors = {};
        error.errors.forEach(err => {
          if (err.path === "nama") {
            errors.nama = err.msg;
          } else if (err.path.includes("tujuan_pembelajaran")) {
            const index = err.path.match(/\d+/)?.[0];
            if (index) {
              errors[`tujuan_pembelajaran_${index}`] = err.msg;
            }
          }
        });
        setFieldErrors(errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Add
      title="Buat Form Penilaian Baru"
      fields={fields}
      onCancel={onClose}
      onSubmit={handleSubmit}
      image={formImage}
      containerClassName="w-full max-w-[900px] max-h-[90vh] bg-white rounded-2xl shadow-xl"
      submitButtonProps={{
        disabled: loading,
        className: loading ? "opacity-50 cursor-not-allowed" : ""
      }}
    />
  );
}