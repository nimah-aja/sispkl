import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";


// import components
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import DashboardCard from "./components/DashboardCard";
import Notification from "./components/Notification";
import SearchBar from "./components/Search";

// import request
import axios from "../utils/axiosInstance";

// import assets
import sidebarUsers from "../assets/sidebarUsers.svg";
import pengajuanPKL from "../assets/pengajuan_PKL.svg";
import Pembimbing from "../assets/pembimbing.svg";
import suratPengantaran from "../assets/surat_pengantaran.svg";
import monitoring from "../assets/monitoring.svg";
import suratPenjemputan from "../assets/surat_penjemputan.svg";
import perpindahanPKL from "../assets/perpindahan_pkl.svg";
import pembekalan from "../assets/pembekalan.svg";
import  profile from "../assets/profile.svg";

export default function DataPengajuan() {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedSurat, setSelectedSurat] = useState(null);

  const [active, setActive] = useState("pengajuanPKL");
  const [query, setQuery] = useState("");
  const [dataDisplay, setDataDisplay] = useState([]);
  const navigate = useNavigate();
  // const user = JSON.parse(localStorage.getItem("user")) || { name: "Guest", role: "admin" };
  const namaGuru = localStorage.getItem("nama_guru") || "Guru SMK";

  const user = { 
    name: namaGuru,
    role: "Koordinator" 
  };

  const [kelas, setKelas] = useState("");

  const filters = [
    {
        label: "Kelas",
        value: kelas,
        options: ["XII RPL 1", "XII RPL 2", "XII TKJ 1", "XII DKV 1"],
        onChange: setKelas,
    }
 ];


  // Data dummy
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
  }, []);

  const filteredDisplay = dataDisplay.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

    const notifications = [
        {
            profile: "https://via.placeholder.com/60",
            name: "Mirza Kholila",
            class: "XII RPL 1",
            description: "Mengajukan PKL di UBIG",
            time: "2 jam yang lalu",
            acceptText: "Terima",
            rejectText: "Tolak",
            onAccept: () => alert("Mirza diterima"),
            onReject: () => alert("Mirza ditolak"),
        },
        {
            profile: "https://via.placeholder.com/60",
            name: "Erin Malik",
            class: "XII TKJ 2",
            description: "Mengajukan PKL di Telkom",
            time: "1 jam yang lalu",
        },
    ];


  const getInitials = (name) => {
    if (!name) return "";
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const handleOpenPreview = (item) => {
    setSelectedSurat(item);
    setShowPreview(true);
  };

  const handleExportPDF = (surat) => {
  if (!surat) return;

  const doc = new jsPDF();

  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("SURAT PENGAJUAN PKL", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("times", "normal");
  doc.text("SMK Negeri 2 Singosari", 105, 26, { align: "center" });

  doc.line(20, 30, 190, 30);

  doc.setFontSize(11);
  doc.text("Yth. Pimpinan Industri", 20, 40);

  doc.text(
    "Dengan hormat,\n\n" +
      "Bersama ini kami mengajukan permohonan Praktik Kerja Lapangan (PKL)\n" +
      "atas nama siswa berikut:",
    20,
    50
  );

  doc.text(`Nama   : ${surat.name}`, 20, 80);
  doc.text(`Kelas  : ${surat.class}`, 20, 88);

  doc.text(
    `${surat.description}.\n\n` +
      "Demikian surat ini kami sampaikan. Atas perhatian Bapak/Ibu,\n" +
      "kami ucapkan terima kasih.",
    20,
    100
  );

  doc.text("Hormat kami,", 140, 140);
  doc.text("Koordinator PKL", 140, 160);

  doc.save(`Surat_PKL_${surat.name}.pdf`);
};


const pengajuanList = [
  {
    name: "Mirza Kholila",
    class: "XII RPL 1",
    description: "Telah mengajukan tempat PKL di UBIG",
  },
  {
    name: "ZEZE",
    class: "XII RPL 2",
    description: "Telah mengajukan tempat PKL di UBIG",
  },
  {
    name: "Anas",
    class: "XII TKJ 1",
    description: "Telah mengajukan tempat PKL di UBIG",
  },
  {
    name: "Anis",
    class: "XII DKV 1",
    description: "Telah mengajukan tempat PKL di UBIG",
  },
  {
    name: "Mirza Kholila",
    class: "XII RPL 1",
    description: "Telah mengajukan tempat PKL di UBIG",
  },
];

const filteredPengajuan = pengajuanList.filter((item) => {
  const searchText = query.toLowerCase();

  const matchSearch =
    item.name.toLowerCase().includes(searchText) ||
    item.class.toLowerCase().includes(searchText) ||
    item.description.toLowerCase().includes(searchText);

  const matchKelas =
    kelas === "" || item.class === kelas;

  return matchSearch && matchKelas;
});







  return (
  <div className="flex min-h-screen w-full bg-white">
    {/* SIDEBAR FULL HEIGHT */}
    <Sidebar active={active} setActive={setActive} />

    {/* AREA HEADER + MAIN */}
    <div className="flex flex-col flex-1">
      <Header user={user} />

      {/* MAIN CONTENT */}
      <main className="flex-1 h-full min-h-screen p-4 sm:p-6 md:p-10 bg-[#641E21] rounded-tl-3xl shadow-inner">

        <h2 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-6">
            Data Pengajuan PKL
        </h2>

        <SearchBar
            query={query}
            setQuery={setQuery}
            filters={filters}
            placeholder="Cari siswa..."
        />

                {/* LIST DATA PENGAJUAN PKL */}
        <div className="mt-6 space-y-4">

        {filteredPengajuan.map((item, index) => (
            <div
  key={index}
  onClick={() => handleOpenPreview(item)}
  className="bg-white rounded-xl w-full py-4 px-4 flex items-center justify-between shadow-md cursor-pointer"
>

            {/* LEFT SIDE */}
            <div className="flex items-center">
                {/* ICON / PROFILE */}
                <div className="w-10 h-10 mr-4 rounded-full bg-[#641E21] text-white flex items-center justify-center font-bold text-sm">
  {getInitials(item.name)}
</div>


                {/* TEXT */}
                <div>
                    <h3 className="font-semibold text-[#641E21] text-base">
                    {item.name} | {item.class}
                    </h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
            </div>


            {/* BUTTON CETAK */}
            <button
  onClick={(e) => {
    e.stopPropagation();
    handleExportPDF(item);
  }}
  className="!bg-[#EC933A] text-white text-sm font-semibold px-5 !py-1 rounded-md hover:bg-[#e0911f] transition"
>
  Cetak
</button>



            </div>
        ))}

        </div>

        {showPreview && selectedSurat && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white w-[90%] max-w-2xl rounded-xl p-6 relative shadow-xl">

      {/* CLOSE */}
      <button
        onClick={() => setShowPreview(false)}
        className="absolute top-3 right-4 text-gray-500 text-xl font-bold hover:text-black !bg-transparent"
      >
        ×
      </button>

      {/* HEADER SURAT */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold uppercase">
          Surat Pengajuan PKL
        </h2>
        <p className="text-sm text-gray-500">
          SMK Negeri 2 Singosari
        </p>
      </div>

      {/* ISI SURAT */}
      <div className="text-sm text-gray-700 space-y-4 leading-relaxed">
        <p>Yth. Pimpinan Industri</p>

        <p>
          Dengan hormat, <br />
          Bersama ini kami mengajukan permohonan Praktik Kerja Lapangan (PKL)
          atas nama:
        </p>

        <ul className="pl-4">
          <li><strong>Nama:</strong> {selectedSurat.name}</li>
          <li><strong>Kelas:</strong> {selectedSurat.class}</li>
        </ul>

        <p>
          {selectedSurat.description}
        </p>

        <p>
          Demikian surat ini kami sampaikan. Atas perhatian Bapak/Ibu,
          kami ucapkan terima kasih.
        </p>
      </div>

      {/* FOOTER */}
      {/* FOOTER */}
      <div className="mt-8 flex justify-between items-end">
        <div className="text-sm">
          <p>Hormat kami,</p>
          <p className="font-semibold mt-4">Koordinator PKL</p>
        </div>

        <button
  onClick={() => handleExportPDF(selectedSurat)}
  className="!bg-[#641E21] text-white px-4 py-2 rounded-md text-sm hover:bg-[#4d1518] transition"
>
  Cetak
</button>

      </div>

    </div>
  </div>
)}



      </main>
    </div>
  </div>
);

}