import React from "react";
import { useNavigate } from "react-router-dom";

// import assets
import sidebarDashboard from "../../assets/sidebarDashboard.svg";
import sidebarUsers from "../../assets/sidebarUsers.svg";
import pengajuanPKL from "../../assets/pengajuan_pkl.svg";
import Pembimbing from "../../assets/pembimbing_sidebar.svg";
import suratPengantaran from "../../assets/surat_pengantaran.svg";
import monitoring from "../../assets/monitoring.svg";
import suratPenjemputan from "../../assets/surat_penjemputan.svg";
import perpindahanPKL from "../../assets/perpindahan_pkl.svg";
import pembekalan from "../../assets/pembekalan.svg";
import logo from "../../assets/logo.png"

export default function Sidebar({ active, setActive }) {
  const navigate = useNavigate();

  const items = [
      { title: "Beranda", icon: sidebarDashboard, route: "/guru/koordinator", key: "sidebarDashboard" },
      { title: "Peserta PKL", icon: sidebarUsers, route: "/guru/koordinator/pesertaPKL", key: "sidebarUsers" },
      { title: "Pengajuan PKL", icon: pengajuanPKL, route: "/guru/koordinator/pengajuanPKL", key: "pengajuanPKL" },
      { title: "Pembimbing", icon: Pembimbing, route: "/guru/koordinator/pembimbing", key: "Pembimbing" },
      { title: "Surat pengantaran", icon: suratPengantaran, route: "/guru/koordinator/suratPengantaran", key: "suratPengantaran" },
      { title: "Monitoring", icon: monitoring, route: "/guru/koordinator/monitoring", key: "monitoring" },
      { title: "Surat Penjemputan", icon: suratPenjemputan, route: "/koordinator/suratPenjemputan", key: "suratPenjemputan" },
      { title: "Perpindahan PKL", icon: perpindahanPKL, route: "/koordinator/perpindahanPKL", key: "perpindahanPKL" },
      { title: "Pembekalan", icon: pembekalan, route: "/koordinator/pembekalan", key: "pembekalan" },
    ];

  // main
  return (
    <aside className="mt-18 w-20 bg-white h-screen flex flex-col items-center py-8 space-y-6 ">
      {items.map((item) => (
        <div key={item.key} className="relative group">
          <div
            onClick={() => {
              setActive(item.key);
              navigate(item.route);
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer
                        bg-[#EC933A] hover:border-4 hover:border-[#641E21] 
                        ${active === item.key ? "border-4 border-[#641E21]" : ""}`}
          >
            <img src={item.icon} alt={item.title} />
          </div>
          {/* tooltip deskripsi */}
          <div className="absolute left-14 top-1/2 -translate-y-1/2 
                          bg-[#E1D6C4] text-[#641E21] text-xs font-bold rounded-md px-3 py-1 
                          opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-9999">
            {item.title}
          </div>
        </div>
      ))}
    </aside>
  );
}
