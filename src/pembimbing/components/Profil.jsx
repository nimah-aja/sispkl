import React from "react";
import { X } from "lucide-react";
import headerBg from "../../assets/maskot.svg";


export default function ProfilePage({ user, onClose, roles = [] }) {
  const getInitials = (name = "") => {
    if (!name) return "?";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const shortRoleName = (name = "") => {
    const map = {
        "Kepala Program Studi": "Kaprog",
        "Wali Kelas": "Wakel",
        "Pembimbing": "Pembimbing",
        "Koordinator": "Koordinator",
    };

    return map[name] || name;
    };


  return (
    <div
      className="fixed inset-0 z-[10000] flex justify-center items-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white w-[500px] max-w-full rounded-2xl shadow-lg overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER GRADIENT */}
        {/* HEADER */}
        <div className="h-42 bg-[#641E21] from-orange-400 via-pink-400 to-blue-300 relative px-6 flex items-end justify-between">
        {/* FOTO BACKGROUND */}
        <div
            className="absolute inset-0 bg-[center_25%] bg-cover opacity-0"
            style={{ backgroundImage: `url(${headerBg})` }}
        />
        
        {/* FOTO */}
        <div className="absolute -bottom-12 left-4 w-24 h-24 rounded-full bg-[#641E21]
            flex items-center justify-center text-white font-bold text-2xl border-4 border-white">
            {getInitials(user.name)}
        </div>
        </div>

        {/* ROLE BADGES */}
        <div className="flex flex-wrap gap-2 mt-2 -mb-10 ml-30">
            {roles.map((role) => (
            <span
                key={role.key}
                className="bg-white/90 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full shadow"
            >
                 {shortRoleName(role.name)}
            </span>
            ))}
        </div>

         
        {/* BODY */}
        <div className="pt-16 px-6 pb-6">
          {/* GRID 2 KOLM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* KIRI */}
            <div>
              <h1 className="text-xl font-bold text-gray-800">{user.name}</h1>
              <p className="text-gray-500 mt-1">{user.role}</p>
              <div className="mt-4">
                <p className="font-medium">NIP</p>
                <p className="text-gray-600">{user.nip}</p>
              </div>
              <div className="mt-4">
                <p className="font-medium">Kode Guru</p>
                <p className="text-gray-600">{user.guruCode}</p>
              </div>
            </div>

            {/* KANAN */}
            <div className="mt-25">
              <div className="mt-4 md:mt-0">
                <p className="font-medium">Nomor Telepon</p>
                <p className="text-gray-600">{user.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
