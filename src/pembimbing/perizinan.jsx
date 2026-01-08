import React, { useEffect, useState, useRef } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Pagination from "./components/Pagination";
import Add from "./components/Add";
import DeleteConfirmation from "./components/Delete";

import deleteImg from "../assets/deleteGrafik.svg"; 

export default function DataPerizinanKaprog() {
  const exportRef = useRef(null);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [mode, setMode] = useState("list");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [active, setActive] = useState("perizinan");
  const [query, setQuery] = useState("");
  const [openExport, setOpenExport] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Pembimbing",
  };

  // ================= COLUMNS =================
  const columns = [
    { label: "Nama", key: "nama" },
    { label: "Kelas", key: "kelas" },
    { label: "Tanggal", key: "tanggal" },
    { label: "Alasan", key: "alasan" },
    { label: "Status", key: "status" },
  ];

  // ================= DUMMY DATA =================
  const data = [
    {
      id: 1,
      nama: "Firli Zulfa Azzahra",
      kelas: "XI RPL 1",
      tanggal: "17/08/2025",
      alasan: "Sakit",
      status: "Proses",
    },
    {
      id: 2,
      nama: "Firli Zulfa Azzahra",
      kelas: "XI RPL 1",
      tanggal: "17/08/2025",
      alasan: "Dispen lomba",
      status: "Proses",
    },
    {
      id: 3,
      nama: "Firli Zulfa Azzahra",
      kelas: "XI RPL 1",
      tanggal: "17/08/2025",
      alasan: "Sakit",
      status: "Disetujui",
    },
  ];

  // ================= RESET PAGE ON SEARCH =================
  useEffect(() => {
    setCurrentPage(1);
  }, [query, filterKelas, filterStatus]);

  // ================= CLICK OUTSIDE EXPORT =================
  useEffect(() => {
    function handleClickOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setOpenExport(false);
      }
    }

    if (openExport) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openExport]);

  const kelasOptions = [
    "Semua",
    ...new Set(data.map((item) => item.kelas)),
  ];

  const statusOptions = [
    "Semua",
    ...new Set(data.map((item) => item.status)),
  ];


  // ================= FILTER + PAGINATION =================
  const filteredData = data.filter((item) => {
    const matchSearch = Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase());

    const matchStatus =
      filterStatus === "Semua" || item.status === filterStatus;

    const matchKelas =
      filterKelas === "Semua" || item.kelas === filterKelas;

    return matchSearch && matchStatus && matchKelas;
  });


  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ================= EXPORT =================
  const exportData = filteredData.map((item, i) => ({
    No: i + 1,
    Nama: item.nama,
    Kelas: item.kelas,
    Tanggal: item.tanggal,
    Alasan: item.alasan,
    Status: item.status,
  }));

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Perizinan");
    XLSX.writeFile(workbook, "data-perizinan.xlsx");
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.text("Data Perizinan PKL", 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [["No", "Nama", "Kelas", "Tanggal", "Alasan", "Status"]],
      body: exportData.map((row) => [
        row.No,
        row.Nama,
        row.Kelas,
        row.Tanggal,
        row.Alasan,
        row.Status,
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [100, 30, 33] },
    });

    doc.save("data-perizinan.pdf");
  };

  const inputFieldsEdit = [
    { label: "Nama", name: "nama", width: "half", disabled: true },
    { label: "Kelas", name: "kelas", width: "half", disabled: true },
    { label: "Tanggal", name: "tanggal", width: "half", disabled: true },
    {
      label: "Status",
      name: "status",
      type: "select",
      width: "half",
      options: [
        { value: "Proses", label: "Proses" },
        { value: "Disetujui", label: "Disetujui" },
        { value: "Ditolak", label: "Ditolak" },
      ],
    },
    {
      label: "Alasan",
      name: "alasan",
      type: "textarea",
      width: "full",
      minLength: 3,
    },
  ];

  if (mode === "edit" && selectedRow) {
    return (
      <Add
        title="Edit Perizinan PKL"
        fields={inputFieldsEdit}
        existingData={[]} // tidak perlu validasi duplikat
        initialData={{
          nama: selectedRow.nama,
          kelas: selectedRow.kelas,
          tanggal: selectedRow.tanggal,
          alasan: selectedRow.alasan,
          status: selectedRow.status,
        }}
        onSubmit={async (formData) => {
          const raw = Object.fromEntries(formData);

          const updatedData = {
            alasan: raw.alasan,
            status: raw.status,
          };

          console.log("UPDATE PERIZINAN:", updatedData);

          // 🔜 kalau pakai API
          // await updatePerizinan(selectedRow.id, updatedData);

          setMode("list");
        }}
        onCancel={() => setMode("list")}
        containerStyle={{ maxHeight: "500px" }}
        backgroundStyle={{ backgroundColor: "#641E21" }}
      />
    );
  }


  return (
    <div className="bg-white min-h-screen w-full">
      <Header query={query} setQuery={setQuery} user={user} />

      <div className="flex">
        <div className="hidden md:block">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 bg-[#641E21] md:rounded-l-3xl">
          <div className="flex items-center mb-4 sm:mb-6 gap-1 w-full relative">
                              <h2 className="text-white font-bold text-base sm:text-lg">
                                Perizinan
                              </h2>
                  
                              <div className="relative" ref={exportRef}>
                                <button
                                  onClick={() => setOpenExport(!openExport)}
                                  className="flex items-center gap-2 px-3 py-2 text-white !bg-transparent hover:bg-white/10 rounded-full"
                                >
                                  <Download size={18} />
                                </button>
                  
                                {openExport && (
                                  <div className="absolute  left-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-md p-2 z-50">
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
                                        handleExportPdf();
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
            query={query}
            setQuery={setQuery}
            placeholder="Cari perizinan"
            filters={[
              {
                label: "Kelas",
                value: filterKelas,
                options: kelasOptions,
                onChange: setFilterKelas,
              },
              {
                label: "Status",
                value: filterStatus,
                options: statusOptions,
                onChange: setFilterStatus,
              },
            ]}
          />

          <div className="rounded-2xl bg-white">
            <Table 
              columns={columns} 
              data={paginatedData} 
              showEdit 
              showDelete
              onEdit={(row) => {
                setSelectedRow(row);
                setMode("edit");
              }}
              onDelete={(row) => {
                setSelectedRow(row);
                setIsDeleteOpen(true);
              }}/>

            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm">
                  Halaman {currentPage} dari {totalPages}
                </p>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </main>
        <DeleteConfirmation
          isOpen={isDeleteOpen}
          title="Hapus Data Perizinan"
          message="Apakah kamu yakin ingin menghapus data perizinan ini?"
          onClose={() => setIsDeleteOpen(false)}
          onDelete={() => {
            console.log("DELETE DATA:", selectedRow);

            // ❌ belum pakai BE → simulasi aja
            // nanti kalau ada API tinggal ganti isinya

            setIsDeleteOpen(false);
            setSelectedRow(null);
          }}
          imageSrc={deleteImg}
        />

      </div>
    </div>
  );
}
