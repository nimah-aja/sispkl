import React from "react";
import { useNavigate } from "react-router-dom";

// import assets
import beranda from "../../assets/beranda_kapro.svg";
import industri from "../../assets/industri.svg";
import pengajuan_PKL from "../../assets/pengajuan_PKL.svg";
import pembimbing from "../../assets/pembimbing.svg";
import Envelope from "../../assets/Envelope.svg";
import out from "../../assets/out.svg";
import check from "../../assets/check.svg";
import logo from "../../assets/logo.png";

export default function Sidebar({ active, setActive }) {
  const navigate = useNavigate();

  const items = [
      { title: "Beranda", icon: beranda, route: "/guru/kaprodi", key: "beranda" },
      { title: "Industri", icon: industri, route: "/guru/kaprodi/industri", key: "industri" },
      { title: "Pengajuan PKL", icon: pengajuan_PKL, route: "/guru/kaprodi/pengajuanPKL", key: "pengajuan_PKL" },
      { title: "Pembimbing", icon: pembimbing, route: "/guru/kaprodi/pembimbing", key: "pembimbing" },
      { title: "Perizinan PKL", icon: Envelope, route: "/guru/kaprodi/perizinan", key: "perizinan_pkl" },
      { title: "Pindah PKL", icon: out, route: "/guru/kaprodi/pengajuan_pindah_pkl", key: "pindah_pkl" },
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
