import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

// import components
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Add from "./components/Add";
import DeleteConfirmationModal from "./components/Delete";
import Pagination from "./components/Pagination";

// import request
import { getJurusan } from "../utils/services/admin/get_jurusan";
import { createJurusan } from "../utils/services/admin/add_jurusan";
import { deleteJurusan } from "../utils/services/admin/delete_jurusan";
import { updateJurusan } from "../utils/services/admin/edit_jurusan"; 

// import assets
import guruImg from "../assets/addSidebar.svg";
import editGrafik from "../assets/editGrafik.svg";
import deleteImg from "../assets/deleteGrafik.svg"; 

export default function JurusanPage() {
  const [search, setSearch] = useState("");
  const [filterJurusan, setFilterJurusan] = useState("");
  const [active, setActive] = useState("sidebarGrad");
  const [jurusan, setJurusan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("list");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  const user = JSON.parse(localStorage.getItem("user")) || { name: "Guest", role: "admin" };

  // ambil data awal
  const fetchData = async () => {
    setLoading(true);
    const data = await getJurusan();
    setJurusan(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // validasi karakter
  const validateJurusan = (data) => {
    const errors = {};
    if (!data.kode || data.kode.length < 2)
      errors.kode = `Kolom Kode Jurusan minimal 2 karakter. Tambahkan ${2 - (data.kode?.length || 0)} karakter lagi.`;
    if (!data.nama || data.nama.length < 10)
      errors.nama = `Kolom Nama Jurusan minimal 10 karakter. Tambahkan ${10 - (data.nama?.length || 0)} karakter lagi.`;
    return errors;
  };

  // reset halaman
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterJurusan]);

  // filter
  const kodeOptions = [...new Set(jurusan.map((j) => j.kode))];
  
  // Filter data 
  const filteredData = jurusan.filter((j) => {
    const s = search.toLowerCase();
    const matchSearch =
      j.nama.toLowerCase().includes(s) || j.kode.toLowerCase().includes(s);
    const matchFilter = filterJurusan ? j.kode === filterJurusan : true;
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

  // kolom tabel
  const columns = [
    { label: "Kode Jurusan", key: "kode" },
    { label: "Nama Jurusan", key: "nama" }
  ];

  // kolom input
  const inputFields = [
    { label: "Kode Jurusan", name: "kode", width: "full", minLength: 2, unique: true },
    { label: "Nama Jurusan", name: "nama", width: "full", minLength: 10 },
  ];

  // form add
  if (mode === "add") {
    return (
      <Add
        title="Tambah Data Jurusan"
        fields={inputFields}
        image={guruImg}
        existingData={jurusan}
        onSubmit={async (formData, setFieldErrors) => {
          const newJurusan = Object.fromEntries(formData);

          // validasi karakter
          const errors = validateJurusan(newJurusan);

          if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
          }

          try {
            await createJurusan(newJurusan);
            await fetchData();
            toast.success("Data jurusan berhasil ditambahkan");
            setMode("list");
          } catch (err) {
            const apiError = err.response?.data?.error;
            const rawMessage = apiError?.message || "";

            // Error kode jurusan sudah ada
            if (rawMessage.toLowerCase().includes("jurusan with this kode already exists")) {
              toast.error("Kode jurusan ini sudah ada.");
              return; 
            }

            // error lain bisa masuk toast umum
            toast.error(apiError?.message || "Gagal menambahkan data");
          }

        }}
        onCancel={() => setMode("list")}
        containerStyle={{ maxHeight: "600px" }}
      />
    );
  }

  //form edit
  if (mode === "edit" && selectedRow) {
    return (
      <Add
        title="Ubah Data Jurusan"
        fields={inputFields}
        image={editGrafik}
        existingData={jurusan.filter((j) => j.id !== selectedRow.id)}
        initialData={selectedRow}
        onSubmit={async (formData, setFieldErrors) => {
          const updatedJurusan = Object.fromEntries(formData);

          // validasi karakter
          const errors = validateJurusan(updatedJurusan);

          if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
          }

          try {
            await updateJurusan(selectedRow.id, updatedJurusan);
            await fetchData();
            toast.success("Data jurusan berhasil diperbarui");
            setMode("list");
          } catch (err) {
            const apiError = err.response?.data?.error;
            const rawMessage = apiError?.message || "";

            // error kode sudah ada
            if (rawMessage.toLowerCase().includes("jurusan with this kode already exists")) {
              toast.error("Kode jurusan ini sudah ada.");
              return; 
            }

            toast.error(err.response?.data?.error?.message || "Gagal memperbarui data");
          }
        }}
        onCancel={() => setMode("list")}
        containerStyle={{ maxHeight: "600px" }}
        backgroundStyle={{ backgroundColor: "#641E21" }}
      />
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
          <h2 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-6">
            Jurusan
          </h2>

          <SearchBar
            query={search}
            setQuery={setSearch}
            placeholder="Pencarian"
            filters={[
              {
                label: "Kode Jurusan",
                value: filterJurusan,
                options: kodeOptions,
                onChange: setFilterJurusan,
              },
            ]}
            onAddClick={() => setMode("add")}
            className="mb-4 w-full"
          />

          <div className="mt-4">
            {loading ? (
              <p className="text-white">Loading data...</p>
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

                <div className="flex justify-center mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
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
              toast.success("Data jurusan berhasil dihapus");
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
