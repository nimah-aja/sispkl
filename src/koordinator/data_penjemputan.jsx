import React, { useEffect, useState, useRef } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Pagination from "./components/Pagination";

// components
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Table from "./components/Table";
import Add from "./components/Add";
import SaveConfirmationModal from "./components/Save";
import DeleteConfirmation from "./components/Delete";

// assets
import addImg from "../assets/addSidebar.svg";
import saveImg from "../assets/save.svg";
import deleteImg from "../assets/deleteGrafik.svg";

export default function DataPeserta() {
  const navigate = useNavigate();
  const exportRef = useRef(null);

  const [active, setActive] = useState("suratPenjemputan");
  const [query, setQuery] = useState("");
  const [peserta, setPeserta] = useState([]);

  const [mode, setMode] = useState("list");
  const [editData, setEditData] = useState(null);
  const [pendingData, setPendingData] = useState(null);

  const [openExport, setOpenExport] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Koordinator",
  };

  //  DUMMY DATA 
  useEffect(() => {
    const dummyPeserta = [
      {
        noSurat: "SP-001",
        penerima: "Firli Zulfa Azzahra",
        perihal: "PKL Emran Digital",
        tanggal: "2025-01-05",
        pengirim: "Nimah Hidayah S.Pd",
      },
      {
        noSurat: "SP-002",
        penerima: "Aulia Rahmawati",
        perihal: "PKL Telkom Indonesia",
        tanggal: "2025-01-06",
        pengirim: "Budi Santoso S.Pd",
      },
      {
        noSurat: "SP-003",
        penerima: "Fajar Wicaksono",
        perihal: "PKL PLN",
        tanggal: "2025-01-07",
        pengirim: "Siti Aminah S.Pd",
      },
      {
        noSurat: "SP-004",
        penerima: "Rama Yuda",
        perihal: "PKL Bank BRI",
        tanggal: "2025-01-08",
        pengirim: "Agus Salim S.Pd",
      },
      {
        noSurat: "SP-005",
        penerima: "Dinda Safitri",
        perihal: "PKL Shopee",
        tanggal: "2025-01-09",
        pengirim: "Sri Wahyuni S.Pd",
      },
      {
        noSurat: "SP-006",
        penerima: "Muhammad Rizki",
        perihal: "PKL Tokopedia",
        tanggal: "2025-01-10",
        pengirim: "Hendra Gunawan S.Pd",
      },
    ];

    setPeserta(dummyPeserta);
  }, []);

  //  FILTER 
  const filteredPeserta = peserta.filter(
    (item) =>
      item.penerima.toLowerCase().includes(query.toLowerCase()) ||
      item.noSurat.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  //  PAGINATION 
  const totalPages = Math.ceil(filteredPeserta.length / itemsPerPage);
  const paginatedData = filteredPeserta.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDownloadSurat = (row) => {
  const doc = new jsPDF();

  // Judul
  doc.setFontSize(14);
  doc.text("SURAT PENJEMPUTAN PKL", 105, 20, { align: "center" });

  doc.setFontSize(11);
  doc.text(`No Surat   : ${row.noSurat}`, 20, 40);
  doc.text(`Penerima   : ${row.penerima}`, 20, 50);
  doc.text(`Perihal    : ${row.perihal}`, 20, 60);
  doc.text(`Tanggal    : ${row.tanggal}`, 20, 70);
  doc.text(`Pengirim   : ${row.pengirim}`, 20, 80);

  doc.text(
    "Dengan ini kami menjemput siswa untuk melaksanakan kegiatan Praktik Kerja Lapangan (PKL) sesuai ketentuan yang berlaku.",
    20,
    100,
    { maxWidth: 170 }
  );

  doc.text("Hormat kami,", 140, 125);
  doc.text(row.pengirim, 140, 140);

  doc.save(`Surat_Penjemputan_${row.noSurat}.pdf`);
};


  //  TABLE COLUMNS 
  const columns = [
  { label: "No Surat", key: "noSurat" },
  { label: "Penerima", key: "penerima" },
  { label: "Perihal", key: "perihal" },
  { label: "Tanggal", key: "tanggal" },
  { label: "Pengirim", key: "pengirim" },
  {
    label: "Unduh",
    sortable: false,
    render: (_, row) => (
      <button
        onClick={() => handleDownloadSurat(row)}
        className="!bg-transparent hover:scale-110 transition"
        title="Unduh Surat"
      >
        <Download size={18} className="text-[#641E21]" />
      </button>
    ),
  },
];


  //  EXPORT 
  const exportData = filteredPeserta.map((item, i) => ({
    No: i + 1,
    "No Surat": item.noSurat,
    Penerima: item.penerima,
    Perihal: item.perihal,
    Tanggal: item.tanggal,
    Pengirim: item.pengirim,
  }));

  const handleExportExcel = () => {
    if (!exportData.length) return;
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Surat Penjemputan");
    XLSX.writeFile(wb, "surat_penjemputan.xlsx");
  };

  const handleExportPDF = () => {
    if (!exportData.length) return;
    const doc = new jsPDF();
    doc.text("Data Surat Penjemputan", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map((d) => Object.values(d)),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [100, 30, 33] },
    });
    doc.save("surat_penjemputan.pdf");
  };

  //  FORM FIELDS 
  const inputFields = [
    { label: "No Surat", name: "noSurat", width: "half" },
    { label: "Penerima", name: "penerima", width: "half" },
    { label: "Perihal", name: "perihal", width: "half" },
    { label: "Tanggal", name: "tanggal", type: "date", width: "half" },
    { label: "Pengirim", name: "pengirim", width: "full" },
  ];

  const validate = (data) => {
    const errors = {};
    if (!data.noSurat) errors.noSurat = "No Surat wajib diisi";
    if (!data.penerima) errors.penerima = "Penerima wajib diisi";
    if (!data.perihal) errors.perihal = "Perihal wajib diisi";
    if (!data.tanggal) errors.tanggal = "Tanggal wajib diisi";
    if (!data.pengirim) errors.pengirim = "Pengirim wajib diisi";
    return errors;
  };

  //  ADD / EDIT 
  if (mode === "add" || (mode === "edit" && editData)) {
    return (
      <>
        <Add
          title={mode === "add" ? "Tambah Surat" : "Edit Surat"}
          fields={inputFields}
          image={addImg}
          existingData={peserta.filter(
            (p) => p.noSurat !== (editData?.noSurat || "")
          )}
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
          title="Konfirmasi Simpan"
          message="Yakin ingin menyimpan data surat?"
          onClose={() => setIsConfirmSaveOpen(false)}
          onSave={() => {
            if (mode === "add") {
              setPeserta((prev) => [...prev, pendingData]);
            } else {
              setPeserta((prev) =>
                prev.map((p) =>
                  p.noSurat === pendingData.noSurat ? pendingData : p
                )
              );
            }
            setMode("list");
            setEditData(null);
            setIsConfirmSaveOpen(false);
          }}
          imageSrc={saveImg}
        />
      </>
    );
  }

  //  LIST 
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar active={active} setActive={setActive} />

      <div className="flex flex-col flex-1">
        <Header query={query} setQuery={setQuery} user={user} />

        <main className="flex-1 p-6 bg-[#641E21] rounded-tl-3xl">
          <div className="flex items-center mb-4 sm:mb-6 gap-1 w-full relative">
                                        <h2 className="text-white font-bold text-base sm:text-lg">
                                          Data Surat Penjemputan
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
            placeholder="Cari surat..."
            onAddClick={() => setMode("add")}
          />

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
