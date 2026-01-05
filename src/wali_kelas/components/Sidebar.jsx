import React from "react";
import { useNavigate } from "react-router-dom";

// icons
import sidebarDashboard from "../../assets/sidebarDashboard.svg";
import sidebarUsers from "../../assets/sidebarUsers.svg";
import sidebarChalk from "../../assets/sidebarChalk.svg";
import sidebarCorporate from "../../assets/sidebarCorporate.svg";

export default function Sidebar({ active, setActive }) {
  const navigate = useNavigate();

  const items = [
    { title: "Beranda", icon: sidebarDashboard, route: "/guru/wali_kelas/walikelas", key: "dashboard" },
    { title: "Peserta Didik", icon: sidebarUsers, route: "/guru/wali_kelas/siswa", key: "siswa" },
    { title: "Permasalahan Peserta Didik", icon: sidebarChalk, route: "/guru/wali_kelas/datapermasalahansiswa", key: "permasalahan" },
    { title: "Perizinan Peserta Didik", icon: sidebarCorporate, route: "/guru/wali_kelas/dataperizinansiswa", key: "perizinan" },
  ];

  return (
    <aside className="w-20 bg-white h-screen flex flex-col items-center py-8 space-y-6 shadow-lg">
      {items.map((item) => (
        <div key={item.key} className="relative group">
          <div
            onClick={() => {
              setActive(item.key);
              navigate(item.route);
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer
                        bg-[#EC933A]
                        hover:ring-4 hover:ring-[#641E21]
                        ${active === item.key ? "ring-4 ring-[#641E21]" : ""}`}
          >
            <img
              src={item.icon}
              alt={item.title}
              className="w-8 h-8 object-contain flex-shrink-0"
            />
          </div>

          {/* Tooltip */}
          <div
            className="absolute left-14 top-1/2 -translate-y-1/2 
                       bg-[#E1D6C4] text-[#641E21] text-xs font-bold
                       rounded-md px-3 py-1 opacity-0
                       group-hover:opacity-100 transition-opacity shadow-lg z-50"
          >
            {item.title}
          </div>
        </div>
      ))}
    </aside>
  );
}