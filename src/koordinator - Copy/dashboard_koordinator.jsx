import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import dayjs from "dayjs";

// components
import Sidebar from "./components/SidebarDashboard";
import Header from "./components/HeaderDashboard";
import DashboardCard from "./components/DashboardCard";
// import AktivitasTerkini from "./components/AktivitasTerkini";
import CalendarPanel from "./components/Calender";
import Detail from "./components/Detail";

// utils
import { getSiswa } from "../utils/services/admin/get_siswa";
import { getPKLApplicationSummary } from "../utils/services/kapro/pengajuanPKL";
import { getTotalPembimbing } from "../utils/services/kapro/pembimbing";
import { getApprovedPKL } from "../utils/services/koordinator/pengajuan";

// assets
import sidebarUsers from "../assets/sidebarUsers.svg";
import applicationPKL from "../assets/pengajuan_PKL.svg";
import Pembimbing from "../assets/pembimbing.svg";
import perpindahanPKL from "../assets/perpindahan_pkl.svg";

export default function KoordinatorDashboard() {
  const navigate = useNavigate();

  const [active, setActive] = useState("sidebarDashboard");
  const [query, setQuery] = useState("");
  const [dataDisplay, setDataDisplay] = useState([]);

  const [aktivitas, setAktivitas] = useState([]);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailAktivitas, setDetailAktivitas] = useState(null);

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Koordinator",
  };

  // =========================
  // FETCH DASHBOARD DATA
  // =========================
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Ambil data pengajuan PKL yang sudah disetujui
        const approvedPKLResponse = await getApprovedPKL();
        const approvedPKL = approvedPKLResponse.data || []; // Ambil array data dari response
        const totalApprovedPKL = approvedPKLResponse.total || approvedPKL.length; // Ambil total dari response

        // Hitung jumlah siswa UNIK dari data pengajuan PKL
        const uniqueSiswa = new Map(); // Gunakan Map untuk menyimpan siswa unik
        
        approvedPKL.forEach(item => {
          const siswaId = item.siswa_id;
          const siswaNISN = item.siswa_nisn;
          const uniqueKey = siswaId || siswaNISN; // Gunakan ID atau NISN sebagai kunci unik
          
          if (!uniqueSiswa.has(uniqueKey)) {
            uniqueSiswa.set(uniqueKey, {
              id: siswaId,
              nisn: siswaNISN,
              nama: item.siswa_username,
              kelas: item.kelas_nama,
              jurusan: item.jurusan_nama
            });
          }
        });

        const totalUniqueSiswa = uniqueSiswa.size;

        // Ambil total pembimbing
        const totalPembimbing = await getTotalPembimbing();

        // DASHBOARD CARD
        setDataDisplay([
          {
            title: "Data Siswa",
            icon: sidebarUsers,
            value: totalUniqueSiswa,
            description: `${totalUniqueSiswa} siswa aktif PKL`,
          },
          {
            title: "Pengajuan PKL",
            icon: applicationPKL,
            value: totalApprovedPKL,
            description: `${totalApprovedPKL} total pengajuan`,
          },
          {
            title: "Pembimbing",
            icon: Pembimbing,
            value: totalPembimbing,
            description: `${totalPembimbing} pembimbing`,
          },
          // {
          //   title: "Perpindahan PKL",
          //   icon: perpindahanPKL,
          //   value: 0,
          //   description: "Belum tersedia",
          // },
        ]);

        // =========================
        // AKTIVITAS 7 HARI TERAKHIR
        // =========================
        const sevenDaysAgo = dayjs().subtract(7, "day");

        const aktivitas7Hari = approvedPKL
          .filter((item) =>
            dayjs(item.tanggal_permohonan).isAfter(sevenDaysAgo)
          )
          .map((item) => ({
            id: item.application_id,
            type: item.status,
            title: "Pengajuan PKL Disetujui",
            description: `${item.siswa_username} mengajukan PKL di ${item.industri_nama}`,
            time: dayjs(item.tanggal_permohonan).format(
              "DD MMM YYYY HH:mm"
            ),
            nama_siswa: item.siswa_username,
            industri: item.industri_nama,
            kelas: item.kelas_nama,
            jurusan: item.jurusan_nama,
            nisn: item.siswa_nisn,
            siswa_id: item.siswa_id,
            tanggal_mulai: item.tanggal_mulai,
            tanggal_selesai: item.tanggal_selesai,
          }))
          .sort((a, b) => dayjs(b.time).diff(dayjs(a.time))); // Urutkan dari terbaru

        setAktivitas(aktivitas7Hari);
      } catch (err) {
        console.error("Gagal load dashboard koordinator:", err);
      }
    };

    fetchDashboardData();
  }, []);

  const filteredDisplay = dataDisplay.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full bg-white">
      <Sidebar active={active} setActive={setActive} />

      <div className="flex flex-col flex-1">
        <Header query={query} setQuery={setQuery} user={user} />

        <main className="flex-1 p-6 bg-white overflow-auto rounded-tl-3xl">

          {/* DASHBOARD CARD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredDisplay.map((item, idx) => (
              <DashboardCard
                key={idx}
                item={item}
                onClick={() => {
                  const title = item.title.toLowerCase();
                  if (title.includes("siswa"))
                    navigate("/guru/koordinator/pesertaPKL");
                  else if (title.includes("pengajuan"))
                    navigate("/guru/koordinator/pengajuanPKL");
                  else if (title.includes("pembimbing"))
                    navigate("/guru/koordinator/pembimbing");
                  else if (title.includes("perpindahan"))
                    navigate("/guru/koordinator/perpindahanPKL");
                }}
              />
            ))}
          </div>

          {/* KALENDER */}
          <div className="mt-10 max-w-6xl mx-auto">
            <CalendarPanel />
          </div>

          {/* AKTIVITAS TERKINI */}
          {/* <div className="mt-10 max-w-6xl mx-auto">
            <AktivitasTerkini
              title="Aktivitas Terkini (7 Hari Terakhir)"
              icon="🔔"
              items={aktivitas}
              color="#641E21"
              onItemClick={(item) => {
                setDetailAktivitas(item);
                setOpenDetail(true);
              }}
            />
          </div> */}
        </main>

        {/* DETAIL MODAL */}
        {openDetail && detailAktivitas &&
          createPortal(
            <Detail
              mode="view"
              title="Detail Pengajuan PKL"
              onClose={() => {
                setOpenDetail(false);
                setDetailAktivitas(null);
              }}
              initialData={{
                nama_industri: detailAktivitas.industri,
                nama_siswa: detailAktivitas.nama_siswa,
                nisn: detailAktivitas.nisn,
                kelas: detailAktivitas.kelas,
                jurusan: detailAktivitas.jurusan,
                status: detailAktivitas.type,
                tanggal_permohonan: detailAktivitas.time,
                tanggal_mulai: detailAktivitas.tanggal_mulai,
                tanggal_selesai: detailAktivitas.tanggal_selesai,
              }}
              fields={[
                { name: "nama_industri", label: "Industri" },
                { name: "nama_siswa", label: "Nama Siswa" },
                { name: "nisn", label: "NISN" },
                { name: "kelas", label: "Kelas" },
                { name: "jurusan", label: "Konsentrasi Keahlian" },
                { name: "status", label: "Status" },
                { name: "tanggal_permohonan", label: "Tanggal Pengajuan" },
                { name: "tanggal_mulai", label: "Tanggal Mulai" },
                { name: "tanggal_selesai", label: "Tanggal Selesai" },
              ]}
            />,
            document.body
          )}
      </div>
    </div>
  );
}