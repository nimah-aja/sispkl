import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

// import components
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Add from "./components/Add";
import DeleteConfirmationModal from "./components/Delete";

// import request
import { getJurusan } from "../utils/services/get_jurusan";
import { createJurusan } from "../utils/services/add_jurusan";
import { deleteJurusan } from "../utils/services/delete_jurusan";
import { updateJurusan } from "../utils/services/edit_jurusan"; 

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

  // filter
  const kodeOptions = [...new Set(jurusan.map((j) => j.kode))];

  const filteredData = jurusan.filter((j) => {
    const s = search.toLowerCase();
    const matchSearch =
      j.nama.toLowerCase().includes(s) || j.kode.toLowerCase().includes(s);
    const matchFilter = filterJurusan ? j.kode === filterJurusan : true;
    return matchSearch && matchFilter;
  });

  // kolom untuk form
  const columns = [
    { label: "Kode Jurusan", key: "kode" },
    { label: "Nama Jurusan", key: "nama" },
  ];

  const dataWithNo = filteredData.map((item, i) => ({
    ...item,
    no: i + 1,
  }));

  const inputFields = [
    { label: "Kode Jurusan", name: "kode", width: "full", minLength: 2 },
    { label: "Nama Jurusan", name: "nama", width: "full", minLength: 10 },
  ];

 // form add
if (mode === "add") {
  return (
    <Add
      title="Tambah Jurusan"
      fields={inputFields}
      image={guruImg}
      existingData={jurusan}
      onSubmit={async (formData, setFieldErrors) => {
        const newJurusan = Object.fromEntries(formData);

        // validasi kode minimal 2 karakter
        const kode = newJurusan.kode || "";
        if (kode.length < 2) {
          const kurang = 2 - kode.length;
          setFieldErrors({
            kode: `Kolom Kode Jurusan minimal 2 karakter. Tambahkan ${kurang} karakter lagi.`
          });
          return;
        }

        // validasi nama minimal 10 karakter
        const nama = newJurusan.nama || "";
        if (nama.length < 10) {
          const kurang = 10 - nama.length;
          setFieldErrors({
            nama: `Kolom Nama Jurusan minimal 10 karakter. Tambahkan ${kurang} karakter lagi.`
          });
          return;
        }

        await createJurusan(newJurusan);
        await fetchData();
        toast.success("Data jurusan berhasil ditambahkan");
        setMode("list");
      }}
      onCancel={() => setMode("list")}
      containerClassName="max-w-3xl bg-white"
      containerStyle={{ maxHeight: "600px" }}
      backgroundStyle={{ backgroundColor: '#E1D6C4' }}
    />
  );
}

// form edit
if (mode === "edit" && selectedRow) {
  return (
    <Add
      title="Edit Jurusan"
      fields={inputFields}
      image={editGrafik}
      existingData={jurusan.filter(j => j.id !== selectedRow.id)}
      initialData={selectedRow}
      onSubmit={async (formData, setFieldErrors) => {
        const updatedJurusan = Object.fromEntries(formData);

        // validasi kode minimal 2 karakter
        const kode = updatedJurusan.kode || "";
        if (kode.length < 2) {
          const kurang = 2 - kode.length;
          setFieldErrors({
            kode: `Kolom Kode Jurusan minimal 2 karakter. Tambahkan ${kurang} karakter lagi.`
          });
          return;
        }

        // validasi nama minimal 10 karakter
        const nama = updatedJurusan.nama || "";
        if (nama.length < 10) {
          const kurang = 10 - nama.length;
          setFieldErrors({
            nama: `Kolom Nama Jurusan minimal 10 karakter. Tambahkan ${kurang} karakter lagi.`
          });
          return;
        }

        await updateJurusan(selectedRow.id, updatedJurusan);
        await fetchData();
        toast.success("Data jurusan berhasil diperbarui");
        setMode("list");
      }}
      onCancel={() => setMode("list")}
      containerClassName="max-w-3xl bg-white"
      containerStyle={{ maxHeight: "600px" }}
      backgroundStyle={{ backgroundColor: '#641E21' }}
    />
  );
}


  return (
    <div className="bg-white min-h-screen w-full">
      <Header />
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
            placeholder="Cari nama / kode jurusan"
            filters={[
              {
                label: "Jurusan",
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
              <Table
                columns={columns}
                data={dataWithNo}
                showEdit
                showDelete
                showMore
                onMoreClick={(row) => alert("Klik more", row)}
                onEdit={(row) => {
                  setSelectedRow(row);
                  setMode("edit"); 
                }}
                onDelete={(row) => {
                  setSelectedRow(row);
                  setIsDeleteOpen(true);
                }}
              />
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
