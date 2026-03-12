// src/pages/SiswaPage.jsx
import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import toast from "react-hot-toast";

// components
import Header from "./components/HeaderBiasa";
import Sidebar from "./components/SidebarBiasa";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Pagination from "./components/Pagination";

// utils
import { getDashboardWaliKelas } from "../utils/services/wakel/dashboard";
import { getSummaryIzinSiswa } from "../utils/services/pembimbing/izin";
import { getReviewPenilaian } from "../utils/services/koordinator/penilaian";

export default function SiswaPage() {
  const exportRef = useRef(null);
  const [openExport, setOpenExport] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [active, setActive] = useState("siswa");
  const [siswa, setSiswa] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // State untuk menyimpan data mentah
  const [siswaList, setSiswaList] = useState([]);
  const [izinMap, setIzinMap] = useState({});
  const [penilaianMap, setPenilaianMap] = useState({});

  const itemsPerPage = 10;

  const user = {
    name: localStorage.getItem("nama_guru") || "Wali Kelas",
    role: "Wali Kelas",
  };

  // ================= FETCH DATA =================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Ambil data dashboard
        console.log("📥 Fetching dashboard...");
        const dashboard = await getDashboardWaliKelas();
        console.log("✅ Dashboard response:", dashboard);

        const siswa = dashboard.siswa_list || [];
        const kelasNama = dashboard.kelas_info?.nama || "-";
        
        // Simpan siswa list dengan tambahan kelas
        const siswaWithKelas = siswa.map(s => ({
          ...s,
          kelas_nama: kelasNama
        }));
        
        setSiswaList(siswaWithKelas);
        console.log("👥 Siswa list:", siswaWithKelas);

        // 2. Ambil data izin untuk setiap siswa
        console.log("📥 Fetching izin data...");
        const izinPromises = siswa.map(async (s) => {
          try {
            const izin = await getSummaryIzinSiswa(s.id);
            console.log(`✅ Izin for siswa ${s.id} (${s.nama}):`, izin);
            return { siswa_id: s.id, data: izin };
          } catch (error) {
            console.log(`❌ Izin failed for siswa ${s.id}:`, error);
            return { siswa_id: s.id, data: { sakit: 0, izin: 0 } };
          }
        });

        const izinResults = await Promise.all(izinPromises);
        const izinMapData = {};
        izinResults.forEach(r => {
          izinMapData[r.siswa_id] = r.data;
        });
        setIzinMap(izinMapData);
        console.log("📊 Izin map:", izinMapData);

        // 3. Ambil data penilaian
        console.log("📥 Fetching penilaian data...");
        const penilaian = await getReviewPenilaian({ limit: 100 });
        console.log("✅ Penilaian response:", penilaian);

        if (penilaian?.data) {
          const penilaianMapData = {};
          penilaian.data.forEach(p => {
            penilaianMapData[p.siswa_id] = p;
          });
          setPenilaianMap(penilaianMapData);
          console.log("📊 Penilaian map:", penilaianMapData);
        }

      } catch (error) {
        console.error("❌ Error:", error);
        toast.error("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Gabungkan data setiap kali ada perubahan
  useEffect(() => {
    if (siswaList.length > 0) {
      console.log("🔄 Menggabungkan data...");
      
      const combined = siswaList.map((siswa, index) => {
        const izin = izinMap[siswa.id] || { sakit: 0, izin: 0 };
        const penilaian = penilaianMap[siswa.id];
        
        console.log(`📝 Data for ${siswa.nama}:`, {
          siswa_id: siswa.id,
          izin,
          penilaian: penilaian || 'Tidak ada'
        });

        return {
          no: index + 1,
          id: siswa.id,
          nisn: siswa.nisn || "-",
          nama: siswa.nama || "-",
          kelas: siswa.kelas_nama || "-",
          industri: siswa.industri || "-",
          pembimbing: siswa.pembimbing || "-",
          status: siswa.status_pkl || "-",
          
          // Data izin
          sakit: izin.sakit || 0,
          izin: izin.izin || 0,
          alpa: 0,
          
          // Data penilaian
          nilai_pkl: penilaian?.rata_rata || "-",
          total_skor: penilaian?.total_skor || "-",
          industri_penilaian: penilaian?.industri_nama || "-",
          tanggal_finalisasi: penilaian?.finalized_at ? new Date(penilaian.finalized_at).toLocaleDateString('id-ID') : "-",
        };
      });

      console.log("✅ Data gabungan:", combined);
      setSiswa(combined);
    }
  }, [siswaList, izinMap, penilaianMap]);

  // Filter dan pagination
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  const filteredData = siswa.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.nama?.toLowerCase().includes(q) ||
      s.nisn?.includes(q) ||
      s.kelas?.toLowerCase().includes(q)
    );
  }).filter((s) => {
    return filterStatus ? s.status === filterStatus : true;
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Render functions
  const renderStatus = (status) => {
    const colors = {
      "Sedang PKL": "bg-emerald-500",
      "Belum PKL": "bg-red-600"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${colors[status] || 'bg-gray-500'}`}>
        {status}
      </span>
    );
  };

  const renderNilai = (nilai) => {
    if (nilai === "-") return "-";
    const num = parseFloat(nilai);
    if (num >= 86) return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">{nilai}</span>;
    if (num >= 75) return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{nilai}</span>;
    return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">{nilai}</span>;
  };

  const renderAngka = (angka) => (
    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
      {angka}
    </span>
  );

  // Table columns
  const columns = [
    { label: "NISN", key: "nisn" },
    { label: "Nama", key: "nama" },
    { label: "Industri", key: "industri" },
    { label: "Pembimbing", key: "pembimbing" },
    { label: "Status", key: "status", render: renderStatus },
    { label: "S", key: "sakit", render: renderAngka },
    { label: "I", key: "izin", render: renderAngka },
    { label: "A", key: "alpa", render: renderAngka },
    { label: "Nilai", key: "nilai_pkl", render: renderNilai },
  ];

  // Export functions
  const exportData = filteredData.map((s) => ({
    No: s.no,
    NISN: s.nisn,
    Nama: s.nama,
    Kelas: s.kelas,
    Industri: s.industri,
    Pembimbing: s.pembimbing,
    Status: s.status,
    Sakit: s.sakit,
    Izin: s.izin,
    Alpa: s.alpa,
    "Nilai PKL": s.nilai_pkl,
    "Total Skor": s.total_skor,
    "Tgl Finalisasi": s.tanggal_finalisasi,
  }));

  const exportExcel = () => {
    if (exportData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Siswa PKL");
    XLSX.writeFile(wb, `data_siswa_pkl_${new Date().toISOString().slice(0,10)}.xlsx`);
    toast.success("Data berhasil diekspor ke Excel");
  };

  const exportPDF = () => {
    if (exportData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text("Data Siswa PKL", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map((d) => Object.values(d)),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [100, 30, 33] },
    });
    doc.save(`data_siswa_pkl_${new Date().toISOString().slice(0,10)}.pdf`);
    toast.success("Data berhasil diekspor ke PDF");
  };

  return (
    <div className="bg-white min-h-screen">
      <Header user={user} />
      <div className="flex">
        <Sidebar active={active} setActive={setActive} />

        <main className="flex-1 p-6 bg-[#641E21] rounded-l-3xl">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-white font-bold text-lg">Data Siswa PKL</h2>

            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setOpenExport(!openExport)}
                className="flex items-center gap-2 px-3 py-2 text-white !bg-transparent hover:bg-white/10 rounded-full"
                disabled={loading}
              >
                <Download />
              </button>

              {openExport && (
                <div className="absolute mt-2 bg-white rounded-lg shadow-md p-2 z-50 min-w-[150px]">
                  <button
                    onClick={() => { exportExcel(); setOpenExport(false); }}
                    className="!bg-transparent flex items-center gap-2 px-3 py-2 text-sm w-full hover:!bg-gray-100 rounded"
                  >
                    <FileSpreadsheet size={16} className="text-green-600"/> Excel
                  </button>
                  <button
                    onClick={() => { exportPDF(); setOpenExport(false); }}
                    className="!bg-transparent flex items-center gap-2 px-3 py-2 text-sm w-full hover:!bg-gray-100 rounded"
                  >
                    <FileText size={16} className="text-red-600"/> PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          <SearchBar
            query={search}
            setQuery={setSearch}
            placeholder="Cari NISN / Nama"
            filters={[
              {
                label: "Status PKL",
                value: filterStatus,
                options: ["Sedang PKL", "Belum PKL"],
                onChange: setFilterStatus,
              },
            ]}
          />

          {loading ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#641E21] border-t-transparent mb-4"></div>
              <p className="text-gray-600">Memuat data siswa...</p>
            </div>
          ) : (
            <>
              <Table columns={columns} data={paginatedData} />

              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}

              {filteredData.length === 0 && !loading && (
                <div className="bg-white rounded-lg p-8 text-center">
                  <p className="text-gray-500">Tidak ada data siswa</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}