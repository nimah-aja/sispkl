// src/pages/SiswaPage.jsx
import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

// components
import Header from "./components/HeaderBiasa";
import Sidebar from "./components/SidebarBiasa";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Pagination from "./components/Pagination";

// utils
import { getDashboardWaliKelas } from "../utils/services/wakel/dashboard";

export default function SiswaPage() {
  const exportRef = useRef(null);
  const [openExport, setOpenExport] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [active, setActive] = useState("siswa");
  const [siswa, setSiswa] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const user = {
    name: localStorage.getItem("nama_guru") || "Wali Kelas",
    role: "Wali Kelas",
  };

  // ================= FETCH DATA =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDashboardWaliKelas();

        const kelasNama = res.kelas_info?.nama || "-";

        const mapped = (res.siswa_list || []).map((s) => ({
          nisn: s.nisn,
          nama: s.nama,
          kelas: kelasNama,
          industri: s.industri ?? "-",
          pembimbing: s.pembimbing ?? "-",
          status: s.status_pkl,
          alamat: s.alamat_industri ?? "-",
        }));

        setSiswa(mapped);
      } catch (err) {
        console.error("Gagal ambil data siswa:", err);
      }
    };

    fetchData();
  }, []);

  // reset page kalau search / filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  // ================= FILTER =================
  const filteredData = siswa.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.nama.toLowerCase().includes(q) ||
      s.nisn.includes(q) ||
      s.kelas.toLowerCase().includes(q);

    const matchStatus = filterStatus ? s.status === filterStatus : true;

    return matchSearch && matchStatus;
  });

  const dataWithNo = filteredData.map((item, i) => ({
    ...item,
    no: i + 1,
  }));

  // ================= PAGINATION =================
  const totalPages = Math.ceil(dataWithNo.length / itemsPerPage);
  const paginatedData = dataWithNo.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ================= TABLE COLUMN =================
  const columns = [
    { label: "NISN", key: "nisn" },
    { label: "Nama", key: "nama" },
    { label: "Kelas", key: "kelas" },
    { label: "Industri", key: "industri" },
    { label: "Pembimbing", key: "pembimbing" },
    { label: "Status PKL", key: "status" },
  ];

  // ================= EXPORT =================
  const exportData = filteredData.map((s, i) => ({
    No: i + 1,
    NISN: s.nisn,
    Nama: s.nama,
    Kelas: s.kelas,
    Industri: s.industri,
    Pembimbing: s.pembimbing,
    Status: s.status,
  }));

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Siswa PKL");
    XLSX.writeFile(wb, "data_siswa_pkl.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Data Siswa PKL", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map((d) => Object.values(d)),
    });
    doc.save("data_siswa_pkl.pdf");
  };

  // ================= UI =================
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
                className="flex items-center gap-2 px-3 py-2 text-white !bg-transparent hover:bg-white/10 rounded-full "
              >
                <Download />
              </button>

              {openExport && (
                <div className="absolute  mt-2 bg-white rounded-lg shadow-md p-2 z-50">
                  <button
                    onClick={exportExcel}
                    className="!bg-transparent flex items-center gap-2 px-3 py-2 text-sm w-full hover:!bg-gray-100"
                  >
                    <FileSpreadsheet size={16} className="text-green-600"/> Excel
                  </button>
                  <button
                    onClick={exportPDF}
                    className="!bg-transparent flex items-center gap-2 px-3 py-2 text-sm w-full hover:!bg-gray-100"
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

          <Table columns={columns} data={paginatedData} />

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </main>
      </div>
    </div>
  );
}
