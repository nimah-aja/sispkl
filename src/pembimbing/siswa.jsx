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
import { getGuruTasks } from "../utils/services/pembimbing/guru";

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
        return status;
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

  // 🔥 AMBIL SISWA DARI getGuruTasks SAJA
  useEffect(() => {
    const fetchPeserta = async () => {
      try {
        const res = await getGuruTasks();
        const tasksData = res.data || [];

        const mappedPeserta = tasksData.flatMap((task) =>
          (task.siswa || []).map((siswa) => ({
            username: siswa.username,
            nama: siswa.nama,
            nisn: siswa.nisn || "-",
            kelas: siswa.kelas || "-",
            industri: task.industri?.nama || "-",
            tanggal_mulai: task.tanggal_mulai
              ? dayjs(task.tanggal_mulai).format("DD-MM-YYYY")
              : "-",
            tanggal_selesai: task.tanggal_selesai
              ? dayjs(task.tanggal_selesai).format("DD-MM-YYYY")
              : "-",
            status: mapStatus("Approved"),
          }))
        );

        setPeserta(mappedPeserta);

        const uniqueKelas = [
          ...new Set(mappedPeserta.map((item) => item.kelas)),
        ];
        setKelasOptions(uniqueKelas);
      } catch (err) {
        console.error("Gagal fetch peserta:", err);
      }
    };

    fetchPeserta();
  }, []);

  // KOLOM TABEL
  const columns = [
    { label: "Username", key: "username" },
    { label: "Nama", key: "nama" },
    { label: "NISN", key: "nisn" },
    { label: "Kelas", key: "kelas" },
    { label: "Industri", key: "industri" },
    // { label: "Tanggal Mulai", key: "tanggal_mulai" },
    // { label: "Tanggal Selesai", key: "tanggal_selesai" },
    { label: "Status", key: "status" },
  ];

  const filters = [
    {
      label: "Kelas",
      value: kelas,
      options: kelasOptions,
      onChange: setKelas,
    },
  ];

  const exportData = filteredPeserta.map((item, i) => ({
    No: i + 1,
    Username: item.username,
    Nama: item.nama,
    NISN: item.nisn,
    Kelas: item.kelas,
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

          <SearchBar
            query={query}
            setQuery={setQuery}
            filters={filters}
            placeholder="Cari siswa..."
          />

          <Table columns={columns} data={paginatedData} />

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
    </div>
  );
}
