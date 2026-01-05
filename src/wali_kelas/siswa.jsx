import React, { useState, useEffect } from "react";

// components
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Pagination from "./components/Pagination";

export default function SiswaPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [active, setActive] = useState("sidebarUsers");
  const [siswa, setSiswa] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Guest", role: "wali_kelas" };

  const dummyDataSiswa = [
  {
    nisn: "1234567890",
    nama: "Firli Zulfa Azzahra",
    industri: "Emran Digital",
    guru: "Nimah Hidayah S.Pd",
    status: "Aktif",
    tanggalLahir: "01 Juli 2008",
    kelas: "XI RPL 2",
    alamat: "Sigura-gura",
    noTelp: "0882-8298-298",
  },
  {
    nisn: "2234567890",
    nama: "Ahmad Fauzan",
    industri: "Telkom Indonesia",
    guru: "Siti Aminah S.Pd",
    status: "Selesai",
    tanggalLahir: "12 Mei 2007",
    kelas: "XI RPL 1",
    alamat: "Lowokwaru",
    noTelp: "0812-3456-7890",
  },
  // dst...
];

  // load dummy data
  useEffect(() => {
    setSiswa(dummyDataSiswa);
  }, []);

  // reset pagination saat filter/search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  // filter
  const filteredData = siswa.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.nama.toLowerCase().includes(q) ||
      s.nisn.includes(q) ||
      s.kelas.toLowerCase().includes(q);

    const matchFilter = filterStatus ? s.status === filterStatus : true;
    return matchSearch && matchFilter;
  });

  // tambah nomor
  const dataWithNo = filteredData.map((item, i) => ({
    ...item,
    no: i + 1,
  }));

  // pagination
  const totalPages = Math.ceil(dataWithNo.length / itemsPerPage);
  const paginatedData = dataWithNo.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // kolom tabel
  const columns = [
    { label: "NISN", key: "nisn" },
    { label: "Nama", key: "nama" },
    { label: "Kelas", key: "kelas" },
    { label: "Industri", key: "industri" },
    { label: "Guru Pembimbing", key: "guru" },
    { label: "Status", key: "status" },
  ];

  return (
    <div className="bg-white min-h-screen w-full">
      <Header user={user} />
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-6 bg-[#641E21] rounded-l-3xl">
          <h2 className="text-white font-bold text-lg mb-6">
            Data Peserta Didik
          </h2>

          <SearchBar
            query={search}
            setQuery={setSearch}
            placeholder="Cari NISN / Nama / Kelas"
            filters={[
              {
                label: "Status",
                value: filterStatus,
                options: ["Aktif", "Selesai"],
                onChange: setFilterStatus,
              },
            ]}
          />

          <div className="mt-4">
            <Table columns={columns} data={paginatedData} />

            <div className="flex justify-center mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
