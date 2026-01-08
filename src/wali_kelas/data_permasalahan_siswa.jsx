import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useRef } from "react";

// Components
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Pagination from "./components/Pagination";

export default function DataPermasalahanSiswa() {
  const exportRef = useRef(null);
  const [openExport, setOpenExport] = useState(false);

  const [active, setActive] = useState("permasalahan");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [dataPermasalahan, setDataPermasalahan] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 2;

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Wali Kelas",
  };


  // ================= DUMMY DATA =================
  const dummyDataPermasalahan = [
    {
      pelapor: "Siswa",
      nama: "Firli Zulfa Azzahra",
      tanggal: "01/05/2025",
      masalah: "Kesulitan memahami materi Matematika",
      status: "Proses",
    },
    {
      pelapor: "Pembimbing",
      nama: "Budi Santoso",
      tanggal: "20/11/2025",
      masalah: "Nilai rapor menurun drastis",
      status: "Selesai",
    },
    {
      pelapor: "Siswa",
      nama: "Maya Anggraini",
      tanggal: "28/11/2025",
      masalah: "Kesulitan adaptasi di sekolah baru",
      status: "Proses",
    },
    {
      pelapor: "Pembimbing",
      nama: "Putri Maharani",
      tanggal: "05/12/2025",
      masalah: "Bolos sekolah tanpa keterangan",
      status: "Selesai",
    },
    {
      pelapor: "Siswa",
      nama: "Andi Pratama",
      tanggal: "15/11/2025",
      masalah: "Konflik dengan teman sekelas",
      status: "Proses",
    },
  ];

  // ================= LOAD DATA =================
  useEffect(() => {
    setDataPermasalahan(dummyDataPermasalahan);
  }, []);

  // reset pagination jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFilter]);

  // ================= HELPER =================
  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split("/");
    return new Date(`${year}-${month}-${day}`);
  };

  // ================= FILTER DATA =================
  const filteredData = dataPermasalahan.filter((item) => {
    const q = search.toLowerCase();

    const matchSearch =
      item.nama.toLowerCase().includes(q) ||
      item.pelapor.toLowerCase().includes(q) ||
      item.masalah.toLowerCase().includes(q);

    const matchStatus = statusFilter ? item.status === statusFilter : true;

    const matchDate = dateFilter
      ? parseDate(item.tanggal).toDateString() ===
        new Date(dateFilter).toDateString()
      : true;

    return matchSearch && matchStatus && matchDate;
  });

  // nomor urut
  const dataWithNo = filteredData.map((item, i) => ({
    ...item,
    no: i + 1,
  }));

  // pagination
  const totalPages = Math.ceil(dataWithNo.length / itemsPerPage);
  const paginatedData = dataWithNo.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ================= TABLE =================
  const columns = [
    { label: "Pelapor", key: "pelapor" },
    { label: "Nama", key: "nama" },
    { label: "Tanggal", key: "tanggal" },
    { label: "Masalah", key: "masalah" },
    { label: "Status", key: "status" },
  ];

  const statusOptions = [...new Set(dataPermasalahan.map((d) => d.status))];

  const exportData = filteredData.map((item, i) => ({
    No: i + 1,
    Pelapor: item.pelapor,
    Nama: item.nama,
    Tanggal: item.tanggal,
    Masalah: item.masalah,
    Status: item.status,
  }));

  const handleExportExcel = () => {
    if (!exportData.length) return;
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Permasalahan Siswa");
    XLSX.writeFile(wb, "data_permasalahan_siswa.xlsx");
  };

  const handleExportPDF = () => {
    if (!exportData.length) return;
    const doc = new jsPDF();
    doc.text("Data Permasalahan Peserta Didik", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map((d) => Object.values(d)),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [100, 30, 33] },
    });
    doc.save("data_permasalahan_siswa.pdf");
  };


  return (
    <div className="bg-white min-h-screen w-full">
      <Header user={user} />

      <div className="flex">
        <div className="hidden md:block">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-6 md:p-10 bg-[#641E21] rounded-l-3xl">
          <div className="flex items-center mb-6 gap-1 w-full relative">
            <h2 className="text-white font-bold text-lg">
              Data Permasalahan Peserta Didik
            </h2>

            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setOpenExport(!openExport)}
                className="flex items-center gap-2 px-3 py-2 text-white !bg-transparent hover:bg-white/10 rounded-full"
              >
                <Download size={18} />
              </button>

              {openExport && (
                <div className="absolute left-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-md p-2 z-50">
                  <button
                    onClick={() => {
                      handleExportExcel();
                      setOpenExport(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 !bg-transparent hover:!bg-gray-100 text-sm w-full"
                  >
                    <FileSpreadsheet size={16} className="text-green-600" />
                    Excel
                  </button>

                  <button
                    onClick={() => {
                      handleExportPDF();
                      setOpenExport(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 !bg-transparent hover:!bg-gray-100 text-sm w-full"
                  >
                    <FileText size={16} className="text-red-600" />
                    PDF
                  </button>
                </div>
              )}
            </div>
            </div>


          {/* SEARCH & FILTER */}
          <SearchBar
            query={search}
            setQuery={setSearch}
            placeholder="Cari nama / pelapor / masalah"
            filters={[
              {
                label: "Status",
                value: statusFilter,
                options: statusOptions,
                onChange: setStatusFilter,
              },
              {
                label: "Tanggal",
                type: "date",
                value: dateFilter,
                onChange: setDateFilter,
              },
            ]}
          />

          {/* TABLE */}
          <Table
                      columns={columns}
                      data={paginatedData}
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
        </main>
      </div>
    </div>
  );
}
