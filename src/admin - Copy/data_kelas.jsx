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
import { getKelas } from "../utils/services/admin/get_kelas";
import { createKelas } from "../utils/services/admin/add_kelas";
import { deleteKelas } from "../utils/services/admin/delete_kelas";
import { updateKelas } from "../utils/services/admin/edit_kelas";
import { getJurusan } from "../utils/services/admin/get_jurusan";
import { getGuru } from "../utils/services/admin/get_guru";


// import assets
import guruImg from "../assets/addSidebar.svg";
import editGrafik from "../assets/editGrafik.svg";
import deleteImg from "../assets/deleteGrafik.svg";
import saveImg from "../assets/save.svg"

export default function KelasPage() {
  const exportRef = useRef(null);
  const [openExport, setOpenExport] = useState(false);
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [active, setActive] = useState("sidebarBook");
  const [kelas, setKelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("list");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false); 
  const [pendingData, setPendingData] = useState(null); 
  const [jurusanList, setJurusanList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10 ; 
  const [guruWaliList, setGuruWaliList] = useState([]);


  const user = JSON.parse(localStorage.getItem("user")) || { name: "Pengguna", role: "Admin" };

  useEffect(() => {
    const fetchKelas = async () => {
      try {
        const data = await getKelas();
        setKelas(data);
      } catch (err) {
        console.error("Gagal ambil data kelas:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchJurusan = async () => {
      try {
        const data = await getJurusan();
        setJurusanList(data);
      } catch (err) {
        console.error("Gagal ambil data konsentrasi keahlian:", err);
      }
    };

    fetchKelas();
    fetchJurusan();
  }, []);

  // ambil data awal
  const fetchData = async () => {
    setLoading(true);
    const data = await getKelas();
    setKelas(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // reset halaman
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterKelas]);

  // filter
  const jurusanOptions = [
    ...new Set(
      kelas
        .map((k) => {
          const jurusan = jurusanList.find((j) => j.id === k.jurusan_id);
          return jurusan ? jurusan.nama : null;
        })
        .filter(Boolean)
    ),
  ];

  // guru wali kelas
  useEffect(() => {
    const fetchKelas = async () => {
      try {
        const data = await getKelas();
        setKelas(data);
      } catch (err) {
        console.error("Gagal ambil data kelas:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchJurusan = async () => {
      try {
        const data = await getJurusan();
        setJurusanList(data);
      } catch (err) {
        console.error("Gagal ambil data konsentrasi keahlian:", err);
      }
    };

    const fetchGuru = async () => {
      try {
        const data = await getGuru();
        setGuruWaliList(data.filter((g) => g.is_wali_kelas));
      } catch (err) {
        console.error("Gagal ambil data guru:", err);
      }
    };

    fetchKelas();
    fetchJurusan();
    fetchGuru();
  }, []);

  
  // Filter data
  const filteredData = kelas.filter((k) => {
    const s = search.toLowerCase();

    const jurusan = jurusanList.find((j) => j.id === k.jurusan_id);
    const jurusanNama = jurusan ? jurusan.nama.toLowerCase() : "";

    const matchSearch =
      k.nama.toLowerCase().includes(s) || jurusanNama.includes(s);

    const matchFilter = filterKelas
      ? jurusanNama === filterKelas.toLowerCase()
      : true;

    return matchSearch && matchFilter;
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
    {
      label: "Konsentrasi Keahlian",
      key: "jurusan_nama",
      render: (_, row) => {
        const jurusan = jurusanList.find((j) => j.id === row.jurusan_id);
        return jurusan ? jurusan.nama : "-";
      },
    },
    { label: "Nama Kelas", key: "nama" },
    {
      label: "Wali Kelas",
      key: "wali_kelas_guru_id",
      render: (_, row) =>
        guruWaliList.find((g) => g.id === row.wali_kelas_guru_id)?.nama || "-",
    },
  ];

  // cek guru udah jadi wakel di kelas lain?
  const isGuruDipakai = (guruId, currentKelasId = null) => {
    return kelas.some(
      (k) =>
        k.wali_kelas_guru_id === guruId &&
        (currentKelasId ? k.id !== currentKelasId : true)
    );
  };

  // mode add
  const waliKelasOptionsAdd = guruWaliList.map((g) => ({
    value: g.id,
    label: g.nama,
    disabled: isGuruDipakai(g.id),
  }));

  // mode edit
  const waliKelasOptionsEdit = [
    {
      value: "REMOVE_WALI",
      label: "— Hapus Wali Kelas —",
    },
    ...guruWaliList.map((g) => ({
      value: g.id,
      label: g.nama,
      disabled: isGuruDipakai(g.id, selectedRow?.id),
    })),
  ];


  // kolom input
    const inputFieldsAdd = [
      {
        label: "Konsentrasi Keahlian",
        name: "jurusan_id",
        width: "full",
        type: "select",
        options: jurusanList.map((j) => ({ value: j.id, label: j.nama })),
      },
      { label: "Nama Kelas", name: "nama", width: "full", minLength: 2 },
      {
        label: "Wali Kelas",
        name: "wali_kelas_guru_id",
        type: "select",
        width: "full",
        options: waliKelasOptionsAdd, 
      },
    ];

    const inputFieldsEdit = [
      {
        label: "Konsentrasi Keahlian",
        name: "jurusan_id",
        width: "full",
        type: "select",
        options: jurusanList.map((j) => ({ value: j.id, label: j.nama })),
      },
      { label: "Nama Kelas", name: "nama", width: "full", minLength: 2 },
      {
        label: "Wali Kelas",
        name: "wali_kelas_guru_id",
        type: "select",
        width: "full",
        options: waliKelasOptionsEdit, 
      },
    ];


   //  Export 
  const exportData = filteredData.map((k, i) => {
    const jurusan = jurusanList.find((j) => j.id === k.jurusan_id);

    return {
      No: i + 1,
      "Konsentrasi Keahlian": jurusan ? jurusan.nama : "-",
      "Nama Kelas": k.nama,
    };
  });

  // PDF
  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Data Kelas", 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [["No", "Konsentrasi Keahlian", "Nama Kelas"]],
      body: exportData.map((row) => [
        row.No,
        row["Konsentrasi Keahlian"],
        row["Nama Kelas"],
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [100, 30, 33] },
    });

    doc.save("data-kelas.pdf");
  };

  // Excel
  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Kelas");
    XLSX.writeFile(workbook, "data-kelas.xlsx");
  };

  // Tutup dropdown export saat klik di luar
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


  // form add
  if (mode === "add") {
    return (
      <>
        <Add
          title="Tambah Data Kelas"
          fields={inputFieldsAdd}
          image={guruImg}
          existingData={kelas}
          onSubmit={async (formData, setFieldErrors) => {
           const newKelas = Object.fromEntries(formData);

            newKelas.jurusan_id = parseInt(newKelas.jurusan_id, 10);
            newKelas.wali_kelas_guru_id = parseInt(
              newKelas.wali_kelas_guru_id,
              10
            );

            
            // validasi karakter
            if (!newKelas.nama || newKelas.nama.length < 2) {
              setFieldErrors({
                nama: "Nama kelas minimal 2 karakter.",
              });
              return;
            }

            if (newKelas.jurusan_id) {
              newKelas.jurusan_id = parseInt(newKelas.jurusan_id, 10);
            }

            try {
              setPendingData(newKelas);
              setIsConfirmSaveOpen(true);
            } catch (err) {
              const apiError = err.response?.data?.error;
              const rawMessage = apiError?.message || "";

              if (rawMessage.toLowerCase().includes("jurusan not found")) {
                toast.error("Konsentrasi keahlian ID tidak ada di sistem");
                return;
              }

              if (
                /jurusan id.*must be a positive number/i.test(rawMessage.trim())
              ) {
                toast.error("konsentrasi keahlian ID harus angka positif");
                return;
              }

              if (
                rawMessage
                  .toLowerCase()
                  .includes("kelas with this nama already exists in the jurusan")
              ) {
                toast.error("Kelas dengan nama tersebut sudah ada");
                return;
              }
            }
          }}
          onCancel={() => setMode("list")}
          containerStyle={{ maxHeight: "600px" }}
        />
        {/*  Modal konfirmasi simpan */}
        <SaveConfirmationModal
          isOpen={isConfirmSaveOpen}
          title="Konfirmasi Simpan"
          message="Apakah kamu yakin ingin menyimpan data kelas ini?"
          onClose={() => setIsConfirmSaveOpen(false)}
          onSave={async () => {
            try {
              await createKelas(pendingData);
              await fetchData();
              toast.success("Data kelas berhasil ditambahkan");
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
          title="Ubah Data Kelas"
          fields={inputFieldsEdit}
          image={editGrafik}
          existingData={kelas.filter((k) => k.id !== selectedRow.id)}
          initialData={selectedRow}
          onSubmit={async (formData, setFieldErrors) => {
            const formObj = Object.fromEntries(formData);

            const isRemoveWali = formObj.wali_kelas_guru_id === "REMOVE_WALI";

            const updatedKelas = {
              nama: formObj.nama,
              jurusan_id: parseInt(
                formObj.jurusan_id || selectedRow.jurusan_id,
                10
              ),
            };

            if (isRemoveWali) {
              updatedKelas.remove_wali_kelas = true;
            } else if (formObj.wali_kelas_guru_id) {
              updatedKelas.wali_kelas_guru_id = parseInt(
                formObj.wali_kelas_guru_id,
                10
              );
            }



            // validasi nama aja (biar tetap aman)
            if (!updatedKelas.nama || updatedKelas.nama.length < 2) {
              setFieldErrors({
                nama: "Nama kelas minimal 2 karakter.",
              });
              return;
            }

            try {
            setPendingData(updatedKelas);
            setIsConfirmSaveOpen(true);
            } catch (err) {
              const apiError = err.response?.data?.error;

              if (apiError?.fields) {
                setFieldErrors(apiError.fields);
                return;
              }

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
          subtitle="Apakah kamu yakin ingin menyimpan perubahan data kelas ini?"
          onClose={() => setIsConfirmSaveOpen(false)}
          onSave={async () => {
            try {
              await updateKelas(selectedRow.id, pendingData);
              await fetchData();
              toast.success("Data kelas berhasil diperbarui");
              setIsConfirmSaveOpen(false);
              setMode("list");
            } catch (err) {
              const apiError = err.response?.data?.error;
              toast.error(apiError?.message || "Gagal memperbarui data");
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
      <Header user={user} />
      <div className="flex flex-col md:flex-row">
        <div className="md:block hidden">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 rounded-none md:rounded-l-3xl bg-[#641E21] shadow-inner">
          <div className="flex items-center mb-4 sm:mb-6 gap-1 w-full relative">
                      <h2 className="text-white font-bold text-base sm:text-lg">
                        Data Kelas
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
                label: "Konsentrasi Keahlian",
                value: filterKelas,
                options: jurusanOptions,
                onChange: setFilterKelas,
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
              await deleteKelas(selectedRow.id);
              await fetchData();
              toast.success("Data kelas berhasil dihapus");
              setIsDeleteOpen(false);
            } catch (err) {
              console.error(err);
              toast.error("Gagal menghapus data");
            }
          }}
          imageSrc={deleteImg}
        />

        {/*  Modal Konfirmasi Simpan */}
        <SaveConfirmationModal
          isOpen={isConfirmSaveOpen}
          title="Konfirmasi Simpan"
          subtitle="Apakah kamu yakin ingin menyimpan data kelas ini?"
          onClose={() => setIsConfirmSaveOpen(false)}
          onSave={async () => {
            try {
              await createKelas(pendingData);
              await fetchData();
              toast.success("Data kelas berhasil ditambahkan");
              setIsConfirmSaveOpen(false);
              setMode("list");
            } catch (err) {
              const apiError = err.response?.data?.error;
              const rawMessage = apiError?.message || "";

              if (rawMessage.toLowerCase().includes("jurusan not found")) {
                toast.error("Konsentrasi keahlian ID tidak ditemukan");
              } else if (
                rawMessage
                  .toLowerCase()
                  .includes("kelas with this nama already exists")
              ) {
                toast.error("Kelas dengan nama tersebut sudah ada di konsentrasi keahlian ini");
              } else {
                toast.error(apiError?.message || "Gagal menambahkan data");
              }
            }
          }}
          imageSrc={saveImg}
        />
      </div>
    </div>
  );
}
