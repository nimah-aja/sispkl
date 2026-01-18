import {
  Bell,
  CheckCircle,
  XCircle,
  FilePlus,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// helpers
import { removeTokens } from "../../utils/authHelper";

// components
import LogoutModal from "./Logout";
import PopupNotifikasi from "./PopupNotifikasi";
import ProfileRolePopup from "./Swicth";

// assets
import profile from "../../assets/profile.svg";
import logoutIcon from "../../assets/logout.svg";
import logoutImage from "../../assets/keluar.svg";
import addImage from "../../assets/add_image.svg";

export default function HeaderKoordinator({ user: propUser, notifications = [], }) {
  const navigate = useNavigate();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const allRoles = [
    { key: "is_wali_kelas", name: "Wali Kelas", path: "/guru/wali_kelas/" },
    { key: "is_kaprog", name: "Kepala Program Studi", path: "/guru/kaprodi" },
    { key: "is_pembimbing", name: "Pembimbing", path: "/guru/pembimbing/dashboard_pembimbing" },
    { key: "is_koordinator", name: "Koordinator", path: "/guru/koordinator" },
  ];


  const availableRoles = allRoles.filter(
    (r) => localStorage.getItem(r.key) === "true"
  );

 

  const handleSelectRole = (role) => {
    localStorage.setItem("guru_role", role.name);
    setIsProfileOpen(false);
    navigate(role.path);
  };


  // Cek apakah ada notifikasi yang belum dibaca
  useEffect(() => {
    const unread = notifications.some(
      (n) => n.is_read === false || n.is_read === undefined
    );
    setHasUnread(unread);
  }, [notifications]);

  // User info
  const user =
    propUser ||
    JSON.parse(localStorage.getItem("user")) || {
      name: "Pengguna",
      role: "Koordinator",
    };

   const activeRole = localStorage.getItem("guru_role"); // is_wali_kelas dll


  // Ambil inisialis nama pengguna
  const getInitials = (name = "") => {
    if (!name) return "?";

    const parts = name.trim().split(" ").filter(Boolean);

    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }

    const first = parts[0][0];
    const last = parts[parts.length - 1][0];

    return (first + last).toUpperCase();
  };


  const handleLogout = () => {
    removeTokens();
    localStorage.removeItem("user");
    setIsLogoutOpen(false);
    navigate("/");
  };

  // Mapping data Aktivitas → PopupNotifikasi
  const popupNotifications = notifications.map((item) => ({
    tab: item.type, // submit | approved | rejected
    title: item.title,
    description: item.description,
    time: item.time,
    onClick: item.onClick,

    // ⬇️ INI YANG HILANG
    actions: item.actions,

    icon:
      item.type === "approved" ? (
        <CheckCircle className="w-5 h-5 text-green-600" />
      ) : item.type === "rejected" ? (
        <XCircle className="w-5 h-5 text-red-600" />
      ) : (
        <FilePlus className="w-5 h-5 text-orange-500" />
      ),

  }));


  return (
    <header className="bg-white px-10 py-7 flex items-center justify-between">
      {/* TITLE */}
      <div>
        <h1 className="font-extrabold text-[#641E20]" style={{ fontSize: "40px" }}>
          DASHBOARD Kepala Kompetensi Keahlian
        </h1>
        <p className="text-sm font-bold text-black mt-1">
          Selamat datang {user.name}!
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">

        {/* Icons */}
        {/* <img src={addImage} alt="Addimg" className="w-9"/> */}
        <button
          onClick={() => {
            setIsNotificationOpen((v) => !v);
            setHasUnread(false);
          }}
          className="!bg-transparent relative p-2 rounded-full hover:bg-gray-100 transition"
        >
          <Bell className="w-7 h-7 text-[#641E21]" />

          {hasUnread && (
            <span
              className="
                absolute
                top-1
                right-1
                w-3
                h-3
                bg-orange-500
                rounded-full
                ring-2
                ring-white
              "
            />
          )}
        </button>


        {/* Profile */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            {/* Avatar Inisial */}
            <div
              onClick={() => setIsProfileOpen(true)}
              className="
                w-10
                h-10
                rounded-full
                bg-[#641E21]
                flex
                items-center
                justify-center
                text-white
                font-bold
                text-sm
                uppercase
              "
            >
              {getInitials(user.name)}
            </div>

            {/* Nama & Role */}
            <div className="text-sm">
              <div className="font-bold text-[#641E21]">
                {user.name}
              </div>
              <div className="text-gray-500">{user.role}</div>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => setIsLogoutOpen(true)} 
          className="button-radius flex items-center gap-2 bg-[#3C3C3C] text-white px-4 py-2 rounded-full hover:bg-[#2d2d2d] transition"
          style={{
            "--btn-bg": "#3A3D3D",
            "--btn-active": "#f4d0adff",
            "--btn-text": "white",
          }}
        >
            <img src={logoutIcon} alt="Logout" className="w-5 h-5 ml-3" />
            <span className="font-semibold">Keluar</span>
          </button>
      </div>

      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={handleLogout}
        imageSrc={logoutImage}
      />

      <PopupNotifikasi
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        headerTitle="Notifikasi"
        headerIcon={<Bell className="w-5 h-5" />}
        tabs={[
          { key: "all", label: "Semua" },
          { key: "submit", label: "Pengajuan" },
          { key: "approved", label: "Diterima" },
          { key: "rejected", label: "Ditolak" },
        ]}
        notifications={popupNotifications}
      />

      <ProfileRolePopup
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={{ name: user.name }}
        roles={availableRoles}
        activeRole={activeRole}
        onSelectRole={handleSelectRole}
        onLogout={handleLogout}
      />

    </header>
  );
}
