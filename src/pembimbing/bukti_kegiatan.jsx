import React, { useEffect, useState, useRef } from "react";
import { Download, FileSpreadsheet, FileText, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";

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

  const [active, setActive] = useState("kegiatan");
  const [query, setQuery] = useState("");
  const [openExport, setOpenExport] = useState(false);

  const [data, setData] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 🔥 DETAIL STATE
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedData, setSelectedData] = useState(null);

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Pembimbing",
  };

  // =========================
  // FETCH + JOIN DATA
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const realisasiRes = await getMyRealisasiKegiatan();
        const tasksRes = await getGuruTasks();

        const realisasi = realisasiRes || [];
        const tasks = tasksRes.data || [];

        const mapped = realisasi.map((r) => {
          let kegiatanNama = "-";
          let industriNama = "-";

          for (const industriGroup of tasks) {
            if (industriGroup.industri?.id === r.industri_id) {
              const task = industriGroup.tasks.find(
                (t) => t.kegiatan?.id === r.kegiatan_id
              );
              if (task) {
                kegiatanNama = task.kegiatan?.jenis || "-";
                industriNama = industriGroup.industri?.nama || "-";
                break;
              }
            }
          }

          return {
            // === UNTUK TABLE ===
            kegiatan: kegiatanNama,
            industri: industriNama,
            tanggal_realisasi: dayjs(r.tanggal_realisasi).format("DD-MM-YYYY"),
            catatan: r.catatan || "-",
            status: r.status,
            bukti: r.bukti_foto_urls?.length || 0,

            // === UNTUK DETAIL ===
            raw: {
              ...r,
              kegiatan_nama: kegiatanNama,
              industri_nama: industriNama,
            },
          };
        });

        setData(mapped);
      } catch (err) {
        console.error("Gagal fetch realisasi", err);
      }
    };

    fetchData();
  }, []);

  // Filter
  const kegiatanOptions = [
    "Pembekalan",
    "Pengantaran",
    "Monitoring1",
    "Monitoring2",
    "Penjemputan",
  ];

  // =========================
  // FILTER + PAGINATION
  // =========================
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

  // =========================
  // TABLE COLUMNS
  // =========================
  const columns = [
    { label: "Kegiatan", key: "kegiatan" },
    { label: "Industri", key: "industri" },
    { label: "Tanggal Realisasi", key: "tanggal_realisasi" },
    { label: "Catatan", key: "catatan" },
    { label: "Status", key: "status" },
    { label: "Bukti", key: "bukti" },
    {
    label: "Aksi",
    key: "aksi",
    sortable: false,
    render: (_value, row) => (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedData(row.raw);
          setOpenDetail(true);
        }}
        className="px-3 py-1 text-sm rounded-md !bg-[#641E21] text-white hover:opacity-90"
      >
        Detail
      </button>
    ),
  },
  ];

  // =========================
  // DETAIL FIELDS
  // =========================
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
    },
    { name: "created_at", label: "Dibuat Pada", type: "text" },
  ];

  // =========================
  // EXPORT
  // =========================
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
    if (!exportData.length) return;
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Realisasi");
    XLSX.writeFile(wb, "data_realisasi_kegiatan.xlsx");
    setOpenExport(false);
  };

  const handleExportPDF = () => {
    if (!exportData.length) return;
    const doc = new jsPDF();
    doc.text("Data Realisasi Kegiatan", 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map((d) => Object.values(d)),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [100, 30, 33] },
    });

    doc.save("data_realisasi_kegiatan.pdf");
    setOpenExport(false);
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="bg-white min-h-screen w-full">
      <Header user={user} />

      <div className="flex">
        <div className="hidden md:block">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 min-h-screen p-4 sm:p-6 md:p-10 bg-[#641E21] rounded-tl-3xl shadow-inner">
          {/* HEADER */}
          <div className="flex items-center mb-4 gap-2 relative">
            <h2 className="text-white font-bold text-lg">
              Data Realisasi Kegiatan
            </h2>

            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setOpenExport(!openExport)}
                className="!bg-transparent flex items-center px-3 py-2 text-white hover:bg-white/10 rounded-full"
              >
                <Download size={18} />
              </button>

              {openExport && (
                <div className="absolute left-10 mt-2 !bg-white !border-white border rounded-lg shadow p-2 z-50">
                  <button
                    onClick={handleExportExcel}
                    className="!bg-transparent flex items-center gap-2 px-3 py-2 text-sm hover:!bg-gray-100 w-full"
                  >
                    <FileSpreadsheet size={16} className="text-green-600" />
                    Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="!bg-transparent flex items-center gap-2 px-3 py-2 text-sm hover:!bg-gray-100 w-full"
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


          {/* TABLE */}
          <Table columns={columns} data={paginatedData}/>

          {/* PAGINATION */}
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
            tanggal_realisasi: dayjs(
              selectedData.tanggal_realisasi
            ).format("DD-MM-YYYY"),
            created_at: dayjs(selectedData.created_at).format(
              "DD-MM-YYYY HH:mm"
            ),
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
