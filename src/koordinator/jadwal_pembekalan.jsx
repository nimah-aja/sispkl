import React, { useEffect, useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRef } from "react";


// components
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Pagination from "./components/Pagination";
import Add from "./components/Add";
import SaveConfirmationModal from "./components/Save";
import DeleteConfirmation from "./components/Delete";

// assets
import addImg from "../assets/addSidebar.svg";
import saveImg from "../assets/save.svg";
import deleteImg from "../assets/deleteGrafik.svg";

/* ================= AVATAR INISIAL ================= */
const AvatarInitial = ({ name }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="w-9 h-9 rounded-full bg-[#641E21] text-white flex items-center justify-center font-semibold text-sm ">
      {initials}
    </div>
  );
};

export default function JadwalPembekalan() {
const exportRef = useRef(null);
const [openExport, setOpenExport] = useState(false);

const [isDeleteOpen, setIsDeleteOpen] = useState(false);
const [selectedRow, setSelectedRow] = useState(null);

  const [mode, setMode] = useState("list");
const [editData, setEditData] = useState(null);
const [pendingData, setPendingData] = useState(null);
const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);

  const [active, setActive] = useState("pembekalan");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [data, setData] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Koordinator",
  };

  /* ================= DUMMY DATA ================= */
  useEffect(() => {
    setData([
      {
        tanggal: "15/05/2025",
        waktu: "08.00 - 10.00",
        materi: "Pengenalan PKL",
        pembicara: "Loren Schmitt",
        ruangan: "Aula Utama",
        jurusan: "RPL",
        status: "Aktif",
      },
      {
        tanggal: "15/05/2025",
        waktu: "08.00 - 10.00",
        materi: "Etika Kerja",
        pembicara: "Loren Schmitt",
        ruangan: "Aula Utama",
        jurusan: "RPL",
        status: "Terjadwal",
      },
      {
        tanggal: "15/05/2025",
        waktu: "08.00 - 10.00",
        materi: "Pengenalan PKL",
        pembicara: "Rr.Henning Gratyanis A.",
        ruangan: "Aula Utama",
        jurusan: "RPL",
        status: "Selesai",
      },
      {
        tanggal: "15/05/2025",
        waktu: "08.00 - 10.00",
        materi: "Etika Kerja",
        pembicara: "Diantebes",
        ruangan: "Aula Utama",
        jurusan: "RPL",
        status: "Selesai",
      },
    ]);
  }, []);

  /* ================= FILTER ================= */
  const filteredData = data.filter((item) => {
    const matchQuery =
      item.materi.toLowerCase().includes(query.toLowerCase()) ||
      item.pembicara.toLowerCase().includes(query.toLowerCase());

    const matchStatus = statusFilter
      ? item.status === statusFilter
      : true;

    return matchQuery && matchStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    { label: "Tanggal", key: "tanggal" },
    { label: "Waktu", key: "waktu" },
    { label: "Materi", key: "materi" },
    {
    label: "Pembicara",
    key: "pembicara",
    align: "left",
    render: (value) => (
        <div className="flex items-center gap-2">
        <AvatarInitial name={value} />
        <div>
            <p className="font-semibold text-sm leading-tight">{value}</p>
            <p className="text-xs text-gray-500 leading-tight">
            Pembimbing
            </p>
        </div>
        </div>
    ),
    },

    { label: "Ruangan", key: "ruangan" },
    { label: "Jurusan", key: "jurusan" },
    {
      label: "Status",
      key: "status",
      render: (value) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold
            ${
              value === "Aktif"
                ? "bg-green-100 text-green-700"
                : value === "Terjadwal"
                ? "bg-orange-100 text-orange-700"
                : "bg-gray-200 text-gray-700"
            }
          `}
        >
          {value}
        </span>
      ),
    },
  ];

  const exportData = filteredData.map((item, i) => ({
    No: i + 1,
    Tanggal: item.tanggal,
    Waktu: item.waktu,
    Materi: item.materi,
    Pembicara: item.pembicara,
    Ruangan: item.ruangan,
    Jurusan: item.jurusan,
    Status: item.status,
    }));

    const handleExportExcel = () => {
        if (!exportData.length) return;

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Jadwal Pembekalan");
        XLSX.writeFile(wb, "jadwal_pembekalan.xlsx");
    };

    const handleExportPDF = () => {
        if (!exportData.length) return;

        const doc = new jsPDF();
        doc.text("Jadwal Pembekalan PKL", 14, 15);

        autoTable(doc, {
            startY: 20,
            head: [Object.keys(exportData[0])],
            body: exportData.map((d) => Object.values(d)),
            styles: { fontSize: 10 },
            headStyles: { fillColor: [100, 30, 33] },
        });

        doc.save("jadwal_pembekalan.pdf");
        };




  const inputFields = [
    { label: "Tanggal", name: "tanggal", width: "half" },
    { label: "Waktu", name: "waktu", width: "half" },
    { label: "Materi", name: "materi", width: "full" },
    { label: "Pembicara", name: "pembicara", width: "full" },
    { label: "Ruangan", name: "ruangan", width: "half" },
    { label: "Jurusan", name: "jurusan", width: "half" },
    {
        label: "Status",
        name: "status",
        type: "select",
        options: ["Aktif", "Terjadwal", "Selesai"],
        width: "full",
    },
    ];

const validate = (data) => {
  const errors = {};
  if (!data.tanggal) errors.tanggal = "Tanggal wajib diisi";
  if (!data.waktu) errors.waktu = "Waktu wajib diisi";
  if (!data.materi) errors.materi = "Materi wajib diisi";
  if (!data.pembicara) errors.pembicara = "Pembicara wajib diisi";
  return errors;
};

if (mode === "add" || (mode === "edit" && editData)) {
  return (
    <>
      <Add
        title={mode === "add" ? "Tambah Jadwal" : "Edit Jadwal"}
        fields={inputFields}
        image={addImg}
        initialData={editData || {}}
        onSubmit={(formData, setFieldErrors) => {
          const raw = Object.fromEntries(formData);
          const errors = validate(raw);
          if (Object.keys(errors).length) {
            setFieldErrors(errors);
            return;
          }
          setPendingData(raw);
          setIsConfirmSaveOpen(true);
        }}
        onCancel={() => {
          setMode("list");
          setEditData(null);
        }}
      />

      <SaveConfirmationModal
        isOpen={isConfirmSaveOpen}
        imageSrc={saveImg}
        title="Konfirmasi Simpan"
        message="Yakin ingin menyimpan jadwal?"
        onClose={() => setIsConfirmSaveOpen(false)}
        onSave={() => {
          if (mode === "add") {
            setData((prev) => [...prev, pendingData]);
          } else {
            setData((prev) =>
              prev.map((d) =>
                d === editData ? pendingData : d
              )
            );
          }
          setMode("list");
          setEditData(null);
          setIsConfirmSaveOpen(false);
        }}
      />
    </>
  );
}

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar active={active} setActive={setActive} />

      <div className="flex flex-col flex-1">
        <Header query={query} setQuery={setQuery} user={user} />

        <main className="flex-1 p-6 bg-[#641E21] rounded-tl-3xl">
          {/* ================= TITLE ================= */}
          <div className="flex items-center mb-4 gap-1 w-full relative">
            <h2 className="text-white font-bold text-lg">
                Jadwal Pembekalan
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


          {/* ================= SEARCH & FILTER ================= */}
          <SearchBar
            query={query}
            setQuery={setQuery}
            placeholder="Pencarian"
            filters={[
              {
                label: "Status",
                value: statusFilter,
                options: ["Aktif", "Terjadwal", "Selesai"],
                onChange: setStatusFilter,
              },
            ]}
             onAddClick={() => setMode("add")}
            className="mb-4"
          />

          {/* ================= TABLE ================= */}
          <Table
            columns={columns}
            data={paginatedData}
            showEdit
            showDelete
            onEdit={(row) => {
              setEditData(row);
              setMode("edit");
            }}
            onDelete={(row) => {
              setSelectedRow(row);
              setIsDeleteOpen(true);
            }}
          />

          {/* ================= PAGINATION ================= */}
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
        <DeleteConfirmation
                  isOpen={isDeleteOpen}
                  title="Hapus Surat"
                  message="Yakin ingin menghapus surat ini?"
                  onClose={() => setIsDeleteOpen(false)}
                  onDelete={() => {
                    setPeserta((prev) =>
                      prev.filter((p) => p.noSurat !== selectedRow.noSurat)
                    );
                    setIsDeleteOpen(false);
                    setSelectedRow(null);
                  }}
                  imageSrc={deleteImg}
                />
      </div>
    </div>
  );
}
