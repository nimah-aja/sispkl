import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle,
  XCircle,
  FilePlus,
  Search
} from "lucide-react";
import React, { useState, useEffect } from "react";


// helper
import { removeTokens } from "../../utils/authHelper";

// import components
import LogoutModal from "./Logout"; 
import PopupNotifikasi from "./PopupNotifikasi";
import ProfileRolePopup from "./Swicth";


// import asset
import logo from "../../assets/logo.png";
import logoutIcon from "../../assets/logout.svg";
import logoutImage from "../../assets/keluar.svg";
import addImage from "../../assets/add_image.svg";

export default function Header({ query, setQuery, user: propUser, notifications = [], }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const user = propUser || JSON.parse(localStorage.getItem("user")) || {
    name: "Guest",
    role: "Unknown",
  };

  const handleLogout = () => {
    removeTokens();
    localStorage.removeItem("user");
    setIsLogoutOpen(false);
    navigate("/");
  };

  // Role setup
  const allRoles = [
    { key: "is_wali_kelas", name: "Wali Kelas", path: "/guru/wali_kelas/walikelas" },
    { key: "is_kaprog", name: "Kepala Program Studi", path: "/guru/kaprodi" },
    { key: "is_pembimbing", name: "Pembimbing", path: "/guru/pembimbing/dashboard_pembimbing" },
    { key: "is_koordinator", name: "Koordinator", path: "/guru/koordinator" },
  ];

  const availableRoles = allRoles.filter(
    (r) => localStorage.getItem(r.key) === "true"
  );

  const activeRole = localStorage.getItem("guru_role");

  const handleSelectRole = (role) => {
    localStorage.setItem("guru_role", role.name);
    setIsProfileOpen(false);
    navigate(role.path);
  };

  // Unread
  useEffect(() => {
    const unread = (notifications || []).some(
      (n) => n.is_read === false || n.is_read === undefined
    );
    setHasUnread(unread);
  }, [notifications]);



  return (
    <header className="bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo + Title */}
        <div className="flex items-center space-x-3">
          <div className="mt-2 -ml-3 w-14 h-14 rounded-full flex items-center justify-center">
            <img src={logo} alt="Logo" />
          </div>
          <h1 className="font-bold text-[#641E20]" style={{ fontSize: "30px" }}>
            SISTEM PENGELOLAAN PKL
          </h1>
        </div>

        {/* kanan */}
        {/* seacrh */}
        <div className="flex items-center space-x-6">
          
          {/* Icons */}
            <img src={addImage} alt="Addimg" className="w-9"/>
            <button
              onClick={() => {
                setIsNotificationOpen((v) => !v);
                setHasUnread(false);
              }}
              className="relative p-2 rounded-full !bg-transparent hover:bg-gray-100"
            >
              <Bell className="w-7 h-7 text-[#641E21]" />

              {hasUnread && (
                <span className="absolute top-1 right-1 w-3 h-3 bg-orange-500 rounded-full ring-2 ring-white" />
              )}
            </button>

          

          {/* profile */}
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center">
              <div
                onClick={() => setIsProfileOpen(true)}
                className="
                  w-9 h-9 rounded-full
                  bg-[#641E21]
                  flex items-center justify-center
                  text-white font-bold text-sm
                  cursor-pointer
                "
              >
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>

            </div>
            <div className="text-sm">
              <div className="font-bold font-medium text-[#641E21]">
                {user.name}
              </div>
              <div className="text-gray-500">{user.role}</div>
            </div>
          </div>

          {/* button */}
          <button
            onClick={() => setIsLogoutOpen(true)} 
            className="button-radius flex items-center gap-2 bg-[#3C3C3C] text-white px-4 py-2 rounded-full hover:bg-[#2d2d2d] "
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
        notifications={(notifications || []).map((item) => ({
          ...item,
          icon:
            item.type === "approved" ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : item.type === "rejected" ? (
              <XCircle className="w-5 h-5 text-red-600" />
            ) : (
              <FilePlus className="w-5 h-5 text-orange-500" />
            ),
        }))}
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
