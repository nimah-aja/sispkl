import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// components
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Add from "./components/Add";
import DeleteConfirmationModal from "./components/Delete";
import SaveConfirmationModal from "./components/Save";
import Pagination from "./components/Pagination";

// utils / services
import {
  getTahunAjaran,
  createTahunAjaran,
  updateTahunAjaran,
  deleteTahunAjaran,
  activateTahunAjaran,
} from "../utils/services/admin/tahun_ajaran";

// assets
import addImg from "../assets/addSidebar.svg";
import editImg from "../assets/editGrafik.svg";
import deleteImg from "../assets/deleteGrafik.svg";
import saveImg from "../assets/save.svg";

export default function TahunAjaranPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("list"); // list, add, edit
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [active, setActive] = useState("Tahunajaran");
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const exportRef = useRef(null);
  const [openExport, setOpenExport] = useState(false);

  const user = JSON.parse(localStorage.getItem("user")) || { name: "Admin", role: "Admin" };

  // fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getTahunAjaran();
      setData(res.data);
    } catch (err) {
      toast.error("Gagal mengambil data tahun ajaran");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // filter data
  const filteredData = data.filter((item) =>
    item.nama.toLowerCase().includes(search.toLowerCase()) ||
    item.kode.toLowerCase().includes(search.toLowerCase())
  );

  const dataWithNo = filteredData.map((item, i) => ({ ...item, no: i + 1 }));

  const totalPages = Math.ceil(dataWithNo.length / itemsPerPage);
  const paginatedData = dataWithNo.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    { label: "Kode", key: "kode" },
    { label: "Nama Tahun Ajaran", key: "nama" },
  ];

  const inputFields = [
  { label: "Kode", name: "kode", width: "full", minLength: 1 },
  { label: "Nama Tahun Ajaran", name: "nama", width: "full", minLength: 3 },
];



  // export data
 const exportData = React.useMemo(
  () => dataWithNo.map((item, i) => ({
    No: i + 1,
    Kode: item.kode,
    "Nama Tahun Ajaran": item.nama,
  })),
  [dataWithNo]
);


  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.text("Data Tahun Ajaran", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0] || {})],
      body: exportData.map((item) => Object.values(item)),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [100, 30, 33] },
    });
    doc.save("data_tahun_ajaran.pdf");
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tahun Ajaran");
    XLSX.writeFile(workbook, "data_tahun_ajaran.xlsx");
  };

  // add/edit form submit
  const handleSubmit = async (formData, isEdit = false) => {
  const raw = Object.fromEntries(formData);

  // konversi ke boolean
  const isActive = raw.is_active === "true";

  setPendingData({
    kode: raw.kode,
    nama: raw.nama,
    is_active: isActive,
  });

  setIsConfirmSaveOpen(true);
  return {};
};



  // main page
  if (mode === "add" || (mode === "edit" && selectedRow)) {
    return (
      <>
        <Add
          title={mode === "add" ? "Tambah Tahun Ajaran" : "Ubah Tahun Ajaran"}
          fields={inputFields}
          image={mode === "add" ? addImg : editImg}
          initialData={mode === "edit" ? selectedRow : {}}
          existingData={data.filter((k) => mode === "edit" && k.id !== selectedRow.id)}
          onSubmit={async (formData, setFieldErrors) => {
            const errors = await handleSubmit(formData, mode === "edit");
            if (Object.keys(errors).length > 0) setFieldErrors(errors);
          }}
          onCancel={() => setMode("list")}
          containerStyle={{ maxHeight: "600px" }}
        />

        <SaveConfirmationModal
          isOpen={isConfirmSaveOpen}
          title="Konfirmasi Simpan"
          message={`Apakah kamu yakin ingin ${mode === "add" ? "menambahkan" : "menyimpan perubahan"} data ini?`}
          onClose={() => setIsConfirmSaveOpen(false)}
          onSave={async () => {
            try {
              if (mode === "add") await createTahunAjaran(pendingData);
              else await updateTahunAjaran(selectedRow.id, pendingData);
              await fetchData();
              toast.success(`Tahun ajaran berhasil ${mode === "add" ? "ditambahkan" : "diperbarui"}`);
              setIsConfirmSaveOpen(false);
              setMode("list");
            } catch (err) {
              toast.error(err.response?.data?.error || "Gagal menyimpan data");
            }
          }}
          imageSrc={saveImg}
        />
      </>
    );
  }

  // main list page
  return (
    <div className="bg-white min-h-screen w-full">
      <Header user={user} />
      <div className="flex flex-col md:flex-row">
        <div className="md:block hidden">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 rounded-none md:rounded-l-3xl bg-[#641E21] shadow-inner">
          <div className="flex items-center mb-4 sm:mb-6 gap-1 w-full relative">
            <h2 className="text-white font-bold text-base sm:text-lg">Tahun Ajaran</h2>

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
            query={search}
            setQuery={setSearch}
            placeholder="Pencarian"
            onAddClick={() => setMode("add")}
            className="mb-4 w-full"
          />

          {loading ? (
            <p className="text-center text-white font-semibold">Memuat data...</p>
          ) : (
            <>
              <Table
                columns={columns}
                data={paginatedData}
                showEdit
                showDelete
                onEdit={(row) => {
                  const original = data.find((d) => d.id === row.id);
                  setSelectedRow(original);
                  setMode("edit");
                }}
                onDelete={(row) => {
                  setSelectedRow(row);
                  setIsDeleteOpen(true);
                }}
              />
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-2 text-white">
                  <p className="text-sm sm:text-base">
                    Halaman {currentPage} dari {totalPages} halaman
                  </p>
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
              )}
            </>
          )}
        </main>

        <DeleteConfirmationModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onDelete={async () => {
            try {
              await deleteTahunAjaran(selectedRow.id);
              await fetchData();
              toast.success("Tahun ajaran berhasil dihapus");
              setIsDeleteOpen(false);
            } catch (err) {
              toast.error("Gagal menghapus data");
            }
          }}
          imageSrc={deleteImg}
        />
      </div>
    </div>
  );
}
