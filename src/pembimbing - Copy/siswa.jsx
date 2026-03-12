import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Pagination from "./components/Pagination";
import dayjs from "dayjs";

// components
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Table from "./components/Table";

// services
import { getGuruSiswa } from "../utils/services/pembimbing/guru";
import { getSiswa } from "../utils/services/admin/get_siswa";
import { getKelasById } from "../utils/services/admin/get_kelas"; // Import getKelasById

export default function DataPeserta() {
  const exportRef = useRef(null);
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [openExport, setOpenExport] = useState(false);
  const [active, setActive] = useState("siswa");
  const [query, setQuery] = useState("");
  const [kelas, setKelas] = useState("");
  const [status, setStatus] = useState("");
  const [peserta, setPeserta] = useState([]);
  const [kelasOptions, setKelasOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const namaGuru = localStorage.getItem("nama_guru") || "Guru SMK";

  const user = {
    name: namaGuru,
    role: "Pembimbing",
  };

  const mapStatus = (status) => {
    switch (status) {
      case "Approved":
        return "Diterima";
      case "Pending":
        return "Diproses";
      case "Rejected":
        return "Ditolak";
      default:
        return status || "-";
    }
  };

  // FILTERING
  const filteredPeserta = peserta.filter((item) => {
    return (
      item.nama.toLowerCase().includes(query.toLowerCase()) &&
      (kelas ? item.kelas === kelas : true)
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [query, kelas]);

  const totalPages = Math.ceil(filteredPeserta.length / itemsPerPage);

  const paginatedData = filteredPeserta.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 🔥 Fungsi untuk mengambil NAMA KELAS berdasarkan ID
  const getNamaKelas = async (kelasId) => {
    if (!kelasId) return "-";
    try {
      const response = await getKelasById(kelasId);
      console.log(`Response kelas ID ${kelasId}:`, response);
      
      // Response dari getKelasById - berdasarkan struktur yang Anda berikan
      // Langsung mengembalikan object kelas, bukan { data: ... }
      // Format: { id, jurusan_id, nama, created_at, updated_at, wali_kelas_guru_id }
      if (response && response.nama) {
        return response.nama; // Langsung return nama kelas
      }
      
      // Fallback jika struktur berbeda
      return `Kelas ${kelasId}`;
    } catch (error) {
      console.error(`Gagal fetch kelas dengan ID ${kelasId}:`, error);
      return `Kelas ${kelasId}`; // Fallback
    }
  };

  // 🔥 AMBIL SISWA DARI getGuruSiswa DAN GABUNGKAN DENGAN DETAIL DARI getSiswa
  useEffect(() => {
    const fetchPeserta = async () => {
      setLoading(true);
      try {
        console.log("Fetching peserta data...");
        
        // Ambil data siswa bimbingan dari getGuruSiswa
        const guruSiswaResponse = await getGuruSiswa();
        console.log("Guru Siswa response:", guruSiswaResponse);
        
        // Ambil data detail siswa dari getSiswa admin
        const allSiswaResponse = await getSiswa();
        console.log("All Siswa response:", allSiswaResponse);
        
        const guruSiswaData = guruSiswaResponse.data || [];
        
        // Buat map untuk memudahkan pencarian detail siswa berdasarkan id
        const siswaDetailMap = new Map();
        allSiswaResponse.forEach((siswa) => {
          siswaDetailMap.set(siswa.id, siswa);
        });
        
        // Kumpulkan semua kelas_id yang unik untuk di-fetch sekaligus
        const uniqueKelasIds = [...new Set(
          guruSiswaData
            .map(item => {
              const detailSiswa = siswaDetailMap.get(item.siswa_id);
              return detailSiswa?.kelas_id;
            })
            .filter(id => id != null)
        )];
        
        console.log("Unique kelas IDs:", uniqueKelasIds);
        
        // Fetch semua nama kelas sekaligus untuk optimasi
        const kelasMap = new Map();
        await Promise.all(
          uniqueKelasIds.map(async (kelasId) => {
            const namaKelas = await getNamaKelas(kelasId);
            kelasMap.set(kelasId, namaKelas);
          })
        );
        
        console.log("Kelas map:", Object.fromEntries(kelasMap));
        
        // Proses mapping dengan nama kelas dari map
        const mappedPeserta = guruSiswaData.map((item) => {
          // Cari detail siswa dari map berdasarkan siswa_id
          const detailSiswa = siswaDetailMap.get(item.siswa_id);
          
          // Ambil nama kelas dari map jika ada kelas_id
          let namaKelas = "-";
          if (detailSiswa?.kelas_id && kelasMap.has(detailSiswa.kelas_id)) {
            namaKelas = kelasMap.get(detailSiswa.kelas_id);
          }
          
          return {
            application_id: item.application_id,
            siswa_id: item.siswa_id,
            username: item.siswa_username,
            nama: item.siswa_nama,
            nisn: detailSiswa?.nisn || "-",
            // Tampilkan NAMA KELAS yang sebenarnya
            kelas: namaKelas,
            kelas_id: detailSiswa?.kelas_id || null,
            alamat: detailSiswa?.alamat || "-",
            no_telp: detailSiswa?.no_telp || "-",
            tanggal_lahir: detailSiswa?.tanggal_lahir 
              ? dayjs(detailSiswa.tanggal_lahir).format("DD-MM-YYYY") 
              : "-",
            industri: item.industri_nama || "-",
            industri_id: item.industri_id,
            tanggal_mulai: item.tanggal_mulai
              ? dayjs(item.tanggal_mulai).format("DD-MM-YYYY")
              : "-",
            tanggal_selesai: item.tanggal_selesai
              ? dayjs(item.tanggal_selesai).format("DD-MM-YYYY")
              : "-",
            status: mapStatus(item.status),
          };
        });

        console.log("Mapped peserta with real class names:", mappedPeserta);
        setPeserta(mappedPeserta);

        // Extract unique kelas values untuk filter (sekarang berupa NAMA KELAS)
        const uniqueKelas = [
          ...new Set(mappedPeserta.map((item) => item.kelas).filter(k => k !== "-")),
        ];
        setKelasOptions(uniqueKelas);
        
      } catch (err) {
        console.error("Gagal fetch peserta:", err);
        
        // Fallback
        try {
          console.log("Fallback: fetching hanya dari getGuruSiswa...");
          const guruSiswaResponse = await getGuruSiswa();
          const guruSiswaData = guruSiswaResponse.data || [];
          
          const fallbackPeserta = guruSiswaData.map((item) => ({
            application_id: item.application_id,
            siswa_id: item.siswa_id,
            username: item.siswa_username,
            nama: item.siswa_nama,
            nisn: "-",
            kelas: "-",
            kelas_id: null,
            alamat: "-",
            no_telp: "-",
            tanggal_lahir: "-",
            industri: item.industri_nama || "-",
            industri_id: item.industri_id,
            tanggal_mulai: item.tanggal_mulai
              ? dayjs(item.tanggal_mulai).format("DD-MM-YYYY")
              : "-",
            tanggal_selesai: item.tanggal_selesai
              ? dayjs(item.tanggal_selesai).format("DD-MM-YYYY")
              : "-",
            status: mapStatus(item.status),
          }));
          
          setPeserta(fallbackPeserta);
          setKelasOptions([]);
          
        } catch (fallbackErr) {
          console.error("Fallback fetch juga gagal:", fallbackErr);
          setPeserta([]);
          setKelasOptions([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPeserta();
  }, []);

  // KOLOM TABEL
  const columns = [
    // { label: "Nama Pengguna", key: "username" },
    { label: "Nama", key: "nama" },
    { label: "NISN", key: "nisn" },
    // { label: "Kelas", key: "kelas" }, // Sekarang menampilkan NAMA KELAS
    { label: "Tanggal Lahir", key: "tanggal_lahir" },
    { label: "Alamat", key: "alamat" },
    { label: "No. Telepon", key: "no_telp" },
    { label: "Industri", key: "industri" },
    // { label: "Status", key: "status" },
  ];

  const filters = [
    {
      label: "Kelas",
      value: kelas,
      options: kelasOptions, // Opsi filter berupa NAMA KELAS
      onChange: setKelas,
    },
  ];

  const exportData = filteredPeserta.map((item, i) => ({
    No: i + 1,
    // Username: item.username,
    Nama: item.nama,
    NISN: item.nisn,
    // Kelas: item.kelas, // NAMA KELAS
    "Tanggal Lahir": item.tanggal_lahir,
    Alamat: item.alamat,
    "No. Telepon": item.no_telp,
    Industri: item.industri,
    Tanggal_Mulai: item.tanggal_mulai,
    Tanggal_Selesai: item.tanggal_selesai,
    Status: item.status,
  }));

  const handleExportExcel = () => {
    if (!exportData.length) return;
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Peserta PKL");
    XLSX.writeFile(wb, "data_peserta_pkl.xlsx");
  };

  const handleExportPDF = () => {
    if (!exportData.length) return;
    const doc = new jsPDF({
      orientation: 'landscape'
    });
    doc.text("Data Peserta PKL", 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map((d) => Object.values(d)),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [100, 30, 33] },
      columnStyles: {
        5: { cellWidth: 60 }, // Kolom Alamat
        6: { cellWidth: 30 }, // Kolom No. Telepon
      }
    });

    doc.save("data_peserta_pkl.pdf");
  };

  return (
    <div className="bg-white min-h-screen w-full">
      <Header user={user} />

      <div className="flex">
        <div className="hidden md:block">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 min-h-screen p-4 sm:p-6 md:p-10 bg-[#641E21] rounded-tl-3xl shadow-inner">
          <div className="flex items-center mb-6 gap-1">
            <h2 className="text-white font-bold text-lg">Data Siswa</h2>

            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setOpenExport(!openExport)}
                className="flex items-center gap-2 px-3 py-2 text-white !bg-transparent hover:bg-white/10 rounded-full"
              >
                <Download size={18} />
              </button>

              {openExport && (
                <div className="absolute left-10 mt-2 bg-white border rounded-lg shadow-md p-2 z-50">
                  <button
                    onClick={() => {
                      handleExportExcel();
                      setOpenExport(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-sm w-full"
                  >
                    <FileSpreadsheet size={16} className="text-green-600" />
                    Excel
                  </button>

                  <button
                    onClick={() => {
                      handleExportPDF();
                      setOpenExport(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-sm w-full"
                  >
                    <FileText size={16} className="text-red-600" />
                    PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#641E21] border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Memuat data siswa...</p>
            </div>
          ) : (
            <>
              <SearchBar
                query={query}
                setQuery={setQuery}
                // filters={filters}
                placeholder="Cari siswa..."
              />

              <div className="overflow-x-auto rounded-lg shadow">
                <Table columns={columns} data={paginatedData} />
              </div>

              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 text-white">
                  <span>
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}