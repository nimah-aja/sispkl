import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// import components
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Table from "./components/Table";
SearchBar
// import assets
import sidebarUsers from "../assets/sidebarUsers.svg";
import pengajuanPKL from "../assets/pengajuan_pkl.svg";
import Pembimbing from "../assets/pembimbing.svg";
import suratPengantaran from "../assets/surat_pengantaran.svg";
import monitoring from "../assets/monitoring.svg";
import suratPenjemputan from "../assets/surat_penjemputan.svg";
import perpindahanPKL from "../assets/perpindahan_pkl.svg";
import pembekalan from "../assets/pembekalan.svg";

export default function DataPeserta() {
  const [active, setActive] = useState("sidebarUsers");
  const [query, setQuery] = useState("");
  const [dataDisplay, setDataDisplay] = useState([]);
  const [kelas, setKelas] = useState("");
  const [industri, setIndustri] = useState("");
  const [status, setStatus] = useState("");
  const [peserta, setPeserta] = useState([]);

  // const user =
  //   JSON.parse(localStorage.getItem("user")) || {
  //     name: "Guest",
  //     role: "admin",
  //   };

  const namaGuru = localStorage.getItem("nama_guru") || "Guru SMK";

  const user = { 
    name: namaGuru,
    role: "Koordinator" 
  };


  const navigate = useNavigate();

  // FILTER OPTIONS
  const filters = [
    {
      label: "Kelas",
      value: kelas,
      options: ["X RPL 1", "X RPL 2", "XI TKJ 1", "XI TKJ 2"],
      onChange: setKelas,
    },
    {
      label: "Industri",
      value: industri,
      options: ["Emran Digital", "Telkom Indonesia", "UBIG", "Dinas Kominfo"],
      onChange: setIndustri,
    },
    {
      label: "Status",
      value: status,
      options: ["Aktif", "Selesai", "Pending"],
      onChange: setStatus,
    },
  ];

  // DUMMY DATA
  useEffect(() => {
    const dummyData = [
      { title: "Peserta PKL", icon: sidebarUsers, value: 25 },
      { title: "Pengajuan PKL", icon: pengajuanPKL, value: 10 },
      { title: "Pembimbing", icon: Pembimbing, value: 5 },
      { title: "Surat Pengantaran", icon: suratPengantaran, value: 8 },
      { title: "Monitoring", icon: monitoring, value: 12 },
      { title: "Surat Penjemputan", icon: suratPenjemputan, value: 6 },
      { title: "Perpindahan PKL", icon: perpindahanPKL, value: 3 },
      { title: "Pembekalan", icon: pembekalan, value: 7 },
    ];
    setDataDisplay(dummyData);

    const dummyPeserta = [
      {
        nisn: "1234567890",
        nama: "Firli Zulfa Azzahra",
        industri: "Emran Digital",
        kelas: "X RPL 1",
        guru: "Nimah Hidayah S.Pd",
        status: "Aktif",
      },
      {
        nisn: "1234567891",
        nama: "Rama Yuda Pratama",
        industri: "Telkom Indonesia",
        kelas: "X RPL 2",
        guru: "Nimah Hidayah S.Pd",
        status: "Aktif",
      },
      {
        nisn: "1234567892",
        nama: "Aulia Rahmawati",
        industri: "UBIG",
        kelas: "XI TKJ 1",
        guru: "Nimah Hidayah S.Pd",
        status: "Selesai",
      },
      {
        nisn: "1234567893",
        nama: "Fajar Wicaksono",
        industri: "Dinas Kominfo",
        kelas: "XI TKJ 2",
        guru: "Nimah Hidayah S.Pd",
        status: "Pending",
      },
    ];

    setPeserta(dummyPeserta);
  }, []);

   // kolom tabel
  const columns = [
    { label: "NISN", key: "nisn" },
    { label: "Nama", key: "nama" },
    { label: "Industri", key: "industri" },
    { label: "Kelas", key: "kelas" },
    { label: "Guru", key: "guru" },
    { label: "Status", key: "status" },
  ];


  // FILTERING PESERTA
  const filteredPeserta = peserta.filter((item) => {
    return (
      item.nama.toLowerCase().includes(query.toLowerCase()) &&
      (kelas ? item.kelas === kelas : true) &&
      (industri ? item.industri === industri : true) &&
      (status ? item.status === status : true)
    );
  });

  return (
    <div className="flex h-screen w-full bg-white">
      {/* SIDEBAR */}
      <Sidebar active={active} setActive={setActive} />

      {/* MAIN AREA */}
      <div className="flex flex-col flex-1">
        <Header query={query} setQuery={setQuery} user={user} />

        <main className="flex-1 h-full min-h-screen p-4 sm:p-6 md:p-10 bg-[#641E21] rounded-tl-3xl shadow-inner">
          <h2 className="text-white font-bold text-lg mb-6">
            Data Peserta PKL
          </h2>

          <SearchBar
            query={query}
            setQuery={setQuery}
            filters={filters}
            placeholder="Cari siswa..."
          />

          <Table
            columns={columns}
            data={filteredPeserta}          
          />
          
        </main>
      </div>
    </div>
  );
}
