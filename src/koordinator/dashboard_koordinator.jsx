import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// import components
import Sidebar from "./components/SidebarDashboard";
import Header from "./components/HeaderDashboard";
import DashboardCard from "./components/DashboardCard";
import Notification from "./components/Notification";


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

export default function KoordinatorDashboard() {
  const [active, setActive] = useState("sidebarDashboard");
  const [query, setQuery] = useState("");
  const [dataDisplay, setDataDisplay] = useState([]);
  const navigate = useNavigate();
  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Koordinator",
  };
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
      <main className="flex-1 p-6 bg-white overflow-auto rounded-tl-3xl">
        
        {/* DASHBOARD CARD GRID */}
        {filteredDisplay.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredDisplay.map((item, idx) => (
              <DashboardCard
                key={idx}
                item={item}
                onClick={() => {
                  navigate("/koordinator/" + item.title.replace(/\s+/g, "").toLowerCase());
                }}
              />
            ))}
          </div>
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center bg-white rounded-xl p-10 shadow-md">
            <p className="text-gray-600 font-medium">Data tidak ditemukan</p>
          </div>
        )}

        {/* NOTIFICATION SECTION */}
        <div className="mt-10 flex justify-center">
          <Notification
            headerText="Notifikasi Pengajuan PKL"
            headerIcon="📢"
            items={notifications}
          />
        </div>

      </main>
    </div>
  </div>
);

}
