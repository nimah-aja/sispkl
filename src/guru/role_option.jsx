import React, { useState, useEffect } from "react";
import Header from "../admin/components/Header";
import waliKelasImg from "../assets/waliKelas.svg";
import kaprodiImg from "../assets/kaprodi.svg";
import pembimbingImg from "../assets/pembimbing.svg";
import koordinatorImg from "../assets/koordinator.svg";
import { useNavigate } from "react-router-dom";

export default function RoleOption() {
  const [selectedRole, setSelectedRole] = useState("");
  const [guruName, setGuruName] = useState("Guru SMK");
  const [roles, setRoles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedName = localStorage.getItem("nama_guru") || "Guru SMK";

    // definisi semua role (template tunggal)
    const allRoles = [
      { key: "is_wali_kelas", name: "Wali Kelas", image: waliKelasImg, path: "/guru/walikelas" },
      { key: "is_kaprog", name: "Kepala Program Studi", image: kaprodiImg, path: "/guru/kaprodi" },
      { key: "is_pembimbing", name: "Pembimbing", image: pembimbingImg, path: "/guru/pembimbing" },
      { key: "is_koordinator", name: "Koordinator", image: koordinatorImg, path: "/guru/koordinator" },
    ];

    // filter role berdasarkan yang true di localStorage
    const availableRoles = allRoles.filter(
      (role) => localStorage.getItem(role.key) === "true"
    );

    setGuruName(storedName);
    setRoles(availableRoles);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedRole) return;

    const selected = roles.find((r) => r.name === selectedRole);
    localStorage.setItem("guru_role", selectedRole);

    navigate(selected?.path || "/guru");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF9]">
      {/* Header */}
      <Header user={{ name: guruName, role: "Guru" }} />

      {/* Konten utama */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-[#641E20] text-3xl font-bold mb-2">Pilih Role Kamu</h2>
        <p className="text-gray-500 mb-10">
          Pilih salah satu peran yang tersedia untuk melanjutkan ke dashboard.
        </p>

        {/* Grid card */}
        <div className="flex justify-center w-full mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {roles.length > 0 ? (
              roles.map((role) => (
                <div
                  key={role.name}
                  onClick={() => setSelectedRole(role.name)}
                  className={`cursor-pointer border-2 rounded-xl p-6 w-56 flex flex-col items-center justify-center transition-all ${
                    selectedRole === role.name
                      ? "border-[#641E20] bg-[#F5EDE7]"
                      : "border-[#E6D6C4] hover:border-[#641E20]/50"
                  }`}
                >
                  <img
                    src={role.image}
                    alt={role.name}
                    className="w-24 h-24 object-contain mb-4"
                  />
                  <span
                    className={`font-semibold text-lg ${
                      selectedRole === role.name ? "text-[#641E20]" : "text-gray-700"
                    }`}
                  >
                    {role.name}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 italic">Tidak ada role yang tersedia.</p>
            )}
          </div>
        </div>

        {/* Tombol Masuk */}
        {roles.length > 0 && (
          <button
            onClick={handleSubmit}
            className="bg-[#EC933A] hover:bg-[#d77d27] text-white px-8 py-3 rounded-lg font-semibold text-lg transition"
          >
            Masuk
          </button>
        )}
      </div>
    </div>
  );
}
