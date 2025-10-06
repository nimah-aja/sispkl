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
import { getIndustri } from "../utils/services/admin/get_industri";
import { createIndustri } from "../utils/services/admin/add_industri";
import { deleteIndustri } from "../utils/services/admin/delete_industri";
import { updateIndustri } from "../utils/services/admin/edit_industri"; 
import { getJurusan } from "../utils/services/admin/get_jurusan";

// import assets
import guruImg from "../assets/addSidebar.svg";
import editGrafik from "../assets/editGrafik.svg";
import deleteImg from "../assets/deleteGrafik.svg"; 

export default function IndustriPage() {
  const [search, setSearch] = useState("");
  const [filterIndustri, setFilterIndustri] = useState("");
  const [active, setActive] = useState("sidebarCorporate");
  const [industri, setIndustri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("list");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [jurusanList, setJurusanList] = useState([]);

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
        setJurusanList(jurusanData); // ini array langsung
      } catch (err) {
        console.error("Gagal ambil data jurusan:", err);
      }
    };

    fetchData();
    fetchJurusan();
  }, []);


  // ambil data awal
  const fetchData = async () => {
    setLoading(true);
    const data = await getIndustri();
    setIndustri(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // filter
  // Ambil daftar jurusan unik yang dipakai oleh industri
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

  const matchFilter = filterIndustri
    ? jurusanNama === filterIndustri.toLowerCase()
    : true;

  return matchSearch && matchFilter;
});


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

  // kolom tabel
  const columns = [
    { label: "Nama Industri", key: "nama" },
    { label: "Alamat", key: "alamat" },
    { label: "Bidang", key: "bidang" },
    { label: "Email", key: "email" },
    { label: "No. Telp", key: "no_telp" },
    { label: "Pembimbing", key: "pic" },
    { label: "No. Telp Pembimbing", key: "pic_telp" },
    {
      label: "Jurusan",
      key: "jurusan_id",
      render: (_, row) => {
        const jurusan = jurusanList.find((j) => j.id === row.jurusan_id);
        return jurusan ? jurusan.nama : "-";
      },
    }
  ];

  const dataWithNo = filteredData.map((item, i) => ({ ...item, no: i + 1 }));

  // kolom input
  const inputFields = [
    { label: "Nama Industri", name: "nama", width: "full", minLength: 3 },
    { label: "Alamat", name: "alamat", width: "full", minLength: 10 },
    { label: "Bidang", name: "bidang", width: "half" },
    { label: "Email", name: "email", width: "half" },
    { label: "No. Telp", name: "no_telp", width: "half", minLength: 10 },
    { label: "Pembimbing", name: "pic", width: "half", minLength: 2 },
    { label: "No. Telp Pembimbing", name: "pic_telp", width: "half", minLength: 10 },
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


  // form add
  if (mode === "add") {
    return (
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
            await createIndustri(newIndustri);
            await fetchData();
            toast.success("Data industri berhasil ditambahkan");
            setMode("list");
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
    );
  }

  //form edit
  if (mode === "edit" && selectedRow) {
    return (
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
            await updateIndustri(selectedRow.id, updatedIndustri);
            await fetchData();
            toast.success("Data industri berhasil diperbarui");
            setMode("list");
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
            Industri
          </h2>

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
                showMore
                onMoreClick={(row) => {
                  setSelectedRow(row);
                  setMode("edit");
                }}
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
