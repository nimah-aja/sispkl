import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Pagination from "./components/Pagination";


// import components
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Table from "./components/Table";

// import assets
import sidebarUsers from "../assets/sidebarUsers.svg";
import pengajuanPKL from "../assets/pengajuan_PKL.svg";
import Pembimbing from "../assets/pembimbing.svg";
import suratPengantaran from "../assets/surat_pengantaran.svg";
import monitoring from "../assets/monitoring.svg";
import suratPenjemputan from "../assets/surat_penjemputan.svg";
import perpindahanPKL from "../assets/perpindahan_pkl.svg";
import pembekalan from "../assets/pembekalan.svg";

export default function DataPeserta() {
  const exportRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [openExport, setOpenExport] = useState(false);

  const [active, setActive] = useState("siswa");
  const [query, setQuery] = useState("");
  const [dataDisplay, setDataDisplay] = useState([]);
  const [kelas, setKelas] = useState("");
  const [industri, setIndustri] = useState("");
  const [status, setStatus] = useState("");
  const [peserta, setPeserta] = useState([]);

  // const user =
  //   JSON.parse(localStorage.getItem("user")) || {
  //     name: "Guest",
  //     role: "admin",
  //   };

  const namaGuru = localStorage.getItem("nama_guru") || "Guru SMK";

  const user = { 
    name: namaGuru,
    role: "Pembimbing" 
  };


  const navigate = useNavigate();

  // FILTER OPTIONS
  const filters = [
    {
      label: "Kelas",
      value: kelas,
      options: ["X RPL 1", "X RPL 2", "XI TKJ 1", "XI TKJ 2"],
      onChange: setKelas,
    },
    {
      label: "Status",
      value: status,
      options: ["Aktif", "Selesai", "Pending"],
      onChange: setStatus,
    },
  ];

   // FILTERING PESERTA
  const filteredPeserta = peserta.filter((item) => {
    return (
      item.nama.toLowerCase().includes(query.toLowerCase()) &&
      (kelas ? item.kelas === kelas : true) &&
      (industri ? item.industri === industri : true) &&
      (status ? item.status === status : true)
    );
  });

  useEffect(() => {
      setCurrentPage(1);
    }, [query, kelas, industri, status]);

    const totalPages = Math.ceil(filteredPeserta.length / itemsPerPage);

    const paginatedData = filteredPeserta.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );


  // DUMMY DATA
  useEffect(() => {
    const dummyData = [
      { title: "Peserta PKL", icon: sidebarUsers, value: 25 },
      { title: "Pengajuan PKL", icon: pengajuanPKL, value: 10 },
      { title: "Pembimbing", icon: Pembimbing, value: 5 },
      { title: "Surat Pengantaran", icon: suratPengantaran, value: 8 },
      { title: "Monitoring", icon: monitoring, value: 12 },
      { title: "Surat Penjemputan", icon: suratPenjemputan, value: 6 },
      { title: "Perpindahan PKL", icon: perpindahanPKL, value: 3 },
      { title: "Pembekalan", icon: pembekalan, value: 7 },
    ];
    setDataDisplay(dummyData);

    const dummyPeserta = [
      {
        nisn: "1234567890",
        nama: "Firli Zulfa Azzahra",
        industri: "Emran Digital",
        kelas: "X RPL 1",
        notelp: "08029102121",
        status: "Aktif",
      },
      {
        nisn: "1234567891",
        nama: "Rama Yuda Pratama",
        industri: "Telkom Indonesia",
        kelas: "X RPL 2",
        notelp: "08029102121",
        status: "Aktif",
      },
      {
        nisn: "1234567892",
        nama: "Aulia Rahmawati",
        industri: "UBIG",
        kelas: "XI TKJ 1",
        notelp: "08029102121",
        status: "Selesai",
      },
      {
        nisn: "1234567893",
        nama: "Fajar Wicaksono",
        industri: "Dinas Kominfo",
        kelas: "XI TKJ 2",
        notelp: "08029102121",
        status: "Pending",
      },
    ];

    setPeserta(dummyPeserta);
  }, []);

   // kolom tabel
  const columns = [
    { label: "NISN", key: "nisn" },
    { label: "Nama", key: "nama" },
    { label: "Industri", key: "industri" },
    { label: "Kelas", key: "kelas" },
    { label: "Notelp", key: "notelp" },
    { label: "Status", key: "status" },
  ];


  const exportData = filteredPeserta.map((item, i) => ({
    No: i + 1,
    NISN: item.nisn,
    Nama: item.nama,
    Industri: item.industri,
    Kelas: item.kelas,
    Notelp: item.notelp,
    Status: item.status,
  }));


  const handleExportExcel = () => {
  if (!exportData.length) return;
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Peserta PKL");
  XLSX.writeFile(wb, "data_peserta_pkl.xlsx");
};

const handleExportPDF = () => {
  if (!exportData.length) return;
  const doc = new jsPDF();
  doc.text("Data Peserta PKL", 14, 15);

  autoTable(doc, {
    startY: 20,
    head: [Object.keys(exportData[0])],
    body: exportData.map((d) => Object.values(d)),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [100, 30, 33] },
  });

  doc.save("data_peserta_pkl.pdf");
};


  return (
    <div className="bg-white min-h-screen w-full">
          <Header user={user} />
    
          <div className="flex">
            <div className="hidden md:block">
              <Sidebar active={active} setActive={setActive} />
            </div>

        <main className="flex-1 h-full min-h-screen p-4 sm:p-6 md:p-10 bg-[#641E21] rounded-tl-3xl shadow-inner">
          <div className="flex items-center mb-4 sm:mb-6 gap-1 w-full relative">
                                        <h2 className="text-white font-bold text-base sm:text-lg">
                                          Data Peserta Didik
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
                                                  handleExportPDF();
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
            filters={filters}
            placeholder="Cari siswa..."
          />

          <Table columns={columns} data={paginatedData} />

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 text-white">
              <span>
                Halaman {currentPage} dari {totalPages}
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}

          
        </main>
      </div>
    </div>
  );
}
