import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// components
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Table from "./components/Table";
import Pagination from "./components/Pagination";
import Add from "./components/Add";
import SaveConfirmationModal from "./components/Save";
import DeleteConfirmation from "./components/Delete";

// assets
import addImg from "../assets/addSidebar.svg";
import saveImg from "../assets/save.svg";
import deleteImg from "../assets/deleteGrafik.svg";

export default function DataPeserta() {
  const exportRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [openExport, setOpenExport] = useState(false);

  const [active, setActive] = useState("bukti_diterima");
  const [query, setQuery] = useState("");
  const [kelas, setKelas] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [status, setStatus] = useState("");
  const [peserta, setPeserta] = useState([]);

  const [mode, setMode] = useState("list"); 
  const [editData, setEditData] = useState(null);
  const [pendingData, setPendingData] = useState(null);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const namaGuru = localStorage.getItem("nama_guru") || "Guru SMK";
  const user = { name: namaGuru, role: "KAPROG" };

  const navigate = useNavigate();

  // FILTER OPTIONS
  const filters = [
    {
      label: "Kelas",
      value: kelas,
      options: ["X RPL 1", "X RPL 2", "XI TKJ 1", "XI TKJ 2"],
      onChange: setKelas,
    },
    {
      label: "Konsentrasi Keahlian",
      value: jurusan,
      options: ["RPL", "TKJ", "MM", "AKL"],
      onChange: setJurusan,
    },
    {
      label: "Status",
      value: status,
      options: ["Aktif", "Selesai", "Pending"],
      onChange: setStatus,
    },
  ];

  // DUMMY DATA
  useEffect(() => {
    const dummyPeserta = [
      {
        nama: "Firli Zulfa Azzahra",
        kelas: "X RPL 1",
        jurusan: "RPL",
        nomorIndustri: "IND-001",
        namaIndustri: "Emran Digital",
        alamatIndustri: "Jl. Sudirman No.10",
        fotoBukti: "https://via.placeholder.com/50",
        tanggalMulai: "2026-01-15",
        tanggalSelesai: "2026-03-15",
        status: "Aktif",
      },
      {
        nama: "Rama Yuda Pratama",
        kelas: "X RPL 2",
        jurusan: "RPL",
        nomorIndustri: "IND-002",
        namaIndustri: "Telkom Indonesia",
        alamatIndustri: "Jl. Gatot Subroto No.25",
        fotoBukti: "https://via.placeholder.com/50",
        tanggalMulai: "2026-01-20",
        tanggalSelesai: "2026-03-20",
        status: "Aktif",
      },
    ];
    setPeserta(dummyPeserta);
  }, []);

  // FILTERING PESERTA
  const filteredPeserta = peserta.filter((item) => {
    return (
      item.nama.toLowerCase().includes(query.toLowerCase()) &&
      (kelas ? item.kelas === kelas : true) &&
      (jurusan ? item.jurusan === jurusan : true) &&
      (status ? item.status === status : true)
    );
  });

  useEffect(() => setCurrentPage(1), [query, kelas, jurusan, status]);

  const totalPages = Math.ceil(filteredPeserta.length / itemsPerPage);
  const paginatedData = filteredPeserta.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // TABLE COLUMNS
  const columns = [
    { label: "Nama Siswa", key: "nama" },
    { label: "Kelas", key: "kelas" },
    { label: "Konsentrasi Keahlian", key: "jurusan" },
    { label: "Nomor Industri", key: "nomorIndustri" },
    { label: "Nama Industri", key: "namaIndustri" },
    { label: "Alamat Industri", key: "alamatIndustri" },
    { label: "Foto Bukti", key: "fotoBukti", type: "image" },
    { label: "Tanggal Mulai", key: "tanggalMulai" },
    { label: "Tanggal Selesai", key: "tanggalSelesai" },
    { label: "Status", key: "status" },
  ];

  const exportData = filteredPeserta.map((item, i) => ({
    No: i + 1,
    "Nama Siswa": item.nama,
    Kelas: item.kelas,
    "Konsentrasi Keahlian": item.jurusan,
    "Nomor Industri": item.nomorIndustri,
    "Nama Industri": item.namaIndustri,
    "Alamat Industri": item.alamatIndustri,
    "Tanggal Mulai": item.tanggalMulai,
    "Tanggal Selesai": item.tanggalSelesai,
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
      styles: { fontSize: 8 },
      headStyles: { fillColor: [100, 30, 33] },
    });
    doc.save("data_peserta_pkl.pdf");
  };

  // INPUT FIELDS FOR ADD/EDIT
  const inputFields = [
    { label: "Nama Siswa", name: "nama", width: "full" },
    { label: "Kelas", name: "kelas", width: "half" },
    { label: "Konsentrasi Keahlian", name: "jurusan", width: "half" },
    { label: "Nomor Industri", name: "nomorIndustri", width: "half" },
    { label: "Nama Industri", name: "namaIndustri", width: "full" },
    { label: "Alamat Industri", name: "alamatIndustri", width: "full" },
    { label: "Foto Bukti (URL)", name: "fotoBukti", width: "full" },
    { label: "Tanggal Mulai", name: "tanggalMulai", type: "date", width: "half" },
    { label: "Tanggal Selesai", name: "tanggalSelesai", type: "date", width: "half" },
    {
      label: "Status",
      name: "status",
      type: "select",
      options: ["Aktif", "Selesai", "Pending"],
      width: "full",
    },
  ];

  const validate = (data) => {
    const errors = {};
    if (!data.nama) errors.nama = "Nama wajib diisi";
    if (!data.kelas) errors.kelas = "Kelas wajib diisi";
    return errors;
  };

  // ADD / EDIT MODE
  if (mode === "edit" && editData) {
    return (
      <>
        <Add
          title={mode === "add" ? "Tambah Peserta" : "Edit Peserta"}
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
          message="Yakin ingin menyimpan data peserta?"
          onClose={() => setIsConfirmSaveOpen(false)}
          onSave={() => {
            if (mode === "add") {
              setPeserta((prev) => [...prev, pendingData]);
            } else {
              setPeserta((prev) =>
                prev.map((p) => (p.nama === editData.nama ? pendingData : p))
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
    <div className="bg-white min-h-screen w-full">
          {/* HEADER */}
          <Header query={query} setQuery={setQuery} user={user} />
    
          <div className="flex">
            {/* SIDEBAR */}
            <div className="hidden md:block">
              <Sidebar active={active} setActive={setActive} />
            </div>

        <main className="flex-1 h-full min-h-screen p-4 sm:p-6 md:p-10 bg-[#641E21] rounded-tl-3xl shadow-inner">
          <div className="flex items-center mb-4 sm:mb-6 gap-1 w-full relative">
            <h2 className="text-white font-bold text-base sm:text-lg">
              Data Bukti Diterima PKL
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
            query={query}
            setQuery={setQuery}
            filters={filters}
            placeholder="Cari siswa..."
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

          <DeleteConfirmation
            isOpen={isDeleteOpen}
            title="Hapus Peserta"
            message="Yakin ingin menghapus peserta ini?"
            onClose={() => setIsDeleteOpen(false)}
            onDelete={() => {
              setPeserta((prev) =>
                prev.filter((p) => p.nama !== selectedRow.nama)
              );
              setIsDeleteOpen(false);
              setSelectedRow(null);
            }}
            imageSrc={deleteImg}
          />
        </main>
      </div>
    </div>
  );
}
