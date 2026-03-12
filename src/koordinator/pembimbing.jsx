import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Pagination from "./components/Pagination";

// Import dari service ADMIN, bukan kapro
import { getGuru } from "../utils/services/admin/get_guru";

// components
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Table from "./components/Table";
import Add from "./components/Add";
import SaveConfirmationModal from "./components/Save";
import DeleteConfirmation from "./components/Delete";

// assets
import unduh from "../assets/unduh.svg";
import addImg from "../assets/addSidebar.svg";
import saveImg from "../assets/save.svg";
import deleteImg from "../assets/deleteGrafik.svg";

export default function DataPembimbing() { // Ubah nama komponen jadi DataPembimbing
  const exportRef = useRef(null);
  const navigate = useNavigate();

  const [active, setActive] = useState("Pembimbing");
  const [query, setQuery] = useState("");
  const [kelas, setKelas] = useState("");
  const [pembimbing, setPembimbing] = useState([]); // Ubah state jadi pembimbing

  const [mode, setMode] = useState("list"); // list / add / edit
  const [pendingData, setPendingData] = useState(null);
  const [editData, setEditData] = useState(null);

  const [openExport, setOpenExport] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Koordinator",
  };

  // FILTER OPTIONS
  const filters = [
    {
      label: "Kelas",
      value: kelas,
      options: ["X RPL 1", "X RPL 2", "XI TKJ 1", "XI TKJ 2"],
      onChange: setKelas,
    },
  ];

  // ===============================
  // FETCH DATA PEMBIMBING DARI ADMIN
  // ===============================
  useEffect(() => {
    const fetchPembimbing = async () => {
      try {
        // Panggil getGuru dari service admin
        const res = await getGuru();
        
        // res sudah langsung array dari getGuru (berdasarkan kode getGuru yang Anda berikan sebelumnya)
        const list = Array.isArray(res) ? res : [];
        
        // Filter hanya yang is_pembimbing = true
        const filteredPembimbing = list.filter(guru => guru.is_pembimbing === true);
        
        // Mapping data sesuai kebutuhan tabel
        const mapped = filteredPembimbing.map((item) => ({
          id: item.id,
          nip: item.nip || "-",
          namaPembimbing: item.nama || "-",
          noTelp: item.no_telp || "-",
          // Data tambahan yang mungkin berguna
          is_koordinator: item.is_koordinator || false,
          is_wali_kelas: item.is_wali_kelas || false,
          is_kaprog: item.is_kaprog || false,
        }));

        setPembimbing(mapped);
        console.log("Data pembimbing (is_pembimbing=true):", mapped);
      } catch (err) {
        console.error("Gagal load data pembimbing:", err);
      }
    };

    fetchPembimbing();
  }, []);

  // FILTER
  const filteredPembimbing = pembimbing.filter(
    (item) =>
      item.namaPembimbing.toLowerCase().includes(query.toLowerCase()) &&
      (kelas ? item.kelas === kelas : true)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [query, kelas]);

  // PAGINATION
  const totalPages = Math.ceil(filteredPembimbing.length / itemsPerPage);
  const paginatedData = filteredPembimbing.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // COLUMNS
  const columns = [
    { label: "NIP", key: "nip" },
    { label: "Nama Pembimbing", key: "namaPembimbing" },
    { label: "No. Telp", key: "noTelp" },
  ];

  // EXPORT DATA
  const exportData = filteredPembimbing.map((item, i) => ({
    No: i + 1,
    NIP: item.nip,
    Pembimbing: item.namaPembimbing,
    Telp: item.noTelp,
  }));

  const handleExportExcel = () => {
    if (!exportData.length) return;
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pembimbing");
    XLSX.writeFile(wb, "data_pembimbing.xlsx");
  };

  const handleExportPDF = () => {
    if (!exportData.length) return;
    const doc = new jsPDF();
    doc.text("Data Pembimbing PKL", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map((d) => Object.values(d)),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [100, 30, 33] },
    });
    doc.save("data_pembimbing.pdf");
  };

  // INPUT FIELDS (untuk tambah/edit)
  const inputFields = [
    { label: "NIP", name: "nip", width: "half", minLength: 18, placeholder: "Harus 18 digit" },
    { label: "Nama Pembimbing", name: "namaPembimbing", width: "half", minLength: 2 },
    { label: "No. Telp", name: "noTelp", width: "half", minLength: 10 },
  ];

  // VALIDASI DATA
  const validatePembimbing = (data) => {
    const errors = {};
    if (!data.nip || data.nip.length !== 18) errors.nip = "NIP harus 18 digit";
    if (!data.namaPembimbing) errors.namaPembimbing = "Nama Pembimbing wajib diisi";
    if (!data.noTelp || data.noTelp.length < 10) errors.noTelp = "No. Telp minimal 10 digit";
    return errors;
  };

  // HANDLE EDIT
  const handleEdit = (row) => {
    setSelectedRow(row);
    setEditData(row);
    setMode("edit");
  };

  // RENDER ADD / EDIT 
  if (mode === "add" || (mode === "edit" && editData)) {
    return (
      <>
        <Add
          title={mode === "add" ? "Tambah Pembimbing" : "Edit Pembimbing"}
          fields={inputFields}
          image={addImg}
          existingData={pembimbing.filter((p) => p.nip !== (editData?.nip || ""))}
          initialData={editData || {}}
          onSubmit={(formData, setFieldErrors) => {
            const raw = Object.fromEntries(formData);
            const errors = validatePembimbing(raw);
            if (Object.keys(errors).length > 0) {
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
          message="Apakah kamu yakin ingin menyimpan data pembimbing ini?"
          onClose={() => setIsConfirmSaveOpen(false)}
          onSave={() => {
            if (mode === "add") {
              setPembimbing((prev) => [...prev, pendingData]);
            } else if (mode === "edit") {
              setPembimbing((prev) =>
                prev.map((p) => (p.nip === pendingData.nip ? pendingData : p))
              );
            }
            setMode("list");
            setEditData(null);
            setIsConfirmSaveOpen(false);
          }}
          imageSrc={saveImg}
        />

        <DeleteConfirmation
          isOpen={isDeleteOpen}
          title="Hapus Data Pembimbing"
          message="Apakah kamu yakin ingin menghapus data pembimbing ini?"
          onClose={() => setIsDeleteOpen(false)}
          onDelete={() => {
            setPembimbing((prev) =>
              prev.filter((p) => p.nip !== selectedRow.nip)
            );
            setIsDeleteOpen(false);
            setSelectedRow(null);
          }}
          imageSrc={deleteImg}
        />
      </>
    );
  }

  // RENDER LIST 
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar active={active} setActive={setActive} />

      <div className="flex flex-col flex-1">
        <Header query={query} setQuery={setQuery} user={user} />

        <main className="flex-1 p-6 bg-[#641E21] rounded-tl-3xl">
          <div className="flex items-center mb-4 sm:mb-6 gap-1 w-full relative">
            <h2 className="text-white font-bold text-base sm:text-lg">
              Data Pembimbing
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
            // filters={filters}
            placeholder="Cari pembimbing..."
            // onAddClick={() => setMode("add")}
          />

          <Table
            columns={columns}
            data={paginatedData}
            // showEdit
            // showDelete
            // onEdit={handleEdit}
            // onDelete={(row) => {
            //   setSelectedRow(row);
            //   setIsDeleteOpen(true);
            // }}
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
          title="Hapus Data Perizinan"
          message="Apakah kamu yakin ingin menghapus data perizinan ini?"
          onClose={() => setIsDeleteOpen(false)}
          onDelete={() => {
            console.log("DELETE DATA:", selectedRow);
            setIsDeleteOpen(false);
            setSelectedRow(null);
          }}
          imageSrc={deleteImg}
        />
      </div>
    </div>
  );
}