import React, { useState, useEffect, useRef } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";


// import components
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Add from "./components/Add";
import SaveConfirmationModal from "./components/Save";
import DeleteConfirmationModal from "./components/Delete";
import Pagination from "./components/Pagination";

// import request
import { getJurusan } from "../utils/services/admin/get_jurusan";
import { createJurusan } from "../utils/services/admin/add_jurusan";
import { deleteJurusan } from "../utils/services/admin/delete_jurusan";
import { updateJurusan } from "../utils/services/admin/edit_jurusan"; 
import { getGuru } from "../utils/services/admin/get_guru";


// import assets
import guruImg from "../assets/addSidebar.svg";
import editGrafik from "../assets/editGrafik.svg";
import deleteImg from "../assets/deleteGrafik.svg"; 
import saveImg from "../assets/save.svg"

export default function JurusanPage() {
  const exportRef = useRef(null);
  const [openExport, setOpenExport] = useState(false);
  const [search, setSearch] = useState("");
  const [filterJurusan, setFilterJurusan] = useState("");
  const [active, setActive] = useState("sidebarGrad");
  const [jurusan, setJurusan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("list");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false); 
  const [pendingData, setPendingData] = useState(null); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 
  const [guruList, setGuruList] = useState([]);

  



  const user = JSON.parse(localStorage.getItem("user")) || { name: "Pengguna", role: "Admin" };

  const fetchData = async () => {
    setLoading(true);

    const dataJurusan = await getJurusan();
    const dataGuru = await getGuru();

    const kaprogOnly = dataGuru.filter((g) => g.is_kaprog === true);

    setJurusan(dataJurusan);
    setGuruList(kaprogOnly);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // validasi karakter
  const validateJurusan = (data) => {
    const errors = {};
    if (!data.kode || data.kode.length < 2)
      errors.kode = `Kolom Kode Konsentrasi Keahlian minimal 2 karakter. Tambahkan ${2 - (data.kode?.length || 0)} karakter lagi.`;
    if (!data.nama || data.nama.length < 10)
      errors.nama = `Kolom Nama Konsentrasi Keahlian minimal 10 karakter. Tambahkan ${10 - (data.nama?.length || 0)} karakter lagi.`;
    return errors;
  };

  // reset halaman
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterJurusan]);

  const kodeOptions = [...new Set(jurusan.map((j) => j.kode))];
  
  const filteredData = jurusan.filter((j) => {
    const s = search.toLowerCase();
    const matchSearch =
      j.nama.toLowerCase().includes(s) || j.kode.toLowerCase().includes(s);
    const matchFilter = filterJurusan ? j.kode === filterJurusan : true;
    return matchSearch && matchFilter;
  });

  const dataWithNo = filteredData.map((item, i) => ({ ...item, no: i + 1 }));

  const totalPages = Math.ceil(dataWithNo.length / itemsPerPage);
  const paginatedData = dataWithNo.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    { label: "Kode Konsentrasi Keahlian", key: "kode" },
    { label: "Nama Konsentrasi Keahlian", key: "nama" },
    {
      label: "Kepala Konsentrasi Keahlian",
      key: "kaprog_guru_id",
      render: (_, row) => {
        const guru = guruList.find((g) => g.id === row.kaprog_guru_id);
        return guru ? guru.nama : "-";
      },
    },
  ];


  const inputFields = [
    { label: "Kode Konsentrasi Keahlian", name: "kode", width: "full", minLength: 2, unique: true },
    { label: "Nama Konsentrasi Keahlian", name: "nama", width: "full", minLength: 10 },
    {
      label: "Kepala Program (Kaprog)",
      name: "kaprog_guru_id",
      width: "full",
      type: "select",
      options: guruList.map((g) => ({
        value: g.id,
        label: g.nama,
      })),
    },
  ];

  const exportData = filteredData.map((j, i) => {
    const guru = guruList.find((g) => g.id === j.kaprog_guru_id);

    return {
      No: i + 1,
      "Kode Konsentrasi Keahlian": j.kode,
      "Nama Konsentrasi Keahlian": j.nama,
      Kaprog: guru ? guru.nama : "-",
    };
  });

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Data Konsentrasi Keahlian", 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [[
        "No",
        "Kode Konsentrasi Keahlian",
        "Nama Konsentrasi Keahlian",
        "Kaprog",
      ]],
      body: exportData.map((row) => [
        row.No,
        row["Kode Konsentrasi Keahlian"],
        row["Nama Konsentrasi Keahlian"],
        row.Kaprog,
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [100, 30, 33] },
    });

    doc.save("data-konsentrasi-keahlian.pdf");
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Konsentrasi Keahlian");

    XLSX.writeFile(workbook, "data-konsentrasi-keahlian.xlsx");
  };

  // nutup otomatis
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


  // FORM ADD
  if (mode === "add") {
    return (
      <>
        <Add
          title="Tambah Data Konsentrasi Keahlian"
          fields={inputFields}
          image={guruImg}
          existingData={jurusan}
          onSubmit={async (formData, setFieldErrors) => {
            const newJurusan = Object.fromEntries(formData);

            // convert ke number
            if (newJurusan.kaprog_guru_id)
              newJurusan.kaprog_guru_id = parseInt(newJurusan.kaprog_guru_id);

            const errors = validateJurusan(newJurusan);

            if (Object.keys(errors).length > 0) {
              setFieldErrors(errors);
              toast.error("Harap lengkapi semua data dengan benar sebelum menyimpan!");
              return;
            }

            // kalau valid => tampilkan modal konfirmasi
            setPendingData(newJurusan);
            setIsConfirmSaveOpen(true);
          }}
          onCancel={() => setMode("list")}
          containerStyle={{ maxHeight: "600px" }}
        />

        {/* Modal konfirmasi simpan */}
        <SaveConfirmationModal
          isOpen={isConfirmSaveOpen}
          title="Konfirmasi Simpan"
          message="Apakah kamu yakin ingin menyimpan data konsentrasi keahlian ini?"
          onClose={() => setIsConfirmSaveOpen(false)}
          onSave={async () => {
            try {
              await createJurusan(pendingData);
              await fetchData();
              toast.success("Data konsentrasi keahlian berhasil ditambahkan");
              setIsConfirmSaveOpen(false);
              setMode("list");
            } catch (err) {
              const apiError = err.response?.data?.error;
              const rawMessage = apiError?.message || "";

              if (rawMessage.toLowerCase().includes("jurusan with this kode already exists")) {
                toast.error("Kode konsentrasi keahlian ini sudah ada.");
              } else {
                toast.error(apiError?.message || "Gagal menambahkan data");
              }
            }
          }}
          imageSrc={saveImg}
        />
      </>
    );
  }

  //  FORM EDIT
  if (mode === "edit" && selectedRow) {
    return (
      <>
        <Add
          title="Ubah Data Konsentrasi Keahlian"
          fields={inputFields}
          image={editGrafik}
          existingData={jurusan.filter((j) => j.id !== selectedRow.id)}
          initialData={selectedRow}
          onSubmit={async (formData, setFieldErrors) => {
            const updatedJurusan = Object.fromEntries(formData);

            if (updatedJurusan.kaprog_guru_id)
              updatedJurusan.kaprog_guru_id = parseInt(updatedJurusan.kaprog_guru_id);

            const errors = validateJurusan(updatedJurusan);

            if (Object.keys(errors).length > 0) {
              setFieldErrors(errors);
              toast.error("Harap lengkapi semua data dengan benar sebelum menyimpan!");
              return;
            }

            setPendingData(updatedJurusan);
            setIsConfirmSaveOpen(true);
          }}
          onCancel={() => setMode("list")}
          containerStyle={{ maxHeight: "600px" }}
          backgroundStyle={{ backgroundColor: "#641E21" }}
        />

        <SaveConfirmationModal
          isOpen={isConfirmSaveOpen}
          title="Konfirmasi Simpan Perubahan"
          message="Apakah kamu yakin ingin menyimpan perubahan data ini?"
          onClose={() => setIsConfirmSaveOpen(false)}
          onSave={async () => {
            try {
              await updateJurusan(selectedRow.id, pendingData);
              await fetchData();
              toast.success("Data konsentrasi keahlian berhasil diperbarui");
              setIsConfirmSaveOpen(false);
              setMode("list");
            } catch (err) {
              const apiError = err.response?.data?.error;
              const rawMessage = apiError?.message || "";

              if (rawMessage.toLowerCase().includes("jurusan with this kode already exists")) {
                toast.error("Kode konsentrasi keahlian ini sudah ada.");
              } else {
                toast.error(apiError?.message || "Gagal memperbarui data");
              }
            }
          }}
          imageSrc={saveImg}
        />
      </>
    );
  }

  


  

  // main
  return (
    <div className="bg-white min-h-screen w-full">
      <Header user={user}/>
      <div className="flex flex-col md:flex-row">
        <div className="md:block hidden">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 rounded-none md:rounded-l-3xl bg-[#641E21] shadow-inner">
          <div className="flex items-center mb-4 sm:mb-6 gap-1 w-full relative">
            <h2 className="text-white font-bold text-base sm:text-lg">
              Konsentrasi Keahlian
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
                      downloadExcel();
                      setOpenExport(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 !bg-transparent hover:!bg-gray-100 text-sm w-full"
                  >
                    <FileSpreadsheet size={16} className="text-green-600" />
                    Excel
                  </button>

                  <button
                    onClick={() => {
                      downloadPDF();
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
            filters={[
              {
                label: "Kode Konsentrasi Keahlian",
                value: filterJurusan,
                options: kodeOptions,
                onChange: setFilterJurusan,
              },
            ]}
            onAddClick={() => {
              setOpenExport(false);
              setMode("add");
            }}

            className="mb-4 w-full"
          />


          <div className="mt-4">
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
                    setSelectedRow(row);
                    setMode("edit");
                  }}
                  onDelete={(row) => {
                    setSelectedRow(row);
                    setIsDeleteOpen(true);
                  }}
                />

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
              </>
            )}
          </div>
        </main>

        <DeleteConfirmationModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onDelete={async () => {
            try {
              await deleteJurusan(selectedRow.id);
              await fetchData();
              toast.success("Data konsentrasi keahlian berhasil dihapus");
              setIsDeleteOpen(false);
            } catch (err) {
              console.error(err);
              toast.error("Gagal menghapus data");
            }
          }}
          imageSrc={deleteImg}
        />

      </div>
    </div>
  );
}
