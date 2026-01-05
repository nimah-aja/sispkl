import React, { useEffect, useState } from "react";

// Components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Pagination from "./components/Pagination";

export default function DataPermasalahanSiswa() {
  const [active, setActive] = useState("permasalahan");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [dataPermasalahan, setDataPermasalahan] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  const user =
    JSON.parse(localStorage.getItem("user")) || {
      name: "Wali Kelas",
      role: "Guru",
    };

  // ================= DUMMY DATA =================
  const dummyDataPermasalahan = [
    {
      pelapor: "Siswa",
      nama: "Firli Zulfa Azzahra",
      tanggal: "01/05/2025",
      masalah: "Kesulitan memahami materi Matematika",
      status: "Proses",
    },
    {
      pelapor: "Pembimbing",
      nama: "Budi Santoso",
      tanggal: "20/11/2025",
      masalah: "Nilai rapor menurun drastis",
      status: "Selesai",
    },
    {
      pelapor: "Siswa",
      nama: "Maya Anggraini",
      tanggal: "28/11/2025",
      masalah: "Kesulitan adaptasi di sekolah baru",
      status: "Proses",
    },
    {
      pelapor: "Pembimbing",
      nama: "Putri Maharani",
      tanggal: "05/12/2025",
      masalah: "Bolos sekolah tanpa keterangan",
      status: "Selesai",
    },
    {
      pelapor: "Siswa",
      nama: "Andi Pratama",
      tanggal: "15/11/2025",
      masalah: "Konflik dengan teman sekelas",
      status: "Proses",
    },
  ];

  // ================= LOAD DATA =================
  useEffect(() => {
    setDataPermasalahan(dummyDataPermasalahan);
  }, []);

  // reset pagination jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFilter]);

  // ================= HELPER =================
  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split("/");
    return new Date(`${year}-${month}-${day}`);
  };

  // ================= FILTER DATA =================
  const filteredData = dataPermasalahan.filter((item) => {
    const q = search.toLowerCase();

    const matchSearch =
      item.nama.toLowerCase().includes(q) ||
      item.pelapor.toLowerCase().includes(q) ||
      item.masalah.toLowerCase().includes(q);

    const matchStatus = statusFilter ? item.status === statusFilter : true;

    const matchDate = dateFilter
      ? parseDate(item.tanggal).toDateString() ===
        new Date(dateFilter).toDateString()
      : true;

    return matchSearch && matchStatus && matchDate;
  });

  // nomor urut
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

  // ================= TABLE =================
  const columns = [
    { label: "Pelapor", key: "pelapor" },
    { label: "Nama", key: "nama" },
    { label: "Tanggal", key: "tanggal" },
    { label: "Masalah", key: "masalah" },
    { label: "Status", key: "status" },
  ];

  const statusOptions = [...new Set(dataPermasalahan.map((d) => d.status))];

  return (
    <div className="bg-white min-h-screen w-full">
      <Header user={user} />

      <div className="flex">
        <div className="hidden md:block">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-6 md:p-10 bg-[#641E21] rounded-l-3xl">
          <h2 className="text-white font-bold text-lg mb-6">
            Data Permasalahan Peserta Didik
          </h2>

          {/* SEARCH & FILTER */}
          <SearchBar
            query={search}
            setQuery={setSearch}
            placeholder="Cari nama / pelapor / masalah"
            filters={[
              {
                label: "Status",
                value: statusFilter,
                options: statusOptions,
                onChange: setStatusFilter,
              },
              {
                label: "Tanggal",
                type: "date",
                value: dateFilter,
                onChange: setDateFilter,
              },
            ]}
          />

          {/* TABLE */}
          <div className="mt-4 bg-white rounded-2xl p-4">
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
