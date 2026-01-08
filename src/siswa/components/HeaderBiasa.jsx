import { Bell } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, CheckCircle, XCircle } from "lucide-react";

// helpers
import { removeTokens } from "../../utils/authHelper";

// components
import LogoutModal from "../components/Logout";
import PopupNotifikasi from "./PopupNotifikasi";

// assets
// import asset
import logo from "../../assets/logo.png";
import profile from "../../assets/profile.svg";
import logoutIcon from "../../assets/logout.svg";
import logoutImage from "../../assets/keluar.svg";
import addImage from "../../assets/add_image.svg";
import notifikasi from "../../assets/notifikasi.svg";

export default function HeaderKoordinator({
  user: propUser,
  notifications = [], 
}) {
  const [hasUnread, setHasUnread] = useState(false);
  const navigate = useNavigate();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    const unread = (notifications || []).some(
      (n) => n.is_read === false || n.is_read === undefined
    );
    setHasUnread(unread);
  }, [notifications]);

  const user =
    propUser ||
    JSON.parse(localStorage.getItem("user")) || {
      name: "Pengguna",
      role: "Siswa",
    };

  const handleLogout = () => {
    removeTokens();
    localStorage.removeItem("user");
    setIsLogoutOpen(false);
    navigate("/");
  };

  // 🔁 Mapping data Aktivitas → PopupNotifikasi
  const popupNotifications = notifications.map((item) => ({
    tab: item.type, // submit | approved | rejected
    title: item.title,
    description: item.description,
    time: item.time,
    onClick: item.onClick,
    icon:
      item.type === "approved" ? (
        <CheckCircle className="w-5 h-5 text-white" />
      ) : item.type === "rejected" ? (
        <XCircle className="w-5 h-5 text-white" />
      ) : (
        <User className="w-5 h-5 text-white" />
      ),
    iconBg:
      item.type === "approved"
        ? "#22c55e"
        : item.type === "rejected"
        ? "#ef4444"
        : "#3b82f6",
  }));



  return (
    <header className="bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo + Title */}
        <div className="flex items-center space-x-3">
          <div className="-mr-23 w-14 h-14 rounded-full flex items-center justify-center">
            <img src={logo} alt="Logo" />
          </div>
          <h1 className="ml-30 font-bold text-[#641E20]" style={{ fontSize: "30px" }}>
            SISTEM PENGELOLAAN PKL
          </h1>
        </div>

        {/* kanan */}
        {/* seacrh */}
        <div className="flex items-center space-x-6">
          
          {/* Icons */}
            {/* <img src={addImage} alt="Addimg" className="w-9"/> */}
            <button
              onClick={() => {
                setIsNotificationOpen((v) => !v);
                setHasUnread(false);
              }}
              className="relative p-2 rounded-full !bg-transparent hover:bg-gray-100 "
            >
              <Bell className="w-7 h-7 text-[#641E21]" />
              {hasUnread && (
                <span className="absolute top-1 right-1 w-3 h-3 bg-orange-500 rounded-full ring-2 ring-white" />
              )}
            </button>

          {/* profile */}
          <div className="flex items-center space-x-2">
            <div
              className="
                w-9 h-9 rounded-full
                bg-[#641E21]
                flex items-center justify-center
                text-white font-bold text-sm uppercase cursor-pointer
              "
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>

            <div className="text-sm">
              <div className="font-bold text-[#641E21]">
                {user.name}
              </div>
              <div className="text-gray-500">
                {user.role}
              </div>
            </div>
          </div>


          {/* button */}
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
    </header>
  );
}
