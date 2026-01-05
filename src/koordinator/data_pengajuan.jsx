import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// import components
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import DashboardCard from "./components/DashboardCard";
import Notification from "./components/Notification";
import SearchBar from "./components/Search";

// import request
import axios from "../utils/axiosInstance";

// import assets
import sidebarUsers from "../assets/sidebarUsers.svg";
import pengajuanPKL from "../assets/pengajuan_pkl.svg";
import Pembimbing from "../assets/pembimbing.svg";
import suratPengantaran from "../assets/surat_pengantaran.svg";
import monitoring from "../assets/monitoring.svg";
import suratPenjemputan from "../assets/surat_penjemputan.svg";
import perpindahanPKL from "../assets/perpindahan_pkl.svg";
import pembekalan from "../assets/pembekalan.svg";
import  profile from "../assets/profile.svg";

export default function DataPengajuan() {
  const [active, setActive] = useState("pengajuanPKL");
  const [query, setQuery] = useState("");
  const [dataDisplay, setDataDisplay] = useState([]);
  const navigate = useNavigate();
  // const user = JSON.parse(localStorage.getItem("user")) || { name: "Guest", role: "admin" };
  const namaGuru = localStorage.getItem("nama_guru") || "Guru SMK";

  const user = { 
    name: namaGuru,
    role: "Koordinator" 
  };

  const [kelas, setKelas] = useState("");

  const filters = [
    {
        label: "Kelas",
        value: kelas,
        options: ["X RPL 1", "X RPL 2", "XI TKJ 1", "XI TKJ 2"],
        onChange: setKelas,
    }
 ];


  // Data dummy
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
  }, []);

  const filteredDisplay = dataDisplay.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

    const notifications = [
        {
            profile: "https://via.placeholder.com/60",
            name: "Mirza Kholila",
            class: "XII RPL 1",
            description: "Mengajukan PKL di UBIG",
            time: "2 jam yang lalu",
            acceptText: "Terima",
            rejectText: "Tolak",
            onAccept: () => alert("Mirza diterima"),
            onReject: () => alert("Mirza ditolak"),
        },
        {
            profile: "https://via.placeholder.com/60",
            name: "Erin Malik",
            class: "XII TKJ 2",
            description: "Mengajukan PKL di Telkom",
            time: "1 jam yang lalu",
        },
    ];


  return (
  <div className="flex h-screen w-full bg-white">
    {/* SIDEBAR FULL HEIGHT */}
    <Sidebar active={active} setActive={setActive} />

    {/* AREA HEADER + MAIN */}
    <div className="flex flex-col flex-1">
      <Header query={query} setQuery={setQuery} user={user} />

      {/* MAIN CONTENT */}
      <main className="flex-1 h-full min-h-screen p-4 sm:p-6 md:p-10 bg-[#641E21] rounded-tl-3xl shadow-inner">

        <h2 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-6">
            Data Pengajuan PKL
        </h2>

        <SearchBar
            query={query}
            setQuery={setQuery}
            filters={filters}
            placeholder="Cari siswa..."
        />

                {/* LIST DATA PENGAJUAN PKL */}
        <div className="mt-6 space-y-4">

        {[
            {
            name: "Mirza Kholila",
            class: "XII RPL 1",
            description: "Telah mengajukan tempat PKL di UBIG",
            },
            {
            name: "Mirza Kholila",
            class: "XII RPL 1",
            description: "Telah mengajukan tempat PKL di UBIG",
            },
            {
            name: "Mirza Kholila",
            class: "XII RPL 1",
            description: "Telah mengajukan tempat PKL di UBIG",
            },
            {
            name: "Mirza Kholila",
            class: "XII RPL 1",
            description: "Telah mengajukan tempat PKL di UBIG",
            },
            {
            name: "Mirza Kholila",
            class: "XII RPL 1",
            description: "Telah mengajukan tempat PKL di UBIG",
            },
        ].map((item, index) => (
            <div
            key={index}
            className="bg-white rounded-xl w-full py-4 px-4 flex items-center justify-between shadow-md"
            >
            {/* LEFT SIDE */}
            <div className="flex items-center">
                {/* ICON / PROFILE */}
                <img 
                    src={profile} 
                    className="w-10 h-10 mr-4" 
                />

                {/* TEXT */}
                <div>
                    <h3 className="font-semibold text-[#641E21] text-base">
                    {item.name} | {item.class}
                    </h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
            </div>


            {/* BUTTON CETAK */}
            <button className="!bg-[#EC933A] text-white text-sm font-semibold px-5 !py-1 rounded-md hover:bg-[#e0911f] transition">
                Cetak
            </button>
            </div>
        ))}

        </div>


      </main>
    </div>
  </div>
);

}