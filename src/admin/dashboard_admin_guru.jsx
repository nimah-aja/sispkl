import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

// components
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Add from "./components/Add";
import DeleteConfirmationModal from "./components/Delete";

// services
import { getGuru } from "../utils/services/get_guru";
import { createGuru } from "../utils/services/add_guru";
import { deleteGuru } from "../utils/services/delete_guru";
import { updateGuru } from "../utils/services/edit_guru";

// assets
import guruImg from "../assets/addSidebar.svg";
import editGrafik from "../assets/editGrafik.svg";
import deleteImg from "../assets/deleteGrafik.svg";

export default function GuruPage() {
  const [search, setSearch] = useState("");
  const [filterGuru, setFilterGuru] = useState("");
  const [active, setActive] = useState("sidebarChalk");
  const [guru, setGuru] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("list");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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
      k.kode_guru.toString().includes(s) ||
      k.roles.some((r) => r.toLowerCase().includes(s));

    const matchFilter = filterGuru ? k.roles.includes(filterGuru) : true;

    return matchSearch && matchFilter;
  });

  const columns = [
    { label: "Kode Guru", key: "kode_guru" },
    { label: "Nama Guru", key: "nama" },
    { label: "NIP", key: "nip" },
    { label: "No. Telp", key: "no_telp" },
    { label: "Role", key: "roles", type: "select" },
  ];

  const inputFields = [
    { label: "Kode Guru", name: "kode_guru", width: "half", minLength: 3 },
    { label: "Nama Guru", name: "nama", width: "half", minLength: 2 },
    { label: "NIP", name: "nip", width: "half", minLength: 18 },
    { label: "No. Telp", name: "no_telp", width: "half", minLength: 10 },
    { label: "Password", name: "password", type: "password", width: "full", minLength: 6 },
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
  const validateGuru = (data) => {
    const errors = {};

    if (!data.kode_guru || data.kode_guru.length < 3)
      errors.kode_guru = `Kolom Kode Guru minimal 3 karakter. Tambahkan ${3 - (data.kode_guru?.length || 0)} karakter lagi.`;

    if (!data.nama || data.nama.length < 2)
      errors.nama = `Kolom Nama Guru minimal 2 karakter. Tambahkan ${2 - (data.nama?.length || 0)} karakter lagi.`;

    if (!data.no_telp || data.no_telp.length < 10)
      errors.no_telp = `Kolom Nomer telepon minimal 10 karakter. Tambahkan ${10 - (data.no_telp?.length || 0)} karakter lagi.`;

    if (!data.password || data.password.length < 6)
      errors.password = `Kolom Password minimal 6 karakter. Tambahkan ${6 - (data.password?.length || 0)} karakter lagi.`;

    // validasi NIP 18 digit
    const nipLen = (data.nip || "").length;
    if (nipLen < 18) {
      errors.nip = `NIP harus 18 digit. Anda baru memasukkan ${nipLen}, kurang ${18 - nipLen}.`;
    } else if (nipLen > 18) {
      errors.nip = `NIP harus 18 digit. Anda memasukkan ${nipLen}, kelebihan ${nipLen - 18}.`;
    }

    return errors;
  };

  // FORM ADD
  if (mode === "add") {
    return (
      <Add
        title="Tambah Data Guru"
        fields={inputFields}
        image={guruImg}
        existingData={guru}
        onSubmit={async (formData, setFieldErrors) => {
          const raw = Object.fromEntries(formData);
          const selectedRoles = formData.getAll("roles");
          const errors = validateGuru(raw);

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
            await createGuru(newGuru);
            await fetchData();
            toast.success("Data guru berhasil ditambahkan");
            setMode("list");
          } catch (err) {
            const apiError = err.response?.data?.error || "";

            if (apiError.toLowerCase().includes("nip already exists")) {
              toast.error("NIP sudah tersedia");
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
    );
  }

  // FORM EDIT
  if (mode === "edit" && selectedRow) {
    return (
      <Add
        title="Ubah Data Guru"
        fields={[{ label: "Kode Guru", name: "kode_guru", width: "half", minLength: 3 },
    { label: "Nama Guru", name: "nama", width: "half", minLength: 2 },
    { label: "NIP", name: "nip", width: "half", minLength: 18 },
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
    },]}
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
        onSubmit={async (formData) => {
          const raw = Object.fromEntries(formData);
          const selectedRoles = formData.getAll("roles");

          const errors = validateGuru(raw);
          if (Object.keys(errors).length > 0) {
            // di sini harus ada mekanisme setFieldErrors kalau Add component mendukung
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
            await updateGuru(selectedRow.id, updatedGuru);
            await fetchData();
            toast.success("Data guru berhasil diperbarui");
            setMode("list");
          } catch (err) {
            console.error("Gagal updateGuru:", err.response?.data || err.message);
            toast.error(err.response?.data?.error?.message || "Gagal mengupdate data");
          }
        }}
        onCancel={() => setMode("list")}
        containerStyle={{ maxHeight: "600px" }}
        backgroundStyle={{ backgroundColor: "#641E21" }}
      />
    );
  }

  // LIST TABLE
  return (
    <div className="bg-white min-h-screen w-full">
      <Header />
      <div className="flex flex-col md:flex-row">
        <div className="md:block hidden">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 rounded-none md:rounded-l-3xl bg-[#641E21] shadow-inner">
          <h2 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-6">
            Guru
          </h2>

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

          <div className="mt-4">
            {loading ? (
              <p className="text-white">Loading data...</p>
            ) : (
              <Table
                columns={columns}
                data={filteredData}
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
