import React from "react";
import { useNavigate } from "react-router-dom";

// import assets
import sidebarDashboard from "../../assets/sidebarDashboard.svg";
import sidebarUsers from "../../assets/sidebarUsers.svg";
import sidebarChalk from "../../assets/exclamation 2.svg";
import sidebarCorporate from "../../assets/envelopenew.svg";
import logo from "../../assets/logo.png";                     // LOGO BARU
import pindahPKL_side from "../../assets/pindahpkl_side.svg"

export default function Sidebar({ active, setActive }) {
  const navigate = useNavigate();

  const items = [
    { title: "Beranda", icon: sidebarDashboard, route: "/guru/pembimbing/dashboard_pembimbing", key: "sidebarDashboard" },
    { title: "Peserta Didik", icon: sidebarUsers, route: "/guru/pembimbing/siswa", key: "siswa" },
    { title: "Permasalahan", icon: sidebarChalk, route: "/guru/pembimbing/permasalahan", key: "permasalahan" },
    { title: "Perizinan", icon: sidebarCorporate, route: "/guru/pembimbing/perizinan", key: "perizinan" },
    { title: "Perpindahan PKL", icon: pindahPKL_side, route: "/guru/pembimbing/perpindahan", key: "perpindahanPKL" }
  ];

  // main
  return (
    <aside className="-pt-2 -mt-3 w-20 bg-white h-screen flex flex-col items-center py-8 space-y-6 ">
      {items.map((item) => (
        <div key={item.key} className="relative group">
          <div
            onClick={() => {
              setActive(item.key);
              navigate(item.route);
            }}
              className={` w-12 h-12 rounded-full overflow-hidden
              flex items-center justify-center transition-all cursor-pointer
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
