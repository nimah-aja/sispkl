import React, { useEffect, useState } from "react";
import Add from "./components/Add";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// Import API
import { getIndustri } from "../utils/services/admin/get_industri";
import { submitPengajuanPKL } from "../utils/services/siswa/pengajuan_pkl";

export default function PengajuanPKL() {
  const navigate = useNavigate();
  const [listIndustri, setListIndustri] = useState([]);

  // ambil data industri
  useEffect(() => {
    const fetchIndustri = async () => {
      try {
        const data = await getIndustri();
        const formatted = data.map((item) => ({
          label: item.nama,
          value: item.id,
        }));
        setListIndustri(formatted);
      } catch (error) {
        console.error("Gagal mengambil data industri:", error);
      }
    };

    fetchIndustri();
  }, []);

  // config form
  const fields = [
    {
      name: "industri_id",
      label: "Nama Industri",
      type: "select",
      width: "full",
      options: listIndustri,
    },
    {
      name: "catatan",
      label: "Catatan",
      type: "textarea",
      width: "full",
      rows: 4,
      required: false,
    },
  ];

  // ✅ SATU-SATUNYA handleSubmit
  const handleSubmit = async (formData) => {
    const payload = {
      industri_id: parseInt(formData.get("industri_id")),
      catatan: formData.get("catatan"),
    };

    console.log("DATA DIKIRIM:", payload);

    try {
      await submitPengajuanPKL(payload);

      toast.success("Pengajuan PKL berhasil dikirim");
      navigate(-1);
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.message ||
        "Gagal mengirim pengajuan PKL";

      toast.error(message);
    }
  };

  return (
    <Add
      title="Pengajuan PKL"
      fields={fields}
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
      backgroundStyle={{ backgroundColor: "#F4EFE6" }}
    />
  );
}
