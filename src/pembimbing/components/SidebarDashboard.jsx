import React from "react";
import { useNavigate } from "react-router-dom";

// import assets
import logo from "../../assets/logo.png";                     // LOGO BARU
import sidebarDashboard from "../../assets/sidebarDashboard.svg";
import sidebarUsers from "../../assets/sidebarUsers.svg";
import sidebarChalk from "../../assets/exclamation 2.svg";
import envelope from "../../assets/envelopenew.svg";
import pindahPKL_side from "../../assets/pindahpkl_side.svg"
import sidebarCorporate from "../../assets/sidebarCorporate.svg";

export default function Sidebar({ active, setActive }) {
  const navigate = useNavigate();

  const items = [
      { title: "Beranda", icon: sidebarDashboard, route: "/guru/pembimbing/dashboard_pembimbing", key: "sidebarDashboard" },
      { title: "Siswa", icon: sidebarUsers, route: "/guru/pembimbing/siswa", key: "siswa" },
      { title: "Industri", icon: sidebarCorporate, route: "/guru/pembimbing/industri", key: "industri" },
      { title: "Kegiatan", icon: sidebarChalk, route: "/guru/pembimbing/kegiatan", key: "kegiatan" },
      { title: "Bukti Kegiatan", icon: sidebarChalk, route: "/guru/pembimbing/bukti_kegiatan", key: "bukti_kegiatan" },
      { title: "Permasalahan", icon: sidebarChalk, route: "/guru/pembimbing/permasalahan", key: "permasalahan" },
      { title: "Perizinan", icon: envelope, route: "/guru/pembimbing/perizinan", key: "perizinan" },
      { title: "Perpindahan PKL", icon: pindahPKL_side, route: "/guru/pembimbing/perpindahan", key: "perpindahanPKL" }
  ];

  // main
  return (
    <aside className="w-20 bg-[#5F1A1E] h-screen flex flex-col items-center py-8 space-y-6">

      <div className="-mt-3 w-14 h-14 rounded-full flex items-center justify-center">
        <img src={logo} alt="Logo"  />
      </div>
      
      {items.map((item) => (
        <div key={item.key} className="relative group top-2">
          <div
            onClick={() => {
              setActive(item.key);
              navigate(item.route);
            }}
              className={`w-12 h-12 rounded-full overflow-hidden
              flex items-center justify-center transition-all cursor-pointer
              bg-[#EC933A] hover:border-4 hover:border-white
              ${active === item.key ? "border-4 border-white" : ""}`}
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