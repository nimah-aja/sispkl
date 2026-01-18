import React from "react";
import { useNavigate } from "react-router-dom";

// import assets
import logo from "../../assets/logo.png";                     // LOGO BARU
import sidebarDashboard from "../../assets/sidebarDashboard.svg";
import sidebarUsers from "../../assets/sidebarUsers.svg";
import sidebarChalk from "../../assets/exclamation 2.svg";
import sidebarCorporate from "../../assets/envelopenew.svg";

export default function Sidebar({ active, setActive }) {
  const navigate = useNavigate();

  const items = [
    { title: "Beranda", icon: sidebarDashboard, route: "/guru/pembimbing/dashboard_pembimbing", key: "sidebarDashboard" },
    { title: "Siswa", icon: sidebarUsers, route: "/guru/pembimbing/siswa", key: "sidebarUsers" },
    { title: "Guru", icon: sidebarChalk, route: "/guru/pembimbing/permasalahan", key: "sidebarChalk" },
    { title: "Industri", icon: sidebarCorporate, route: "/guru/pembimbing/perizinan", key: "sidebarCorporate" },
  ];

  return (
    <aside className="w-20 bg-[#641E21] h-screen flex flex-col items-center py-8 space-y-6">

      {/* LOGO DI ATAS MENU */}
      <div className="mb-6">
        <img
          src={logo}
          alt="Logo"
          className="w-14 h-14 object-contain"
        />
      </div>

      {/* ICON MENU */}
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

          {/* Tooltip */}
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
