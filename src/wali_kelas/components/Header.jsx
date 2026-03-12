import { Search, Download, FileSpreadsheet, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";

// helper
import { removeTokens } from "../../utils/authHelper";

// import components
import LogoutModal from "../components/Logout"; 

// import asset
import logo from "../../assets/logo.png";
import profile from "../../assets/profile.svg";
import logoutIcon from "../../assets/logout.svg";
import logoutImage from "../../assets/logout.jpg";

// import utils untuk export
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

// IMPORT SERVICE EXPORT PENILAIAN WALI
import { exportPenilaianWali } from "../../utils/services/guru/exportPenilaianWali";

export default function Header({ 
  query, 
  setQuery, 
  user: propUser,
  onExportExcel, // Props untuk fungsi export Excel (opsional)
  onExportPDF,   // Props untuk fungsi export PDF (opsional)
  exportData,    // Props untuk data yang akan diexport (opsional)
  showExport = false, // Props untuk menampilkan/menyembunyikan button export
  exportFilename = "data_export", // Nama file default untuk export
  useWaliExport = false // Props untuk menggunakan service export wali
}) {
  const navigate = useNavigate();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const exportDropdownRef = useRef(null);

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

  // Fungsi export menggunakan service exportPenilaianWali
  const handleExportWali = async () => {
    try {
      setLoadingExport(true);
      toast.loading("Menyiapkan export rekap nilai...", { id: "exportWali" });
      
      await exportPenilaianWali();
      
      toast.success("Rekap nilai berhasil diexport!", { id: "exportWali" });
    } catch (error) {
      console.error("Error export wali:", error);
      toast.error("Gagal export rekap nilai: " + (error.message || "Terjadi kesalahan"), { id: "exportWali" });
    } finally {
      setLoadingExport(false);
      setShowExportDropdown(false);
    }
  };

  // Fungsi export Excel default
  const handleExportExcel = () => {
    if (useWaliExport) {
      handleExportWali();
      return;
    }

    if (onExportExcel) {
      // Jika ada props onExportExcel, gunakan itu
      onExportExcel();
    } else if (exportData && exportData.length > 0) {
      // Jika ada exportData, gunakan data tersebut
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");
      XLSX.writeFile(wb, `${exportFilename}.xlsx`);
      toast.success("Data berhasil diekspor ke Excel");
    } else {
      toast.error("Tidak ada data untuk diekspor");
    }
    setShowExportDropdown(false);
  };

  // Fungsi export PDF default
  const handleExportPDF = () => {
    if (useWaliExport) {
      // Untuk export wali, hanya support Excel, bukan PDF
      toast.error("Export PDF tidak tersedia untuk rekap nilai wali. Gunakan Export Excel.");
      setShowExportDropdown(false);
      return;
    }

    if (onExportPDF) {
      // Jika ada props onExportPDF, gunakan itu
      onExportPDF();
    } else if (exportData && exportData.length > 0) {
      // Jika ada exportData, gunakan data tersebut
      const doc = new jsPDF();
      doc.text("Data Export", 14, 15);
      
      const headers = Object.keys(exportData[0] || {});
      const body = exportData.map(item => Object.values(item));
      
      autoTable(doc, {
        startY: 20,
        head: [headers],
        body: body,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [100, 30, 33] },
      });
      
      doc.save(`${exportFilename}.pdf`);
      toast.success("Data berhasil diekspor ke PDF");
    } else {
      toast.error("Tidak ada data untuk diekspor");
    }
    setShowExportDropdown(false);
  };

  // Click outside untuk menutup dropdown export
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
    };

    if (showExportDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportDropdown]);

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
          {/* search */}
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

          {/* BUTTON EXPORT NILAI */}
          {showExport && (
            <div className="relative" ref={exportDropdownRef}>
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                disabled={loadingExport}
                className={`flex items-center gap-2 bg-[#EC933A] text-white px-4 py-2 rounded-full hover:bg-[#d47d2c] transition ${
                  loadingExport ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title="Export Nilai"
              >
                <Download size={18} />
                <span className="font-semibold">
                  {loadingExport ? "Memproses..." : "Export Nilai"}
                </span>
              </button>

              {showExportDropdown && !loadingExport && (
                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-md p-2 z-50 min-w-[180px]">
                  <button
                    onClick={handleExportExcel}
                    className="!bg-transparent flex items-center gap-2 px-3 py-2 hover:!bg-gray-100 text-sm w-full rounded"
                  >
                    <FileSpreadsheet size={16} className="text-green-600" />
                    {useWaliExport ? "Export Rekap Nilai (Excel)" : "Export Excel"}
                  </button>
                  
                  {/* Sembunyikan opsi PDF jika menggunakan export wali */}
                  {!useWaliExport && (
                    <button
                      onClick={handleExportPDF}
                      className="!bg-transparent flex items-center gap-2 px-3 py-2 hover:!bg-gray-100 text-sm w-full rounded"
                    >
                      <FileText size={16} className="text-red-600" />
                      Export PDF
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* profile */}
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

          {/* logout button */}
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