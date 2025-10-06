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
import { getSiswa } from "../utils/services/admin/get_siswa";
import { createSiswa } from "../utils/services/admin/add_siswa";
import { deleteSiswa } from "../utils/services/admin/delete_siswa";
import { updateSiswa } from "../utils/services/admin/edit_siswa"; 
import { getKelas } from "../utils/services/admin/get_kelas";


// import assets
import guruImg from "../assets/addSidebar.svg";
import editGrafik from "../assets/editGrafik.svg";
import deleteImg from "../assets/deleteGrafik.svg"; 

export default function SiswaPage() {
  const [search, setSearch] = useState("");
  const [filterSiswa, setFilterSiswa] = useState("");
  const [active, setActive] = useState("sidebarUsers");
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("list");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Guest", role: "admin" };
  const [kelasList, setKelasList] = useState([]);

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

  // filter
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


  // kolom untuk table
  const columns = [
  { label: "Kelas", key: "kelas_id" },
  { label: "Nama Lengkap", key: "nama_lengkap" },
  { label: "NISN", key: "nisn"},
  { label: "Alamat", key: "alamat" },
  { label: "No. Telepon", key: "no_telp" },
  { label: "Tanggal Lahir", key: "tanggal_lahir" },
];

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




  // kolom input
  const inputFields = [
    { label: "Nama Lengkap", name: "nama_lengkap", width: "half", minLength: 2, unique: true },
    { label: "NISN", name: "nisn", width: "half", unique: true },
    { 
      label: "Kelas", 
      name: "kelas_id", 
      width: "half", 
      type: "select", 
      options: kelasList.map((k) => ({ value: k.id, label: k.nama })) 
    },
    { label: "Alamat", name: "alamat", width: "half" },
    { label: "No. Telepon", name: "no_telp", width: "full", minLength:10 },
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

// form add
if (mode === "add") {
  return (
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
          await createSiswa(newSiswa);
          await fetchData();
          toast.success("Data siswa berhasil ditambahkan");
          setMode("list");
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
  );
}

// form edit
if (mode === "edit" && selectedRow) {
  return (
    // EDIT
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
          await updateSiswa(selectedRow.id, updatedSiswa);
          await fetchData();
          toast.success("Data siswa berhasil diperbarui");
          setMode("list");
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
  );
}

  return (
    <div className="bg-white min-h-screen w-full">
      <Header  user={user}/>
      <div className="flex flex-col md:flex-row">
        <div className="md:block hidden">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 rounded-none md:rounded-l-3xl bg-[#641E21] shadow-inner">
          <h2 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-6">
            Siswa
          </h2>

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
              <p className="text-white">Loading data...</p>
            ) : (
              <Table
                columns={columns}
                data={dataWithNo}
                showMore
                onMoreClick={(row) => {
                  const original = siswa.find((s) => s.id === row.id);
                  setSelectedRow(original);
                  setMode("edit");
                }}
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