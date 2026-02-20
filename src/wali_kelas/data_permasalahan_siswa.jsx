import React, { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

import Detail from "./components/Detail";
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Pagination from "./components/Pagination";

const STORAGE_KEY = "data_permasalahan_siswa";

export default function DataPermasalahanSiswa() {
  const exportRef = useRef(null);
  const [openExport, setOpenExport] = useState(false);

  const [active, setActive] = useState("permasalahan");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [dataPermasalahan, setDataPermasalahan] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailMode, setDetailMode] = useState("view");

  const itemsPerPage = 10;

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Wali Kelas",
  };

  /* =====================
     DUMMY DATA
  ===================== */
  const dummyDataPermasalahan = [
    {
      id: 1,
      pelapor: "Pembimbing",
      nama: "Firli Zulfa Azzahra",
      tanggal: "01/05/2025",
      industri: "PT Astra Honda",
      masalah: "Kesulitan memahami materi Matematika",
      status: "Proses",
    },
    {
      id: 2,
      pelapor: "Pembimbing",
      nama: "Budi Santoso",
      tanggal: "20/11/2025",
      industri: "PT Astra Honda",
      masalah: "Nilai rapor menurun drastis",
      status: "Selesai",
    },
  ];

  /* =====================
     LOAD LOCAL STORAGE
  ===================== */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setDataPermasalahan(JSON.parse(saved));
    else {
      setDataPermasalahan(dummyDataPermasalahan);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(dummyDataPermasalahan)
      );
    }
  }, []);

  /* =====================
     HELPERS
  ===================== */
  const saveData = (data) => {
    setDataPermasalahan(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split("/");
    return new Date(`${year}-${month}-${day}`);
  };

  /* =====================
     FILTER DATA
  ===================== */
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

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* =====================
     ACTIONS
  ===================== */
  const handleProcess = (id) => {
    setDataPermasalahan((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, status: "Selesai" } : item
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleEditSubmit = (updatedItem) => {
    const updated = dataPermasalahan.map((item) =>
      item.id === updatedItem.id ? updatedItem : item
    );
    saveData(updated);
    setSelectedItem(updatedItem);
  };

  const handleDelete = (id) => {
    const updated = dataPermasalahan.filter((item) => item.id !== id);
    saveData(updated);
    setSelectedItem(null);
  };

  /* =====================
     EXPORT DATA
  ===================== */
  const exportData = filteredData.map((item, i) => ({
    No: i + 1,
    Pelapor: item.pelapor,
    Nama: item.nama,
    Tanggal: item.tanggal,
    Masalah: item.masalah,
    Status: item.status,
  }));

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Permasalahan");
    XLSX.writeFile(wb, "data_permasalahan_siswa.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Data Permasalahan Siswa", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map((d) => Object.values(d)),
    });
    doc.save("data_permasalahan_siswa.pdf");
  };

  /* =====================
     RENDER
  ===================== */
  return (
    <div className="bg-white min-h-screen w-full">
      <Header user={user} />

      <div className="flex">
        <Sidebar active={active} setActive={setActive} />

        <main className="flex-1 p-6 md:p-10 bg-[#641E21] rounded-l-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-bold text-lg">Data Permasalahan</h2>
          </div>

          <SearchBar
            query={search}
            setQuery={setSearch}
            // filters={[
            //   {
            //     label: "Status",
            //     value: statusFilter,
            //     options: ["Proses", "Selesai"],
            //     onChange: setStatusFilter,
            //   },
            // ]}
          />

          <div className="mt-6 space-y-4">
            {paginatedData.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-xl p-4 cursor-pointer"
              >
                <div className="flex justify-between">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-orange-500 rounded-full text-white flex items-center justify-center font-bold">
                      {getInitials(item.nama)}
                    </div>
                    <div>
                      <h3 className="font-bold">{item.nama}</h3>
                      <p className="text-sm text-gray-500">{item.masalah}</p>
                    </div>
                  </div>

                  <span className="text-xs text-gray-500">{item.tanggal}</span>
                </div>

                {/* <div className="flex justify-between mt-3">
                  {item.status === "Proses" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProcess(item.id);
                      }}
                      className="px-3 py-1 bg-orange-400 text-white rounded text-xs"
                    >
                      Proses
                    </button>
                  )}

                  <span
                    className={`text-xs font-semibold ${
                      item.status === "Selesai"
                        ? "text-green-600"
                        : "text-orange-500"
                    }`}
                  >
                    {item.status}
                  </span>
                </div> */}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
                            <div className="flex justify-between items-center mt-0 text-white">
                              <p className="text-sm sm:text-base">
                                Halaman {currentPage} dari {totalPages} halaman
                              </p>
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
            mode={detailMode}
            initialData={selectedItem}
            onClose={() => setSelectedItem(null)}
            onChangeMode={setDetailMode}
            onSubmit={handleEditSubmit}
            onDelete={handleDelete}
            fields={[
              { name: "nama", label: "Nama Siswa" },
              { name: "industri", label: "Nama Industri" },
              { name: "masalah", label: "Permasalahan Siswa" },
              { name: "tanggal", label: "Tanggal" },
            ]}
          />
        )}
      </div>
    </div>
  );
}
