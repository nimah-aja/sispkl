import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { X, Plus, ArrowLeft } from "lucide-react";

import { getAvailableIndustri } from "../utils/services/siswa/industri";
import { submitPengajuanPKL } from "../utils/services/siswa/pengajuan_pkl";
import { getSiswa } from "../utils/services/admin/get_siswa";

// Import asset untuk sidebar
import addSidebar from "../assets/addSidebar.svg"; // Sesuaikan path ini

export default function PengajuanPKL() {
  const navigate = useNavigate();
  const [listIndustri, setListIndustri] = useState([]);
  const [listSiswa, setListSiswa] = useState([]);
  const [selectedSiswa, setSelectedSiswa] = useState([]);
  const [catatan, setCatatan] = useState("");
  const [selectedIndustri, setSelectedIndustri] = useState("");
  const [kategoriPeserta, setKategoriPeserta] = useState("individu");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingIndustri, setIsLoadingIndustri] = useState(true);

  // ambil data industri dan siswa
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingIndustri(true);
        
        // Fetch industri
        const industriResponse = await getAvailableIndustri();
        console.log("Response industri:", industriResponse);
        
        // Cek struktur response yang sesuai
        // Jika response.data adalah array langsung
        let industriData = [];
        
        if (Array.isArray(industriResponse)) {
          // Jika response langsung berupa array
          industriData = industriResponse;
        } else if (industriResponse && Array.isArray(industriResponse.data)) {
          // Jika response memiliki properti data yang berupa array
          industriData = industriResponse.data;
        } else if (industriResponse && industriResponse.data && Array.isArray(industriResponse.data.data)) {
          // Jika response memiliki nested data.data
          industriData = industriResponse.data.data;
        }
        
        console.log("Industri data extracted:", industriData);
        
        // Format data untuk dropdown
        const formattedIndustri = industriData.map((item) => ({
          label: item.name || item.nama || "Industri", // Gunakan 'name' dari response API
          value: item.id.toString(), // Konversi ke string untuk konsistensi
          address: item.address,
          quota: item.quota,
          remaining_slots: item.remaining_slots,
          sector: item.sector
        }));
        
        console.log("Formatted industri:", formattedIndustri);
        setListIndustri(formattedIndustri);

        // Fetch siswa
        const siswaResponse = await getSiswa();
        let siswaData = [];
        
        if (Array.isArray(siswaResponse)) {
          siswaData = siswaResponse;
        } else if (siswaResponse && Array.isArray(siswaResponse.data)) {
          siswaData = siswaResponse.data;
        }
        
        const formattedSiswa = siswaData.map((item) => ({
          label: item.nama_lengkap || item.nama || "Siswa",
          value: item.id.toString(),
        }));
        setListSiswa(formattedSiswa);
        
      } catch (error) {
        console.error("Gagal mengambil data:", error);
        toast.error("Gagal memuat data industri atau siswa");
      } finally {
        setIsLoadingIndustri(false);
      }
    };

    fetchData();
  }, []);

  const handleTambahSiswa = () => {
    setSelectedSiswa([...selectedSiswa, ""]);
  };

  const handleHapusSiswa = (index) => {
    const newSelectedSiswa = [...selectedSiswa];
    newSelectedSiswa.splice(index, 1);
    setSelectedSiswa(newSelectedSiswa);
  };

  const handleSiswaChange = (index, value) => {
    const newSelectedSiswa = [...selectedSiswa];
    newSelectedSiswa[index] = value;
    setSelectedSiswa(newSelectedSiswa);
  };

  const handleSubmit = async () => {
    if (!selectedIndustri) {
      toast.error("Pilih nama industri terlebih dahulu");
      return;
    }

    // Cari industri yang dipilih untuk mendapatkan detailnya
    const selectedIndustriObj = listIndustri.find(
      (industri) => industri.value === selectedIndustri
    );
    
    console.log("Industri yang dipilih:", selectedIndustriObj);
    console.log("ID Industri yang akan dikirim:", selectedIndustri);

    if (kategoriPeserta === "kelompok" && selectedSiswa.filter(id => id !== "").length === 0) {
      toast.error("Tambahkan minimal satu siswa untuk kategori kelompok");
      return;
    }

    const payload = {
      kategori_peserta: kategoriPeserta,
      industri_id: parseInt(selectedIndustri), // Konversi ke number
      siswa_ids: kategoriPeserta === "individu" 
        ? [] 
        : selectedSiswa
            .filter(id => id !== "")
            .map(id => parseInt(id)),
      catatan: catatan
    };

    console.log("DATA DIKIRIM KE API:", payload);

    try {
      setIsLoading(true);
      await submitPengajuanPKL(payload);
      toast.success("Pengajuan PKL berhasil dikirim");
      navigate(-1);
    } catch (error) {
      console.error("Error pengajuan PKL:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Gagal mengirim pengajuan PKL";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="flex h-screen w-screen justify-center items-center p-4 bg-[#F4EFE6]">
      <div className="flex flex-col w-full md:w-[1300px] max-h-screen bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b flex-shrink-0">
          <div
            onClick={handleCancel}
            className="p-2 rounded-full bg-[#EC933A] hover:bg-orange-600 text-white cursor-pointer"
          >
            <ArrowLeft size={20} />
          </div>
          <h2 className="text-2xl font-bold">Pengajuan PKL</h2>
        </div>

        {/* Body dengan layout split */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar kiri untuk gambar (sama seperti add.jsx) */}
          <div className="hidden md:flex w-1/2 items-center justify-center border-r p-4">
            <img
              src={addSidebar}
              alt="Pengajuan PKL"
              className="max-w-xs w-full h-auto object-contain"
            />
          </div>

          {/* Konten kanan untuk form */}
          <div className="flex w-full md:w-1/2 p-8 overflow-auto">
            <div className="w-full space-y-8">
              {/* Kategori Peserta */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Kategori Peserta</h2>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex items-center">
                    <label htmlFor="individu" className="flex items-center cursor-pointer">
                      <div className="w-4 h-4 border-2 border-gray-400 rounded-sm mr-2 flex items-center justify-center">
                        <input
                          type="radio"
                          id="individu"
                          name="kategori"
                          checked={kategoriPeserta === "individu"}
                          onChange={() => setKategoriPeserta("individu")}
                          className="hidden"
                        />
                        {kategoriPeserta === "individu" && (
                          <div className="w-2 h-2 bg-[#641E20] rounded-sm"></div>
                        )}
                      </div>
                      <span className="font-medium">Individu</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <label htmlFor="kelompok" className="flex items-center cursor-pointer">
                      <div className="w-4 h-4 border-2 border-gray-400 rounded-sm mr-2 flex items-center justify-center">
                        <input
                          type="radio"
                          id="kelompok"
                          name="kategori"
                          checked={kategoriPeserta === "kelompok"}
                          onChange={() => setKategoriPeserta("kelompok")}
                          className="hidden"
                        />
                        {kategoriPeserta === "kelompok" && (
                          <div className="w-2 h-2 bg-[#641E20] rounded-sm"></div>
                        )}
                      </div>
                      <span className="font-medium">Kelompok</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Nama Industri */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Nama Industri</h2>
                <div className="relative">
                  <select
                    value={selectedIndustri}
                    onChange={(e) => setSelectedIndustri(e.target.value)}
                    disabled={isLoadingIndustri}
                    className="w-full p-4 border border-[#C9CFCF] rounded-lg bg-white appearance-none cursor-pointer focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {isLoadingIndustri ? "Memuat industri..." : "Pilih nama industri"}
                    </option>
                    {listIndustri.map((industri) => (
                      <option key={industri.value} value={industri.value}>
                        {industri.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Informasi tambahan tentang industri yang dipilih */}
                {selectedIndustri && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm font-medium text-gray-700">
                      Industri yang dipilih:{" "}
                      <span className="font-bold">
                        {listIndustri.find(i => i.value === selectedIndustri)?.label}
                      </span>
                    </p>
                    {listIndustri.find(i => i.value === selectedIndustri)?.address && (
                      <p className="text-sm text-gray-600 mt-1">
                        Alamat: {listIndustri.find(i => i.value === selectedIndustri)?.address}
                      </p>
                    )}
                    {listIndustri.find(i => i.value === selectedIndustri)?.sector && (
                      <p className="text-sm text-gray-600 mt-1">
                        Sektor: {listIndustri.find(i => i.value === selectedIndustri)?.sector}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Siswa (hanya tampil untuk kelompok) */}
              {kategoriPeserta === "kelompok" && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Siswa</h2>
                  <div className="space-y-3">
                    {selectedSiswa.map((siswaId, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <div className="relative flex-1">
                          <select
                            value={siswaId}
                            onChange={(e) => handleSiswaChange(index, e.target.value)}
                            className="w-full p-4 border border-[#C9CFCF] rounded-lg bg-white appearance-none cursor-pointer focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                          >
                            <option value="">Pilih nama siswa</option>
                            {listSiswa.map((siswa) => (
                              <option key={siswa.value} value={siswa.value}>
                                {siswa.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleHapusSiswa(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus siswa"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleTambahSiswa}
                      className="flex items-center gap-2 text-[#641E20] hover:text-[#8B2D2D] font-medium"
                    >
                      <Plus size={20} />
                      <span>Tambah siswa</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Catatan */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Catatan</h2>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Masukkan catatan (opsional)"
                  className="w-full p-4 border border-[#C9CFCF] rounded-lg bg-white min-h-[120px] resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex justify-end gap-4 flex-shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 !bg-[#3A3D3D] text-white rounded-lg hover:bg-[#5d6464ff] transition-colors font-medium"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !selectedIndustri}
            className="px-6 py-3 !bg-[#EC933A] text-white rounded-lg hover:bg-[#f4d0adff] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Mengirim..." : "Kirim Pengajuan"}
          </button>
        </div>
      </div>
    </div>
  );
}