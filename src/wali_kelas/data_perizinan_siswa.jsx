import React, { useEffect, useState } from "react";

// Components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Pagination from "./components/Pagination";

export default function DataPerizinanSiswa() {
  const [active, setActive] = useState("perizinan");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [dataPerizinan, setDataPerizinan] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  const user =
    JSON.parse(localStorage.getItem("user")) || {
      name: "Wali Kelas",
      role: "Guru",
    };

  // ================= DUMMY DATA =================
  const dummyDataPerizinan = [
    {
      nama: "Firli Zulfa Azzahra",
      kelas: "XII",
      tanggal: "01/05/2025",
      alasan: "SAKIT",
      lampiran: "Ada",
      status: "Proses",
    },
    {
      nama: "Andi Pratama",
      kelas: "XI RPL 2",
      tanggal: "15/11/2025",
      alasan: "SAKIT",
      lampiran: "Ada",
      status: "Disetujui",
    },
    {
      nama: "Dewi Lestari",
      kelas: "XII",
      tanggal: "22/11/2025",
      alasan: "Urusan Pribadi",
      lampiran: "Ada",
      status: "Ditolak",
    },
    {
      nama: "Maya Anggraini",
      kelas: "XII",
      tanggal: "28/11/2025",
      alasan: "Acara Keluarga",
      lampiran: "Ada",
      status: "Proses",
    },
    {
      nama: "Putri Maharani",
      kelas: "XI RPL 2",
      tanggal: "05/12/2025",
      alasan: "SAKIT",
      lampiran: "Ada",
      status: "Disetujui",
    },
  ];

  // ================= LOAD DATA =================
  useEffect(() => {
    setDataPerizinan(dummyDataPerizinan);
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
  const filteredData = dataPerizinan.filter((item) => {
    const q = search.toLowerCase();

    const matchSearch =
      item.nama.toLowerCase().includes(q) ||
      item.kelas.toLowerCase().includes(q) ||
      item.alasan.toLowerCase().includes(q);

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
    { label: "Nama", key: "nama" },
    { label: "Kelas", key: "kelas" },
    { label: "Tanggal", key: "tanggal" },
    { label: "Alasan", key: "alasan" },
    { label: "Lampiran", key: "lampiran" },
    { label: "Status", key: "status" },
  ];

  const statusOptions = [...new Set(dataPerizinan.map((d) => d.status))];

  return (
    <div className="bg-white min-h-screen w-full">
      <Header user={user} />

      <div className="flex">
        <div className="hidden md:block">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-6 md:p-10 bg-[#641E21] rounded-l-3xl">
          <h2 className="text-white font-bold text-lg mb-6">
            Data Perizinan Peserta Didik
          </h2>

          {/* SEARCH & FILTER */}
          <SearchBar
            query={search}
            setQuery={setSearch}
            placeholder="Cari nama / kelas / alasan"
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
