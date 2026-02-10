import React from "react";
import { useNavigate } from "react-router-dom";

// assets
import sidebarDashboard from "../../assets/sidebarDashboard.svg";
import envelope from "../../assets/envelopenew.svg";
import pengajuan_PKL from "../../assets/pengajuan_PKL.svg";
import sidebarCorporate from "../../assets/sidebarCorporate.svg";
import logo from "../../assets/logo.png";
import pindahPKL_side from "../../assets/pindahpkl_side.svg"

export default function Sidebar({ active, setActive }) {
  const navigate = useNavigate();

  const items = [
    {
      title: "Beranda",
      icon: sidebarDashboard,
      route: "/siswa",
      key: "sidebarDashboard",
    },
    {
      title: "Riwayat Pengajuan",
      icon: pengajuan_PKL,
      route: "/siswa/riwayat_pengajuan",
      key: "riwayat_pengajuan",
    },
    {
      title: "Industri",
      icon: sidebarCorporate,
      route: "/siswa/industri",
      key: "industri",
    },
    { title: "Riwayat Perizinan", 
      icon: envelope, 
      route: "/siswa/riwayat_perizinan", key: "riwayat_perizinan" },
     { title: "Perpindahan PKL", icon: pindahPKL_side, route: "/siswa/perpindahan", key: "perpindahanPKL" }
  ];

  return (
    <aside className="w-20 bg-[#5F1A1E] h-screen flex flex-col items-center py-8 space-y-6 relative z-50">
      {/* LOGO */}
      <div className="-mt-3 w-14 h-14 rounded-full flex items-center justify-center">
        <img src={logo} alt="Logo" />
      </div>

      {/* MENU */}
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

          {/* TOOLTIP */}
          <div
            className="
              absolute left-14 top-1/2 -translate-y-1/2
              bg-[#E1D6C4] text-[#641E21]
              text-xs font-bold rounded-md px-3 py-1
              opacity-0 group-hover:opacity-100
              transition-opacity whitespace-nowrap
              shadow-lg z-50
            "
          >
            {item.title}
          </div>
        </div>
      ))}
    </aside>
  );
}
