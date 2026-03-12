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

  //  Mapping data Aktivitas → PopupNotifikasi
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
    <header className="bg-white px-10 py-7 flex items-center justify-between">
      {/* TITLE */}
      <div>
        <h1 className="font-extrabold text-[#641E20]" style={{ fontSize: "40px" }}>
          Beranda Siswa
        </h1>
        <p className="text-sm font-bold text-black mt-1">
          Selamat datang {user.name}!
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">
        {/* Add Icon */}
        {/* <img src={addImage} alt="Add" className="w-9" /> */}

        {/* Notification */}
        <button
          onClick={() => {
            setIsNotificationOpen((v) => !v);
            setHasUnread(false);
          }}
          className="relative p-2 rounded-full !bg-transparent hover:bg-gray-100 transition"
        >
          <Bell className="w-7 h-7 text-[#641E21]" />
          {hasUnread && (
            <span className="absolute top-1 right-1 w-3 h-3 bg-orange-500 rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* Profile */}
        <div className="flex items-center space-x-2">
          <div
            className="
              w-10 h-10 rounded-full
              bg-[#641E21]
              flex items-center justify-center
              text-white font-bold text-sm uppercase
            "
          >
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>

          <div className="text-sm">
            <div className="font-bold text-[#641E21]">
              {user.name}
            </div>
            <div className="text-gray-500">{user.role}</div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => setIsLogoutOpen(true)}
          className="button-radius flex items-center gap-2 !bg-[#3A3D3D] text-white px-4 py-2 rounded-full hover:bg-[#2d2d2d] transition"
        >
          <img src={logoutIcon} alt="Logout" className="w-5 h-5 ml-3" />
          <span className="font-semibold">Keluar</span>
        </button>
      </div>

      {/* MODALS */}
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