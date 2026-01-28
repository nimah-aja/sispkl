import React, { useEffect, useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// components
import Header from "./components/HeaderBiasa";
import Sidebar from "./components/SidebarBiasa";
import Table from "./components/Table";
import SearchBar from "./components/Search";

// utils
import {
  getAvailableIndustri,
  getIndustriById,
} from "../utils/services/siswa/industri";

export default function IndustriPage() {
  const user =
    JSON.parse(localStorage.getItem("user")) || { name: "Pengguna", role: "Admin" };

  const [active, setActive] = useState("industri");
  const [search, setSearch] = useState("");
  const [openExport, setOpenExport] = useState(false);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchIndustri = async () => {
      try {
        const available = await getAvailableIndustri();

        const detailResults = await Promise.all(
          available.data.map((item) => getIndustriById(item.id))
        );

        setData(detailResults);
      } catch (err) {
        console.error("Gagal mengambil data industri:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIndustri();
  }, []);

  const filteredData = data.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ================= TABLE ================= */
  const columns = [
    { label: "Nama Industri", key: "name" },
    { label: "Alamat", key: "address" },
    { label: "Bidang", key: "sector" },
    { label: "Kuota", key: "quota" },
    { label: "Sisa", key: "remaining_slots" },
    { label: "Pembimbing Industri", key: "pic_name" },
    { label: "No Pembimbing Industri", key: "pic_phone" },
    { label: "Email", key: "email" },
    {
      label: "Website",
      key: "website",
      render: (val) =>
        val ? (
          <a
            href={val}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            {val}
          </a>
        ) : (
          "-"
        ),
    },
  ];

  /* ================= EXPORT ================= */
  const exportData = filteredData.map((d, i) => ({
    No: i + 1,
    ID: d.id,
    Nama: d.name,
    Alamat: d.address,
    Sektor: d.sector,
    Kuota: d.quota,
    Sisa: d.remaining_slots,
    PIC: d.pic_name,
    "No PIC": d.pic_phone,
    Email: d.email,
    Website: d.website || "-",
  }));

  const downloadPDF = () => {
    if (!exportData.length) return;

    const doc = new jsPDF();
    doc.text("Data Industri", 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map(Object.values),
      styles: { fontSize: 9 },
    });

    doc.save("data-industri.pdf");
    setOpenExport(false);
  };

  const downloadExcel = () => {
    if (!exportData.length) return;

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Industri");
    XLSX.writeFile(wb, "data-industri.xlsx");
    setOpenExport(false);
  };

  return (
    <div className="bg-white min-h-screen w-full">
      <Header user={user} />

      <div className="flex flex-col md:flex-row">
        <div className="md:block hidden">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 bg-[#641E21] rounded-none md:rounded-l-3xl shadow-inner">
          {/* TITLE */}
          <div className="flex items-center gap-2 mb-4 relative">
            <h2 className="text-white font-bold text-lg">Industri</h2>

            <button onClick={() => setOpenExport(!openExport)} className="!bg-transparent">
              <Download size={18} className="text-white" />
            </button>

            {/* EXPORT MENU */}
            {openExport && (
              <div className="absolute top-9 left-25 bg-white rounded shadow p-2 z-50">
                <button
                  onClick={downloadPDF}
                  className="!bg-transparent flex items-center gap-2 px-3 py-2 hover:!bg-gray-100 w-full"
                >
                  <FileText size={14} /> PDF
                </button>

                <button
                  onClick={downloadExcel}
                  className="!bg-transparent flex items-center gap-2 px-3 py-2 hover:!bg-gray-100 w-full"
                >
                  <FileSpreadsheet size={14} /> Excel
                </button>
              </div>
            )}
          </div>

          {/* SEARCH */}
          <SearchBar
            query={search}
            setQuery={setSearch}
            placeholder="Cari industri..."
            className="mb-4"
          />

          {/* TABLE */}
          {loading ? (
            <p className="text-white font-semibold">Memuat data...</p>
          ) : (
            <Table
              columns={columns}
              data={filteredData}
              emptyText="Belum ada data industri"
            />
          )}
        </main>
      </div>
    </div>
  );
}
