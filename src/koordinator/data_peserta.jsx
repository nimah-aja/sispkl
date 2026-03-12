import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// components
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Table from "./components/Table";
import Pagination from "./components/Pagination";
import Add from "./components/Add";
import SaveConfirmationModal from "./components/Save";
import DeleteConfirmation from "./components/Delete";

// utils API
import { getApprovedPKL } from "../utils/services/koordinator/pengajuan";

// assets
import addImg from "../assets/addSidebar.svg";
import saveImg from "../assets/save.svg";
import deleteImg from "../assets/deleteGrafik.svg";

export default function DataPeserta() {
  const navigate = useNavigate();
  const exportRef = useRef(null);

  const [active, setActive] = useState("sidebarUsers");
  const [query, setQuery] = useState("");
  const [kelas, setKelas] = useState("");
  const [industri, setIndustri] = useState("");
  const [status, setStatus] = useState("");
  const [jurusanFilter, setJurusanFilter] = useState("");

  const [peserta, setPeserta] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [openExport, setOpenExport] = useState(false);

  const [mode, setMode] = useState("list");
  const [editData, setEditData] = useState(null);
  const [pendingData, setPendingData] = useState(null);

  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Koordinator",
  };

  // ===============================
  // FETCH DATA PESERTA PKL (API)
  // ===============================
  useEffect(() => {
    const fetchPeserta = async () => {
      try {
        const appRes = await getApprovedPKL();

        // =============================
        // AMBIL ARRAY DATA
        // =============================
        const list = appRes?.data || [];

        // =============================
        // DEDUPLIKASI BERDASARKAN NISN
        // =============================
        const pesertaMap = new Map();

        list.forEach((item) => {
          const nisn = item.siswa_nisn;

          if (!nisn) return;

          pesertaMap.set(nisn, {
            nisn: item.siswa_nisn || "-",
            nama: item.siswa_username || "-",
            industri: item.industri_nama || "-",
            kelas: item.kelas_nama || "-",
            jurusan: item.jurusan_nama || "-", // Ini akan berisi "Rekayasa Perangkat Lunak", "Teknik Komputer dan Jaringan", dll
            status: item.status || "Menunggu",
          });
        });

        // Ambil array dari Map
        let pesertaArray = Array.from(pesertaMap.values());
        
        // =============================
        // URUTKAN BERDASARKAN JURUSAN (NAMA LENGKAP)
        // =============================
        // Urutan prioritas jurusan berdasarkan nama lengkap
        const jurusanOrder = {
          "Rekayasa Perangkat Lunak": 1,
          "Teknik Komputer dan Jaringan": 2,
          "Desain Komunikasi Visual": 3,
          "Akuntansi dan Keuangan Lembaga": 4,
          "Otomatisasi dan Tata Kelola Perkantoran": 5,
          "Bisnis Daring dan Pemasaran": 6,
          "Usaha Perjalanan Wisata": 7,
          "Perhotelan": 8,
          "Tata Boga": 9,
          // Tambahkan jurusan lain sesuai kebutuhan
        };

        // Urutkan berdasarkan jurusan (prioritas) lalu berdasarkan nama
        pesertaArray.sort((a, b) => {
          const orderA = jurusanOrder[a.jurusan] || 999; // Jurusan yang tidak dikenal diurutkan di akhir
          const orderB = jurusanOrder[b.jurusan] || 999;
          
          if (orderA !== orderB) {
            return orderA - orderB; // Urut berdasarkan prioritas jurusan
          }
          
          // Jika jurusan sama, urut berdasarkan nama
          return a.nama.localeCompare(b.nama);
        });

        setPeserta(pesertaArray);
      } catch (err) {
        console.error("Gagal load peserta PKL:", err);
      }
    };

    fetchPeserta();
  }, []);

  // ===============================
  // FILTER OPTIONS (DINAMIS)
  // ===============================
  // Ambil daftar jurusan unik untuk filter (dalam bentuk nama lengkap)
  const uniqueJurusan = [...new Set(peserta.map((p) => p.jurusan))].sort();

  const filters = [
    {
      label: "Kelas",
      value: kelas,
      options: [...new Set(peserta.map((p) => p.kelas))],
      onChange: setKelas,
    },
    {
      label: "Konsentrasi Keahlian",
      value: jurusanFilter,
      options: uniqueJurusan,
      onChange: setJurusanFilter,
    },
    {
      label: "Industri",
      value: industri,
      options: [...new Set(peserta.map((p) => p.industri))],
      onChange: setIndustri,
    },
  ];

  // ===============================
  // FILTER DATA
  // ===============================
  const filteredPeserta = peserta.filter((item) => {
    // Filter berdasarkan query (nama)
    const matchesQuery = item.nama.toLowerCase().includes(query.toLowerCase());
    
    // Filter berdasarkan kelas
    const matchesKelas = kelas ? item.kelas === kelas : true;
    
    // Filter berdasarkan jurusan (nama lengkap)
    const matchesJurusan = jurusanFilter ? item.jurusan === jurusanFilter : true;
    
    // Filter berdasarkan industri
    const matchesIndustri = industri ? item.industri === industri : true;
    
    // Filter berdasarkan status
    const matchesStatus = status ? item.status === status : true;
    
    return matchesQuery && matchesKelas && matchesJurusan && matchesIndustri && matchesStatus;
  });

  useEffect(() => setCurrentPage(1), [query, kelas, jurusanFilter, industri, status]);

  const totalPages = Math.ceil(filteredPeserta.length / itemsPerPage);
  const paginatedData = filteredPeserta.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ===============================
  // TABLE COLUMNS
  // ===============================
  const columns = [
    { label: "No", key: "no" },
    { label: "NISN", key: "nisn" },
    { label: "Nama", key: "nama" },
    { label: "Konsentrasi Keahlian", key: "jurusan" }, // Nama lengkap kompetensi keahlian
    { label: "Kelas", key: "kelas" },
    { label: "Industri", key: "industri" },
  ];

  // ===============================
  // EXPORT DATA
  // ===============================
  const exportData = filteredPeserta.map((item, i) => ({
    No: i + 1,
    NISN: item.nisn,
    Nama: item.nama,
    "Kompetensi Keahlian": item.jurusan,
    Kelas: item.kelas,
    Industri: item.industri,
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
    const doc = new jsPDF();
    doc.text("Data Peserta PKL", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map((d) => Object.values(d)),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [100, 30, 33] },
    });
    doc.save("data_peserta_pkl.pdf");
  };

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar active={active} setActive={setActive} />

      <div className="flex flex-col flex-1">
        <Header query={query} setQuery={setQuery} user={user} />

        <main className="flex-1 p-6 bg-[#641E21] rounded-tl-3xl">
          <div className="flex items-center mb-4 gap-2">
            <h2 className="text-white font-bold text-lg">
              Data Siswa PKL
            </h2>

            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setOpenExport(!openExport)}
                className="flex items-center gap-2 px-3 py-2 text-white !bg-transparent hover:bg-white/10 rounded-full"
              >
                <Download size={18} />
              </button>

              {openExport && (
                <div className="absolute left-10 mt-2 bg-white rounded-lg shadow-md p-2 z-50">
                  <button
                    onClick={() => {
                      handleExportExcel();
                      setOpenExport(false);
                    }}
                    className="!bg-transparent flex items-center gap-2 px-3 py-2 hover:!bg-gray-100 w-full"
                  >
                    <FileSpreadsheet size={16} className="text-green-600" />
                    Excel
                  </button>

                  <button
                    onClick={() => {
                      handleExportPDF();
                      setOpenExport(false);
                    }}
                    className="!bg-transparent flex items-center gap-2 px-3 py-2 hover:!bg-gray-100 w-full"
                  >
                    <FileText size={16} className="text-red-600" />
                    PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          <SearchBar
            query={query}
            setQuery={setQuery}
            filters={filters}
            placeholder="Cari siswa..."
          />

          <Table
            columns={columns}
            data={paginatedData.map((item, index) => ({
              ...item,
              no: (currentPage - 1) * itemsPerPage + index + 1
            }))}
          />

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

          <DeleteConfirmation
            isOpen={isDeleteOpen}
            title="Hapus Peserta"
            message="Yakin ingin menghapus peserta ini?"
            imageSrc={deleteImg}
            onClose={() => setIsDeleteOpen(false)}
            onDelete={() => {
              setPeserta((prev) =>
                prev.filter((p) => p.nisn !== selectedRow.nisn)
              );
              setIsDeleteOpen(false);
              setSelectedRow(null);
            }}
          />
        </main>
      </div>
    </div>
  );
}