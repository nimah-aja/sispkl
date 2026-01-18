import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// import components
import Header from "./components/HeaderBiasa";
import Sidebar from "./components/SidebarBiasa";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Add from "./components/Add";
import DeleteConfirmationModal from "./components/Delete";
import SaveConfirmationModal from "./components/Save";
import Pagination from "./components/Pagination"; 

// import assets
import guruImg from "../assets/addSidebar.svg";
import editGrafik from "../assets/editGrafik.svg";
import deleteImg from "../assets/deleteGrafik.svg";
import saveImg from "../assets/save.svg";

import { getGuruIndustri } from "../utils/services/pembimbing/guru";


export default function GuruPage() {
  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef(null);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("industri");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [industriData, setIndustriData] = useState([]);


  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Pembimbing",
  };

  // =========================
  // DATA (INDUSTRI)
  // =========================
  useEffect(() => {
    const fetchIndustri = async () => {
        setLoading(true);
        try {
        const res = await getGuruIndustri(); // panggil API
        // Map sesuai format tabel
        const mapped = res.data.map((item, i) => ({
            no: i + 1,
            industri_id: item.industri_id,
            nama_industri: item.industri_nama,
            jumlah_siswa: item.jumlah_siswa,
        }));
        setIndustriData(mapped);
        } catch (err) {
        console.error("Gagal fetch industri:", err);
        toast.error("Gagal memuat data industri");
        } finally {
        setLoading(false);
        }
    };

    fetchIndustri();
    }, []);


  // =========================
  // FILTER SEARCH
  // =========================
  const filteredData = industriData.filter((item) =>
    item.nama_industri.toLowerCase().includes(search.toLowerCase())
    );

    

  // Nomor urut
  const dataWithNo = filteredData.map((item, i) => ({
    no: i + 1,
    ...item,
  }));

  // =========================
  // PAGINATION
  // =========================
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
    );


  // =========================
  // KOLOM TABEL (DIUBAH)
  // =========================
  const columns = [
    { label: "No", key: "no", sortable: false },
    { label: "Nama Industri", key: "nama_industri" },
    { label: "Jumlah Siswa", key: "jumlah_siswa", sortable: false },
  ];

  // =========================
  // EXPORT
  // =========================
  const exportData = filteredData.map((item) => ({
    No: item.no,
    "Nama Industri": item.nama_industri,
    "Jumlah Siswa": item.jumlah_siswa,
    }));


  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.text("Data Industri", 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0] || {})],
      body: exportData.map((item) => Object.values(item)),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [100, 30, 33] },
    });

    doc.save("data_industri.pdf");
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Industri");
    XLSX.writeFile(workbook, "data_industri.xlsx");
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="bg-white min-h-screen w-full">
      <Header user={user} />

      <div className="flex flex-col md:flex-row">
        <div className="md:block hidden">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 rounded-none md:rounded-l-3xl bg-[#641E21] shadow-inner">
          <div className="flex items-center mb-4 gap-1 w-full relative">
            <h2 className="text-white font-bold text-base sm:text-lg">
              Industri
            </h2>

            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setOpenExport(!openExport)}
                className="flex items-center gap-2 px-3 py-2 text-white !bg-transparent hover:bg-white/10 rounded-full"
              >
                <Download size={18} />
              </button>

              {openExport && (
                <div className="absolute left-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-md p-2 z-50">
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
            query={search}
            setQuery={setSearch}
            placeholder="Pencarian"
            className="mb-4 w-[100%]"
          />

          <div className="mt-4">
            {loading ? (
              <p className="text-center text-white font-semibold">
                Memuat data...
              </p>
            ) : (
              <>
                <Table columns={columns} data={paginatedData} />

                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-0 text-white">
                    <p className="text-sm sm:text-base">
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