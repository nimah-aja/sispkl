import { Search, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";

// helper
import { removeTokens } from "../../utils/authHelper";

// components
import LogoutModal from "../components/Logout";

// asset
import logo from "../../assets/logo.png";
import logoutImage from "../../assets/keluar.svg";

export default function Header({ query, setQuery, user: propUser }) {
  const navigate = useNavigate();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const user = propUser || JSON.parse(localStorage.getItem("user")) || {
    name: "Pengguna",
    role: "Admin",
  };

  const getInitial = (name = "") =>
    name?.trim()?.[0]?.toUpperCase() || "U";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    removeTokens();
    localStorage.removeItem("user");
    setIsLogoutOpen(false);
    navigate("/");
  };

  const handleSettingClick = () => {
    setIsDropdownOpen(false);
    navigate("/admin/setting");
  };

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    setIsLogoutOpen(true);
  };

  return (
    <header className="bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        {/* LOGO */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 flex items-center justify-center">
            <img src={logo} alt="Logo" />
          </div>
          <h3 className="font-bold text-[#641E20] text-[30px]">
            SISTEM PENGELOLAAN PKL
          </h3>
        </div>

        {/* KANAN */}
        <div className="flex items-center space-x-6">
          {/* SEARCH */}
          {query !== undefined && setQuery !== undefined && (
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jumlah kelas"
                className="pl-4 pr-10 py-2 rounded-lg bg-[#E1D6C4] text-sm w-56 focus:outline-none"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4" />
            </div>
          )}

          {/* PROFILE */}
          <div className="relative" ref={dropdownRef}>
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="w-9 h-9 rounded-full bg-[#641E21] flex items-center justify-center text-white font-bold text-sm">
                {getInitial(user.name)}
              </div>

              <div className="text-sm">
                <div className="font-bold font-medium text-[#641E21]">
                  {user.name}
                </div>
                <div className="text-gray-500">{user.role}</div>
              </div>
            </div>

            {/* DROPDOWN */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 !border !border-gray-200 rounded-2xl p-4 bg-white shadow-lg z-50">
                {/* SETTING */}
                <button
                  onClick={handleSettingClick}
                  className="!bg-transparent w-full flex items-center gap-3 px-4 py-3 mb-2 bg-white rounded-xl shadow-md hover:!bg-gray-200 transition"
                >
                  <Settings className="w-5 h-5 text-gray-800" />
                  <span className="font-semibold text-gray-800">
                    Setting
                  </span>
                </button>

                {/* LOGOUT */}
                <button
                  onClick={handleLogoutClick}
                  className="!bg-transparent  w-full flex items-center gap-3 px-4 py-3 bg-white hover:!bg-gray-200 rounded-xl transition"
                >
                  <LogOut className="w-5 h-5 text-gray-800" />
                  <span className="font-medium text-gray-800">
                    Keluar
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MODAL */}
        <LogoutModal
          isOpen={isLogoutOpen}
          onClose={() => setIsLogoutOpen(false)}
          onConfirm={handleLogout}
          imageSrc={logoutImage}
        />
      </div>
    </header>
  );
}