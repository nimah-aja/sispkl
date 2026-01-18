import React, { useState, useEffect } from "react";
import Header from "../admin/components/Header";
import waliKelasImg from "../assets/waliKelas.svg";
import kaprodiImg from "../assets/kaprodi.svg";
import pembimbingImg from "../assets/pembimbing_role.svg";
import koordinatorImg from "../assets/koordinator.svg";
import { useNavigate } from "react-router-dom";

export default function RoleOption() {
  const [selectedRole, setSelectedRole] = useState("");
  const [guruName, setGuruName] = useState("Guru SMK");
  const [roles, setRoles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedName = localStorage.getItem("nama_guru") || "Guru SMK";

    const allRoles = [
      { key: "is_wali_kelas", name: "Wali Kelas", image: waliKelasImg, path: "/guru/wali_kelas/" },
      { key: "is_kaprog", name: "Kepala Kompetensi Keahlian", image: kaprodiImg, path: "/guru/kaprodi" },
      { key: "is_pembimbing", name: "Pembimbing", image: pembimbingImg, path: "/guru/pembimbing/dashboard_pembimbing" },
      { key: "is_koordinator", name: "Koordinator", image: koordinatorImg, path: "/guru/koordinator" },
    ];

    // Filter hanya role yang aktif di localStorage
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
    <div className="min-h-screen flex flex-col bg-[#FFFFFF]">
      {/* Header */}
      <Header user={{ name: guruName, role: "Guru" }} />

      {/* Konten utama */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-[#641E20] text-2xl font-bold mb-2">Pilih Role Kamu</h2>

        <p
          className="text-gray-500 mb-10"
          style={{ fontSize: "20px" }}
        >
          Untuk memulai proyek Anda kami perlu menyesuaikan preferensi Anda.
        </p>

        {/* Grid card */}
        <div className="flex justify-center w-full mb-10">
          <div
            className="grid gap-8 justify-center"
            style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(206px, 1fr))`,
              maxWidth: "1200px",
            }}
          >
            {roles.length > 0 ? (
              roles.map((role) => (
                <div
                  key={role.name}
                  onClick={() => setSelectedRole(role.name)}
                  className={`cursor-pointer rounded-[10px] flex flex-col items-center justify-center transition-all ${
                    selectedRole === role.name
                      ? "border-[3px] border-[#641E20] bg-[#FFFFFF]"
                      : "border-[3px] border-[#E1D6C4] bg-[#FFFFFF] hover:border-[#641E20]/60"
                  }`}
                  style={{
                    width: "270px",
                    height: "305px",
                    padding: "32px 24px",
                  }}
                >
                  <div className="flex flex-col items-center justify-center pb-4">
                    <img
                      src={role.image}
                      alt={role.name}
                      className="w-30 h-30 object-contain mb-4"
                    />
                    <span
                      className={`mt-4 text-[#641E20] text-center leading-tight ${
                        selectedRole === role.name ? "font-bold" : "font-semibold"
                      }`}
                      style={{ fontSize: "25px" }}
                    >
                      {role.name}
                    </span>
                  </div>
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
            disabled={!selectedRole}
            className="font-semibold text-white rounded-[20px]"
            style={{
              backgroundColor: "#EC933A",
              width: "194px",
              height: "62px",
              fontSize: "22px",
            }}
          >
            Masuk
          </button>
        )}
      </div>
    </div>
  );
}