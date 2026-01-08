import React, { useEffect, useState, useRef } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Pagination from "./components/Pagination";

import { getPembimbingList } from "../utils/services/kapro/pembimbing";

export default function DataPembimbingKaprog() {
  const exportRef = useRef(null);

  const [active, setActive] = useState("pembimbing");
  const [query, setQuery] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openExport, setOpenExport] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "KAPROG",
  };

  const columns = [
    { label: "Nama Pembimbing", key: "nama" },
    { label: "NIP", key: "nip" },
    { label: "No. Telepon", key: "no_telp" },
  ];

  // ================= FETCH DATA =================
  useEffect(() => {
    const fetchPembimbing = async () => {
      try {
        setLoading(true);
        const res = await getPembimbingList();
        setData(res || []);
      } catch (err) {
        console.error("Gagal mengambil data pembimbing:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPembimbing();
  }, []);

  // reset halaman saat search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  // close export saat klik luar
  useEffect(() => {
    function handleClickOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setOpenExport(false);
      }
    }

    if (openExport) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openExport]);

  // ================= FILTER + PAGINATION =================
  const filteredData = data.filter((item) =>
    Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const dataWithNo = filteredData.map((item, i) => ({
    ...item,
    no: i + 1,
  }));

  const totalPages = Math.ceil(dataWithNo.length / itemsPerPage);

  const paginatedData = dataWithNo.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ================= EXPORT DATA =================
  const exportData = filteredData.map((item, i) => ({
    No: i + 1,
    "Nama Pembimbing": item.nama,
    NIP: item.nip,
    "No. Telepon": item.no_telp,
  }));

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pembimbing");
    XLSX.writeFile(workbook, "data-pembimbing.xlsx");
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.text("Data Pembimbing PKL", 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [["No", "Nama Pembimbing", "NIP", "No. Telepon"]],
      body: exportData.map((row) => [
        row.No,
        row["Nama Pembimbing"],
        row.NIP,
        row["No. Telepon"],
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [100, 30, 33] },
    });

    doc.save("data-pembimbing.pdf");
  };

  return (
    <div className="bg-white min-h-screen w-full">
      <Header query={query} setQuery={setQuery} user={user} />

      <div className="flex">
        <div className="hidden md:block">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 bg-[#641E21] rounded-none md:rounded-l-3xl shadow-inner">
          <div className="flex items-center mb-4 sm:mb-6 gap-1 w-full relative">
                              <h2 className="text-white font-bold text-base sm:text-lg">
                                Siswa
                              </h2>
                  
                              <div className="relative" ref={exportRef}>
                                <button
                                  onClick={() => setOpenExport(!openExport)}
                                  className="flex items-center gap-2 px-3 py-2 text-white !bg-transparent hover:bg-white/10 rounded-full"
                                >
                                  <Download size={18} />
                                </button>
                  
                                {openExport && (
                                  <div className="absolute  left-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-md p-2 z-50">
                                    <button
                                      onClick={() => {
                                        handleExportExcel();
                                        setOpenExport(false);
                                      }}
                                      className="flex items-center gap-2 px-3 py-2 !bg-transparent hover:!bg-gray-100 text-sm w-full"
                                    >
                                      <FileSpreadsheet size={16} className="text-green-600" />
                                      Excel
                                    </button>
                  
                                    <button
                                      onClick={() => {
                                        handleExportPdf();
                                        setOpenExport(false);
                                      }}
                                      className="flex items-center gap-2 px-3 py-2 !bg-transparent hover:!bg-gray-100 text-sm w-full"
                                    >
                                      <FileText size={16} className="text-red-600" />
                                      PDF
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

          <SearchBar
            query={query}
            setQuery={setQuery}
            placeholder="Cari pembimbing"
          />

          <div className="rounded-2xl p-4">
            {loading ? (
              <p className="text-center text-white font-semibold">
                Memuat data...
              </p>
            ) : (
              <>
                <Table columns={columns} data={paginatedData} />

                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-2 text-white">
                    <p className="text-sm">
                      Halaman {currentPage} dari {totalPages} halaman
                    </p>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
