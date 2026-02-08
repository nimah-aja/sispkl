import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";
import { Building2, MapPin } from "lucide-react";

// Components
import Sidebar from "./components/SidebarDashboard";
import Header from "./components/HeaderDashboard";
import DashboardCard from "./components/DashboardCard";
import AktivitasTerkini from "./components/AktivitasTerkini";
import { getDashboardWaliKelas } from "../utils/services/wakel/dashboard";
import { getIzinWaliKelas } from "../utils/services/wakel/izin";

// Assets
import userIcon from "../assets/sidebarUsers.svg";
import timeIcon from "../assets/permasalahanCard.svg";
import surrelIcon from "../assets/envelope.png";

export default function DashboardWaliKelas() {
  const [active, setActive] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [dataDisplay, setDataDisplay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Wali Kelas",
  };

  const [statusPKLData, setStatusPKLData] = useState([]);
  const [notifikasiPerizinan, setNotifikasiPerizinan] = useState([]);
  const [notifikasiPermasalahan, setNotifikasiPermasalahan] = useState([]);
  const [aktivitasDummy, setAktivitasDummy] = useState([]);

  // Fungsi helper
  const getInitials = (name = "") => {
    if (!name || name === "-") return "?";

    const words = name.trim().split(" ");

    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (
      words[0].charAt(0) + words[words.length - 1].charAt(0)
    ).toUpperCase();
  };

  const getIconColor = (name = "") => {
    if (!name || name === "-") return "#F97316";
    
    const colors = [
      "#F97316", // orange
      "#10B981", // green
      "#3B82F6", // blue
      "#8B5CF6", // purple
      "#EF4444", // red
      "#06B6D4", // cyan
      "#F59E0B", // amber
    ];
    
    const charSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charSum % colors.length];
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return "";
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        // Ambil data dashboard utama
        const res = await getDashboardWaliKelas();

        /**
         * CARD DASHBOARD
         */
        setDataDisplay([
          {
            title: "Jumlah Siswa PKL",
            icon: userIcon,
            value: res.kelas_info?.total_siswa || 0,
          },
          {
            title: "Jumlah Permasalahan",
            icon: timeIcon,
            value: 0, // nanti isi dari API lain
          },
          {
            title: "Perizinan",
            icon: surrelIcon,
            value: 0, // nanti isi dari API lain
          },
        ]);

        /**
         * STATUS PKL SISWA
         */
        const mappedStatusPKL = res.siswa_list.map((siswa) => ({
          id: siswa.id,
          nama: siswa.nama,
          nisn: siswa.nisn,
          status: siswa.status_pkl,
          perusahaan: siswa.industri || "-",
          lokasi: siswa.alamat_industri || "-",
        }));

        setStatusPKLData(mappedStatusPKL);

        /**
         * AMBIL DATA NOTIFIKASI PERIZINAN DARI API
         */
        const izinRes = await getIzinWaliKelas();
        
        // Pastikan data ada dan dalam format yang benar
        const izinData = izinRes.data || izinRes || [];
        
        const perizinanMapped = Array.isArray(izinData) ? izinData.map((izin) => {
          const status = (izin.status || "pending").toUpperCase();
          const lampiran = izin.bukti_foto_urls?.length > 0 ? "Ada" : "Tidak Ada";
          
          return {
            id: izin.id || izin.izin_id,
            nama: izin.siswa_nama || izin.nama_siswa || "-",
            kelas: izin.kelas_nama || izin.kelas || "-",
            status: status,
            lampiran: lampiran,
            alasan: izin.jenis || izin.alasan || "-",
            waktu: izin.created_at || izin.tanggal_pengajuan,
            icon: getInitials(izin.siswa_nama || izin.nama_siswa),
            iconColor: getIconColor(izin.siswa_nama || izin.nama_siswa),
          };
        }) : [];

        setNotifikasiPerizinan(perizinanMapped);

        /**
         * DATA PERMASALAHAN (DUMMY SEMENTARA)
         * TODO: Buat API untuk getPermasalahanWaliKelas()
         */
        const permasalahanDummy = [
          {
            id: 1,
            nama: "Firli Zulfa Azzahra",
            pelapor: "Pembimbing",
            keterangan: "Kesulitan memahami materi Matematika",
            status: "Proses",
            waktu: new Date().toISOString(),
            icon: "FZ",
            iconColor: "#F97316", 
          },
          {
            id: 2,
            nama: "Budi Santoso",
            pelapor: "Pembimbing",
            keterangan: "Nilai rapor menurun drastis",
            status: "Proses",
            waktu: new Date().toISOString(),
            icon: "BS",
            iconColor: "#F97316", 
          },
        ];

        setNotifikasiPermasalahan(permasalahanDummy);

        /**
         * GABUNGKAN DATA UNTUK AKTIVITAS TERKINI
         */
        const aktivitasGabungan = [
          ...perizinanMapped.map((item) => {
            const statusType = item.status === "APPROVED" ? "approved" : 
                             item.status === "REJECTED" ? "rejected" : "pending";
            const statusLabel = item.status === "APPROVED" ? "Disetujui" : 
                              item.status === "REJECTED" ? "Ditolak" : "Proses";
            
            return {
              type: statusType,
              title: `${item.nama} | ${item.kelas}`,
              description: `${item.alasan} • Lampiran: ${item.lampiran}`,
              subdescription: "",
              status: statusLabel,
              time: formatTime(item.waktu),
              icon: item.icon,
              iconColor: item.iconColor,
              onClick: () => navigate("/guru/wali_kelas/dataperizinansiswa"),
            };
          }),
          ...permasalahanDummy.map((item) => ({
            type: item.status === "Selesai" ? "approved" : "pending",
            title: item.nama,
            description: `Pelapor: ${item.pelapor}`,
            subdescription: item.keterangan,
            status: item.status,
            time: formatTime(item.waktu),
            icon: item.icon,
            iconColor: item.iconColor,
            onClick: () => navigate("/guru/wali_kelas/datapermasalahansiswa"),
          })),
        ];

        // Batasi hanya 5 aktivitas terbaru untuk ditampilkan
        const sortedAktivitas = aktivitasGabungan
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .slice(0, 5);

        setAktivitasDummy(sortedAktivitas);

      } catch (err) {
        console.error("Error fetching dashboard:", err);
        setError("Gagal mengambil data dashboard.");
        
        // Fallback ke data dummy jika API error
        const fallbackAktivitas = [
          {
            type: "pending",
            title: "Firli Zulfa Azzahra | XII",
            description: "SAKIT • Lampiran: Ada",
            subdescription: "",
            status: "Proses",
            time: "08:30",
            icon: "FZ",
            iconColor: "#F97316",
            onClick: () => navigate("/guru/wali_kelas/dataperizinansiswa"),
          },
          {
            type: "pending",
            title: "Budi Santoso",
            description: "Pelapor: Pembimbing",
            subdescription: "Nilai rapor menurun drastis",
            status: "Proses",
            time: "09:15",
            icon: "BS",
            iconColor: "#F97316",
            onClick: () => navigate("/guru/wali_kelas/datapermasalahansiswa"),
          },
        ];
        
        setAktivitasDummy(fallbackAktivitas);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const filteredDisplay = dataDisplay.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  const getStatusBadge = (status) => {
    if (status === "Sedang PKL") {
      return (
        <span className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-emerald-500">
          Sedang PKL
        </span>
      );
    }
    return (
      <span className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-red-600">
        Belum PKL
      </span>
    );
  };

  return (
    <div className="flex h-screen w-full bg-white">
      {/* Sidebar */}
      <Sidebar active={active} setActive={setActive} />

      {/* Content */}
      <div className="flex flex-col flex-1">
        <Header query={query} setQuery={setQuery} user={user} />

        <main className="flex-1 p-6 bg-white overflow-auto rounded-tl-3xl">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="font-semibold">Loading data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-600 p-6 rounded-xl text-center">
              {error}
            </div>
          ) : (
            <>
              {/* Dashboard Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
                {filteredDisplay.map((item, idx) => (
                  <DashboardCard
                    key={idx}
                    item={item}
                    onClick={() => {
                      if (item.title === "Jumlah Siswa PKL")
                        navigate("/guru/wali_kelas/siswa");
                      else if (item.title === "Jumlah Permasalahan")
                        navigate("/guru/wali_kelas/datapermasalahansiswa");
                      else if (item.title === "Perizinan")
                        navigate("/guru/wali_kelas/dataperizinansiswa");
                    }}
                  />
                ))}
              </div>

              {/* Notifikasi & Status PKL */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
                {/* Notifikasi (Component) */}
                <AktivitasTerkini
                  title="Aktivitas Terkini"
                  icon="🔔"
                  items={aktivitasDummy}
                  color="#641E21"
                  showFooter={true}
                />

                {/* Status PKL */}
                <div
                  className="rounded-2xl shadow-lg"
                  style={{ backgroundColor: "#641E21" }}
                >
                  <div className="flex justify-between items-center p-6 pb-4">
                    <h2 className="text-white text-xl font-bold">
                      Status PKL Siswa
                    </h2>
                    <button 
                      className="!bg-transparent text-white text-sm hover:underline font-medium"
                      onClick={() => navigate("/guru/wali_kelas/siswa")}
                    >
                      Lihat Semua
                    </button>
                  </div>
                  
                  <div className="w-145 border border-white mb-10 -m-2"></div>

                  <div className="px-6 pb-6 space-y-4 max-h-96 overflow-y-auto">
                    {statusPKLData.length > 0 ? (
                      statusPKLData.map((siswa) => (
                        <div key={siswa.id} className="bg-white rounded-xl p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex gap-3">
                              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {getInitials(siswa.nama)}
                              </div>

                              <div>
                                <h3 className="font-bold text-base">
                                  {siswa.nama}
                                  <span className="text-gray-400 text-sm ml-1">
                                    - NISN : {siswa.nisn}
                                  </span>
                                </h3>
                              </div>
                            </div>
                            {getStatusBadge(siswa.status)}
                          </div>

                          <div className="ml-15 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700 -mt-7">
                            <div className="flex items-center gap-2">
                              <Building2 size={16} className="text-gray-600" />
                              <span className="truncate max-w-[200px]">
                                {siswa.perusahaan}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <MapPin size={16} className="text-gray-600" />
                              <span className="truncate max-w-[200px]">
                                {siswa.lokasi}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white rounded-xl p-5 text-center text-gray-500">
                        Tidak ada data siswa
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}