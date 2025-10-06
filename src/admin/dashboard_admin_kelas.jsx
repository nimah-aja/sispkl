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
import { getKelas } from "../utils/services/admin/get_kelas";
import { createKelas } from "../utils/services/admin/add_kelas";
import { deleteKelas } from "../utils/services/admin/delete_kelas";
import { updateKelas } from "../utils/services/admin/edit_kelas";
import { getJurusan } from "../utils/services/admin/get_jurusan";

// import assets
import guruImg from "../assets/addSidebar.svg";
import editGrafik from "../assets/editGrafik.svg";
import deleteImg from "../assets/deleteGrafik.svg";

export default function KelasPage() {
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [active, setActive] = useState("sidebarBook");
  const [kelas, setKelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("list");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [jurusanList, setJurusanList] = useState([]);

  const user =
    JSON.parse(localStorage.getItem("user")) || { name: "Guest", role: "admin" };

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
        console.error("Gagal ambil data jurusan:", err);
      }
    };

    fetchKelas();
    fetchJurusan();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const data = await getKelas();
    setKelas(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===== FILTERING =====
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

  // ===== TABLE COLUMNS =====
  const columns = [
    {
      label: "Jurusan",
      key: "jurusan_id",
      render: (_, row) => {
        const jurusan = jurusanList.find((j) => j.id === row.jurusan_id);
        return jurusan ? jurusan.nama : "-";
      },
    },
    { label: "Nama Kelas", key: "nama" },
  ];

  const dataWithNo = filteredData.map((item, i) => ({
    ...item,
    no: i + 1,
  }));

  // ===== INPUT FIELDS =====
  const inputFieldsAdd = [
    {
      label: "Jurusan",
      name: "jurusan_id",
      width: "full",
      type: "select",
      options: jurusanList.map((j) => ({ value: j.id, label: j.nama })),
    },
    { label: "Nama Kelas", name: "nama", width: "full", minLength: 2 },
  ];

  // ===== ADD FORM =====
  if (mode === "add") {
    return (
      <Add
        title="Tambah Data Kelas"
        fields={inputFieldsAdd}
        image={guruImg}
        existingData={kelas}
        onSubmit={async (formData, setFieldErrors) => {
          const newKelas = Object.fromEntries(formData);

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
            await createKelas(newKelas);
            await fetchData();
            toast.success("Data kelas berhasil ditambahkan");
            setMode("list");
          } catch (err) {
            const apiError = err.response?.data?.error;
            const rawMessage = apiError?.message || "";

            if (rawMessage.toLowerCase().includes("jurusan not found")) {
              toast.error("Jurusan ID tidak ada di sistem");
              return;
            }

            if (
              /jurusan id.*must be a positive number/i.test(rawMessage.trim())
            ) {
              toast.error("Jurusan ID harus angka positif");
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
    );
  }

  // ===== EDIT FORM =====
  if (mode === "edit" && selectedRow) {
    return (
      <Add
        title="Ubah Data Kelas"
        fields={[
          {
            label: "Nama Kelas",
            name: "nama",
            width: "full",
            minLength: 2,
          },
        ]}
        image={editGrafik}
        existingData={kelas.filter((k) => k.id !== selectedRow.id)}
        initialData={selectedRow}
        onSubmit={async (formData, setFieldErrors) => {
          const formObj = Object.fromEntries(formData);
          const updatedKelas = { nama: formObj.nama };

          if (!updatedKelas.nama || updatedKelas.nama.length < 2) {
            setFieldErrors({
              nama: "Nama kelas minimal 2 karakter.",
            });
            return;
          }

          try {
            await updateKelas(selectedRow.id, updatedKelas);
            await fetchData();
            toast.success("Data kelas berhasil diperbarui");
            setMode("list");
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
    );
  }

  // ===== MAIN PAGE =====
  return (
    <div className="bg-white min-h-screen w-full">
      <Header user={user} />
      <div className="flex flex-col md:flex-row">
        <div className="md:block hidden">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 rounded-none md:rounded-l-3xl bg-[#641E21] shadow-inner">
          <h2 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-6">
            Kelas
          </h2>

          <SearchBar
            query={search}
            setQuery={setSearch}
            placeholder="Pencarian"
            filters={[
              {
                label: "Jurusan",
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
              <p className="text-white">Loading data...</p>
            ) : (
              <Table
                columns={columns}
                data={dataWithNo}
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
      </div>
    </div>
  );
}
