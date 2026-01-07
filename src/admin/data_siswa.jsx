import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";


// import components
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Add from "./components/Add";
import DeleteConfirmationModal from "./components/Delete";
import SaveConfirmationModal from "./components/Save";
import Pagination from "./components/Pagination"; 

// import request
import { getSiswa } from "../utils/services/admin/get_siswa";
import { createSiswa } from "../utils/services/admin/add_siswa";
import { deleteSiswa } from "../utils/services/admin/delete_siswa";
import { updateSiswa } from "../utils/services/admin/edit_siswa"; 
import { getKelas } from "../utils/services/admin/get_kelas";


// import assets
import guruImg from "../assets/addSidebar.svg";
import editGrafik from "../assets/editGrafik.svg";
import deleteImg from "../assets/deleteGrafik.svg"; 
import saveImg from "../assets/save.svg"

export default function SiswaPage() {
  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef(null);
  const [search, setSearch] = useState("");
  const [filterSiswa, setFilterSiswa] = useState("");
  const [active, setActive] = useState("sidebarUsers");
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("list");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false); 
  const [pendingData, setPendingData] = useState(null); 
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Pengguna", role: "Admin" };
  const [kelasList, setKelasList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  useEffect(() => {
    const fetchKelas = async () => {
      try {
        const data = await getKelas();
        setKelasList(data);
      } catch (err) {
        console.error("Gagal ambil data kelas:", err);
      }
    };
    fetchKelas();
  }, []);


  // ambil data awal
  const fetchData = async () => {
    setLoading(true);
    const data = await getSiswa();
    setSiswa(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // DD.MM.YYYY
  const formatDateToDDMMYYYY = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr; // kalau bukan tanggal valid, balikin apa adanya
    return d.toLocaleDateString("id-ID"); // otomatis jadi dd/mm/yyyy
  };

  // YYYY.MM.DD
  const formatDateToYYYYMMDD = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return ""; // kalau invalid
    return d.toISOString().split("T")[0]; // hasil: yyyy-MM-dd
  };

  // reset halaman
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterSiswa]);

  // filter
  const kelasOptions = [
    ...new Set(
      siswa
        .map((k) => {
          const kelas = kelasList.find((c) => c.id === k.kelas_id);
          return kelas ? kelas.nama : null;
        })
        .filter(Boolean)
    ),
  ];
  
  // Filter data berdasarkan nama kelas, bukan id
  const filteredData = siswa.filter((k) => {
    const s = search.toLowerCase();

    const kelas = kelasList.find((c) => c.id === k.kelas_id);
    const kelasNama = kelas ? kelas.nama.toLowerCase() : "";

    const matchSearch =
      k.nama_lengkap.toLowerCase().includes(s) ||
      k.nisn.toLowerCase().includes(s) ||
      k.alamat.toLowerCase().includes(s) ||
      k.no_telp.toLowerCase().includes(s) ||
      k.tanggal_lahir.toString().includes(s) ||
      kelasNama.includes(s);

    const matchFilter = filterSiswa
      ? kelasNama === filterSiswa.toLowerCase()
      : true;

    return matchSearch && matchFilter;
  });
    
  // Nomor urut 
  const dataWithNo = filteredData.map((item, i) => {
    // cari nama kelas berdasarkan kelas_id
    const kelas = kelasList.find((k) => k.id === item.kelas_id);

    return {
      ...item,
      no: i + 1,
      kelas_id: kelas ? kelas.nama : "-", // kalau ga ada, tampilkan "-"
      tanggal_lahir: formatDateToDDMMYYYY(item.tanggal_lahir), 
    };
  });
  
  // Pagination 
  const totalPages = Math.ceil(dataWithNo.length / itemsPerPage);
  const paginatedData = dataWithNo.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // kolom untuk table
  const columns = [
    { label: "Kelas", key: "kelas_id" },
    { label: "Nama Lengkap", key: "nama_lengkap" },
    { label: "NISN", key: "nisn", sortable: false},
    { label: "Alamat", key: "alamat" },
    { label: "No. Telepon", key: "no_telp", sortable: false },
    { label: "Tanggal Lahir", key: "tanggal_lahir", sortable: false },
  ];

  // kolom input
  const inputFields = [
    { label: "Nama Lengkap", name: "nama_lengkap", width: "half", minLength: 2, unique: true },
    { label: "NISN", name: "nisn", width: "half", unique: true, placeholder: "Harus 10 digit"},
    { 
      label: "Kelas", 
      name: "kelas_id", 
      width: "half", 
      type: "select", 
      options: kelasList.map((k) => ({ value: k.id, label: k.nama })) 
    },
    { label: "Alamat", name: "alamat", width: "half" },
    { label: "No. Telepon", name: "no_telp", width: "full", minLength:10, placeholder: "Min 10 digit" },
    { label: "Tanggal Lahir", name: "tanggal_lahir", width: "full", type: "date" },
  ];

  // validasi nisn
  const validateNISN = (nisn) => {
    const len = (nisn || "").length;
    if (len < 10) {
      return `NISN harus 10 digit. Anda baru memasukkan ${len}, kurang ${10 - len}.`;
    } else if (len > 10) {
      return `NISN harus 10 digit. Anda memasukkan ${len}, kelebihan ${len - 10}.`;
    } else {
      return "NISN harus 10 digit angka.";
    }
  };

  // export
const exportData = dataWithNo.map((item) => ({
  Kelas: item.kelas_id,
  "Nama Lengkap": item.nama_lengkap,
  NISN: item.nisn,
  Alamat: item.alamat,
  "No. Telepon": item.no_telp,
  "Tanggal Lahir": item.tanggal_lahir,
}));

// PDF
const handleExportPdf = () => {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Data Siswa", 14, 15);

  autoTable(doc, {
    startY: 20,
    head: [[
      "Kelas",
      "Nama Lengkap",
      "NISN",
      "Alamat",
      "No. Telepon",
      "Tanggal Lahir",
    ]],
    body: exportData.map((item) => [
      item.Kelas,
      item["Nama Lengkap"],
      item.NISN,
      item.Alamat,
      item["No. Telepon"],
      item["Tanggal Lahir"],
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [100, 30, 33] },
  });

  doc.save("data-siswa.pdf");
};

// Excel
const handleExportExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Siswa");
  XLSX.writeFile(workbook, "data-siswa.xlsx");
};

  // form add
  if (mode === "add") {
    return (
      <>
        <Add
          title="Tambah Data Siswa"
          fields={inputFields}
          image={guruImg}
          existingData={siswa}
          onSubmit={async (formData, setFieldErrors) => {
            const newSiswa = Object.fromEntries(formData);

            // validasi karakter
            const errors = {};
            if (!newSiswa.nama_lengkap || newSiswa.nama_lengkap.trim().length < 3) {
              errors.nama_lengkap = "Nama lengkap minimal 3 karakter.";
            }
            if (!newSiswa.no_telp || newSiswa.no_telp.length < 10) {
              errors.no_telp = "No. telepon minimal 10 karakter.";
            }
            if (Object.keys(errors).length > 0) {
              setFieldErrors(errors);
              return;
            }

            // konversi kelas_id ke number
            newSiswa.kelas_id = parseInt(newSiswa.kelas_id, 10);

            try {
              setPendingData(newSiswa);
              setIsConfirmSaveOpen(true);
            } catch (err) {
              const apiError = err.response?.data?.error;
              const rawMessage = apiError?.message || "";
              const fieldErrors = {};

              // validasi nisn
              if (rawMessage.toLowerCase().includes("nisn must be exactly 10 digits")) {
                fieldErrors.nisn = validateNISN(newSiswa.nisn);
              }

              // error khusus
              if (rawMessage.toLowerCase().includes("kelas not found")) {
                toast.error("Kelas ID tidak ada di sistem");
                return;
              }
              if (/kelas_id must be positive/i.test(rawMessage.trim())) {
                toast.error("Kelas ID harus angka positif");
                return;
              }
              if (rawMessage.toLowerCase().includes("kelas with this nama already exists in the jurusan")) {
                toast.error("Kelas dengan nama tersebut sudah ada");
                return;
              }
              if (rawMessage.toLowerCase().includes("tanggal_lahir")) {
                toast.error("tanggal lahir tidak valid");
                return;
              }

              // fields errors
              if (Object.keys(fieldErrors).length > 0) {
                setFieldErrors(fieldErrors);
                return;
              }

              // error lain
              toast.error(apiError?.message || "Gagal menambahkan data");
            }
          }}
          onCancel={() => setMode("list")}
          containerStyle={{ maxHeight: "600px" }}
        />
        <SaveConfirmationModal
          isOpen={isConfirmSaveOpen}
          title="Konfirmasi Simpan"
          message="Apakah kamu yakin ingin menyimpan data jurusan ini?"
          onClose={() => setIsConfirmSaveOpen(false)}
          onSave={async () => {
            try {
              await createSiswa(pendingData);
              await fetchData();
              toast.success("Data jurusan berhasil ditambahkan");
              setIsConfirmSaveOpen(false);
              setMode("list");
            } catch (err) {
              const apiError = err.response?.data?.error;
              const rawMessage = apiError?.message || "";

              if (rawMessage.toLowerCase().includes("jurusan with this kode already exists")) {
                toast.error("Kode jurusan ini sudah ada.");
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

  // form edit
  if (mode === "edit" && selectedRow) {
    return (
      // EDIT
      <>
        <Add
          title="Ubah Data Siswa"
          fields={inputFields}
          image={editGrafik}
          existingData={siswa.filter((k) => k.id !== selectedRow.id)}
          initialData={{
            ...selectedRow,
            tanggal_lahir: selectedRow.tanggal_lahir
              ? formatDateToYYYYMMDD(selectedRow.tanggal_lahir)
              : "",
          }}
          onSubmit={async (formData, setFieldErrors) => {
            const updatedSiswa = Object.fromEntries(formData);

            // validasi karakter
            const errors = {};
            if (!updatedSiswa.nama_lengkap || updatedSiswa.nama_lengkap.trim().length < 3) {
              errors.nama_lengkap = "Nama lengkap minimal 3 karakter.";
            }
            if (!updatedSiswa.no_telp || updatedSiswa.no_telp.length < 10) {
              errors.no_telp = "No. telepon minimal 10 karakter.";
            }
            if (Object.keys(errors).length > 0) {
              setFieldErrors(errors);
              return;
            }

            // konversi kelas_id
            if (updatedSiswa.kelas_id) {
              updatedSiswa.kelas_id = parseInt(updatedSiswa.kelas_id, 10);
            }

            try {
              setPendingData(updatedSiswa);
              setIsConfirmSaveOpen(true);
            } catch (err) {
              const apiError = err.response?.data?.error;
              const rawMessage = apiError?.message || "";

              const fieldErrors = {};

              // validasi nisn
              if (rawMessage.toLowerCase().includes("nisn must be exactly 10 digits")) {
                fieldErrors.nisn = validateNISN(newSiswa.nisn);
              }

              // error khusus
              if (rawMessage.toLowerCase().includes("kelas not found")) {
                toast.error("Kelas ID tidak ada di sistem");
                return;
              }
              if (/kelas_id must be positive/i.test(rawMessage.trim())) {
                toast.error("Kelas ID harus angka positif");
                return;
              }
              if (rawMessage.toLowerCase().includes("kelas with this nama already exists in the jurusan")) {
                toast.error("Kelas dengan nama tersebut sudah ada");
                return;
              }
              if (rawMessage.toLowerCase().includes("tanggal_lahir")) {
                toast.error("tanggal lahir tidak valid");
                return;
              }

              if (Object.keys(fieldErrors).length > 0) {
                setFieldErrors(fieldErrors);
                return; 
              }

              // error lain
              toast.error(apiError?.message || "Gagal memperbarui data");
            }
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
              await updateSiswa(selectedRow.id, pendingData);
              await fetchData();
              toast.success("Data jurusan berhasil diperbarui");
              setIsConfirmSaveOpen(false);
              setMode("list");
            } catch (err) {
              const apiError = err.response?.data?.error;
              const rawMessage = apiError?.message || "";

              if (rawMessage.toLowerCase().includes("jurusan with this kode already exists")) {
                toast.error("Kode jurusan ini sudah ada.");
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
      <Header  user={user}/>
      <div className="flex flex-col md:flex-row">
        <div className="md:block hidden">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 rounded-none md:rounded-l-3xl bg-[#641E21] shadow-inner">
        <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-2xl font-bold">
                Siswa
              </h2>
  
              {/* EXPORT */}
              <div className="relative -left-314" ref={exportRef}>
                <button
                  onClick={() => setOpenExport(!openExport)}
                  className="flex items-center gap-2 px-4 py-2 !bg-transparent text-white rounded-full"
                >
                  <Download size={20} />
                </button>
  
                {openExport && (
                  <div className="absolute -right-25 -mt-5 p-2 !bg-white border border-[#E1D6C4] rounded-lg shadow-md z-50">
                    <button
                      onClick={() => {
                        handleExportExcel();
                        setOpenExport(false);
                      }}
                      className="flex items-center gap-2 px-3 !bg-transparent py-2 hover:!bg-gray-100 text-sm w-full"
                    >
                      <FileSpreadsheet size={16} className="text-green-500" />
                      Excel
                    </button>
  
                    <button
                      onClick={() => {
                        handleExportPdf();
                        setOpenExport(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 !bg-transparent hover:!bg-gray-100 text-sm w-full"
                    >
                      <FileText size={16} className="text-red-500" />
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
              label: "Kelas",
              value: filterSiswa,
              options: kelasOptions,
              onChange: setFilterSiswa,
            },
          ]}
            onAddClick={() => setMode("add")}
            className="mb-4 w-[100%]"
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
                      const original = siswa.find((s) => s.id === row.id); 
                      setSelectedRow(original);
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
              await deleteSiswa(selectedRow.id);
              await fetchData();
              toast.success("Data siswa berhasil dihapus");
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