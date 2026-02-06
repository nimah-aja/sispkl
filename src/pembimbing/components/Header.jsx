import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { removeTokens } from "../../utils/authHelper";

// components
import LogoutModal from "./Logout";

// assets
import profileIcon from "../../assets/PersonCircle.png";   
import logoutIcon from "../../assets/logout.svg";
import logoutImage from "../../assets/logout.jpg";
import bell from "../../assets/loncengnew.png";           

export default function Header({ query, setQuery, user: propUser }) {
  const navigate = useNavigate();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const user =
    propUser ||
    JSON.parse(localStorage.getItem("user")) || {
      name: "Guest",
      role: "Unknown",
    };

  const handleLogout = () => {
    removeTokens();
    localStorage.removeItem("user");
    setIsLogoutOpen(false);
    navigate("/");
  };

  return (
    <header className="bg-white">
      <div className="flex items-center justify-between px-6 py-4">

        {/* Title */}
        <div className="flex flex-col font-poppins">
          <h1
            className="font-extrabold text-[#641E20] uppercase"
            style={{ fontSize: "38px", lineHeight: "1.1" }}
          >
            DASHBOARD PEMBIMBING
          </h1>

          <p
            className="font-semibold text-black mt-3"
            style={{ fontSize: "20px" }}
          >
            Selamat datang, Pembimbing
          </p>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-6">

          {/* Notification Icon */}
          <button className="relative cursor-pointer">
            <img
              src={bell}
              alt="Notification"
              className="w-7 h-7 object-contain"
            />
          </button>

          {/* Profile */}
          <div className="flex items-center space-x-2 cursor-pointer">
            <img
              src={profileIcon}
              alt="Profile"
              className="w-8 h-8 object-contain"
            />

            <div className="text-sm">
              <div className="font-bold text-[#641E21]">{user.name}</div>
              <div className="text-gray-500">{user.role}</div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => setIsLogoutOpen(true)}
            className="button-radius flex items-center gap-2 text-white px-4 py-2 rounded-full transition"
            style={{ backgroundColor: "#3A3D3D" }}
          >
            <img src={logoutIcon} alt="Logout" className="w-5 h-5 ml-3" />
            <span className="font-semibold">Keluar</span>
          </button>

          <LogoutModal
            isOpen={isLogoutOpen}
            onClose={() => setIsLogoutOpen(false)}
            onConfirm={handleLogout}
            imageSrc={logoutImage}
          />
        </div>
      </div>
    </header>
  );
}
