import React, { useState } from "react";
import { X, Check, User } from "lucide-react";
import ProfilePage from "./Profil";
import { getGuru } from "../../utils/services/admin/get_guru";
import { useEffect } from "react";


export default function ProfileRolePopup({
  isOpen,
  onClose,
  user,
  roles = [],
  activeRole,
  onSelectRole,
  onLogout,
}) {
  const [showProfile, setShowProfile] = useState(false);
  const [guru, setGuru] = useState(null);
  const [loadingGuru, setLoadingGuru] = useState(false);

  const kodeGuru = localStorage.getItem("kode_guru");


  useEffect(() => {
    if (!isOpen || !kodeGuru) return;

    const fetchGuru = async () => {
      try {
        setLoadingGuru(true);

        const guruList = await getGuru();

        const foundGuru = guruList.find(
          (g) => String(g.kode_guru) === String(kodeGuru)
        );

        setGuru(foundGuru || null);
      } catch (err) {
        console.error("Gagal ambil data guru", err);
      } finally {
        setLoadingGuru(false);
      }
    };

    fetchGuru();
  }, [isOpen, kodeGuru]);



  
  if (!isOpen) return null;

  const getInitials = (name = "") => {
    if (!name) return "?";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  

  if (showProfile) {
    if (loadingGuru) {
      return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
          <div className="bg-white px-6 py-4 rounded-xl shadow">
            Loading profile...
          </div>
        </div>
      );
    }

    if (!guru) {
      return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
          <div className="bg-white px-6 py-4 rounded-xl shadow text-red-500">
            Data guru tidak ditemukan
          </div>
        </div>
      );
    }

    const profileUser = {
      name: guru.nama,
      role: "Guru",
      nip: guru.nip,
      phone: guru.no_telp,
      guruCode: guru.kode_guru,
    };

    const profileRoles = [
      guru.is_kaprog && { key: "kaprog", name: "Kepala Program Studi" },
      guru.is_wali_kelas && { key: "wakel", name: "Wali Kelas" },
      guru.is_pembimbing && { key: "pembimbing", name: "Pembimbing" },
      guru.is_koordinator && { key: "koordinator", name: "Koordinator" },
    ].filter(Boolean);

    return (
      <ProfilePage
        user={profileUser}
        roles={profileRoles}
        onClose={() => setShowProfile(false)}
      />
    );
  }



  return (
    <div className="fixed inset-0 z-[9999] flex justify-center items-start pt-20"  onClick={onClose}>
      <div className="border border-gray-300 bg-white w-[340px] rounded-xl shadow-lg mt-5 ml-280 overflow-hidden"  onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <p className="ml-5 mt-3 text-md font-medium text-gray-400">Ganti Role</p>

        {/* ROLE LIST */}
        <div className=" px-2 py-2">
          {roles.map((role) => {
           const isActive = activeRole === role.name;


            return (
              <button
                key={role.key}
                onClick={() => onSelectRole(role)}
                className={`
                  w-full
                  flex
                  items-center
                  gap-3
                  px-3
                  py-2
                  rounded-lg
                  text-left
                  transition
                  !bg-white
                  mb-2
                  hover:!bg-gray-200
                  ${isActive ? "bg-white" : "hover:bg-white/60"}

                `}
              >
                {/* Lingkaran inisial */}
                <div
                  className={`
                    w-9
                    h-9
                    rounded-full
                    flex
                    items-center
                    justify-center
                    font-bold
                    text-sm
                    ${isActive
                      ? "bg-[#641E21] text-white"
                      : "bg-red-300 text-gray-700"}
                  `}
                >
                  {getInitials(user.name)}
                </div>
                <div><p className="text-sm font-bold">{user.name}</p>      
                <span className="text-sm text-gray-400">{role.name}</span></div>

                {/* KANAN */}
                {isActive && <Check className=" ml-15  w-5 h-5 text-[#641E21]" />}
              </button>
            );
          })}
          {/* Profil Saya */}
          <div
            className="cursor-pointer !bg-transparent flex items-center gap-3 text-sm font-bold border-t pl-8 pt-3 pb-3  border-gray-300 hover:bg-gray-100 w-full"
            onClick={(e) => {
              e.stopPropagation();
              setShowProfile(true);
            }}
          >
            <User className="w-5 h-5 text-gray-500" />
            Profil Saya
          </div>
        </div>
      </div>
    </div>
  );
}
