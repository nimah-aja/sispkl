import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useRef } from "react";
import Detail from "./components/Detail";
import Add from "./components/Add";
import SaveConfirmationModal from "./components/Save";

import saveImg from "../assets/save.svg";
import editGrafik from "../assets/editGrafik.svg";


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
  const [mode, setMode] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailMode, setDetailMode] = useState("view");


  const itemsPerPage = 10;

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Pembimbing",
  };


  // ================= DUMMY DATA =================
  const dummyDataPermasalahan = [
    {
      pelapor: "Pembimbing",
      nama: "Firli Zulfa Azzahra",
      tanggal: "01/05/2025",
      industri: "PT Astra Honda",
      masalah: "Kesulitan memahami materi Matematika",
      status: "Proses",
    },
    {
      pelapor: "Pembimbing",
      nama: "Budi Santoso",
      tanggal: "20/11/2025",
      industri: "PT Astra Honda",
      masalah: "Nilai rapor menurun drastis",
      status: "Selesai",
    },
    {
      pelapor: "Pembimbing",
      nama: "Maya Anggraini",
      tanggal: "28/11/2025",
      industri: "PT Astra Honda",
      masalah: "Kesulitan adaptasi di sekolah baru",
      status: "Proses",
    },
    {
      pelapor: "Pembimbing",
      nama: "Putri Maharani",
      tanggal: "05/12/2025",
      industri: "PT Astra Honda",
      masalah: "Bolos sekolah tanpa keterangan",
      status: "Selesai",
    },
    {
      pelapor: "Pembimbing",
      nama: "Andi Pratama",
      tanggal: "15/11/2025",
      industri: "PT Astra Honda",
      masalah: "Konflik dengan teman sekelas",
      status: "Proses",
    },
  ];

  





  const getInitials = (name = "") =>
    name
      .split(" ")
      .map(w => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const avatarColors = [
    "bg-orange-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
  ];

  const handleProcess = (index) => {
    setDataPermasalahan(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, status: "Selesai" } : item
      )
    );
  };


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

  const addFields = [
    {
      label: "Nama Siswa",
      name: "nama",
      width: "full",
    },
    {
      label: "Industri",
      name: "industri",
      width: "full",
    },
    {
      label: "Permasalahan Siswa",
      name: "masalah",
      width: "full",
      type: "textarea",
      rows: 4,
    },
  ];

  if (mode === "add") {
  return (
    <Add
      title="Tambah Permasalahan Siswa"
      fields={addFields}
      image={editGrafik}
      onSubmit={(formData) => {
        const raw = Object.fromEntries(formData);

        if (!raw.masalah) return;

        setDataPermasalahan(prev => [
          {
            pelapor: "Pembimbing",
            tanggal: new Date().toLocaleDateString("id-ID"),
            status: "Proses",
            ...raw,
          },
          ...prev,
        ]);

        setMode("list");
      }}
      onCancel={() => setMode("list")}
    />
  );
}



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
              Data Permasalahan
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
          onAddClick={() => setMode("add")}
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
          <div className="mt-6 space-y-4">
            {filteredData.map((item, index) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedItem(item);
                  setDetailMode("view");
                }}
                className="bg-white rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
              >

                {/* HEADER */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    {/* AVATAR ORANGE FIX */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-500 text-white font-bold text-sm"
                    >
                      {getInitials(item.nama)}
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">
                        {item.nama}
                      </h3>
                      <p className="text-xs text-gray-600">
                        Pelapor: {item.pelapor}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.masalah}
                      </p>
                    </div>
                  </div>

                  {/* Tanggal di kanan atas */}
                  <span className="text-xs text-gray-500">
                    {item.tanggal}
                  </span>
                </div>

                {/* ACTION */}
                <div className="flex justify-between items-center mt-3 ml-15">
                  {/* Tombol Proses di kiri */}
                  {item.status === "Proses" && (
                    <button
                      onClick={() => handleProcess(index)}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ backgroundColor: "#EC933A" }}
                    >
                      Proses
                    </button>
                  )}

                  {/* Status di kanan */}
                  <span
                    className={`text-xs font-semibold ${
                      item.status === "Selesai"
                        ? "text-green-600"
                        : "text-orange-500"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
            

          
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
        {selectedItem && (
          <Detail
            title="Detail Permasalahan Siswa"
            initialData={selectedItem}
            mode={detailMode}
            onClose={() => setSelectedItem(null)}
            onChangeMode={setDetailMode}
            onSubmit={() => setSelectedItem(null)}
            fields={[
              { name: "nama", label: "Nama Siswa" },
              { name: "industri", label: "Nama Industri" },
              { name: "masalah", label: "Permasalahan Siswa", full: true },
              { name: "tanggal", label: "Tanggal" },
              { name: "status", label: "Status" },
            ]}
          />
        )}

        
      </div>
    </div>
  );
}
