import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { removeTokens } from "../utils/authHelper";

// Import asset
import { Search, Edit2, Trash2 } from "lucide-react";
import logo from "../assets/logo.png";
import profile from "../assets/profile.svg";
import dashboard from "../assets/dashboard.svg";
import grad from "../assets/grad.svg";
import users from "../assets/users.svg";
import chalk from "../assets/chalk.svg";
import add from "../assets/add.svg";
import trash from "../assets/trash.svg";
import edit from "../assets/edit.svg";


export default function JurusanPage() {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("grad");
  const navigate = useNavigate();

  const jurusanData = [
    { kode: "RPL", nama: "Rekayasa Perangkat Lunak" },
    { kode: "TKJ", nama: "Teknik Komputer Jaringan" },
    { kode: "MM", nama: "Multimedia" },
    { kode: "AK", nama: "Akuntansi" },
    { kode: "RPL", nama: "Rekayasa Perangkat Lunak" },
    { kode: "TKJ", nama: "Teknik Komputer Jaringan" },
    { kode: "MM", nama: "Multimedia" },
    { kode: "AK", nama: "Akuntansi" },
    { kode: "RPL", nama: "Rekayasa Perangkat Lunak" },
    { kode: "TKJ", nama: "Teknik Komputer Jaringan" },
    { kode: "MM", nama: "Multimedia" },
    { kode: "AK", nama: "Akuntansi" },
    { kode: "RPL", nama: "Rekayasa Perangkat Lunak" },
    { kode: "TKJ", nama: "Teknik Komputer Jaringan" },
    { kode: "MM", nama: "Multimedia" },
    { kode: "AK", nama: "Akuntansi" },
  ];

  const filteredData = jurusanData.filter((j) =>
    j.nama.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = () => {
    removeTokens();           // hapus token dari storage
    navigate("/");       // langsung ke login page
  };

  return (
    <div className="bg-white min-h-screen w-full">
      {/* Header */}
      <header className="bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo + Title */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center">
              <img src={logo} alt="Logo" />
            </div>
            <h1
              className="font-bold text-[#641E20]"
              style={{ fontSize: "30px" }}
            >
              SISTEM PENGELOLAAN PKL
            </h1>
          </div>

          {/* User */}
            <div className="flex items-center space-x-2 ml-188">
              <div className="w-9 h-9 rounded-full flex items-center justify-center">
                <img src={profile} alt="Profile" />
              </div>
              <div className="text-sm">
                <div className="font-bold font-medium text-[#641E21]">
                  Loren Schmitt
                </div>
                <div className="text-gray-500">Admin</div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-red hover:bg-red-600 text-white text-sm px-3 py-1 rounded-md transition"
            >
              Logout
            </button>
        </div>
      </header>

      {/* Sidebar + Main */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-20 bg-white h-screen flex flex-col items-center py-8 space-y-6">
          {/* Dashboard */}
          <div className="relative group">
            <div
              onClick={() => {
                setActive("dashboard");
                navigate("/dashboard/admin");
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer
                bg-[#EC933A] hover:border-4 hover:border-[#641E21]
                ${active === "dashboard" ? "border-4 border-[#641E21]" : ""}`}
            >
              <img src={dashboard} alt="Dashboard" />
            </div>
            <div className="absolute left-14 top-1/2 -translate-y-1/2 
                            bg-white text-[#641E21] text-xs rounded-md px-3 py-1 
                            opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
              Dashboard
            </div>
          </div>

          {/* Jurusan */}
          <div className="relative group">
            <div
              onClick={() => setActive("grad")}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer
                bg-[#EC933A] hover:border-4 hover:border-[#641E21]
                ${active === "grad" ? "border-4 border-[#641E21]" : ""}`}
            >
              <img src={grad} alt="Grad" />
            </div>
            <div className="absolute left-14 top-1/2 -translate-y-1/2 
                            bg-white text-[#641E21] text-xs rounded-md px-3 py-1 
                            opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
              Jurusan
            </div>
          </div>

          {/* Users */}
          <div className="relative group">
            <div
              onClick={() => setActive("users")}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer
                bg-[#EC933A] hover:border-4 hover:border-[#641E21]
                ${active === "users" ? "border-4 border-[#641E21]" : ""}`}
            >
              <img src={users} alt="Users" />
            </div>
            <div className="absolute left-14 top-1/2 -translate-y-1/2 
                            bg-white text-[#641E21] text-xs rounded-md px-3 py-1 
                            opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
              Peserta Didik
            </div>
          </div>

          {/* Guru */}
          <div className="relative group">
            <div
              onClick={() => setActive("chalk")}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer
                bg-[#EC933A] hover:border-4 hover:border-[#641E21]
                ${active === "chalk" ? "border-4 border-[#641E21]" : ""}`}
            >
              <img src={chalk} alt="Chalk" />
            </div>
            <div className="absolute left-14 top-1/2 -translate-y-1/2 
                            bg-white text-[#641E21] text-xs rounded-md px-3 py-1 
                            opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
              Guru
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-10 rounded-l-3xl bg-[#641E21] shadow-inner">
          <div>
            <h2 className="text-white font-bold text-lg mb-6">Jurusan</h2>
            
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pencarian"
                className="pl-10 pr-10 py-2 rounded-lg bg-white text-black text-sm w-300 focus:outline-none"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-black" />
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl mt-5">
             <table className="w-full border-separate border-spacing-y-3">
                <thead className="text-[#641E21] bg-[#E1D6C4]">
                    <tr>
                        <th className="py-3 px-4 text-center">No</th>
                        <th className="py-3 px-4 text-center">Kode Jurusan</th>
                        <th className="py-3 px-4 text-center">Nama Jurusan</th>
                        <th className="py-3 px-4 text-center">Edit</th>
                        <th className="py-3 px-4 text-center">Hapus</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((j, i) => (
                    <tr
                        key={i}
                        className="bg-white shadow-md hover:bg-orange-200 transition-all duration-200 divide-x divide-transparent hover:divide-gray-400"
                    >
                        <td className="py-3 px-4 text-center font-semibold text-gray-700 group-hover:text-white">
                            {i + 1}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-700 text-center group-hover:text-white">
                            {j.kode}
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-center group-hover:text-white">
                            {j.nama}
                        </td>
                        <td className="py-3 px-4 text-center">
                            <img src={edit} alt="Edit" className="w-7 h-7 inline-block" />
                        </td>
                        <td className="py-3 px-4 text-center">
                            <img src={trash} alt="Hapus" className="w-7 h-7 inline-block" />
                        </td>
                    </tr>
                    ))}
                    {filteredData.length === 0 && (
                    <tr>
                        <td colSpan="4" className="text-center py-4 text-gray-500">
                        Data tidak ditemukan
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>

                <div
                    onClick={() => alert("Tambah Data diklik")}
                    className="fixed bottom-8 right-8"
                    >
                    <img src={add} alt="Tambah" className="w-20 h-20 bg-white rounded-full" />
                </div>



            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
