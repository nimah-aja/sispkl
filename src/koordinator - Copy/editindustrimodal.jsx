import React, { useEffect, useState } from "react";

export default function EditIndustriModal({ data, onClose }) {
  const [form, setForm] = useState({
    nama: "",
    alamat: "",
    bidang: "",
    email: "",
    no_telp: "",
    tautan_peta: "",
    jarak_tempuh: "",
    nama_siswa: "",
    jurusan_nama: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        nama: data.nama || "",
        alamat: data.alamat || "",
        bidang: data.bidang || "",
        email: data.email || "",
        no_telp: data.no_telp || "",
        tautan_peta: data.tautan_peta || "",
        jarak_tempuh: data.jarak_tempuh || "",
        nama_siswa: data.nama_siswa || "",
        jurusan_nama: data.jurusan_nama || "",
      });
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm " +
    "outline-none transition focus:border-[#EC933A] focus:ring-2 focus:ring-[#EC933A]/30";

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b bg-white">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Edit Industri
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Perbarui data industri
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full
                       !bg-gray-100 hover:!bg-gray-200 text-gray-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">
          {/* Data utama */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* Nama Industri */}
            <div className="md:col-span-2">
              <label className={labelClass}>Nama Industri</label>
              <input
                type="text"
                name="nama"
                value={form.nama}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Alamat */}
            <div>
              <label className={labelClass}>Alamat</label>
              <input
                type="text"
                name="alamat"
                value={form.alamat}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Bidang */}
            <div>
              <label className={labelClass}>Bidang</label>
              <input
                type="text"
                name="bidang"
                value={form.bidang}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>E-Mail</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* No Telp */}
            <div>
              <label className={labelClass}>No. Telepon</label>
              <input
                type="text"
                name="no_telp"
                value={form.no_telp}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Tautan Peta */}
            <div>
              <label className={labelClass}>Tautan Peta</label>
              <input
                type="text"
                name="tautan_peta"
                value={form.tautan_peta}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Jarak Tempuh */}
            <div>
              <label className={labelClass}>Jarak Tempuh</label>
              <input
                type="text"
                name="jarak_tempuh"
                value={form.jarak_tempuh}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          {/* Divider halus */}
          <div className="my-7 border-t border-dashed" />

          {/* Data siswa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* Nama Siswa */}
            <div>
              <label className={labelClass}>Nama Siswa</label>
              <input
                type="text"
                name="nama_siswa"
                value={form.nama_siswa}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Jurusan */}
            <div>
              <label className={labelClass}>Jurusan</label>
              <input
                type="text"
                name="jurusan_nama"
                value={form.jurusan_nama}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-8 py-5 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border text-sm font-medium
                       !bg-white !text-gray-700 hover:!bg-gray-100 transition"
          >
            Batal
          </button>

          <button
            onClick={() => {
              console.log("DATA EDIT :", form);
              onClose();
            }}
            className="px-6 py-2 rounded-lg text-sm font-medium
                       !bg-[#EC933A] !text-white hover:brightness-110 transition"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
