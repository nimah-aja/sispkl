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
  const itemsPerPage = 5;

  const [openExport, setOpenExport] = useState(false);

  const [active, setActive] = useState("sidebarUsers");
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
    role: "Koordinator" 
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
      label: "Industri",
      value: industri,
      options: ["Emran Digital", "Telkom Indonesia", "UBIG", "Dinas Kominfo"],
      onChange: setIndustri,
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
        guru: "Nimah Hidayah S.Pd",
        status: "Aktif",
      },
      {
        nisn: "1234567891",
        nama: "Rama Yuda Pratama",
        industri: "Telkom Indonesia",
        kelas: "X RPL 2",
        guru: "Nimah Hidayah S.Pd",
        status: "Aktif",
      },
      {
        nisn: "1234567892",
        nama: "Aulia Rahmawati",
        industri: "UBIG",
        kelas: "XI TKJ 1",
        guru: "Nimah Hidayah S.Pd",
        status: "Selesai",
      },
      {
        nisn: "1234567893",
        nama: "Fajar Wicaksono",
        industri: "Dinas Kominfo",
        kelas: "XI TKJ 2",
        guru: "Nimah Hidayah S.Pd",
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
    { label: "Guru", key: "guru" },
    { label: "Status", key: "status" },
  ];


  const exportData = filteredPeserta.map((item, i) => ({
    No: i + 1,
    NISN: item.nisn,
    Nama: item.nama,
    Industri: item.industri,
    Kelas: item.kelas,
    Guru: item.guru,
    Status: item.status,
  }));


  const handleExportExcel = () => {
  if (!exportData.length) return;
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Peserta PKL");
  XLSX.writeFile(wb, "data_peserta_pkl.xlsx");
};

const handleExportPdf = () => {
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
    <div className="flex h-screen w-full bg-white">
      {/* SIDEBAR */}
      <Sidebar active={active} setActive={setActive} />

      {/* MAIN AREA */}
      <div className="flex flex-col flex-1">
        <Header query={query} setQuery={setQuery} user={user} />

        <main className="flex-1 h-full min-h-screen p-4 sm:p-6 md:p-10 bg-[#641E21] rounded-tl-3xl shadow-inner">
          <div className="flex items-center justify-between mb-4">
                        <h2 className="text-white text-2xl font-bold">
                          Data Peserta PKL
                        </h2>
            
                        {/* EXPORT */}
                        <div className="relative -left-280" ref={exportRef}>
                          <button
                            onClick={() => setOpenExport(!openExport)}
                            className="flex items-center gap-2 px-4 py-2 !bg-transparent text-white rounded-full"
                          >
                            <Download size={20} />
                          </button>
            
                          {openExport && (
                            <div className="absolute -right-25 -mt-5 p-2 !bg-white border border-[#E1D6C4] rounded-lg shadow-md z-50">
                              <button
                                onClick={() => {
                                  handleExportExcel();
                                  setOpenExport(false);
                                }}
                                className="flex items-center gap-2 px-3 !bg-transparent py-2 hover:!bg-gray-100 text-sm w-full"
                              >
                                <FileSpreadsheet size={16} className="text-green-500" />
                                Excel
                              </button>
            
                              <button
                                onClick={() => {
                                  handleExportPdf();
                                  setOpenExport(false);
                                }}
                                className="flex items-center gap-2 px-3 py-2 !bg-transparent hover:!bg-gray-100 text-sm w-full"
                              >
                                <FileText size={16} className="text-red-500" />
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
