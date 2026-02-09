// src/pages/dashboard_walikelas.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import Detail from "./components/Detail";


// Icon
import { Building2, MapPin } from "lucide-react";

// Components
import Sidebar from "./components/SidebarDashboard";
import Header from "./components/HeaderDashboard";
import DashboardCard from "./components/DashboardCard";
import AktivitasTerkini from "./components/AktivitasTerkini";

// Services
import { getDashboardWaliKelas } from "../utils/services/wakel/dashboard";
import { getIzinWaliKelas } from "../utils/services/wakel/izin";
import { getSiswa } from "../utils/services/admin/get_siswa";
import { getKelas } from "../utils/services/admin/get_kelas";

// Assets
import userIcon from "../assets/sidebarUsers.svg";
import surrelIcon from "../assets/envelope.png";
import timeIcon from "../assets/permasalahanCard.svg";

export default function DashboardWaliKelas() {
  const [active, setActive] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [dataDisplay, setDataDisplay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusPKLData, setStatusPKLData] = useState([]);
  const [notifikasiPerizinan, setNotifikasiPerizinan] = useState([]);
  const [aktivitasDummy, setAktivitasDummy] = useState([]);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);


  const navigate = useNavigate();

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Wali Kelas",
  };

  // Helper
  const getInitials = (name = "") => {
    if (!name || name === "-") return "?";
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const getIconColor = (name = "") => {
    if (!name || name === "-") return "#F97316";
    const colors = ["#F97316","#10B981","#3B82F6","#8B5CF6","#EF4444","#06B6D4","#F59E0B"];
    const charSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charSum % colors.length];
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("id-ID",{ hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const getStatusBadge = (status) => {
    if (status === "Sedang PKL") {
      return <span className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-emerald-500">Sedang PKL</span>;
    }
    return <span className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-red-600">Belum PKL</span>;
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        // Ambil dashboard utama
        // Ambil dashboard utama
        const res = await getDashboardWaliKelas();

        // Ambil data siswa & kelas
        const siswaList = await getSiswa();
        const kelasList = await getKelas();

        const siswaMap = {};
        siswaList.forEach(s => (siswaMap[s.id] = s));

        const kelasMap = {};
        kelasList.forEach(k => (kelasMap[k.id] = k.nama));

        // Ambil data perizinan
        const izinRes = await getIzinWaliKelas();
        const izinData = izinRes.data || izinRes || [];
        const totalPerizinan = Array.isArray(izinData) ? izinData.length : 0;

        // ⬅️ BARU SET DATA DISPLAY SETELAH totalPerizinan ADA
        setDataDisplay([
          {
            title: "Jumlah Siswa PKL",
            icon: userIcon,
            value: res.kelas_info?.total_siswa || 0,
          },
          {
            title: "Perizinan",
            icon: surrelIcon,
            value: totalPerizinan,
          },
        ]);


                

            


        const perizinanMapped = Array.isArray(izinData) ? izinData.map((izin) => {
          const siswa = siswaMap[izin.siswa_id];
          const status = (izin.status || "pending").toUpperCase();
          const lampiran = izin.bukti_foto_urls?.length > 0 ? "Ada" : "Tidak Ada";

          return {
            id: izin.id,
            nama: siswa?.nama_lengkap || "-",
            kelas: kelasMap[siswa?.kelas_id] || "-",
            status,
            lampiran,
            alasan: izin.jenis || "-",
            waktu: izin.created_at || izin.tanggal,
            icon: getInitials(siswa?.nama_lengkap),
            iconColor: getIconColor(siswa?.nama_lengkap),
          };
        }) : [];

        setNotifikasiPerizinan(perizinanMapped);

        // Mapping aktivitasDummy (5 terbaru)
        const aktivitasGabungan = perizinanMapped
          .map(item => {
            const statusType = item.status === "APPROVED" ? "approved" : item.status === "REJECTED" ? "rejected" : "pending";
            const statusLabel = item.status === "APPROVED" ? "Disetujui" : item.status === "REJECTED" ? "Ditolak" : "Proses";
            return {
              type: statusType,
              title: `${item.nama} | ${item.kelas}`,
              description: `${item.alasan} • Lampiran: ${item.lampiran}`,
              subdescription: "",
              status: statusLabel,
              time: formatTime(item.waktu),
              icon: item.icon,
              iconColor: item.iconColor,
              onClick: () => {
                setDetailData({
                  nama: item.nama,
                  kelas: item.kelas,
                  alasan: item.alasan,
                  statusLabel,
                  waktu: item.waktu,
                  jam: formatTime(item.waktu),
                  lampiran: item.lampiran,
                });
                setOpenDetail(true);
              },

            };
          })
          .slice(0, 5);

        setAktivitasDummy(aktivitasGabungan);

        // Mapping status PKL siswa
        const mappedStatusPKL = res.siswa_list.map(siswa => ({
          id: siswa.id,
          nama: siswa.nama,
          nisn: siswa.nisn,
          status: siswa.status_pkl,
          perusahaan: siswa.industri || "-",
          lokasi: siswa.alamat_industri || "-",
        }));
        setStatusPKLData(mappedStatusPKL);

      } catch (err) {
        console.error("Error fetching dashboard:", err);
        setError("Gagal mengambil data dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const filteredDisplay = dataDisplay.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex h-screen w-full bg-white">
      <Sidebar active={active} setActive={setActive} />
      <div className="flex flex-col flex-1">
        <Header query={query} setQuery={setQuery} user={user} />
        <main className="flex-1 p-6 bg-white overflow-auto rounded-tl-3xl">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="font-semibold">Loading data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-600 p-6 rounded-xl text-center">{error}</div>
          ) : (
            <>
              {/* Dashboard Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
                {filteredDisplay.map((item, idx) => (
                  <DashboardCard
                    key={idx}
                    item={item}
                    onClick={() => {
                      if (item.title === "Jumlah Siswa PKL") navigate("/guru/wali_kelas/siswa");
                      else if (item.title === "Perizinan") navigate("/guru/wali_kelas/dataperizinansiswa");
                    }}
                  />
                ))}
              </div>

              {/* Aktivitas Terkini */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
                <AktivitasTerkini title="Aktivitas Terkini" icon="🔔" items={aktivitasDummy} color="#641E21" showFooter={true} />

                {/* Status PKL Siswa */}
                <div className="rounded-2xl shadow-lg" style={{ backgroundColor: "#641E21" }}>
                  <div className="flex justify-between items-center p-6 pb-4">
                    <h2 className="text-white text-xl font-bold">Status PKL Siswa</h2>
                    <button className="!bg-transparent text-white text-sm hover:underline font-medium" onClick={() => navigate("/guru/wali_kelas/siswa")}>Lihat Semua</button>
                  </div>

                  <div className="px-6 pb-6 space-y-4 max-h-96 overflow-y-auto">
                    {statusPKLData.length > 0 ? statusPKLData.map(siswa => (
                      <div key={siswa.id} className="bg-white rounded-xl p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{getInitials(siswa.nama)}</div>
                            <div>
                              <h3 className="font-bold text-base">
                                {siswa.nama} <span className="text-gray-400 text-sm ml-1">- NISN: {siswa.nisn}</span>
                              </h3>
                            </div>
                          </div>
                          {getStatusBadge(siswa.status)}
                        </div>

                        <div className="ml-15 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700 -mt-7">
                          <div className="flex items-center gap-2"><Building2 size={16} className="text-gray-600" /><span className="truncate max-w-[200px]">{siswa.perusahaan}</span></div>
                          <div className="flex items-center gap-2"><MapPin size={16} className="text-gray-600" /><span className="truncate max-w-[200px]">{siswa.lokasi}</span></div>
                        </div>
                      </div>
                    )) : <div className="bg-white rounded-xl p-5 text-center text-gray-500">Tidak ada data siswa</div>}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
        {openDetail &&
  createPortal(
    <Detail
      mode="view"
      title="Detail Izin"
      initialData={detailData}
      onClose={() => setOpenDetail(false)}
      fields={[
        { name: "nama", label: "Nama" },
        { name: "kelas", label: "Kelas" },
        { name: "alasan", label: "Jenis" },
        { name: "statusLabel", label: "Status" },
        { name: "jam", label: "Jam Pengajuan" },
        { name: "lampiran", label: "Lampiran" },
      ]}
    />,
    document.body
  )}

      </div>
    </div>
  );
}
