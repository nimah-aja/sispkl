import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

import {
  CheckCircle,
  XCircle,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
} from "lucide-react";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Detail from "./components/Detail";
import Pagination from "./components/Pagination";
import toast from "react-hot-toast";

import { getIzinPembimbing, decideIzin } from "../utils/services/pembimbing/izin";
import { getSiswa } from "../utils/services/admin/get_siswa";
import { getKelas } from "../utils/services/admin/get_kelas";

export default function DataPerizinanSiswa() {
  const [active, setActive] = useState("perizinan");
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  
  // Filter Tanggal
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  const [openDetail, setOpenDetail] = useState(false);
  const [detailMode, setDetailMode] = useState("view");
  const [detailData, setDetailData] = useState(null);
  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef(null);
  const dateFilterRef = useRef(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru",
    role: "Pembimbing",
  };

  // Click outside untuk menutup date filter
  useEffect(() => {
    function handleClickOutside(event) {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target)) {
        setShowDateFilter(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    const izin = await getIzinPembimbing();
    const siswa = await getSiswa();
    const kelas = await getKelas();

    const siswaMap = {};
    siswa.forEach((s) => (siswaMap[s.id] = s));

    const kelasMap = {};
    kelas.forEach((k) => (kelasMap[k.id] = k.nama));

    const mapped = izin.map((i) => {
      const s = siswaMap[i.siswa_id];
      const waktu = i.created_at || i.tanggal;
      const status = (i.status || "pending").toLowerCase();

      // Normalisasi alasan: jadikan lowercase dan hilangkan spasi berlebih
      const alasanNormalized = i.jenis ? i.jenis.toLowerCase().trim() : "izin";
      
      // Jika alasan adalah "izin" atau "Izin" atau variasi lainnya, jadikan "izin"
      const alasanFinal = alasanNormalized === "izin" ? "izin" : alasanNormalized;

      return {
        id: i.id,
        nama: s?.nama_lengkap || "-",
        kelas: kelasMap[s?.kelas_id] || "-",
        waktu,
        tanggal: dayjs(waktu).format("DD MMMM YYYY"),
        tanggalRaw: dayjs(waktu).format("YYYY-MM-DD"), // Untuk filter
        jam: dayjs(waktu).format("HH:mm"),
        alasan: alasanFinal, // Gunakan alasan yang sudah dinormalisasi
        keterangan: i.keterangan || "-",
        status,
        statusLabel:
          status === "approved"
            ? "Disetujui"
            : status === "rejected"
            ? "Ditolak"
            : "Menunggu",
        rejection_reason: i.rejection_reason || "",
        bukti: i.bukti_foto_urls || [],
        pembimbing: i.pembimbing_nama || "-",
        hasActions: status === "pending",
        type: status === "pending" ? "pending" : status === "approved" ? "approved" : "rejected",
      };
    }).filter(item => {
      // Filter out items with empty or "-" nama and kelas
      const isValidNama = item.nama && item.nama !== "-" && item.nama.trim() !== "";
      const isValidKelas = item.kelas && item.kelas !== "-" && item.kelas.trim() !== "";
      return isValidNama && isValidKelas;
    });

    mapped.sort((a, b) => new Date(b.waktu) - new Date(a.waktu));
    setData(mapped);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDecision = async (mode, payload = {}) => {
    try {
      await decideIzin(
        detailData.id,
        mode === "approve" ? "approved" : "rejected",
        mode === "reject" ? payload.rejection_reason || "" : ""
      );

      const message = mode === "approve" ? "Izin berhasil disetujui" : "Izin berhasil ditolak";
      toast.success(message);
      setOpenDetail(false);
      setDetailMode("view");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Gagal memproses izin");
    }
  };

  const getStatusIcon = (s) =>
    s === "approved" ? (
      <CheckCircle className="w-6 h-6 text-green-600" />
    ) : s === "rejected" ? (
      <XCircle className="w-6 h-6 text-red-600" />
    ) : (
      <Clock className="w-6 h-6 text-orange-500" />
    );

  const statusOptions = ["pending", "approved", "rejected"];
  
  // Ambil nilai unik dari alasan yang sudah dinormalisasi
  const jenisOptions = [...new Set(data.map((d) => d.alasan))];
  
  const kelasOptions = [...new Set(data.map((d) => d.kelas))];

  // MODIFIED: Filter dengan tambahan pencarian tanggal
  const filtered = data.filter((i) => {
    const s = search.toLowerCase();
    
    // Pencarian teks biasa (termasuk tanggal)
    const textMatch = (
      i.nama + 
      i.kelas + 
      i.alasan + 
      (i.keterangan || "") + 
      i.tanggal + // Tambahkan tanggal ke pencarian
      i.statusLabel
    ).toLowerCase().includes(s);
    
    // Filter dropdown
    const statusMatch = filterStatus ? i.status === filterStatus : true;
    const jenisMatch = filterJenis ? i.alasan === filterJenis : true;
    const kelasMatch = filterKelas ? i.kelas === filterKelas : true;
    
    // Filter tanggal
    let dateMatch = true;
    if (startDate || endDate) {
      const itemDate = i.tanggalRaw;
      
      if (startDate && endDate) {
        // Range tanggal
        dateMatch = itemDate >= startDate && itemDate <= endDate;
      } else if (startDate) {
        // Dari tanggal tertentu ke atas
        dateMatch = itemDate >= startDate;
      } else if (endDate) {
        // Sampai tanggal tertentu
        dateMatch = itemDate <= endDate;
      }
    }
    
    return textMatch && statusMatch && jenisMatch && kelasMatch && dateMatch;
  });

  const totalPages = Math.ceil(filtered.filter(item => item.type === "approved" || item.type === "rejected").length / itemsPerPage);

  // ============ RESET FILTER TANGGAL ============
  const resetDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setShowDateFilter(false);
  };

  // ============ FORMAT DATE LABEL ============
  const getDateLabel = (date) => {
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    if (dateStr === today) return "Hari Ini";
    if (dateStr === yesterday) return "Kemarin";
    return dayjs(date).format('DD MMM YYYY');
  };

  // Get pending items (always show all on first page)
  const pendingItems = filtered.filter(item => item.type === "pending");
  
  // Get paginated combined items
  const getPaginatedCombinedItems = () => {
    const combinedItems = filtered.filter(item => item.type === "approved" || item.type === "rejected");
    
    // Sort by date
    combinedItems.sort((a, b) => new Date(b.waktu) - new Date(a.waktu));
    
    // Apply pagination
    return combinedItems.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  };

  const paginatedCombinedItems = getPaginatedCombinedItems();

  // Group pending items by date
  const groupedPendingItems = pendingItems.reduce((acc, item) => {
    const dateKey = dayjs(item.waktu).format('YYYY-MM-DD');
    const dateLabel = getDateLabel(item.waktu);
    if (!acc[dateKey]) {
      acc[dateKey] = {
        label: dateLabel,
        items: []
      };
    }
    acc[dateKey].items.push(item);
    return acc;
  }, {});

  // Sort pending dates
  const sortedPendingDates = Object.keys(groupedPendingItems).sort((a, b) =>
    dayjs(b).unix() - dayjs(a).unix()
  );

  // Group combined items by date
  const groupedCombinedItems = paginatedCombinedItems.reduce((acc, item) => {
    const dateKey = dayjs(item.waktu).format('YYYY-MM-DD');
    const dateLabel = getDateLabel(item.waktu);
    if (!acc[dateKey]) {
      acc[dateKey] = {
        label: dateLabel,
        items: []
      };
    }
    acc[dateKey].items.push(item);
    return acc;
  }, {});

  // Sort combined dates
  const sortedCombinedDates = Object.keys(groupedCombinedItems).sort((a, b) =>
    dayjs(b).unix() - dayjs(a).unix()
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterJenis, filterKelas, startDate, endDate]);

  // ================= EXPORT =================
  const exportData = filtered.map((d, i) => ({
    No: i + 1,
    Nama: d.nama,
    Kelas: d.kelas,
    Jenis: d.alasan,
    Keterangan: d.keterangan,
    Status: d.statusLabel,
    Tanggal: `${d.tanggal} ${d.jam}`,
  }));

  const handleExportExcel = () => {
    if (!exportData.length) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PerizinanPKL");
    XLSX.writeFile(wb, `Data_Perizinan_PKL_${dayjs().format("YYYY-MM-DD")}.xlsx`);
    setOpenExport(false);
  };

  const handleExportPDF = () => {
    if (!exportData.length) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const doc = new jsPDF({
      orientation: 'landscape'
    });
    doc.text("Data Perizinan PKL", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [["No", "Nama", "Kelas", "Jenis", "Keterangan", "Status", "Tanggal"]],
      body: exportData.map((d) => [d.No, d.Nama, d.Kelas, d.Jenis, d.Keterangan, d.Status, d.Tanggal]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [100, 30, 33] },
    });
    doc.save(`Data_Perizinan_PKL_${dayjs().format("YYYY-MM-DD")}.pdf`);
    setOpenExport(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setOpenExport(false);
      }
    };

    if (openExport) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openExport]);

  // Fields untuk Detail modal
  const viewFields = [
    { name: "nama", label: "Nama Siswa" },
    { name: "kelas", label: "Kelas" },
    { name: "tanggal", label: "Tanggal" },
    { name: "jam", label: "Jam" },
    { name: "alasan", label: "Jenis Izin" },
    { name: "keterangan", label: "Keterangan", },
    { name: "statusLabel", label: "Status" },
    { 
      name: "rejection_reason", 
      label: "Alasan Ditolak",
      condition: (data) => data?.status === "rejected" 
    },
    { 
      name: "bukti", 
      label: "Bukti Foto", 
      type: "images",
      full: true,
      condition: (data) => data?.bukti?.length > 0 
    },
  ];

  const rejectFields = [
    {
      name: "rejection_reason",
      label: "Alasan Penolakan",
      full: true,
      required: true,
    },
  ];

  const getFieldsByMode = () => {
    if (detailMode === "reject") return rejectFields;
    return viewFields;
  };

  // Info filter aktif
  const isDateFilterActive = startDate || endDate;

  return (
    <div className="bg-white min-h-screen">
      <Header user={user} />

      <div className="flex">
        <Sidebar active={active} setActive={setActive} />

        <main className="flex-1 p-4 sm:p-6 md:p-10 bg-[#641E21] rounded-none md:rounded-l-3xl shadow-inner">  
          <div className="flex items-center justify-between mb-4 sm:mb-6 w-full">
            <h2 className="text-white font-bold text-base sm:text-lg">
              Perizinan PKL
            </h2>

            <div className="flex items-center gap-2">
              {/* Tombol Filter Tanggal */}
              <div className="relative" ref={dateFilterRef}>
                <button
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className={`flex items-center gap-2 px-3 py-2 text-white !bg-transparent hover:bg-white/10 rounded-full ${
                    isDateFilterActive ? "bg-white/20" : ""
                  }`}
                  title="Filter Tanggal"
                >
                  <Calendar size={18} />
                  {isDateFilterActive && (
                    <span className="text-xs bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                      !
                    </span>
                  )}
                </button>

                {showDateFilter && (
                  <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg p-4 z-50 min-w-[300px]">
                    <h3 className="font-semibold text-gray-700 mb-3">Filter Berdasarkan Tanggal</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Tanggal Mulai</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC933A]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Tanggal Akhir</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC933A]"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={resetDateFilter}
                          className="flex-1 px-3 py-2 !bg-gray-200 text-gray-700 rounded-lg hover:!bg-gray-300 text-sm"
                        >
                          Atur Ulang
                        </button>
                        <button
                          onClick={() => setShowDateFilter(false)}
                          className="flex-1 px-3 py-2 !bg-[#641E21] text-white rounded-lg hover:!bg-[#7a2a2e] text-sm"
                        >
                          Terapkan
                        </button>
                      </div>
                    </div>

                    {isDateFilterActive && (
                      <div className="mt-3 p-2 bg-orange-50 rounded-lg text-xs text-orange-700">
                        <span className="font-semibold">Filter aktif: </span>
                        {startDate && `Dari ${dayjs(startDate).format("DD MMM YYYY")}`}
                        {startDate && endDate && " - "}
                        {endDate && `Sampai ${dayjs(endDate).format("DD MMM YYYY")}`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tombol Export */}
              <div className="relative" ref={exportRef}>
                <button
                  onClick={() => setOpenExport(!openExport)}
                  className="flex items-center gap-2 px-3 py-2 text-white !bg-transparent hover:bg-white/10 rounded-full"
                >
                  <Download size={18} />
                </button>

                {openExport && (
                  <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-md p-2 z-50 min-w-[150px]">
                    <button
                      onClick={handleExportExcel}
                      className="!bg-transparent flex items-center gap-2 px-3 py-2 text-sm w-full hover:!bg-gray-100 rounded"
                    >
                      <FileSpreadsheet size={16} className="text-green-600" />
                      Excel
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="!bg-transparent flex items-center gap-2 px-3 py-2 text-sm w-full hover:!bg-gray-100 rounded"
                    >
                      <FileText size={16} className="text-red-600" />
                      PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <SearchBar
            query={search}
            setQuery={setSearch}
            placeholder="Cari nama, kelas, jenis izin, status, atau tanggal..."
            filters={[
              {
                label: "Status",
                value: filterStatus,
                options: statusOptions,
                optionLabels: { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" },
                onChange: setFilterStatus
              },
              { 
                label: "Jenis", 
                value: filterJenis, 
                options: jenisOptions, 
                onChange: setFilterJenis 
              },
              { label: "Kelas", value: filterKelas, options: kelasOptions, onChange: setFilterKelas },
            ]}
          />

          {/* Info jumlah data dan filter */}
          <div className="flex justify-between items-center mt-4 mb-2">
            {isDateFilterActive && (
              <button
                onClick={resetDateFilter}
                className="!bg-transparent text-xs text-white/80 hover:text-white underline"
              >
                Atur Ulang Filter Tanggal
              </button>
            )}
          </div>

          <div className="mt-6 space-y-3">
            {/* SECTION 1: MENUNGGU PERSETUJUAN */}
            {pendingItems.length > 0 && (
              <div className="mb-8">
                <div className="mb-3">
                  <h3 className="text-white font-bold text-lg border-b border-white/20 pb-2">
                    Menunggu Persetujuan
                  </h3>
                </div>

                {sortedPendingDates.map(dateKey => {
                  const group = groupedPendingItems[dateKey];
                  return (
                    <div key={dateKey} className="mb-4">
                      <div className="text-white font-semibold mb-2">
                        {group.label}
                      </div>

                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white p-4 rounded-lg hover:bg-gray-50 transition-colors mb-2"
                        >
                          <div
                            className="cursor-pointer"
                            onClick={() => {
                              setDetailData(item);
                              setDetailMode("view");
                              setOpenDetail(true);
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex gap-3">
                                {getStatusIcon(item.status)}
                                <div>
                                  <h3 className="font-bold">
                                    {item.nama} • <span className="text-sm font-medium text-gray-500">{item.kelas}</span>
                                  </h3>
                                  <p className="text-sm text-gray-600 mt-0.5">
                                    {item.alasan} • {item.keterangan !== "-" ? item.keterangan : "Tidak ada keterangan"}
                                  </p>
                                </div>
                              </div>
                              <span className="text-sm text-gray-500">{item.jam}</span>
                            </div>
                          </div>

                          {/* Tombol Terima/Tolak untuk perizinan yang masih pending */}
                          {item.hasActions && (
                            <div className="flex gap-2 mt-3 ml-9">
                              <button
                                className="px-4 py-2 rounded-lg text-white !bg-[#EC933A] hover:!bg-[#d47d2c] transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailData(item);
                                  handleDecision("approve");
                                }}
                              >
                                Terima
                              </button>
                              <button
                                className="px-4 py-2 rounded-lg text-white !bg-[#BC2424] hover:!bg-[#9e1e1e] transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailData(item);
                                  setDetailMode("reject");
                                  setOpenDetail(true);
                                }}
                              >
                                Tolak
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* SECTION 2: IZIN TERIMA & TOLAK (GABUNG) */}
            {paginatedCombinedItems.length > 0 && (
              <div className="mb-8">
                <div className="mb-3">
                  <h3 className="text-white font-bold text-lg border-b border-white/20 pb-2">
                     Izin Diterima & Ditolak
                  </h3>
                </div>

                {sortedCombinedDates.map(dateKey => {
                  const group = groupedCombinedItems[dateKey];
                  return (
                    <div key={dateKey} className="mb-4">
                      <div className="text-white font-semibold mb-2">
                        {group.label}
                      </div>

                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white p-4 rounded-lg hover:bg-gray-50 transition-colors mb-2"
                        >
                          <div
                            className="cursor-pointer"
                            onClick={() => {
                              setDetailData(item);
                              setDetailMode("view");
                              setOpenDetail(true);
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex gap-3">
                                {getStatusIcon(item.status)}
                                <div>
                                  <h3 className="font-bold">
                                    {item.nama} • <span className="text-sm font-medium text-gray-500">{item.kelas}</span>
                                  </h3>
                                  <p className="text-sm text-gray-600 mt-0.5">
                                    {item.alasan} • {item.statusLabel}
                                  </p>
                                  {item.keterangan !== "-" && item.keterangan !== "" && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {item.keterangan}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="text-sm text-gray-500">{item.jam}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination - hanya untuk bagian Izin Terima & Tolak */}
            {filtered.filter(item => item.type === "approved" || item.type === "rejected").length > itemsPerPage && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-4 text-white">
                <p className="text-sm">
                  Halaman {currentPage} dari {totalPages} halaman
                </p>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}

            {/* No data message */}
            {filtered.length === 0 && (
              <div className="text-center py-10">
                <p className="text-white/70">Tidak ada data perizinan</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal untuk detail view dan reject */}
      {openDetail && detailData &&
        createPortal(
          <Detail
            mode={detailMode}
            onChangeMode={setDetailMode}
            onSubmit={handleDecision}
            onClose={() => {
              setOpenDetail(false);
              setDetailMode("view");
              setDetailData(null);
            }}
            title="Detail Izin"
            size="half"
            initialData={detailData}
            fields={getFieldsByMode()}
          />,
          document.body
        )}
    </div>
  );
}