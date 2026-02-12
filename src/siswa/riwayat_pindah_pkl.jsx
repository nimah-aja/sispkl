import React, { useState, useRef, useEffect } from "react";
import {
  FilePlus,
  CheckCircle,
  XCircle,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Detail from "./components/Detail";

import dayjs from "dayjs";
import { createPortal } from "react-dom";

import { getPindahPKLMe } from "../utils/services/siswa/perpindahan";
import { getIndustri } from "../utils/services/admin/get_industri";
import { getGuru } from "../utils/services/admin/get_guru";

const RiwayatPindahPKL = () => {
  const [submissions, setSubmissions] = useState([]);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [active, setActive] = useState("perpindahanPKL");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Status");
  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  const [user] = useState(
    JSON.parse(localStorage.getItem("user")) || {
      name: "Guest",
      role: "Siswa",
    }
  );

  const renderDayLabel = (cur, idx) => {
    const d = dayjs(cur.time).format("YYYY-MM-DD");
    const p =
        idx > 0
        ? dayjs(filteredSubmissions[idx - 1].time).format("YYYY-MM-DD")
        : null;

    if (d !== p) {
        if (d === dayjs().format("YYYY-MM-DD")) return "Hari Ini";
        if (d === dayjs().subtract(1, "day").format("YYYY-MM-DD"))
        return "Kemarin";
        return dayjs(cur.time).format("D MMMM YYYY");
    }
    return null;
    };


  useEffect(() => {
    const fetchRiwayat = async () => {
      setIsLoading(true);
      try {
        console.log("=== Mulai Fetching Data ===");
        
        // Ambil data secara terpisah untuk debugging
        let pindahData = null;
        let industriData = [];
        let guruData = [];
        
        try {
          pindahData = await getPindahPKLMe();
          console.log("1. Data dari getPindahPKLMe():", pindahData);
        } catch (pindahErr) {
          console.error("Error getPindahPKLMe:", pindahErr);
          // Jika 404, itu normal (belum ada data)
          if (pindahErr.response?.status === 404) {
            console.log("Tidak ada data pindah PKL (404)");
            pindahData = null;
          } else {
            throw pindahErr;
          }
        }
        
        try {
          industriData = await getIndustri();
          console.log("2. Data dari getIndustri():", industriData?.length, "items");
        } catch (industriErr) {
          console.error("Error getIndustri:", industriErr);
          // Lanjutkan tanpa data industri
        }
        
        try {
          guruData = await getGuru();
          console.log("3. Data dari getGuru():", guruData?.length, "items");
        } catch (guruErr) {
          console.error("Error getGuru:", guruErr);
          // Lanjutkan tanpa data guru
        }
        
        // Jika tidak ada data pindah PKL
        if (!pindahData) {
          console.log("Tidak ada data pindah PKL untuk ditampilkan");
          setSubmissions([]);
          setIsLoading(false);
          return;
        }
        
        // Buat mapping untuk industri dan guru
        const industriMap = {};
        if (industriData && Array.isArray(industriData)) {
          industriData.forEach((i) => {
            industriMap[i.id] = i.nama;
          });
        }
        
        const guruMap = {};
        if (guruData && Array.isArray(guruData)) {
          guruData.forEach((g) => {
            guruMap[g.id] = g.nama;
          });
        }
        
        const riwayat = [];
        
        // Ambil nama industri dari objek yang sudah ada di respons
        const namaIndustriBaru = pindahData.industri_baru?.nama || 
                                 industriMap[pindahData.industri_baru_id] || 
                                 "Industri tidak diketahui";
        
        const namaIndustriLama = pindahData.industri_lama?.nama || 
                                 industriMap[pindahData.industri_lama_id] || 
                                 "Industri tidak diketahui";
        
        console.log("Industri Baru:", namaIndustriBaru);
        console.log("Industri Lama:", namaIndustriLama);
        
        // 1. SUBMIT - Pengajuan awal
        riwayat.push({
          id: `submit-${pindahData.id}`,
          type: "submit", // Ini menentukan icon
          name: "Anda Mengajukan Pindah PKL",
          description: `Pengajuan pindah dari ${namaIndustriLama} ke ${namaIndustriBaru}`,
          time: pindahData.created_at,
          onClick: () => {
            setDetailData({
              ...pindahData,
              namaIndustriBaru,
              namaIndustriLama,
              namaGuru: "-",
              status: getStatusLabel(pindahData.status),
            });
            setOpenDetail(true);
          },
        });
        
        // 2. DECISION - Jika sudah diproses
        // Periksa jika status sudah bukan pending awal
        if (pindahData.status === "approved" || pindahData.status === "rejected") {
          const statusType = pindahData.status === "approved" ? "approved" : "rejected";
          
          // Cari nama guru yang memproses jika ada data
          const namaGuru = pindahData.processed_by ? 
                          (guruMap[pindahData.processed_by] || "Pembimbing/Kaprog") : 
                          "Pembimbing/Kaprog";
          
          riwayat.push({
            id: `decide-${pindahData.id}`,
            type: statusType,
            name: statusType === "approved" ? `Pindah PKL Disetujui` : `Pindah PKL Ditolak`,
            description: `Pengajuan pindah dari ${namaIndustriLama} ke ${namaIndustriBaru}`,
            time: pindahData.decided_at || pindahData.updated_at || pindahData.created_at,
            onClick: () => {
              setDetailData({
                ...pindahData,
                namaIndustriBaru,
                namaIndustriLama,
                namaGuru,
                status: getStatusLabel(pindahData.status),
              });
              setOpenDetail(true);
            },
          });
        }
        
        console.log("4. Riwayat yang dibuat:", riwayat);
        setSubmissions(riwayat);
        
      } catch (err) {
        console.error("Gagal mengambil riwayat pindah PKL:", err);
        console.error("Error details:", err.response || err);
        setSubmissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRiwayat();
  }, []);

  // Fungsi untuk mengubah status ke label yang lebih readable
  const getStatusLabel = (status) => {
    switch (status) {
      case "pending_pembimbing":
        return "Menunggu Persetujuan Pembimbing";
      case "pending_kaprog":
        return "Menunggu Persetujuan Kaprog";
      case "pending_koordinator":
        return "Menunggu Persetujuan Koordinator";
      case "approved":
        return "Disetujui";
      case "rejected":
        return "Ditolak";
      default:
        return status;
    }
  };

  const getIcon = (type) => {
    if (type === "submit")
      return <FilePlus className="w-6 h-6 text-orange-500" />;
    if (type === "approved")
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    if (type === "rejected")
      return <XCircle className="w-6 h-6 text-red-600" />;
    return null;
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const q = query.toLowerCase();

    const matchQuery =
      sub.name.toLowerCase().includes(q) ||
      sub.description.toLowerCase().includes(q) ||
      dayjs(sub.time).format("YYYY-MM-DD HH:mm").includes(q);

    let matchStatus = true;
    
    // Filter berdasarkan status yang dipilih
    if (statusFilter === "Menunggu") {
      // Tampilkan yang type = "submit" (pengajuan awal)
      matchStatus = sub.type === "submit";
    } else if (statusFilter === "Disetujui") {
      matchStatus = sub.type === "approved";
    } else if (statusFilter === "Ditolak") {
      matchStatus = sub.type === "rejected";
    }
    // Jika statusFilter = "Status" (default), tampilkan semua

    return matchQuery && matchStatus;
  });

  const exportData = filteredSubmissions.map((sub, i) => ({
    No: i + 1,
    Nama: sub.name,
    Deskripsi: sub.description,
    Waktu: dayjs(sub.time).format("DD/MM/YYYY HH:mm"),
    Status: sub.type === "submit" ? "Menunggu" : sub.type === "approved" ? "Disetujui" : "Ditolak",
  }));

  const handleExportExcel = () => {
    if (exportData.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PindahPKL");
    XLSX.writeFile(wb, "RiwayatPindahPKL.xlsx");
    setOpenExport(false);
  };

  const handleExportPDF = () => {
    if (exportData.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }
    const doc = new jsPDF();
    doc.text("Riwayat Pindah PKL", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [["No", "Nama", "Deskripsi", "Waktu", "Status"]],
      body: exportData.map((r) => [
        r.No,
        r.Nama,
        r.Deskripsi,
        r.Waktu,
        r.Status,
      ]),
    });
    doc.save("RiwayatPindahPKL.pdf");
    setOpenExport(false);
  };

  const safe = (v) => (v ? v : "-");

  return (
    <div className="bg-white min-h-screen w-full">
      <Header query={query} setQuery={setQuery} user={user} />

      <div className="flex">
        <Sidebar active={active} setActive={setActive} />

        <main className="flex-1 p-6 bg-[#641E21] rounded-l-3xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">
              Riwayat Pindah PKL
            </h2>

            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setOpenExport(!openExport)}
                className="flex items-center gap-2 px-3 py-2 text-white !bg-transparent hover:bg-white/10 rounded-full -ml-300"
              >
                <Download />
              </button>

              {openExport && (
                <div className="absolute  left-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-md p-2 z-50 -ml-300">
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-3 py-2 !bg-transparent hover:!bg-gray-100 text-sm w-full"
                  >
                    <FileSpreadsheet size={16} className="text-green-600"/> Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-3 py-2 !bg-transparent hover:!bg-gray-100 text-sm w-full"
                  >
                    <FileText size={16} className="text-red-600"/> PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          <SearchBar
            query={query}
            setQuery={setQuery}
            filters={[
              {
                label: "Status",
                value: statusFilter,
                options: ["Status", "Menunggu", "Disetujui", "Ditolak"],
                onChange: setStatusFilter,
              },
            ]}
          />

          <div className="mt-6">
            {isLoading ? (
              <div className="text-center py-8 bg-white rounded-lg">
                <p className="text-gray-500">Memuat data...</p>
              </div>
            ) : filteredSubmissions.length > 0 ? (
              <div className="space-y-3">
                {filteredSubmissions.map((sub, idx) => (
                    <div key={sub.id}>
                        {renderDayLabel(sub, idx) && (
                        <div className="text-white font-semibold mb-2">
                            {renderDayLabel(sub, idx)}
                        </div>
                        )}

                        <div
                        className="bg-white rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
                        onClick={sub.onClick}
                        >
                        <div className="flex justify-between">
                            <div className="flex gap-3">
                            {getIcon(sub.type)}
                            <div>
                                <p className="font-bold text-gray-800">{sub.name}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                {sub.description}
                                </p>
                            </div>
                            </div>

                            <div className="text-right">
                            <span className="text-sm text-gray-500 block">
                                {dayjs(sub.time).format("HH:mm")}
                            </span>
                            </div>
                        </div>
                        </div>
                    </div>
                    ))}

              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-lg shadow-sm">
                <p className="text-gray-500">
                  {statusFilter !== "Status" && statusFilter !== "Semua"
                    ? `Tidak ada riwayat dengan status "${statusFilter}"`
                    : "Belum ada riwayat pindah PKL"}
                </p>
              </div>
            )}
          </div>
        </main>

        {openDetail &&
          detailData &&
          createPortal(
            <Detail
              mode="view"
              title="Detail Pindah PKL"
              size="half"
              onClose={() => setOpenDetail(false)}
              initialData={{
                industri_lama: safe(detailData.namaIndustriLama),
                industri_baru: safe(detailData.namaIndustriBaru),
                status: safe(detailData.status),
                alasan: safe(detailData.alasan),
                tanggal: safe(
                  dayjs(detailData.created_at).format("DD MMMM YYYY HH:mm")
                ),
                pembimbing: safe(detailData.namaGuru),
              }}
              fields={[
                { name: "industri_lama", label: "Industri Lama", full: true },
                { name: "industri_baru", label: "Industri Baru"},
                { name: "status", label: "Status" },
                { name: "alasan", label: "Alasan", full: true },
                { name: "tanggal", label: "Tanggal Pengajuan" },
                { name: "pembimbing", label: "Diproses Oleh" },
              ]}
            />,
            document.body
          )}
      </div>
    </div>
  );
};

export default RiwayatPindahPKL;