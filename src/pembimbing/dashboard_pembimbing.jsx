import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FilePlus, XCircle, User, FileText } from "lucide-react";
import industriIcon from "../assets/industri.svg";
dayjs.extend(relativeTime);
import sidebarCorporate from "../assets/sidebarCorporate.svg";

// Components
import Sidebar from "./components/SidebarDashboard";
import Header from "./components/HeaderDashboard";
import DashboardCard from "./components/DashboardCard";
import CalendarPanel from "./components/Calender";
import TugasTerbaru from "./components/TugasTerbaru";
import DaftarSiswaPKL from "./components/DaftarSiswaPKL";
import DaftarIndustri from "./components/DaftarIndustri";
import AktivitasTerkini from "./components/AktivitasTerkini";
import Detail from "./components/Detail";
import { 
  getGuruTasks, 
  getGuruSiswa,
} from "../utils/services/pembimbing/guru"; 
import {getMyRealisasiKegiatan} from "../utils/services/pembimbing/realisasi"; 
import {getActiveKegiatanPKL} from "../utils/services/pembimbing/kegiatan"; 

// Assets
import userIcon from "../assets/sidebarUsers.svg";
import timeIcon from "../assets/timewalkel.png";
import surrelIcon from "../assets/envelope.png";
import bellIcon from "../assets/bell-notification-social-media 1.png";
import perpindahan from "../assets/pindahPKL.svg";

export default function PKLDashboard() {
  const [active, setActive] = useState("sidebarDashboard");
  const [query, setQuery] = useState("");
  const [dataDisplay, setDataDisplay] = useState([
    {
      title: "Data Siswa",
      icon: userIcon,
      value: 0,
      description: "Memuat..."
    },
    {
      title: "Data Industri",
      icon: sidebarCorporate,
      value: 0,
      description: "Memuat..."
    },
    {
      title: "Kegiatan",
      icon: timeIcon,
      value: 0,
      description: "Memuat..."
    },
    {
      title: "Realisasi",
      icon: bellIcon,
      value: 0,
      description: "Memuat..."
    },
    {
      title: "Perizinan",
      icon: perpindahan,
      value: 0,
      description: "Belum ada data"
    },
    {
      title: "Permasalahan",
      icon: userIcon,
      value: 0,
      description: "Belum ada data"
    },
  ]);
  const [tugasTerbaru, setTugasTerbaru] = useState([]);
  const [siswa, setSiswa] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [selectedIndustri, setSelectedIndustri] = useState(null);
  const [selectedAktivitas, setSelectedAktivitas] = useState(null);
  const [aktivitasItems, setAktivitasItems] = useState([]);
  const [detailType, setDetailType] = useState(null); 

  const navigate = useNavigate();
  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Pembimbing",
  };

  // Fungsi untuk handle click detail dengan type yang jelas
  const handleDetailClick = (item, type) => {
    console.log(`Opening detail for ${type}:`, item);
    
    // Reset semua state detail sebelumnya
    setSelectedSiswa(null);
    setSelectedIndustri(null);
    setSelectedAktivitas(null);
    
    // Set type dan data sesuai dengan jenis
    setDetailType(type);
    
    if (type === 'siswa') {
      setSelectedSiswa(item);
    } else if (type === 'industri') {
      setSelectedIndustri(item);
    } else if (type === 'kegiatan') {
      setSelectedAktivitas({
        type: 'kegiatan',
        data: item
      });
    } else if (type === 'realisasi') {
      setSelectedAktivitas({
        type: 'realisasi',
        data: item
      });
    }
    
    setDetailOpen(true);
  };

  // Fungsi untuk menutup detail
  const handleCloseDetail = () => {
    console.log("Closing detail modal");
    setDetailOpen(false);
    // Tunggu sebentar sebelum reset data agar animasi smooth
    setTimeout(() => {
      setDetailType(null);
      setSelectedSiswa(null);
      setSelectedIndustri(null);
      setSelectedAktivitas(null);
    }, 300);
  };

  // Fetch data aktivitas (kegiatan aktif dan realisasi)
  useEffect(() => {
    const fetchAktivitas = async () => {
      try {
        console.log("Fetching aktivitas data...");
        
        // Ambil data kegiatan aktif
        const kegiatanRes = await getActiveKegiatanPKL();
        console.log("Kegiatan aktif response:", kegiatanRes);
        
        // Ambil data realisasi saya
        const realisasiRes = await getMyRealisasiKegiatan();
        console.log("Realisasi response:", realisasiRes);
        
        // Mapping data kegiatan aktif
        const kegiatanItems = (kegiatanRes || []).map((kegiatan) => {
          let type = "info"; 
          let title = "";
          
          if (kegiatan.status === "active") type = "info";
          
          switch (kegiatan.jenis_kegiatan) {
            case "Pembekalan":
              title = "Koordinator membuat Jadwal Pembekalan";
              break;
            case "Monitoring1":
              title = "Koordinator membuat Jadwal Monitoring 1";
              break;
            case "Monitoring2":
              title = "Koordinator membuat Jadwal Monitoring 2";
              break;
            case "Penjemputan":
              title = "Koordinator membuat Jadwal Penjemputan";
              break;
            default:
              title = `Jadwal ${kegiatan.jenis_kegiatan}`;
          }
          
          const tanggalText = kegiatan.tanggal_mulai === kegiatan.tanggal_selesai
            ? dayjs(kegiatan.tanggal_mulai).format("DD/MM/YYYY")
            : `${dayjs(kegiatan.tanggal_mulai).format("DD/MM")} - ${dayjs(kegiatan.tanggal_selesai).format("DD/MM/YYYY")}`;
          
          return {
            type: type,
            title: title,
            description: `${kegiatan.deskripsi || "Tidak ada deskripsi"} dijadwalkan pada (${tanggalText})`,
            time: kegiatan.created_at ? dayjs(kegiatan.created_at).fromNow() : "Baru saja",
            data: kegiatan,
            onClick: () => handleDetailClick(kegiatan, 'kegiatan')
          };
        });
        
        console.log("Kegiatan items mapped:", kegiatanItems);
        
        // Mapping data realisasi 
        const realisasiItems = (realisasiRes || []).map((realisasi) => {
          let type = "approved";
          let title = "Anda Melakukan Realisasi Kegiatan";
          
          if (realisasi.status === "Sudah") {
            type = "approved";
          } else if (realisasi.status === "Belum") {
            type = "pending";
          }
          
          // Cari info kegiatan
          const kegiatanInfo = kegiatanRes?.find(k => k.id === realisasi.kegiatan_id);
          const kegiatanNama = kegiatanInfo?.jenis_kegiatan || `Kegiatan #${realisasi.kegiatan_id}`;
          
          return {
            type: type,
            title: title,
            description: `${kegiatanNama} - ${realisasi.catatan || "Tanpa catatan"}`,
            time: realisasi.created_at ? dayjs(realisasi.created_at).fromNow() : "Baru saja",
            data: {
              ...realisasi,
              kegiatan_nama: kegiatanNama,
            },
            onClick: () => handleDetailClick({
              ...realisasi,
              kegiatan_nama: kegiatanNama
            }, 'realisasi')
          };
        });
        
        console.log("Realisasi items mapped:", realisasiItems);
        
        const allAktivitas = [...kegiatanItems, ...realisasiItems];
        
        // Urutkan berdasarkan tanggal (terbaru ke terlama)
        allAktivitas.sort((a, b) => {
          try {
            const dateA = a.data.created_at ? new Date(a.data.created_at) : new Date();
            const dateB = b.data.created_at ? new Date(b.data.created_at) : new Date();
            return dateB - dateA;
          } catch (error) {
            return 0;
          }
        });
        
        // Ambil 10 terbaru untuk dashboard
        const latestAktivitas = allAktivitas.slice(0, 10);
        setAktivitasItems(latestAktivitas);
        
      } catch (err) {
        console.error("Gagal fetch aktivitas:", err);
        // Fallback data dummy jika API error
        setAktivitasItems([
          {
            type: "info",
            title: "Koordinator membuat Jadwal Pembekalan",
            description: "test dijadwalkan pada (15/01/2026 - 16/01/2026)",
            time: "2 hours ago",
            onClick: () => handleDetailClick({
              id: 46,
              jenis_kegiatan: "Pembekalan",
              deskripsi: "test",
              tanggal_mulai: "2026-01-15",
              tanggal_selesai: "2026-01-16",
              status: "active",
              created_at: "2026-01-15T16:57:35.903459Z"
            }, 'kegiatan')
          },
          {
            type: "approved",
            title: "Anda Melakukan Realisasi Kegiatan",
            description: "Jadwal Pembekalan - tes yubik",
            time: "30 minutes ago",
            onClick: () => handleDetailClick({
              id: 16,
              kegiatan_id: 46,
              kegiatan_nama: "Pembekalan",
              catatan: "tes yubik",
              status: "Sudah",
              tanggal_realisasi: "2026-01-16",
              bukti_foto_urls: ["https://cdn.gedanggoreng.com/uploads/bdf01c90-d054-481b-afc9-97343001776f.jpg"],
              created_at: "2026-01-16T12:10:11.084494Z"
            }, 'realisasi')
          },
        ]);
      }
    };
    
    fetchAktivitas();
  }, []);

  // Fetch tugas guru DAN realisasi secara bersamaan untuk filter
  useEffect(() => {
    const fetchGuruTasksAndRealisasi = async () => {
      try {
        console.log("Fetching tasks and realisasi...");
        
        // Jalankan parallel requests
        const [tasksRes, realisasiRes] = await Promise.all([
          getGuruTasks(),
          getMyRealisasiKegiatan()
        ]);
        
        console.log("Tasks response:", tasksRes.data);
        console.log("Realisasi response:", realisasiRes);
        
        // Buat Set dari kombinasi kegiatan_id + industri_id yang sudah direalisasi
        const completedTasks = new Set(
          (realisasiRes || []).map(r => `${r.kegiatan_id}-${r.industri_id}`)
        );
        
        console.log("Tasks yang sudah direalisasi (kegiatan_id-industri_id):", Array.from(completedTasks));
        
        // Filter dan map tasks - HANYA YANG BELUM DIREALISASI UNTUK INDUSTRI TERSEBUT
        const filteredTasks = tasksRes.data.flatMap((industriGroup) =>
          industriGroup.tasks
            .filter(task => {
              const kegiatanId = task.kegiatan?.id;
              const industriId = industriGroup.industri?.id;
              const taskKey = `${kegiatanId}-${industriId}`;
              const isCompleted = completedTasks.has(taskKey);
              
              return !isCompleted;
            })
            .map((task) => ({
              // Data kegiatan
              id: task.kegiatan?.id,
              nama: task.kegiatan?.jenis || "Tidak ada nama",
              jenis: task.kegiatan?.jenis,
              deskripsi: task.kegiatan?.deskripsi || "Tidak ada deskripsi",
              tanggal_mulai: task.kegiatan?.tanggal_mulai,
              tanggal_selesai: task.kegiatan?.tanggal_selesai,
              is_active: task.kegiatan?.is_active,
              can_submit: task.kegiatan?.can_submit,
              
              // Data industri
              industri: industriGroup.industri,
              industri_id: industriGroup.industri?.id,
              industri_nama: industriGroup.industri?.nama || "Tidak diketahui",
              jenis_industri: industriGroup.industri?.jenis_industri || "-",
              alamat: industriGroup.industri?.alamat || "-",
              
              // Data siswa
              siswa: industriGroup.siswa || [],
              siswa_count: industriGroup.siswa_count || 0,
              siswa_list: industriGroup.siswa?.map(s => ({
                id: s.id,
                nama: s.nama,
                username: s.username,
                nisn: s.nisn,
                kelas: s.kelas
              })) || [],
              
              // Metadata
              sudah_direalisasi: false,
              deadline_passed: task.kegiatan?.tanggal_selesai 
                ? new Date(task.kegiatan.tanggal_selesai) < new Date()
                : false,
              
              // Key untuk identifikasi unik
              task_key: `${task.kegiatan?.id}-${industriGroup.industri?.id}`
            }))
        );
        
        console.log(`Total tasks awal: ${tasksRes.data.flatMap(g => g.tasks).length}`);
        console.log(`Filtered tasks (belum direalisasi): ${filteredTasks.length}`);
        
        setTugasTerbaru(filteredTasks);
        
      } catch (error) {
        console.error("Error fetching tasks and realisasi:", error);
      }
    };
    
    fetchGuruTasksAndRealisasi();
  }, []);

  // Data industri dari tugas guru
  const industriesData = React.useMemo(() => {
    return tugasTerbaru.reduce((acc, taskItem) => {
      const id = taskItem.industri_id;
      if (!id) return acc;
      
      // Cek apakah industri sudah ada di acc
      const existing = acc.find((i) => i.industri_id === id);
      if (existing) {
        // Update jumlah siswa jika sudah ada
        existing.jumlahSiswa = Math.max(existing.jumlahSiswa, taskItem.siswa_count || 0);
      } else {
        // Tambah industri baru
        acc.push({
          industri_id: id,
          nama: taskItem.industri_nama || "Tidak Diketahui",
          bidang: taskItem.jenis_industri || "-",
          alamat: taskItem.alamat || "-",
          jumlahSiswa: taskItem.siswa_count || 0,
        });
      }
      return acc;
    }, []);
  }, [tugasTerbaru]);

  // Fetch data siswa
  useEffect(() => {
    const fetchSiswa = async () => {
      try {
        const siswaRes = await getGuruSiswa();
        console.log("API SISWA response:", siswaRes);
        
        // Handle berbagai format response
        const siswaData = siswaRes.data?.data || siswaRes.data || [];
        console.log("Siswa data to map:", siswaData);
        
        const siswaList = siswaData.map((item) => ({
          siswa_id: item.siswa_id || item.id,
          nama_ssw: item.siswa_nama || item.nama || "Nama tidak tersedia",
          inisial: (item.siswa_nama || item.nama || "")
            .split(" ")
            .map((n) => n ? n[0] : '')
            .join("")
            .toUpperCase() || '?',
          industri_ssw: item.industri_nama || item.industri || "Industri tidak tersedia",
          tanggal_selesai: item.tanggal_selesai,
          tanggal_mulai: item.tanggal_mulai,
          status: item.status || "Approved",
          username_ssw: item.siswa_username || item.username || "-"
        }));
        
        console.log("Siswa List setelah mapping:", siswaList);
        setSiswa(siswaList);
        
      } catch (err) {
        console.error("Gagal fetch siswa:", err);
      }
    };
    fetchSiswa();
  }, []);

  // Update dashboard cards dengan data yang sudah ada
  useEffect(() => {
    console.log("Updating dashboard cards with existing data...");
    
    // Data dari state yang sudah ada
    const totalSiswa = siswa.length;
    const totalIndustri = industriesData.length;
    const totalKegiatan = tugasTerbaru.length;
    const totalRealisasi = aktivitasItems.filter(item => item.type === "approved").length;
    
    const results = [
      {
        title: "Data Siswa",
        icon: userIcon,
        value: totalSiswa,
        description: `${totalSiswa} siswa bimbingan`
      },
      {
        title: "Data Industri",
        icon: sidebarCorporate,
        value: totalIndustri,
        description: `${totalIndustri} tempat PKL`
      },
      {
        title: "Kegiatan",
        icon: timeIcon,
        value: totalKegiatan,
        description: `${totalKegiatan} tugas belum direalisasi`
      },
      {
        title: "Realisasi",
        icon: bellIcon,
        value: totalRealisasi,
        description: `${totalRealisasi} kegiatan selesai`
      },
      {
        title: "Perizinan",
        icon: surrelIcon,
        value: 0,
        description: "Belum ada data"
      },
      // {
      //   title: "Permasalahan",
      //   icon: timeIcon,
      //   value: 0,
      //   description: "Belum ada data"
      // },
    ];
    
    console.log("Dashboard cards updated:", results);
    setDataDisplay(results);
    
  }, [siswa, industriesData, tugasTerbaru, aktivitasItems]);

  // Get industri name for realisasi (saat detail realisasi dibuka)
  useEffect(() => {
    if (detailOpen && detailType === 'realisasi' && selectedAktivitas?.data) {
      console.log("Fetching industri name for realisasi:", selectedAktivitas.data);
      
      const getIndustriName = () => {
        // Cari dari industriesData
        const industriInfo = industriesData.find(i => i.industri_id === selectedAktivitas.data.industri_id);
        if (industriInfo) {
          console.log("Found industri in industriesData:", industriInfo);
          setSelectedAktivitas(prev => ({
            ...prev,
            data: {
              ...prev.data,
              industri_nama: industriInfo.nama
            }
          }));
          return;
        }
        
        // Cari dari tugasTerbaru
        const taskInfo = tugasTerbaru.find(t => t.industri_id === selectedAktivitas.data.industri_id);
        if (taskInfo) {
          console.log("Found industri in tugasTerbaru:", taskInfo.industri_nama);
          setSelectedAktivitas(prev => ({
            ...prev,
            data: {
              ...prev.data,
              industri_nama: taskInfo.industri_nama || `Industri #${selectedAktivitas.data.industri_id}`
            }
          }));
          return;
        }
        
        // Fallback
        console.log("Industri not found, using fallback");
        setSelectedAktivitas(prev => ({
          ...prev,
          data: {
            ...prev.data,
            industri_nama: `Industri #${selectedAktivitas.data.industri_id}`
          }
        }));
      };
      
      getIndustriName();
    }
  }, [detailOpen, detailType, selectedAktivitas, industriesData, tugasTerbaru]);

  return (
    <div className="flex h-screen w-full bg-white">
      <Sidebar active={active} setActive={setActive} />

      <div className="flex flex-col flex-1">
        <Header query={query} setQuery={setQuery} user={user} />

        <main className="flex-1 p-6 bg-white overflow-auto rounded-tl-3xl">
          {/* DASHBOARD CARD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto mb-10">
            {dataDisplay.map((item, i) => (
              <DashboardCard
                key={i}
                item={item}
                onClick={() => {
                  console.log("Card clicked:", item.title);
                  
                  if (item.title.includes("Data Siswa"))
                    navigate("/guru/pembimbing/siswa");
                  else if (item.title.includes("Data Industri"))
                    navigate("/guru/industri");
                  else if (item.title.includes("Kegiatan"))
                    navigate("/guru/tugas");
                  else if (item.title.includes("Realisasi"))
                    navigate("/guru/realisasi");
                  else if (item.title.includes("Perizinan"))
                    navigate("/guru/pembimbing/perizinan");
                  // else if (item.title.includes("Permasalahan"))
                  //   navigate("/guru/pembimbing/permasalahan");
                  // else if (item.title.includes("Perpindahan PKL"))
                  //   navigate("/guru/pembimbing/perpindahan");
                }}
              />
            ))}
          </div>

          {/* KALENDER */}
          <CalendarPanel />

          {/* NOTIFIKASI + TUGAS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              <AktivitasTerkini
                title="Aktivitas Terkini"
                icon="🔔"
                items={aktivitasItems}
                color="#641E21"
                showFooter={true}
                emptyMessage={aktivitasItems.length === 0 ? "Tidak ada aktivitas terbaru" : null}
              />
            </div>

            <TugasTerbaru
              data={tugasTerbaru}
              onViewAll={() => navigate("/guru/tugas")}
            />
          </div>

          {/* DAFTAR SISWA + INDUSTRI */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <DaftarSiswaPKL
              data={siswa}
              onViewAll={() => navigate("/guru/pembimbing/siswa")}
              onItemClick={(item) => handleDetailClick(item, 'siswa')}
            />

            <DaftarIndustri
              data={industriesData}
              onViewAll={() => navigate("/guru/industri")}
              onItemClick={(item) => handleDetailClick(item, 'industri')}
            />
          </div>
        </main>

        {/* MODAL DETAIL  */}
        {detailOpen && detailType && (
          <Detail
            title={
              detailType === 'siswa' ? `Detail Siswa` :
              detailType === 'industri' ? `Detail Industri` :
              detailType === 'kegiatan' ? "Detail Kegiatan" :
              "Detail Realisasi"
            }
            initialData={
              detailType === 'siswa' ? {
                username: selectedSiswa?.username_ssw,
                nama: selectedSiswa?.nama_ssw,
                industri: selectedSiswa?.industri_ssw,
                tanggal_mulai: dayjs(selectedSiswa?.tanggal_mulai).format("DD-MM-YYYY"),
                tanggal_selesai: dayjs(selectedSiswa?.tanggal_selesai).format("DD-MM-YYYY"),
                status: selectedSiswa?.status || "Approved",
              } :
              detailType === 'industri' ? {
                nama: selectedIndustri?.nama,
                jumlahSiswa: selectedIndustri?.jumlahSiswa,
                bidang: selectedIndustri?.bidang,
                alamat: selectedIndustri?.alamat
              } :
              detailType === 'kegiatan' ? {
                jenis_kegiatan: selectedAktivitas?.data?.jenis_kegiatan,
                deskripsi: selectedAktivitas?.data?.deskripsi || "-",
                tanggal_mulai: dayjs(selectedAktivitas?.data?.tanggal_mulai).format("DD-MM-YYYY"),
                tanggal_selesai: dayjs(selectedAktivitas?.data?.tanggal_selesai).format("DD-MM-YYYY"),
                status: selectedAktivitas?.data?.status,
                created_by: selectedAktivitas?.data?.created_by,
                created_at: dayjs(selectedAktivitas?.data?.created_at).format("DD-MM-YYYY HH:mm"),
              } :
              // Realisasi
              {
                kegiatan_id: selectedAktivitas?.data?.kegiatan_id,
                kegiatan_nama: selectedAktivitas?.data?.kegiatan_nama || `Kegiatan #${selectedAktivitas?.data?.kegiatan_id}`,
                industri_nama: selectedAktivitas?.data?.industri_nama || `Industri #${selectedAktivitas?.data?.industri_id}`,
                catatan: selectedAktivitas?.data?.catatan || "-",
                status: selectedAktivitas?.data?.status,
                tanggal_realisasi: dayjs(selectedAktivitas?.data?.tanggal_realisasi).format("DD-MM-YYYY"),
                bukti_foto_urls: selectedAktivitas?.data?.bukti_foto_urls || [],
                created_at: dayjs(selectedAktivitas?.data?.created_at).format("DD-MM-YYYY HH:mm"),
              }
            }
            fields={
              detailType === 'siswa' ? [
                { name: "username", label: "Username", type: "text" },
                { name: "nama", label: "Nama Siswa", type: "text" },
                { name: "industri", label: "Industri PKL", type: "text" },
                { name: "tanggal_mulai", label: "Tanggal Mulai", type: "date" },
                { name: "tanggal_selesai", label: "Tanggal Selesai", type: "date" },
                { name: "status", label: "Status", type: "text" },
              ] :
              detailType === 'industri' ? [
                { name: "nama", label: "Nama Industri", type: "text" },
                { name: "jumlahSiswa", label: "Jumlah Siswa", type: "number" },
                { name: "bidang", label: "Bidang", type: "text" },
                { name: "alamat", label: "Alamat", type: "text" },
              ] :
              detailType === 'kegiatan' ? [
                { name: "jenis_kegiatan", label: "Jenis Kegiatan", type: "text" },
                { name: "deskripsi", label: "Deskripsi", type: "text" },
                { name: "tanggal_mulai", label: "Tanggal Mulai", type: "date" },
                { name: "tanggal_selesai", label: "Tanggal Selesai", type: "date" },
                { name: "status", label: "Status", type: "text" },
                { name: "created_at", label: "Dibuat Pada", type: "text" },
              ] :
              // Realisasi
              [
                { name: "kegiatan_nama", label: "Nama Kegiatan", type: "text" },
                { name: "industri_nama", label: "Industri", type: "text" },
                { name: "catatan", label: "Catatan", type: "text" },
                { name: "status", label: "Status", type: "text" },
                { name: "tanggal_realisasi", label: "Tanggal Realisasi", type: "date" },
                {
                  name: "bukti_foto_urls",
                  label: "Bukti Foto",
                  type: "custom",
                  render: (urls) => (
                    <div className="flex flex-wrap gap-2">
                      {urls?.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Bukti Foto ${idx + 1}`}
                          className="w-32 h-32 object-cover rounded shadow"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/128?text=No+Image";
                          }}
                        />
                      ))}
                    </div>
                  ),
                },
                { name: "created_at", label: "Dibuat Pada", type: "text" },
              ]
            }
            onClose={handleCloseDetail}
            mode="view"
          />
        )}
      </div>
    </div>
  );
}