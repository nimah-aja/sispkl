import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


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
import { getGuru } from "../utils/services/admin/get_guru";
import { createGuru } from "../utils/services/admin/add_guru";
import { deleteGuru } from "../utils/services/admin/delete_guru";
import { updateGuru } from "../utils/services/admin/edit_guru";

// import assets
import guruImg from "../assets/addSidebar.svg";
import editGrafik from "../assets/editGrafik.svg";
import deleteImg from "../assets/deleteGrafik.svg";
import saveImg from "../assets/save.svg";

export default function GuruPage() {
  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef(null);
  const [search, setSearch] = useState("");
  const [filterGuru, setFilterGuru] = useState("");
  const [active, setActive] = useState("sidebarChalk");
  const [guru, setGuru] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("list");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false); 
  const [pendingData, setPendingData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 
  
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Pengguna", role: "Admin" };

  // ambil data awal
  const fetchData = async () => {
    setLoading(true);
    const data = await getGuru();
    setGuru(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // mapping roles ke array string untuk display
  const mappedData = guru.map((item) => {
    const roles = [];
    if (item.is_kaprog) roles.push("Kapro");
    if (item.is_koordinator) roles.push("Koordinator");
    if (item.is_pembimbing) roles.push("Pembimbing");
    if (item.is_wali_kelas) roles.push("Wali Kelas");
    return { ...item, roles: roles.length ? roles : ["Guru"] };
  });

  // reset halaman 
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterGuru]);

  // filter
  const roleOptions = [
    "Kapro",
    "Koordinator",
    "Pembimbing",
    "Wali Kelas",
  ];
  
  // filter data
  const filteredData = mappedData.filter((k) => {
    const s = search.toLowerCase();
    const matchSearch =
      k.nama.toLowerCase().includes(s) ||
      k.kode_guru.toLowerCase().includes(s) ||
      k.roles.some((r) => r.toLowerCase().includes(s)) ||
      k.no_telp.toLowerCase().includes(s) ||
      k.nip.toString().includes(s);

    const matchFilter = filterGuru ? k.roles.includes(filterGuru) : true;

    return matchSearch && matchFilter;
  });

  // Nomor urut 
  const dataWithNo = filteredData.map((item, i) => ({ ...item, no: i + 1 }));

  // Pagination 
  const totalPages = Math.ceil(dataWithNo.length / itemsPerPage);
  const paginatedData = dataWithNo.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // table
  const columns = [
    { label: "Kode Guru", key: "kode_guru", sortable: false },
    { label: "Nama Guru", key: "nama" },
    { label: "NIP", key: "nip", sortable: false },
    { label: "No. Telp", key: "no_telp", sortable: false },
    { label: "Role", key: "roles", type: "select" },
  ];

  // input
  const inputFields = [
    { label: "Kode Guru", name: "kode_guru", width: "half", minLength: 3 },
    { label: "Nama Guru", name: "nama", width: "half", minLength: 2 },
    { label: "NIP", name: "nip", width: "half", minLength: 18, placeholder : "Harus 18 digit" },
    { label: "No. Telp", name: "no_telp", width: "half", minLength: 10, placeholder : "Min 10 digit" },
    { label: "Password", name: "password", type: "password", width: "full", minLength: 6, placeholder : "Min 6 digit" },
    {
      label: "Role",
      name: "roles",
      type: "multiselect",
      width: "full",
      options: [
        { value: "kaprog", label: "Kapro" },
        { value: "koordinator", label: "Koordinator" },
        { value: "pembimbing", label: "Pembimbing" },
        { value: "wali kelas", label: "Wali Kelas" },
      ],
    },
  ];

  const inputFieldsUpdate = [
    { label: "Kode Guru", name: "kode_guru", width: "half", minLength: 3 },
    { label: "Nama Guru", name: "nama", width: "half", minLength: 2 },
    { label: "NIP", name: "nip", width: "half", minLength: 18,    },
    { label: "No. Telp", name: "no_telp", width: "half", minLength: 10 },
    {
      label: "Role",
      name: "roles",
      type: "multiselect",
      width: "full",
      options: [
        { value: "kaprog", label: "Kapro" },
        { value: "koordinator", label: "Koordinator" },
        { value: "pembimbing", label: "Pembimbing" },
        { value: "wali kelas", label: "Wali Kelas" },
      ],
    },
  ];

  // validasi semua field termasuk NIP
  const validateGuru = (data, isEdit = false) => {
    const errors = {};

    if (!data.kode_guru || data.kode_guru.length < 3)
      errors.kode_guru = "Kode Guru minimal 3 karakter";

    if (!data.nama || data.nama.length < 2)
      errors.nama = "Nama minimal 2 karakter";

    if (!data.no_telp || data.no_telp.length < 10)
      errors.no_telp = "No Telp minimal 10 karakter";

    if (!isEdit) {
      if (!data.password || data.password.length < 6)
        errors.password = "Password minimal 6 karakter";
    }

    const nipLen = (data.nip || "").length;
    if (nipLen !== 18) {
      errors.nip = `NIP harus 18 digit (sekarang ${nipLen})`;
    }

    return errors;
  };

  // Export 
  const exportData = React.useMemo(
  () =>
    dataWithNo.map((item, i) => ({
      No: i + 1,
      "Kode Guru": item.kode_guru,
      "Nama Guru": item.nama,
      NIP: item.nip,
      "No. Telp": item.no_telp,
      Role: item.roles.join(", "),
    })),
  [dataWithNo]
);

// PDF
const handleExportPdf = () => {
  const doc = new jsPDF();

  doc.text("Data Guru", 14, 15);

  autoTable(doc, {
    startY: 20,
    head: [Object.keys(exportData[0] || {})],
    body: exportData.map((item) => Object.values(item)),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [100, 30, 33] },
  });

  doc.save("data_guru.pdf");
};

// Excel
const handleExportExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Guru");
  XLSX.writeFile(workbook, "data_guru.xlsx");
};

  // form add
  if (mode === "add") {
    return (
      <>
        <Add
          title="Tambah Data Guru"
          fields={inputFields}
          image={guruImg}
          existingData={guru}
          onSubmit={async (formData, setFieldErrors) => {
            const raw = Object.fromEntries(formData);
            const selectedRoles = formData.getAll("roles");
            const errors = validateGuru(raw, false);

            const newGuru = {
              kode_guru: raw.kode_guru,
              nama: raw.nama,
              nip: raw.nip.trim(),
              no_telp: raw.no_telp,
              password: raw.password,
              is_kaprog: selectedRoles.includes("kaprog"),
              is_koordinator: selectedRoles.includes("koordinator"),
              is_pembimbing: selectedRoles.includes("pembimbing"),
              is_wali_kelas: selectedRoles.includes("wali kelas"),
            };

            try {
              setPendingData(newGuru);
              setIsConfirmSaveOpen(true);
            } catch (err) {
              const apiError = err.response?.data?.error || "";
              const errorMsg = String(apiError);

              if (apiError.toLowerCase().includes("nip already exists")) {
                toast.error("NIP sudah tersedia");
                return;
              }

              if (apiError.toLowerCase().includes("nip must be exactly 18 digits")) {
                toast.error("NIP harus 18 digit");
                return;
              }

              if (apiError.toLowerCase().includes("no telepon already exists")) {
                toast.error("No. Telepon sudah tersedia");
                return;
              }

              if (apiError.toLowerCase().includes("kode guru already exists")) {
                toast.error("Kode Guru sudah tersedia");
                return;
              }

              toast.error("Gagal menambahkan data");


              if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                return;
              }
            }
          }}
          onCancel={() => setMode("list")}
          containerStyle={{ maxHeight: "600px" }}
        />

        <SaveConfirmationModal
          isOpen={isConfirmSaveOpen}
          title="Konfirmasi Simpan"
          message="Apakah kamu yakin ingin menyimpan data guru ini?"
          onClose={() => setIsConfirmSaveOpen(false)}
          onSave={async () => {
            try {
              await createGuru(pendingData);
              await fetchData();
              toast.success("Data guru berhasil ditambahkan");
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

  // form edit
  if (mode === "edit" && selectedRow) {
    return (
      <>
        <Add
          title="Ubah Data Guru"
          fields={inputFieldsUpdate}
          image={editGrafik}
          existingData={guru.filter((k) => k.id !== selectedRow.id)}
          initialData={{
            ...selectedRow,
            roles: [
              selectedRow.is_kaprog && "kaprog",
              selectedRow.is_koordinator && "koordinator",
              selectedRow.is_pembimbing && "pembimbing",
              selectedRow.is_wali_kelas && "wali kelas",
            ].filter(Boolean),
          }}
          onSubmit={async (formData, setFieldErrors) => {
            const raw = Object.fromEntries(formData);
            const selectedRoles = formData.getAll("roles");

            const errors = validateGuru(raw, true);
            if (Object.keys(errors).length > 0) {
              setFieldErrors(errors);
              return;
            }

            const updatedGuru = {
              kode_guru: raw.kode_guru,
              nama: raw.nama,
              nip: raw.nip,
              no_telp: raw.no_telp,
              is_kaprog: selectedRoles.includes("kaprog"),
              is_koordinator: selectedRoles.includes("koordinator"),
              is_pembimbing: selectedRoles.includes("pembimbing"),
              is_wali_kelas: selectedRoles.includes("wali kelas"),
            };

            if (raw.password) updatedGuru.password = raw.password;

            try {
              setPendingData(updatedGuru);
              setIsConfirmSaveOpen(true);
            } catch (err) {
              console.error("Gagal updateGuru:", err.response?.data || err.message);
              toast.error(err.response?.data?.error?.message || "Gagal mengupdate data");
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
              await updateGuru(selectedRow.id, pendingData);
              await fetchData();
              toast.success("Data guru berhasil diperbarui");
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
                      Data Guru
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
            query={search}
            setQuery={setSearch}
            placeholder="Pencarian"
            filters={[
              {
                label: "Role",
                value: filterGuru,
                options: roleOptions,
                onChange: setFilterGuru,
              },
            ]}
            onAddClick={() => setMode("add")}
            className="mb-4 w-[100%]"
          />

          <div className="mt-10">
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
                    const original = guru.find((g) => g.id === row.id);
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
              await deleteGuru(selectedRow.id);
              await fetchData();
              toast.success("Data guru berhasil dihapus");
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
