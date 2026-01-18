import React from "react";
import { useNavigate } from "react-router-dom";
import { CalendarRange } from "lucide-react";


// import assets
import sidebarDashboard from "../../assets/sidebarDashboard.svg";
import sidebarGrad from "../../assets/sidebarGrad.svg";
import sidebarBook from "../../assets/sidebarBook.svg";
import sidebarUsers from "../../assets/sidebarUsers.svg";
import sidebarChalk from "../../assets/sidebarChalk.svg";
import sidebarCorporate from "../../assets/sidebarCorporate.svg";
import pengajuan from "../../assets/pengajuan.svg";


export default function Sidebar({ active, setActive }) {
  const navigate = useNavigate();

  const items = [
    { title: "Beranda", icon: sidebarDashboard, route: "/admin", key: "sidebarDashboard" },
    { title: "Kompetensi Keahlian", icon: sidebarGrad, route: "/admin/jurusan", key: "sidebarGrad" },
    { title: "Kelas", icon: sidebarBook, route: "/admin/kelas", key: "sidebarBook" },
    { title: "Siswa", icon: sidebarUsers, route: "/admin/siswa", key: "sidebarUsers" },
    { title: "Guru", icon: sidebarChalk, route: "/admin/guru", key: "sidebarChalk" },
    { title: "Industri", icon: sidebarCorporate, route: "/admin/industri", key: "sidebarCorporate" },
    { title: "Pengajuan", icon: pengajuan, route: "/admin/pengajuan", key: "Pengajuan" },
    { title: "Tahun Ajaran", lucide: CalendarRange, route: "/admin/tahunajaran", key: "Tahunajaran" },
  ];

  // main
  return (
    <aside className="w-20 bg-white h-screen flex flex-col items-center py-8 space-y-6">
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
            {item.icon && <img src={item.icon} alt={item.title} />}
            {item.lucide && <item.lucide size={22} className="text-white" />}
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
