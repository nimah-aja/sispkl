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
import { getIndustri } from "../utils/services/admin/get_industri";
import { createIndustri } from "../utils/services/admin/add_industri";
import { deleteIndustri } from "../utils/services/admin/delete_industri";
import { updateIndustri } from "../utils/services/admin/edit_industri"; 
import { getJurusan } from "../utils/services/admin/get_jurusan";
import { getGuru } from "../utils/services/admin/get_guru";



// import assets
import guruImg from "../assets/addSidebar.svg";
import editGrafik from "../assets/editGrafik.svg";
import deleteImg from "../assets/deleteGrafik.svg"; 
import saveImg from "../assets/save.svg";

export default function IndustriPage() {
  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef(null);
  const [search, setSearch] = useState("");
  const [filterIndustri, setFilterIndustri] = useState("");
  const [active, setActive] = useState("sidebarCorporate");
  const [industri, setIndustri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("list");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null); 
  const [jurusanList, setJurusanList] = useState([]);
  const [filterBidang, setFilterBidang] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Pengguna", role: "Admin" };
  const [pembimbingList, setPembimbingList] = useState([]);
  const [selectedPembimbing, setSelectedPembimbing] = useState("");

  const fetchPembimbing = async () => {
    try {
      const guru = await getGuru();

      const pembimbing = guru.filter((g) => g.is_pembimbing === true);

      setPembimbingList(pembimbing);
    } catch (err) {
      console.error("Gagal fetch pembimbing:", err);
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getIndustri();
      setIndustri(data);
      setLoading(false);
    };
  
    const fetchJurusan = async () => {
      try {
        const jurusanData = await getJurusan();
        setJurusanList(jurusanData); 
      } catch (err) {
        console.error("Gagal ambil data jurusan:", err);
      }
    };
  
    fetchData();
    fetchJurusan();
    fetchPembimbing();
  }, []);
  
  
  // ambil data awal
  const fetchData = async () => {
    setLoading(true);
    const data = await getIndustri();
    setIndustri(data);
    setLoading(false);
  };
  
  // useEffect(() => {
  // fetchData();
  // }, []);

  // validasi karakter
  const validateIndustri = (data) => {
    const errors = {};
    if (!data.alamat || data.alamat.length < 10)
      errors.alamat = `Kolom Alamat Industri minimal 10 karakter. Tambahkan ${10 - (data.kode?.length || 0)} karakter lagi.`;
    if (!data.nama || data.nama.length < 3)
      errors.nama = `Kolom Nama Industri minimal 3 karakter. Tambahkan ${3 - (data.nama?.length || 0)} karakter lagi.`;
    if (!data.no_telp || data.no_telp.length < 10)
      errors.no_telp = `Kolom No. telp Industri minimal 10 karakter. Tambahkan ${10 - (data.kode?.length || 0)} karakter lagi.`;
    if (!data.pic || data.pic.length < 2)
      errors.pic = `Kolom PIC Industri minimal 2 karakter. Tambahkan ${2 - (data.nama?.length || 0)} karakter lagi.`;
    if (!data.pic_telp || data.pic_telp.length < 10)
      errors.pic_telp = `Kolom PIC telp Industri minimal 10 karakter. Tambahkan ${10 - (data.nama?.length || 0)} karakter lagi.`;
    return errors;
  };

   // reset halaman 
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterIndustri, filterBidang]);

  // filter
  const jurusanOptions = [
    ...new Set(
      industri
        .map((b) => {
          const jurusan = jurusanList.find((j) => j.id === b.jurusan_id);
          return jurusan ? jurusan.nama : null;
        })
        .filter(Boolean)
    ),
  ];

  const bidangOptions = [
    ...new Set(industri.map((b) => b.bidang).filter(Boolean)),
  ];

  // Filter data berdasarkan jurusan (nama), bukan id
  const filteredData = industri.filter((b) => {
    const s = search.toLowerCase();

    const jurusan = jurusanList.find((j) => j.id === b.jurusan_id);
    const jurusanNama = jurusan ? jurusan.nama.toLowerCase() : "";

    const matchSearch =
      b.nama.toLowerCase().includes(s) ||
      b.alamat.toLowerCase().includes(s) ||
      b.bidang.toLowerCase().includes(s) ||
      b.email.toLowerCase().includes(s) ||
      b.no_telp.toLowerCase().includes(s) ||
      b.pic.toLowerCase().includes(s) || 
      jurusanNama.includes(s);

    const matchFilterJurusan = filterIndustri
    ? jurusanNama === filterIndustri.toLowerCase()
    : true;

    const matchFilterBidang = filterBidang
      ? b.bidang.toLowerCase() === filterBidang.toLowerCase()
      : true;

    return matchSearch && matchFilterJurusan && matchFilterBidang;
  });

  // Nomor urut 
  const dataWithNo = filteredData.map((item, i) => {
      const jurusan = jurusanList.find((j) => j.id === item.jurusan_id);
      return {
        ...item,
        no: i + 1,
        jurusan_nama: jurusan ? jurusan.nama : "-", 
      };
    });

  // Pagination 
  const totalPages = Math.ceil(dataWithNo.length / itemsPerPage);
  const paginatedData = dataWithNo.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // kolom tabel
  const columns = [
    { label: "Nama Industri", key: "nama" },
    { label: "Alamat", key: "alamat" },
    { label: "Bidang", key: "bidang" },
    { label: "Email", key: "email" },
    { label: "No. Telp", key: "no_telp", sortable: false },
    { label: "Pembimbing", key: "pic" },
    { label: "No. Telp Pembimbing", key: "pic_telp", sortable: false },
    {
      label: "Jurusan",
      key: "jurusan_nama", 
      render: (_, row) => {
        const jurusan = jurusanList.find((j) => j.id === row.jurusan_id);
        return jurusan ? jurusan.nama : "-";
      },
    },

  ];

  // kolom input
  const inputFields = [
    { label: "Nama Industri", name: "nama", width: "full", minLength: 3 },
    { label: "Alamat", name: "alamat", width: "full", minLength: 10 },
    { label: "Bidang", name: "bidang", width: "half" },
    { label: "Email", name: "email", width: "half", placeholder : "Contoh : PT@gmail.com" },
    { label: "No. Telp", name: "no_telp", width: "half", minLength: 10, placeholder : "Min 10 digit" },
    {
      label: "Pembimbing",
      name: "pic",
      width: "half",
      type: "select",
      options: pembimbingList.map((p) => ({
        value: p.nama,
        label: p.nama,
      })),
    },

    { label: "No. Telp Pembimbing", name: "pic_telp", width: "half", minLength: 10, placeholder : "Min 10 digit" },
    {
      label: "Jurusan", 
      name: "jurusan_id", 
      width: "half", 
      type: "select",
      options: jurusanList.map((j) => ({
        value: j.id,
        label: j.nama,
      })),
    },
  ];

  // Export
  const exportData = React.useMemo(
  () =>
    dataWithNo.map((item, i) => ({
      No: i + 1,
      "Nama Industri": item.nama,
      Alamat: item.alamat,
      Bidang: item.bidang,
      Email: item.email,
      "No. Telp": item.no_telp,
      Pembimbing: item.pic,
      "No. Telp Pembimbing": item.pic_telp,
      Jurusan: item.jurusan_nama,
    })),
  [dataWithNo]
);

const handleExportPdf = () => {
  const doc = new jsPDF();

  doc.text("Data Industri", 14, 15);

  autoTable(doc, {
    startY: 20,
    head: [Object.keys(exportData[0] || {})],
    body: exportData.map((item) => Object.values(item)),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [100, 30, 33] },
  });

  doc.save("data_industri.pdf");
};

// Excel
const handleExportExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Industri");
  XLSX.writeFile(workbook, "data_industri.xlsx");
};

  // form add
  if (mode === "add") {
    return (
      <>
        <Add
          title="Tambah Data Industri"
          fields={inputFields}
          image={guruImg}
          existingData={industri}
          onSubmit={async (formData, setFieldErrors) => {
            const newIndustri = Object.fromEntries(formData);

            // pastikan jurusan_id jadi integer
            if (newIndustri.jurusan_id) {
              newIndustri.jurusan_id = parseInt(newIndustri.jurusan_id, 10);
            }

            // validasi karakter
            const errors = validateIndustri(newIndustri);

            try {
              setPendingData(newIndustri);
              setIsConfirmSaveOpen(true);
            } catch (err) {
              const apiError = err.response?.data?.error;
              const rawMessage = apiError?.message || "";

              // Error kode industri sudah ada
              if (rawMessage.toLowerCase().includes("email must be a valid email address")) {
                toast.error("email tidak valid");
                return; 
              }

              // Error kode industri sudah ada
              if (rawMessage.toLowerCase().includes("jurusan not found")) {
                toast.error("jurusan tidak tersedia di sistem");
                return; 
              }

              // Error kode industri sudah ada
              if (rawMessage.toLowerCase().includes("email already exists")) {
                toast.error("Alamat email tersebut sudah tersedia");
                return; 
              }

              // Error kode industri sudah ada
              if (rawMessage.toLowerCase().includes("pic phone number already exists")) {
                toast.error("Nomer telepon pembimbing tersebut sudah tersedia");
                return; 
              }

              // Error kode industri sudah ada
              if (rawMessage.toLowerCase().includes("nama industri already exists")) {
                toast.error("Nama industri tersebut sudah tersedia");
                return; 
              }

              // error lain bisa masuk toast umum
              toast.error(apiError?.message || "Gagal menambahkan data");

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
          message="Apakah kamu yakin ingin menyimpan data jurusan ini?"
          onClose={() => setIsConfirmSaveOpen(false)}
          onSave={async () => {
            try {
              await createIndustri(pendingData);
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

  //form edit
  if (mode === "edit" && selectedRow) {
    return (
      <>
        <Add
          title="Ubah Data Industri"
          fields={inputFields}
          image={editGrafik}
          existingData={industri.filter((j) => j.id !== selectedRow.id)}
          initialData={selectedRow}
          onSubmit={async (formData, setFieldErrors) => {
            const updatedIndustri = Object.fromEntries(formData);

            // pastikan jurusan_id jadi integer
            if (updatedIndustri.jurusan_id) {
              updatedIndustri.jurusan_id = parseInt(updatedIndustri.jurusan_id, 10);
            }

            // validasi karakter
            const errors = validateIndustri(updatedIndustri);

            try {
              setPendingData(updatedIndustri);
              setIsConfirmSaveOpen(true);
            } catch (err) {
              const apiError = err.response?.data?.error;
              const rawMessage = apiError?.message || ""

              // Error kode industri sudah ada
              if (rawMessage.toLowerCase().includes("email must be a valid email address")) {
                toast.error("email tidak valid");
                return; 
              }

              // Error kode industri sudah ada
              if (rawMessage.toLowerCase().includes("jurusan not found")) {
                toast.error("jurusan tidak tersedia di sistem");
                return; 
              }

              // Error kode industri sudah ada
              if (rawMessage.toLowerCase().includes("email already exists")) {
                toast.error("Alamat email tersebut sudah tersedia");
                return; 
              }

              // Error kode industri sudah ada
              if (rawMessage.toLowerCase().includes("pic phone number already exists")) {
                toast.error("Nomer telepon pembimbing tersebut sudah tersedia");
                return; 
              }

              // Error kode industri sudah ada
              if (rawMessage.toLowerCase().includes("nama industri already exists")) {
                toast.error("Nama industri tersebut sudah tersedia");
                return; 
              }

              // error lain bisa masuk toast umum
              toast.error(apiError?.message || "Gagal menambahkan data");

              if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                return; 
              }
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
              await updateIndustri(selectedRow.id, pendingData);
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
      <Header user={user}/>
      <div className="flex flex-col md:flex-row">
        <div className="md:block hidden">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 rounded-none md:rounded-l-3xl bg-[#641E21] shadow-inner">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-2xl font-bold">
              Industri
            </h2>

            {/* EXPORT */}
            <div className="relative -left-307" ref={exportRef}>
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
                label: "Jurusan",
                value: filterIndustri,
                options: jurusanOptions,
                onChange: setFilterIndustri,
              },
              {
                label: "Bidang",
                value: filterBidang,
                options: bidangOptions,
                onChange: setFilterBidang,
              },
            ]}
            onAddClick={() => setMode("add")}
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
              await deleteIndustri(selectedRow.id);
              await fetchData();
              toast.success("Data industri berhasil dihapus");
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
