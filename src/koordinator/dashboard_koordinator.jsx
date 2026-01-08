import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import Detail from "./components/Detail";


// import components
import Sidebar from "./components/SidebarDashboard";
import Header from "./components/HeaderDashboard";
import DashboardCard from "./components/DashboardCard";
import Notification from "./components/Notification";
import AktivitasTerkini from "./components/AktivitasTerkini";



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

export default function KoordinatorDashboard() {
  const [openDetail, setOpenDetail] = useState(false);
  const [detailAktivitas, setDetailAktivitas] = useState(null);

  const [active, setActive] = useState("sidebarDashboard");
  const [query, setQuery] = useState("");
  const [dataDisplay, setDataDisplay] = useState([]);
  const navigate = useNavigate();
  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Koordinator",
  };
  // Data dummy
  useEffect(() => {
    const dummyData = [
      { title: "Data Peserta PKL", icon: sidebarUsers, value: 20 },
      { title: "Pengajuan PKL", icon: pengajuanPKL, value: 2 },
      { title: "Pembimbing", icon: Pembimbing, value: 2 },
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

  const dummyAktivitas = [
  {
    id: 1,
    type: "Tertunda",
    title: "Pengajuan PKL Baru",
    description: "Mirza Kholila mengajukan PKL di UBIG",
    time: "04 Jan 2026 10:00",
    nama_siswa: "Mirza Kholila",
    industri: "UBIG",
    kelas: "XI RPL 1",
    jurusan: "RPL",
    nisn: "1234567890",
    status: "Menunggu",
  },
];




  return (
  <div className="flex h-screen w-full bg-white">
    {/* SIDEBAR FULL HEIGHT */}
    <Sidebar active={active} setActive={setActive} />

    {/* AREA HEADER + MAIN */}
    <div className="flex flex-col flex-1">
      <Header query={query} setQuery={setQuery} user={user} />

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 bg-white overflow-auto rounded-tl-3xl">
        
        {/* DASHBOARD CARD GRID */}
        {filteredDisplay.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredDisplay.map((item, idx) => (
              <DashboardCard
                key={idx}
                item={item}
                onClick={() => {
  const title = item.title.toLowerCase();

  if (title.includes("peserta pkl"))
    navigate("/guru/koordinator/pesertaPKL");
  else if (title.includes("pengajuan pkl"))
    navigate("/guru/koordinator/pengajuanPKL");
  else if (title.includes("pembimbing"))
    navigate("/guru/koordinator/pembimbing");
  else if (title.includes("surat pengantaran"))
    navigate("/guru/koordinator/suratPengantaran");
  else if (title.includes("monitoring"))
    navigate("/guru/koordinator/monitoring");
  else if (title.includes("surat penjemputan"))
    navigate("/guru/koordinator/suratPenjemputan");
  else if (title.includes("perpindahan pkl"))
    navigate("/guru/koordinator/perpindahanPKL");
  else if (title.includes("pembekalan"))
    navigate("/guru/koordinator/pembekalan");
}}

              />
            ))}
          </div>
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center bg-white rounded-xl p-10 shadow-md">
            <p className="text-gray-600 font-medium">Data tidak ditemukan</p>
          </div>
        )}

        {/* NOTIFICATION SECTION */}
        <div className="mt-10 max-w-6xl mx-auto">
  <AktivitasTerkini
  title="Aktivitas Terkini"
  icon="🔔"
  items={dummyAktivitas}
  color="#641E21"
  onItemClick={(item) => {
    setDetailAktivitas(item);
    setOpenDetail(true);
  }}
/>
</div>


      </main>
      {openDetail && detailAktivitas &&
  createPortal(
    <Detail
      mode="view"
      title="Detail Pengajuan Pindah PKL"
      size="half"
      onClose={() => {
        setOpenDetail(false);
        setDetailAktivitas(null);
      }}

     initialData={{
      nama_industri: detailAktivitas.industri || "-",
      nama_siswa: detailAktivitas.nama_siswa || "-",
      nisn: detailAktivitas.nisn || "-",
      kelas: detailAktivitas.kelas || "-",
      jurusan: detailAktivitas.jurusan || "-",
      status: detailAktivitas.type || "-",
      tanggal_permohonan: detailAktivitas.time || "-",
    }}

      fields={[
        { name: "nama_industri", label: "Industri", full: true },
        { name: "nama_siswa", label: "Nama Siswa" },
        { name: "nisn", label: "NISN" },
        { name: "kelas", label: "Kelas" },
        { name: "jurusan", label: "Jurusan" },
        { name: "status", label: "Status" },
        { name: "tanggal_permohonan", label: "Tanggal Pengajuan" },
      ]}
    />,
    document.body
  )}

    </div>
  </div>
);

}
