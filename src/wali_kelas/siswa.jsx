import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useRef } from "react";


// components
import Header from "./components/HeaderBiasa";
import Sidebar from "./components/SidebarBiasa";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Pagination from "./components/Pagination";

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
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Wali Kelas",
  };

  const dummyDataSiswa = [
  {
    nisn: "1234567890",
    nama: "Firli Zulfa Azzahra",
    industri: "Emran Digital",
    guru: "Nimah Hidayah S.Pd",
    status: "Aktif",
    tanggalLahir: "01 Juli 2008",
    kelas: "XI RPL 2",
    alamat: "Sigura-gura",
    noTelp: "0882-8298-298",
  },
  {
    nisn: "2234567890",
    nama: "Ahmad Fauzan",
    industri: "Telkom Indonesia",
    guru: "Siti Aminah S.Pd",
    status: "Selesai",
    tanggalLahir: "12 Mei 2007",
    kelas: "XI RPL 1",
    alamat: "Lowokwaru",
    noTelp: "0812-3456-7890",
  },
  // dst...
];

  // load dummy data
  useEffect(() => {
    setSiswa(dummyDataSiswa);
  }, []);

  // reset pagination saat filter/search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  // filter
  const filteredData = siswa.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.nama.toLowerCase().includes(q) ||
      s.nisn.includes(q) ||
      s.kelas.toLowerCase().includes(q);

    const matchFilter = filterStatus ? s.status === filterStatus : true;
    return matchSearch && matchFilter;
  });

  // tambah nomor
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

  // kolom tabel
  const columns = [
    { label: "NISN", key: "nisn" },
    { label: "Nama", key: "nama" },
    { label: "Kelas", key: "kelas" },
    { label: "Industri", key: "industri" },
    { label: "Guru Pembimbing", key: "guru" },
    { label: "Status", key: "status" },
  ];

  const exportData = filteredData.map((item, i) => ({
    No: i + 1,
    NISN: item.nisn,
    Nama: item.nama,
    Kelas: item.kelas,
    Industri: item.industri,
    "Guru Pembimbing": item.guru,
    Status: item.status,
  }));

  const handleExportExcel = () => {
    if (!exportData.length) return;
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
    XLSX.writeFile(wb, "data_siswa.xlsx");
  };

  const handleExportPDF = () => {
    if (!exportData.length) return;
    const doc = new jsPDF();
    doc.text("Data Peserta Didik", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map((d) => Object.values(d)),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [100, 30, 33] },
    });
    doc.save("data_siswa.pdf");
  };


  return (
    <div className="bg-white min-h-screen w-full">
      <Header user={user} />
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-6 bg-[#641E21] rounded-l-3xl">
          <div className="flex items-center mb-4 gap-1 w-full relative">
          <h2 className="text-white font-bold text-lg">
            Data Peserta Didik
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


          <SearchBar
            query={search}
            setQuery={setSearch}
            placeholder="Cari NISN / Nama / Kelas"
            filters={[
              {
                label: "Status",
                value: filterStatus,
                options: ["Aktif", "Selesai"],
                onChange: setFilterStatus,
              },
            ]}
          />

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
