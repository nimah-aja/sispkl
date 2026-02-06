import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Pagination from "./components/Pagination";
import dayjs from "dayjs";


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

import { getGuruSiswa, getGuruTasks } from "../utils/services/pembimbing/guru"; 

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
  const [kelasOptions, setKelasOptions] = useState([]);


  const namaGuru = localStorage.getItem("nama_guru") || "Guru SMK";

  const user = { 
    name: namaGuru,
    role: "Pembimbing" 
  };


  const navigate = useNavigate();

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


    useEffect(() => {
    const fetchPeserta = async () => {
      try {
        // 1. Ambil data siswa
        const siswaRes = await getGuruSiswa(); 
        const siswaData = siswaRes.data;

        // 2. Ambil data tasks untuk dapetin nisn & kelas
        const tasksRes = await getGuruTasks();
        const tasksData = tasksRes.data;

        // 3. Map siswaData ke format table lengkap
        const mappedPeserta = siswaData.map((item) => {
          // cari data siswa di tasksData
          let taskSiswa = null;
          for (const industri of tasksData) {
            const found = industri.siswa.find((s) => s.id === item.siswa_id);
            if (found) {
              taskSiswa = found;
              break;
            }
          }

          return {
            username: item.siswa_username,
            nama: item.siswa_nama,
            industri: item.industri_nama,
            nisn: taskSiswa?.nisn || "-",      
            kelas: taskSiswa?.kelas || "-",    
            tanggal_mulai: dayjs(item.tanggal_mulai).format("DD-MM-YYYY"),
            tanggal_selesai: dayjs(item.tanggal_selesai).format("DD-MM-YYYY"),
            status: item.status,
          };
        });

        setPeserta(mappedPeserta);

        // Ambil semua kelas unik dari mappedPeserta
        const uniqueKelas = [...new Set(mappedPeserta.map((item) => item.kelas))];
        setKelasOptions(uniqueKelas);

      } catch (err) {
        console.error("Gagal fetch peserta:", err);
      }
    };

    fetchPeserta();
  }, []);


   // kolom tabel
  const columns = [
    { label: "Username", key: "username" },
    { label: "Nama", key: "nama" },
    {label: "NISN", key: "nisn"},
    {label: "Kelas", key: "kelas"},
    { label: "Industri", key: "industri" },
    { label: "Tanggal Mulai", key: "tanggal_mulai" },
    { label: "Tanggal Selesai", key: "tanggal_selesai" },
    { label: "Status", key: "status" },
  ];

  // FILTER OPTIONS
  const filters = [
    {
      label: "Kelas",
      value: kelas,
      options: kelasOptions,
      onChange: setKelas,
    },
  ];

  const exportData = filteredPeserta.map((item, i) => ({
    No: i + 1,
    Username : item.username,
    Nama: item.nama,
    NISN: item.nisn,
    Kelas: item.kelas,
    Industri: item.industri,
    Tanggal_Mulasi : item.tanggal_mulai,
    Tanggal_Selesai : item.tanggal_selesai,
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
                                          Data Siswa
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
