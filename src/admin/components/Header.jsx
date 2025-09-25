import React from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { removeTokens } from "../../utils/authHelper";

// import asset
import logo from "../../assets/logo.png";
import profile from "../../assets/profile.svg";

export default function Header({ query, setQuery }) {
  const navigate = useNavigate();

  // handler logout
  const handleLogout = () => {
    removeTokens();
    navigate("/");
  };

  return (
    <header className="bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo + Title */}
        <div className="flex items-center space-x-3">
          <div className="-ml-2 w-12 h-12 rounded-full flex items-center justify-center">
            <img src={logo} alt="Logo" />
          </div>
          <h1 className="font-bold text-[#641E20]" style={{ fontSize: "30px" }}>
            SISTEM PENGELOLAAN PKL
          </h1>
        </div>

        {/* kanan */}
        <div className="flex items-center space-x-6">
          {/* serach input opsional */}
          {query !== undefined && setQuery !== undefined && (
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jumlah kelas"
                className="pl-4 pr-10 py-2 rounded-lg bg-[#E1D6C4] text-black text-sm w-56 focus:outline-none"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-black" />
            </div>
          )}

          {/* profil */}
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center">
              <img src={profile} alt="Profile" />
            </div>
            <div className="text-sm">
              <div className="font-bold font-medium text-[#641E21]">Loren Schmitt</div>
              <div className="text-gray-500">Admin</div>
            </div>
          </div>

          {/* button logout */}
          <button
            onClick={handleLogout}
            className="button-radius"
            style={{
              "--btn-bg": "#EC933A",       
              "--btn-active": "#f4d0adff",   
              "--btn-text": "white",     
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
