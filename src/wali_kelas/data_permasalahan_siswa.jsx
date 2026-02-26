import React, { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from 'dayjs';
import { useNavigate, useLocation } from 'react-router-dom';

import { getStudentIssuesWaliKelas } from "../utils/services/wakel/permasalahan";

import Detail from "./components/Detail";
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Pagination from "./components/Pagination";

export default function DataPermasalahanSiswa() {
  const navigate = useNavigate();
  const location = useLocation();
  const exportRef = useRef(null);

  const [openExport, setOpenExport] = useState(false);
  const [active, setActive] = useState("permasalahan");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [dataPermasalahan, setDataPermasalahan] = useState([]);
  const [mode, setMode] = useState("list"); // list | detail
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailMode, setDetailMode] = useState("view");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Wali Kelas",
  };

  // Opsi kategori
  const kategoriOptions = [
    { label: "Kedisiplinan", value: "kedisiplinan" },
    { label: "Absensi", value: "absensi" },
    { label: "Performa", value: "performa" },
    { label: "Lainnya", value: "lainnya" },
  ];

  // Fungsi untuk mendapatkan mode dari URL
  const getModeFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('mode') || 'list';
  };

  // Fungsi untuk mendapatkan selected ID dari URL
  const getSelectedIdFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('id');
  };

  // Effect untuk sinkronisasi mode dari URL
  useEffect(() => {
    const urlMode = getModeFromUrl();
    setMode(urlMode);
  }, [location.search]);

  // Effect untuk mencari selectedItem berdasarkan ID dari URL
  useEffect(() => {
    const selectedId = getSelectedIdFromUrl();
    if (selectedId && dataPermasalahan.length > 0) {
      const item = dataPermasalahan.find(i => i.id === parseInt(selectedId));
      if (item) {
        setSelectedItem(item);
      } else {
        // Jika item tidak ditemukan, redirect ke list
        handleModeChange('list');
      }
    }
  }, [dataPermasalahan, location.search]);

  // Fungsi untuk mengubah mode dan update URL
  const handleModeChange = (newMode, item = null) => {
    const params = new URLSearchParams(location.search);
    params.set('mode', newMode);
    
    if (item) {
      params.set('id', item.id);
      setSelectedItem(item);
    } else {
      params.delete('id');
      setSelectedItem(null);
    }
    
    // Reset detail mode
    if (newMode !== 'detail') {
      setDetailMode('view');
    }
    
    navigate(`${location.pathname}?${params.toString()}`);
  };

  // Fungsi untuk format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  // Fungsi untuk format tanggal dengan jam
  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return dayjs(dateString).format('DD/MM/YYYY HH:mm');
  };

  // Fungsi untuk mendapatkan label tanggal (Hari Ini, Kemarin, atau format DD MMM YYYY)
  const getDateLabel = (date) => {
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    if (dateStr === today) return "Hari Ini";
    if (dateStr === yesterday) return "Kemarin";
    return dayjs(date).format('DD MMM YYYY');
  };

  // Fungsi untuk mendapatkan inisial dari nama
  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.split(" ");
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  // Fungsi untuk mendapatkan warna berdasarkan nama
  const getColorFromName = (name) => {
    if (!name) return "bg-gray-500";
    
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", 
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
      "bg-orange-500", "bg-cyan-500", "bg-emerald-500", "bg-violet-500"
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash |= 0;
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Fungsi untuk mendapatkan warna badge status
  const getStatusBadge = (status) => {
    switch (status) {
      case "resolved":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          border: "border-green-300",
          label: "Selesai"
        };
      case "in_progress":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          border: "border-yellow-300",
          label: "Dalam Proses"
        };
      case "opened":
        return {
          bg: "bg-blue-100",
          text: "text-blue-700",
          border: "border-blue-300",
          label: "Proses"
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-300",
          label: status
        };
    }
  };

  // Fungsi untuk mendapatkan label kategori
  const getKategoriLabel = (kategoriValue) => {
    const kategori = kategoriOptions.find(k => k.value === kategoriValue);
    return kategori ? kategori.label : kategoriValue;
  };

  /* =====================
     FETCH DATA PERMASALAHAN DARI API
  ===================== */
  const fetchPermasalahan = async () => {
    setLoading(true);
    try {
      const response = await getStudentIssuesWaliKelas();
      console.log("Permasalahan response:", response);
      
      const issues = response?.items || [];
      
      const mappedIssues = issues.map((item) => ({
        id: item.id,
        judul: item.judul,
        deskripsi: item.deskripsi,
        kategori: item.kategori,
        kategori_label: getKategoriLabel(item.kategori),
        siswa_id: item.siswa?.id,
        siswa_nama: item.siswa?.nama || "-",
        siswa_nisn: item.siswa?.nisn || "-",
        pembimbing_id: item.pembimbing?.id,
        pembimbing_nama: item.pembimbing?.nama || "-",
        status: item.status || "opened",
        status_badge: getStatusBadge(item.status),
        tindak_lanjut: item.tindak_lanjut || "-",
        created_at: item.created_at,
        resolved_at: item.resolved_at,
        // Format untuk tampilan
        nama: item.siswa?.nama || "-",
        masalah: item.deskripsi,
        tanggal: formatDate(item.created_at),
        tanggal_lengkap: formatDateTime(item.created_at),
        tanggal_disetujui: item.resolved_at ? formatDateTime(item.resolved_at) : "-",
        // Untuk grouping by date
        dateKey: dayjs(item.created_at).format('YYYY-MM-DD'),
        timeLabel: dayjs(item.created_at).format('HH:mm'),
      }));
      
      setDataPermasalahan(mappedIssues);
    } catch (error) {
      console.error("Gagal fetch permasalahan:", error);
      toast.error("Gagal memuat data permasalahan");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data saat komponen dimuat
  useEffect(() => {
    fetchPermasalahan();
  }, []);

  /* =====================
     FILTER & PAGINATION
  ===================== */
  const filteredData = dataPermasalahan.filter((i) => {
    const q = search.toLowerCase();
    return (
      (i.siswa_nama?.toLowerCase() || "").includes(q) ||
      (i.judul?.toLowerCase() || "").includes(q) ||
      (i.kategori_label?.toLowerCase() || "").includes(q) ||
      (i.deskripsi?.toLowerCase() || "").includes(q)
    );
  });

  // Urutkan berdasarkan created_at descending
  const sortedData = [...filteredData].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* =====================
     FUNGSI UNTUK RENDER GROUP BERDASARKAN STATUS
  ===================== */
  const renderGroupByStatus = (title, statuses) => {
    // Filter data berdasarkan status
    const submissions = paginatedData.filter(item => statuses.includes(item.status));
    
    if (submissions.length === 0) return null;

    // Group by date
    const groupedByDate = {};
    submissions.forEach(item => {
      const dateKey = dayjs(item.created_at).format('YYYY-MM-DD');
      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
      groupedByDate[dateKey].push(item);
    });

    // Sort dates descending
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
      dayjs(b).unix() - dayjs(a).unix()
    );

    return (
      <div className="mb-8">
        <div className="mb-3">
          <h3 className="text-white font-bold text-lg border-b border-white/20 pb-2">
            {title}
          </h3>
        </div>
        
        {sortedDates.map(dateKey => {
          const dateItems = groupedByDate[dateKey];
          const dateLabel = getDateLabel(dateKey);

          return (
            <div key={dateKey} className="mb-4">
              {/* DATE LABEL */}
              <div className="text-white font-semibold mb-2">
                {dateLabel}
              </div>
              
              {/* ITEMS FOR THIS DATE */}
              {dateItems.map(item => (
                <div 
                  key={item.id}
                  className="bg-white rounded-xl p-4 hover:shadow-md transition-all cursor-pointer mb-2"
                  onClick={() => handleModeChange("detail", item)}
                >
                  <div className="flex items-start gap-4">
                    {/* Lingkungan dengan inisial */}
                    <div className={`w-12 h-12 rounded-full ${getColorFromName(item.siswa_nama)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                      {getInitials(item.siswa_nama)}
                    </div>

                    {/* Bagian Tengah - Informasi */}
                    <div className="flex-1">
                      {/* Baris atas: Nama Siswa */}
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm">{item.siswa_nama}</h3>
                      </div>
                      
                      {/* Baris tengah: Kategori + Judul */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                          {item.kategori_label}
                        </span>
                        <p className="text-sm font-medium text-gray-700">
                          {item.judul}
                        </p>
                      </div>

                      {/* Baris bawah: Pembimbing (jika ada) */}
                      {item.pembimbing_nama && item.pembimbing_nama !== "-" && (
                        <div className="text-xs text-gray-500 mt-1">
                          Pembimbing: {item.pembimbing_nama}
                        </div>
                      )}
                    </div>

                    {/* Bagian Kanan - Badge Status */}
                    <div className="self-start">
                      <span className={`px-4 py-2 text-sm rounded-full ${item.status_badge.bg} ${item.status_badge.text} border ${item.status_badge.border}`}>
                        {item.status_badge.label}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  /* =====================
     EXPORT FUNCTIONS
  ===================== */
  const exportData = sortedData.map((item, index) => ({
    No: index + 1,
    "Nama Siswa": item.siswa_nama || "-",
    "NISN": item.siswa_nisn || "-",
    "Permasalahan": item.judul || "-",
    "Kategori": item.kategori_label || "-",
    "Deskripsi": item.deskripsi || "-",
    "Status": item.status_badge.label || "-",
    "Tanggal Lapor": item.tanggal_lengkap || "-",
    "Tanggal Selesai": item.tanggal_disetujui || "-",
    "Pembimbing": item.pembimbing_nama || "-",
    "Tindak Lanjut": item.tindak_lanjut || "-",
  }));

  const handleExportExcel = () => {
    if (!exportData.length) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Permasalahan Siswa");
    XLSX.writeFile(wb, "data_permasalahan_siswa.xlsx");
    toast.success("Excel berhasil diekspor");
  };

  const handleExportPDF = () => {
    if (!exportData.length) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    
    const doc = new jsPDF({
      orientation: 'landscape'
    });
    
    doc.text("Data Permasalahan Siswa", 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map((item) => Object.values(item)),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [100, 30, 33] },
    });

    doc.save("data_permasalahan_siswa.pdf");
    toast.success("PDF berhasil diekspor");
  };

  /* =====================
     DETAIL MODE
  ===================== */
  if (mode === "detail" && selectedItem) {
    return (
      <Detail
        title="Detail Permasalahan Siswa"
        mode={detailMode}
        initialData={{
          "Nama Siswa": selectedItem.siswa_nama || "-",
          "NISN": selectedItem.siswa_nisn || "-",
          "Judul": selectedItem.judul || "-",
          "Kategori": selectedItem.kategori_label || "-",
          "Deskripsi": selectedItem.deskripsi || "-",
          "Status": selectedItem.status_badge.label || "-",
          "Tanggal Lapor": selectedItem.tanggal_lengkap || "-",
          "Tanggal Selesai": selectedItem.tanggal_disetujui || "-",
          "Pembimbing": selectedItem.pembimbing_nama || "-",
          "Tindak Lanjut": selectedItem.tindak_lanjut || "-",
        }}
        onClose={() => handleModeChange("list")}
        onChangeMode={setDetailMode}
        fields={[
          { name: "Nama Siswa", label: "Nama Siswa" },
          { name: "NISN", label: "NISN" },
          { name: "Judul", label: "Judul Permasalahan" },
          { name: "Kategori", label: "Kategori" },
          { name: "Deskripsi", label: "Deskripsi" },
          { name: "Status", label: "Status" },
          { name: "Tanggal Lapor", label: "Tanggal Lapor" },
          { name: "Tanggal Selesai", label: "Tanggal Selesai" },
          { name: "Pembimbing", label: "Pembimbing" },
          { name: "Tindak Lanjut", label: "Tindak Lanjut" },
        ]}
      />
    );
  }

  /* =====================
     LIST VIEW
  ===================== */
  return (
    <div className="bg-white min-h-screen">
      <Header user={user} />

      <div className="flex">
        <Sidebar active={active} setActive={setActive} />

        <main className="flex-1 p-6 bg-[#641E21] rounded-l-3xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">
              Data Permasalahan Siswa
            </h2>
            
            <div className="relative -left-[1120px]" ref={exportRef}>
              <button
                onClick={() => setOpenExport(!openExport)}
                className="!bg-transparent flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 rounded-full"
              >
                <Download size={18} />
              </button>

              {openExport && (
                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-md p-2 z-50">
                  <button
                    onClick={() => {
                      handleExportExcel();
                      setOpenExport(false);
                    }}
                    className="!bg-transparent flex items-center gap-2 px-3 py-2 hover:!bg-gray-100 text-sm w-full"
                  >
                    <FileSpreadsheet size={16} className="text-green-600" />
                    Excel
                  </button>
                  <button
                    onClick={() => {
                      handleExportPDF();
                      setOpenExport(false);
                    }}
                    className="!bg-transparent flex items-center gap-2 px-3 py-2 hover:!bg-gray-100 text-sm w-full"
                  >
                    <FileText size={16} className="text-red-600" />
                    PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          <SearchBar
            query={search}
            setQuery={setSearch}
            placeholder="Cari nama siswa / judul / kategori"
          />

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
              <p className="text-white mt-2">Memuat data...</p>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center mt-6">
              <p className="text-gray-500">Tidak ada data permasalahan</p>
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-3">
                {/* SECTION 1: PERMASALAHAN BELUM DIPROSES (opened) */}
                {renderGroupByStatus('Permasalahan Belum Diproses', ['opened'])}

                {/* SECTION 2: PERMASALAHAN SEDANG DIPROSES (in_progress) */}
                {renderGroupByStatus('Permasalahan Sedang Diproses', ['in_progress'])}

                {/* SECTION 3: PERMASALAHAN TERSELESAIKAN (resolved) */}
                {renderGroupByStatus('Permasalahan Terselesaikan', ['resolved'])}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 text-white flex justify-between items-center">
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