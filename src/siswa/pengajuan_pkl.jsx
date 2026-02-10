import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { X, Plus, ArrowLeft } from "lucide-react";

import { getAvailableIndustri } from "../utils/services/siswa/industri";
import { submitPengajuanPKL } from "../utils/services/siswa/pengajuan_pkl";
import { getSiswa } from "../utils/services/admin/get_siswa";
import { getKelas } from "../utils/services/admin/get_kelas";

import addSidebar from "../assets/addSidebar.svg";


export default function PengajuanPKL() {
  const navigate = useNavigate();

  const [listIndustri, setListIndustri] = useState([]);
  const [listKelas, setListKelas] = useState([]);

  const [allSiswa, setAllSiswa] = useState([]);
  const [listSiswa, setListSiswa] = useState([]);

  const [selectedSiswa, setSelectedSiswa] = useState([]);
  const [selectedIndustri, setSelectedIndustri] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");

  const [kategoriPeserta, setKategoriPeserta] = useState("individu");
  const [catatan, setCatatan] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingIndustri, setIsLoadingIndustri] = useState(true);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingIndustri(true);

        /* INDUSTRI */
        const industriRes = await getAvailableIndustri();
        const industriData = Array.isArray(industriRes?.data)
          ? industriRes.data
          : Array.isArray(industriRes)
          ? industriRes
          : [];

        setListIndustri(
          industriData.map((i) => ({
            label: i.name || i.nama,
            value: i.id.toString(),
          }))
        );

        /* KELAS */
        const kelasRes = await getKelas();
        const kelasData = Array.isArray(kelasRes?.data)
          ? kelasRes.data
          : Array.isArray(kelasRes)
          ? kelasRes
          : [];

        setListKelas(
          kelasData.map((k) => ({
            label: k.nama_kelas || k.nama,
            value: k.id.toString(),
          }))
        );

        /* SISWA */
        const siswaRes = await getSiswa();
        const siswaData = Array.isArray(siswaRes?.data)
          ? siswaRes.data
          : Array.isArray(siswaRes)
          ? siswaRes
          : [];

        const formatted = siswaData.map((s) => ({
          label: s.nama_lengkap || s.nama,
          value: s.id.toString(),
          kelas_id: s.kelas_id?.toString(),
        }));

        setAllSiswa(formatted);
        setListSiswa(formatted);
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat data");
      } finally {
        setIsLoadingIndustri(false);
      }
    };

    fetchData();
  }, []);

  /* ===== FILTER SISWA BERDASARKAN KELAS ===== */
  useEffect(() => {
    if (!selectedKelas) {
      setListSiswa([]);
      setSelectedSiswa([]);
      return;
    }

    const filtered = allSiswa.filter(
      (s) => s.kelas_id === selectedKelas
    );

    setListSiswa(filtered);
    setSelectedSiswa([]);
  }, [selectedKelas, allSiswa]);

  /* ================= HANDLER ================= */
  const handleTambahSiswa = () =>
    setSelectedSiswa([...selectedSiswa, ""]);

  const handleHapusSiswa = (idx) => {
    const copy = [...selectedSiswa];
    copy.splice(idx, 1);
    setSelectedSiswa(copy);
  };

  const handleSiswaChange = (idx, value) => {
    const copy = [...selectedSiswa];
    copy[idx] = value;
    setSelectedSiswa(copy);
  };

  const handleSubmit = async () => {
    if (!selectedIndustri) {
      toast.error("Pilih industri dulu");
      return;
    }

    if (kategoriPeserta === "kelompok" && !selectedKelas) {
      toast.error("Pilih kelas terlebih dahulu");
      return;
    }

    const payload = {
      kategori_peserta: kategoriPeserta,
      industri_id: parseInt(selectedIndustri),
      kelas_id:
        kategoriPeserta === "kelompok"
          ? parseInt(selectedKelas)
          : null,
      siswa_ids:
        kategoriPeserta === "kelompok"
          ? selectedSiswa.filter(Boolean).map(Number)
          : [],
      catatan,
    };

    try {
      setIsLoading(true);
      await submitPengajuanPKL(payload);
      toast.success("Pengajuan PKL berhasil");
      navigate(-1);
    } catch (err) {
      toast.error("Gagal mengirim pengajuan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen justify-center items-center bg-[#F4EFE6]">
      <div className="flex flex-col w-full md:w-[1300px] bg-white rounded-2xl shadow overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center gap-3 px-6 py-4 border-b">
          <div
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-[#EC933A] text-white cursor-pointer"
          >
            <ArrowLeft size={20} />
          </div>
          <h2 className="text-2xl font-bold">Pengajuan PKL</h2>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* SIDEBAR */}
          <div className="hidden md:flex w-1/2 justify-center items-center border-r">
            <img src={addSidebar} className="max-w-xs" />
          </div>

          {/* FORM */}
          <div className="w-full md:w-1/2 p-8 overflow-auto space-y-8">

            {/* KATEGORI */}
            <div>
              <h2 className="font-semibold mb-3">Kategori Peserta</h2>
              <div className="flex gap-6">
                {["individu", "kelompok"].map((k) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={kategoriPeserta === k}
                      onChange={() => setKategoriPeserta(k)}
                    />
                    {k}
                  </label>
                ))}
              </div>
            </div>

            {/* INDUSTRI + KELAS */}
            {/* INDUSTRI + KELAS */}
            <div>
              <h2 className="font-semibold mb-3">Industri& Kelas</h2>

              <div
                className={`grid gap-4 ${
                  kategoriPeserta === "kelompok"
                    ? "grid-cols-1 md:grid-cols-2"
                    : "grid-cols-1"
                }`}
              >
                {/* INDUSTRI */}
                <select
                  value={selectedIndustri}
                  onChange={(e) => setSelectedIndustri(e.target.value)}
                  className="w-full p-4 border border-[#C9CFCF] rounded-lg bg-white
                    focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Pilih industri</option>
                  {listIndustri.map((i) => (
                    <option key={i.value} value={i.value}>
                      {i.label}
                    </option>
                  ))}
                </select>

                {/* KELAS — HANYA KELOMPOK */}
                {kategoriPeserta === "kelompok" && (
                  <select
                    value={selectedKelas}
                    onChange={(e) => setSelectedKelas(e.target.value)}
                    className="w-full p-4 border border-[#C9CFCF] rounded-lg bg-white
                      focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">Pilih kelas</option>
                    {listKelas.map((k) => (
                      <option key={k.value} value={k.value}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>


            {/* SISWA */}
            {kategoriPeserta === "kelompok" && (
              <div>
                <h2 className="font-semibold mb-3">Siswa</h2>

                {selectedSiswa.map((val, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select
                      value={val}
                      onChange={(e) =>
                        handleSiswaChange(idx, e.target.value)
                      }
                      className="flex-1 p-4 border rounded-lg"
                    >
                      <option value="">Pilih siswa</option>
                      {listSiswa.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button className="!text-red-600 !bg-transparent" onClick={() => handleHapusSiswa(idx)}>
                      <X />
                    </button>
                  </div>
                ))}

                <button
                  onClick={handleTambahSiswa}
                  className="flex items-center gap-2 !bg-transparent !text-[#641E20]"
                >
                  <Plus /> Tambah siswa
                </button>
              </div>
            )}

            {/* CATATAN */}
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full p-4 border rounded-lg"
              placeholder="Catatan (opsional)"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t p-6 flex justify-end gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 !bg-gray-600 text-white rounded-lg"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-3 !bg-[#EC933A] text-white rounded-lg"
          >
            {isLoading ? "Mengirim..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
