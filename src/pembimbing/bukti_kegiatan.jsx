import React, { useEffect, useState, useRef } from "react";
import { Download, FileSpreadsheet, FileText, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import toast from "react-hot-toast";

// components
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Table from "./components/Table";
import Pagination from "./components/Pagination";
import Detail from "./components/Detail";

// services
import { getGuruTasks } from "../utils/services/pembimbing/guru";
import { getMyRealisasiKegiatan } from "../utils/services/pembimbing/realisasi";

export default function DataRealisasiKegiatan() {
  const navigate = useNavigate();
  const exportRef = useRef(null);
  const [filterKegiatan, setFilterKegiatan] = useState("");

  const [active, setActive] = useState("bukti_kegiatan");
  const [query, setQuery] = useState("");
  const [openExport, setOpenExport] = useState(false);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // DETAIL STATE
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedData, setSelectedData] = useState(null);

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Pembimbing",
  };

  // Fungsi hitung sisa hari
  const hitungSisaHari = (tanggalSelesai) => {
    if (!tanggalSelesai) return undefined;
    const end = dayjs(tanggalSelesai);
    if (!end.isValid()) return undefined;
    return end.startOf("day").diff(dayjs().startOf("day"), "day");
  };

  // FETCH + JOIN DATA
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       setLoading(true);
  //       const realisasiRes = await getMyRealisasiKegiatan();
  //       const tasksRes = await getGuruTasks();

  //       const realisasi = realisasiRes || [];
  //       const tasks = tasksRes.data || [];

  //       const mapped = realisasi.map((r) => {
  //         let kegiatanNama = "-";
  //         let industriNama = "-";
  //         let tanggalSelesai = null;

  //         for (const industriGroup of tasks) {
  //           if (industriGroup.industri?.id === r.industri_id) {
  //             const task = industriGroup.tasks.find(
  //               (t) => t.kegiatan?.id === r.kegiatan_id
  //             );
  //             if (task) {
  //               kegiatanNama = task.kegiatan?.jenis || "-";
  //               industriNama = industriGroup.industri?.nama || "-";
  //               tanggalSelesai = task.kegiatan?.tanggal_selesai;
  //               break;
  //             }
  //           }
  //         }

  //         return {
  //           // UNTUK TABLE 
  //           id: r.id,
  //           kegiatan: kegiatanNama,
  //           industri: industriNama,
  //           tanggal_realisasi: dayjs(r.tanggal_realisasi).format("DD-MM-YYYY"),
  //           catatan: r.catatan || "-",
  //           status: r.status,
  //           bukti: r.bukti_foto_urls?.length || 0,
  //           tanggal_selesai: tanggalSelesai,

  //           // UNTUK DETAIL 
  //           raw: {
  //             ...r,
  //             kegiatan_nama: kegiatanNama,
  //             industri_nama: industriNama,
  //             tanggal_selesai: tanggalSelesai,
  //           },
  //         };
  //       });

  //       setData(mapped);
  //     } catch (err) {
  //       console.error("Gagal fetch realisasi", err);
  //       toast.error("Gagal memuat data realisasi");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, []);

  // FETCH + JOIN DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const realisasiRes = await getMyRealisasiKegiatan();
        const tasksRes = await getGuruTasks();

        const realisasi = realisasiRes || [];
        const tasks = tasksRes.data || [];

        const mapped = realisasi
          .map((r) => {
            let kegiatanNama = "-";
            let industriNama = "-";
            let tanggalSelesai = null;

            for (const industriGroup of tasks) {
              if (industriGroup.industri?.id === r.industri_id) {
                const task = industriGroup.tasks.find(
                  (t) => t.kegiatan?.id === r.kegiatan_id
                );
                if (task) {
                  kegiatanNama = task.kegiatan?.jenis || "-";
                  industriNama = industriGroup.industri?.nama || "-";
                  tanggalSelesai = task.kegiatan?.tanggal_selesai;
                  break;
                }
              }
            }

            return {
              // UNTUK TABLE 
              id: r.id,
              kegiatan: kegiatanNama,
              industri: industriNama,
              tanggal_realisasi: dayjs(r.tanggal_realisasi).format("DD-MM-YYYY"),
              catatan: r.catatan || "-",
              status: r.status,
              bukti: r.bukti_foto_urls?.length || 0,
              tanggal_selesai: tanggalSelesai,

              // UNTUK DETAIL 
              raw: {
                ...r,
                kegiatan_nama: kegiatanNama,
                industri_nama: industriNama,
                tanggal_selesai: tanggalSelesai,
              },
            };
          })
          .filter(item => {
            // FILTER: Jangan tampilkan data dengan kegiatan "Pembekalan" (case insensitive)
            const isPembekalan = 
              item.kegiatan?.toLowerCase().includes("pembekalan") ||
              item.raw?.kegiatan_nama?.toLowerCase().includes("pembekalan");
            
            return !isPembekalan;
          });

        console.log(`Total realisasi awal: ${realisasi.length}`);
        console.log(`Realisasi setelah filter (tanpa pembekalan): ${mapped.length}`);

        setData(mapped);
      } catch (err) {
        console.error("Gagal fetch realisasi", err);
        toast.error("Gagal memuat data realisasi");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  // Filter
  const kegiatanOptions = [
    // "Pembekalan",
    // "Pengantaran",
    "Monitoring1",
    "Monitoring2",
    "Penjemputan",
  ];

  // FILTER + PAGINATION
  const filteredData = data.filter((item) => {
    const matchSearch =
      item.kegiatan.toLowerCase().includes(query.toLowerCase()) ||
      item.industri.toLowerCase().includes(query.toLowerCase());

    const matchKegiatan =
      !filterKegiatan || item.kegiatan === filterKegiatan;

    return matchSearch && matchKegiatan;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [query, filterKegiatan]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // HANDLE EDIT - Navigasi ke halaman edit
  const handleEdit = (row) => {
    // Cek deadline
    const sisaHari = hitungSisaHari(row.tanggal_selesai);
    const isLewat = sisaHari < 0;
    
    if (isLewat) {
      toast.error("Tidak dapat mengedit realisasi karena sudah melewati deadline kegiatan.");
      return;
    }

    // Navigasi ke halaman edit dengan membawa data realisasi
    navigate("/guru/pembimbing/edit-realisasi", {
      state: {
        realisasiId: row.id,
        kegiatan_nama: row.kegiatan,
        industri_nama: row.industri,
        catatan: row.catatan !== "-" ? row.catatan : "",
        tanggal_realisasi: row.tanggal_realisasi,
        bukti_count: row.bukti,
      }
    });
  };

  // TABLE COLUMNS
  const columns = [
    { label: "Kegiatan", key: "kegiatan" },
    { label: "Industri", key: "industri" },
    { label: "Tanggal Realisasi", key: "tanggal_realisasi" },
    { 
      label: "Catatan", 
      key: "catatan",
      render: (value) => (
        <div className="max-w-[200px] truncate" title={value}>
          {value}
        </div>
      )
    },
    { 
      label: "Status", 
      key: "status",
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium
          ${value === 'Sudah' ? 'bg-green-100 text-green-800' : 
            value === 'Belum' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-gray-100 text-gray-800'}`}
        >
          {value}
        </span>
      )
    },
    { 
      label: "Bukti", 
      key: "bukti",
      render: (value) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          {value} foto
        </span>
      )
    },
    {
      label: "Aksi",
      key: "aksi",
      sortable: false,
      render: (_value, row) => {
        const sisaHari = hitungSisaHari(row.tanggal_selesai);
        const isLewat = sisaHari < 0;

        return (
          <div className="flex gap-2">
            {/* Tombol Detail */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedData(row.raw);
                setOpenDetail(true);
              }}
              className="ml-5 px-3 py-1 text-sm rounded-md !bg-[#641E21] text-white hover:opacity-90 transition-opacity"
            >
              Detail
            </button>

            {/* Tombol Edit */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
              disabled={isLewat}
              className={`-mr-15 px-3 py-1 text-sm rounded-md flex items-center gap-1 transition-opacity
                ${isLewat 
                  ? '!bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : '!bg-[#EC933A] text-white hover:opacity-90'
                }`}
              title={isLewat ? "Tidak dapat mengedit karena sudah melewati deadline" : "Edit foto bukti"}
            >
              <Edit size={14} />
              Ubah
            </button>
          </div>
        );
      },
    },
  ];

  // DETAIL FIELDS
  const detailFields = [
    { name: "kegiatan_nama", label: "Nama Kegiatan", type: "text" },
    { name: "industri_nama", label: "Industri", type: "text" },
    { name: "catatan", label: "Catatan", type: "text" },
    { name: "status", label: "Status", type: "text" },
    { name: "tanggal_realisasi", label: "Tanggal Realisasi", type: "text" },
    {
      name: "bukti_foto_urls",
      label: "Bukti Foto",
      type: "custom",
      render: (urls) => (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {urls?.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Bukti ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/150?text=Error";
                }}
              />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
              >
                <span className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                  Lihat
                </span>
              </a>
            </div>
          ))}
        </div>
      )
    },
    { name: "created_at", label: "Dibuat Pada", type: "text" },
  ];

  // EXPORT
  const exportData = filteredData.map((item, i) => ({
    No: i + 1,
    Kegiatan: item.kegiatan,
    Industri: item.industri,
    Tanggal_Realisasi: item.tanggal_realisasi,
    Catatan: item.catatan,
    Status: item.status,
    Jumlah_Bukti: item.bukti,
  }));

  const handleExportExcel = () => {
    if (!exportData.length) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Realisasi");
    XLSX.writeFile(wb, `data_realisasi_kegiatan_${dayjs().format("DD-MM-YYYY")}.xlsx`);
    toast.success("Berhasil export Excel");
    setOpenExport(false);
  };

  const handleExportPDF = () => {
    if (!exportData.length) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }
    const doc = new jsPDF();
    doc.text("Data Realisasi Kegiatan", 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map((d) => Object.values(d)),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [100, 30, 33] },
    });

    doc.save(`data_realisasi_kegiatan_${dayjs().format("DD-MM-YYYY")}.pdf`);
    toast.success("Berhasil export PDF");
    setOpenExport(false);
  };

  // RENDER
  return (
    <div className="bg-white min-h-screen w-full">
      <Header user={user} />

      <div className="flex">
        <div className="hidden md:block">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 min-h-screen p-4 sm:p-6 md:p-10 bg-[#641E21] rounded-tl-3xl shadow-inner">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-lg">
                Data Realisasi Kegiatan
              </h2>
            </div>

            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setOpenExport(!openExport)}
                className="!bg-transparent flex items-center px-3 py-2 text-white hover:bg-white/10 rounded-full transition-colors -ml-290"
                title="Export data"
              >
                <Download size={18} />
              </button>

              {openExport && (
                <div className="absolute -left-290 mt-2 !bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50 min-w-[120px]">
                  <button
                    onClick={handleExportExcel}
                    className="!bg-transparent flex items-center gap-2 px-3 py-2 text-sm hover:!bg-gray-100 w-full rounded-md transition-colors"
                  >
                    <FileSpreadsheet size={16} className="text-green-600" />
                    Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="!bg-transparent flex items-center gap-2 px-3 py-2 text-sm hover:!bg-gray-100 w-full rounded-md transition-colors"
                  >
                    <FileText size={16} className="text-red-600" />
                    PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SEARCH */}
          <SearchBar
            query={query}
            setQuery={setQuery}
            placeholder="Cari kegiatan / industri..."
            filters={[
              {
                label: "Kegiatan",
                value: filterKegiatan,
                options: kegiatanOptions,
                onChange: setFilterKegiatan,
              },
            ]}
          />

          {/* Loading State */}
          {loading ? (
            <div className=" rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#641E21] mx-auto mb-4"></div>
              <p className="text-gray-200">Memuat data ...</p>
            </div>
          ) : (
            <>
              {/* TABLE */}
              <div className="rounded-lg overflow-hidden">
                <Table columns={columns} data={paginatedData} />
              </div>

              {/* Empty State */}
              {/* {filteredData.length === 0 && (
                <div className="bg-white rounded-lg p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data</h3>
                  <p className="text-gray-500">
                    {query || filterKegiatan 
                      ? "Tidak ada data yang sesuai dengan filter" 
                      : "Belum ada realisasi kegiatan"}
                  </p>
                </div>
              )} */}

              {/* PAGINATION */}
              {totalPages > 1 && filteredData.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 text-white">
                  <span className="text-sm">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
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

      {/* DETAIL MODAL */}
      {openDetail && selectedData && (
        <Detail
          title="Detail Realisasi Kegiatan"
          fields={detailFields}
          mode="view"
          initialData={{
            ...selectedData,
            tanggal_realisasi: dayjs(selectedData.tanggal_realisasi).format("DD-MM-YYYY"),
            created_at: dayjs(selectedData.created_at).format("DD-MM-YYYY HH:mm"),
          }}
          onClose={() => {
            setOpenDetail(false);
            setSelectedData(null);
          }}
        />
      )}
    </div>
  );
}