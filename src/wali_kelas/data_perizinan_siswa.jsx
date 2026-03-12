// src/pages/guru/wali_kelas/dataperizinansiswa.jsx
import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  CheckCircle,
  XCircle,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
} from "lucide-react";

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Detail from "./components/Detail";

import { getIzinWaliKelas } from "../utils/services/wakel/izin";
import { getSiswa } from "../utils/services/admin/get_siswa";
import { getKelas } from "../utils/services/admin/get_kelas";
import { getGuru } from "../utils/services/admin/get_guru";

// ================= UTIL =================
const normalizeText = (text) =>
  text
    ? text
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "-";

export default function DataPerizinanSiswa() {
  const [active, setActive] = useState("perizinan");
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);

  // Filter tambahan
  const [filterJenis, setFilterJenis] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  
  // Filter Tanggal
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef(null);
  const dateFilterRef = useRef(null);

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru",
    role: "Wali Kelas",
  };

  // ================= FETCH DATA =================
  const fetchData = async () => {
    const izin = await getIzinWaliKelas();
    const siswa = await getSiswa();
    const kelas = await getKelas();
    const guru = await getGuru();

    const siswaMap = {};
    siswa.forEach((s) => (siswaMap[s.id] = s));

    const kelasMap = {};
    kelas.forEach((k) => (kelasMap[k.id] = k.nama));

    const guruMap = {};
    guru.forEach((g) => (guruMap[g.id] = g.nama));

    const mapped = izin.map((i) => {
      const s = siswaMap[i.siswa_id];
      const waktu = i.created_at || i.tanggal;
      const status = (i.status || "pending").toLowerCase();

      return {
        id: i.id,
        nama: s?.nama_lengkap || "-",
        kelas: kelasMap[s?.kelas_id] || "-",

        waktu,
        tanggal: dayjs(waktu).format("DD MMMM YYYY"),
        tanggalRaw: dayjs(waktu).format("YYYY-MM-DD"), // Untuk filter
        jam: dayjs(waktu).format("HH:mm"),

        tanggal_putus: i.decided_at
          ? dayjs(i.decided_at).format("DD MMMM YYYY")
          : "-",
        jam_putus: i.decided_at
          ? dayjs(i.decided_at).format("HH:mm")
          : "-",

        alasan: normalizeText(i.jenis),

        keterangan: i.keterangan || "-",

        status,
        statusLabel:
          status === "approved"
            ? "Disetujui"
            : status === "rejected"
            ? "Ditolak"
            : "Proses",

        rejection_reason: i.rejection_reason || "-",
        bukti: i.bukti_foto_urls || [],

        pembimbing: guruMap[i.pembimbing_guru_id] || "-",
      };
    });

    mapped.sort((a, b) => new Date(b.waktu) - new Date(a.waktu));
    setData(mapped);
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  // ================= FILTER OPTIONS =================
  const validData = data.filter(i => i.nama !== "-" && i.kelas !== "-");
  
  const jenisOptions = [
    ...new Set(validData.map((d) => d.alasan).filter(Boolean)),
  ];

  const kelasOptions = [
    ...new Set(validData.map((d) => d.kelas).filter(Boolean)),
  ];

  const statusOptions = [
    ...new Set(validData.map((d) => d.statusLabel).filter(Boolean)),
  ];

  // ================= FILTER DATA =================
  const filtered = data
    .filter(i => i.nama !== "-" && i.kelas !== "-")
    .filter((i) => {
      const q = search.toLowerCase();
      // Pencarian teks biasa
      const textMatch = (
        i.nama + 
        i.kelas + 
        i.alasan + 
        i.statusLabel + 
        i.pembimbing +
        i.tanggal // Tambahkan tanggal ke pencarian teks
      ).toLowerCase().includes(q);
      
      // Filter dropdown
      const jenisMatch = filterJenis ? i.alasan === filterJenis : true;
      const kelasMatch = filterKelas ? i.kelas === filterKelas : true;
      const statusMatch = filterStatus ? i.statusLabel === filterStatus : true;
      
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
      
      return textMatch && jenisMatch && kelasMatch && statusMatch && dateMatch;
    });

  // ================= RESET FILTER TANGGAL =================
  const resetDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setShowDateFilter(false);
  };

  // ================= EXPORT DATA =================
  const exportData = filtered.map((i, idx) => ({
    No: idx + 1,
    Nama: i.nama,
    Kelas: i.kelas,
    "Tanggal Pengajuan": i.tanggal,
    Jam: i.jam,
    "Tanggal Diputuskan": i.tanggal_putus,
    "Jam Diputuskan": i.jam_putus,
    Jenis: i.alasan,
    Keterangan: i.keterangan,
    Status: i.statusLabel,
    Pembimbing: i.pembimbing,
    "Alasan Ditolak": i.rejection_reason !== "-" ? i.rejection_reason : "-",
    "Bukti Foto": i.bukti.length ? "Ada" : "Tidak ada",
  }));

  const exportExcel = () => {
    if (!exportData.length) {
      alert("Tidak ada data untuk diekspor");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Perizinan PKL");
    XLSX.writeFile(wb, `perizinan_pkl_${dayjs().format("YYYY-MM-DD")}.xlsx`);
  };

  const exportPDF = () => {
    if (!exportData.length) {
      alert("Tidak ada data untuk diekspor");
      return;
    }
    const doc = new jsPDF({
      orientation: 'landscape'
    });
    doc.text("Data Perizinan PKL", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map((d) => Object.values(d)),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [100, 30, 33] },
    });
    doc.save(`perizinan_pkl_${dayjs().format("YYYY-MM-DD")}.pdf`);
  };

  const getStatusIcon = (s) =>
    s === "approved" ? (
      <CheckCircle className="text-green-600" size={20} />
    ) : s === "rejected" ? (
      <XCircle className="text-red-600" size={20} />
    ) : (
      <Clock className="text-orange-500" size={20} />
    );

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const groupedByDate = filtered.reduce((acc, item) => {
    if (!acc[item.tanggal]) acc[item.tanggal] = [];
    acc[item.tanggal].push(item);
    return acc;
  }, {});

  // Info filter aktif
  const isDateFilterActive = startDate || endDate;

  // ================= RENDER =================
  return (
    <div className="bg-white min-h-screen">
      <Header user={user} />

      <div className="flex">
        <Sidebar active={active} setActive={setActive} />

        <main className="flex-1 p-10 bg-[#641E21] rounded-l-3xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white font-bold text-lg">
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
                  <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-md p-2 z-50 min-w-[150px]">
                    <button
                      onClick={() => {
                        exportExcel();
                        setOpenExport(false);
                      }}
                      className="!bg-transparent flex items-center gap-2 px-3 py-2 text-sm w-full hover:!bg-gray-100 rounded"
                    >
                      <FileSpreadsheet size={16} className="text-green-600" />
                      Excel
                    </button>
                    <button
                      onClick={() => {
                        exportPDF();
                        setOpenExport(false);
                      }}
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
                onChange: setFilterStatus,
              },
              {
                label: "Jenis",
                value: filterJenis,
                options: jenisOptions,
                onChange: setFilterJenis,
              },
              {
                label: "Kelas",
                value: filterKelas,
                options: kelasOptions,
                onChange: setFilterKelas,
              },
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

          {filtered.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center mt-6">
              <p className="text-gray-500">Tidak ada data perizinan</p>
            </div>
          ) : (
            Object.entries(groupedByDate).map(([tanggal, items]) => (
              <div key={tanggal}>
                <h2 className="text-white font-semibold mb-3 mt-6">
                  {tanggal}
                </h2>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-4 rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => {
                        setDetailData(item);
                        setOpenDetail(true);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          {getStatusIcon(item.status)}
                          <div>
                            <h3 className="font-bold flex items-center gap-2">
                              {item.nama} | {item.kelas}
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeColor(item.status)}`}>
                                {item.statusLabel}
                              </span>
                            </h3>
                            <p className="text-sm text-gray-600">
                              {item.alasan} • {item.jam}
                            </p>
                            {item.pembimbing !== "-" && (
                              <p className="text-xs text-gray-500 mt-1">
                                Pembimbing: {item.pembimbing}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {item.jam}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </main>
      </div>

      {openDetail &&
        createPortal(
          <Detail
            mode="view"
            onClose={() => setOpenDetail(false)}
            title="Detail Izin"
            initialData={detailData}
            fields={[
              { name: "nama", label: "Nama Siswa" },
              { name: "kelas", label: "Kelas" },
              { name: "tanggal", label: "Tanggal Pengajuan" },
              { name: "jam", label: "Jam Pengajuan" },
              { name: "tanggal_putus", label: "Tanggal Diputuskan" },
              { name: "jam_putus", label: "Jam Diputuskan" },
              { name: "alasan", label: "Jenis Izin" },
              { name: "keterangan", label: "Keterangan"},
              { name: "statusLabel", label: "Status" },
              { name: "pembimbing", label: "Pembimbing" },
              { 
                name: "rejection_reason", 
                label: "Alasan Ditolak", 
                condition: (data) => data?.status === "rejected"
              },
              { 
                name: "bukti", 
                label: "Bukti Foto",
                type: "images",
              },
            ]}
          />,
          document.body
        )}
    </div>
  );
}   