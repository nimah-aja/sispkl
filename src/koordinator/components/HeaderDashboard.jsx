import { Bell, Settings } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// helpers
import { removeTokens } from "../../utils/authHelper";

// components
import LogoutModal from "./Logout";

// assets
import profile from "../../assets/profile.svg";
import logoutIcon from "../../assets/logout.svg";
import logoutImage from "../../assets/keluar.svg";
import addImage from "../../assets/add_image.svg";
import notifikasi from "../../assets/notifikasi.svg";

export default function HeaderKoordinator({ user: propUser }) {
  const navigate = useNavigate();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const user =
    propUser ||
    JSON.parse(localStorage.getItem("user")) || {
      name: "Pengguna",
      role: "Koordinator",
    };

  const handleLogout = () => {
    removeTokens();
    localStorage.removeItem("user");
    setIsLogoutOpen(false);
    navigate("/");
  };

  return (
    <header className="bg-white px-10 py-7 flex items-center justify-between">
      {/* TITLE */}
      <div>
        <h1 className="font-extrabold text-[#641E20]" style={{ fontSize: "40px" }}>
          DASHBOARD KOORDINATOR
        </h1>
        <p className="text-sm font-bold text-black mt-1">
          Selamat datang {user.name}!
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-8">

        {/* Icons */}
        <img src={addImage} alt="Addimg" className="w-9"/>
        <img src={notifikasi} alt="notifikasi" className="w-8" />

        {/* Profile */}
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center">
            <img src={profile} alt="Profile" />
          </div>
          <div className="text-sm">
            <div className="font-bold font-medium text-[#641E21]">
              {user.name}
            </div>
            <div className="text-gray-500">{user.role}</div>
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
    </header>
  );
}
