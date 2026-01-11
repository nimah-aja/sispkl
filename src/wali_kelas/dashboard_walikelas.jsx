import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";

// Components
import Sidebar from "./components/SidebarDashboard";
import Header from "./components/HeaderDashboard";
import DashboardCard from "./components/DashboardCard";

// Assets
import userIcon  from "../assets/sidebarUsers.svg";
import timeIcon  from "../assets/permasalahanCard.svg";
import surrelIcon from "../assets/envelope.png";
import bellIcon from "../assets/bell-notification-social-media 1.png";

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

  // Endpoint API untuk dashboard
  const endpoints = [
    { title: "Jumlah Siswa PKL", icon: userIcon, url : "/api/siswa" },
    { title: "Jumlah Permasalahan", icon: timeIcon,  url : "/api/siswa" },
    { title: "Perizinan", icon: surrelIcon,  url : "/api/siswa" },
  ];

  // Data dummy untuk notifikasi perizinan
  const notifikasiPerizinan = [
    {
      id: 1,
      nama: "Mirza Kholila | XII RPL 1",
      keterangan: "Mengajukan izin sakit - 2 hari",
      waktu: "2 jam yang lalu",
      status: "Periksa"
    },
    {
      id: 2,
      nama: "Mirza Kholila | XII RPL 1",
      keterangan: "Izin keluarga mendadak - 1 hari",
      waktu: "4 jam yang lalu",
      status: "Periksa"
    },
    {
      id: 3,
      nama: "Mirza Kholila | XII RPL 1",
      keterangan: "Izin mengurus keperluan - 1 minggu",
      waktu: "30 menit yang lalu",
      status: "Periksa"
    }
  ];

  // Data dummy untuk notifikasi permasalahan
  const notifikasiPermasalahan = [
    {
      id: 1,
      judul: "Konflik dengan BK",
      keterangan: "Dilaporkan oleh: Mirza",
      waktu: "2 jam yang lalu",
      status: "Proses",
      type: "critical"
    },
    {
      id: 2,
      judul: "Keterlambatan Berulang",
      keterangan: "Dilaporkan oleh: Fifii",
      waktu: "4 jam yang lalu",
      status: "Proses",
      type: "critical"
    },
    {
      id: 3,
      judul: "Kesulitan Adaptasi",
      keterangan: "Dilaporkan oleh: Nimah",
      waktu: "30 menit yang lalu",
      status: "Selesai",
      type: "warning"
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const results = await Promise.all(
          endpoints.map(async (ep) => {
            const res = await axios.get(ep.url);
            let total = 0;

            if (res.data?.data?.total_all !== undefined) {
              total = Number(res.data.data.total_all) || 0;
            } else if (Array.isArray(res.data?.data?.data)) {
              total = res.data.data.data.length;
            } else if (Array.isArray(res.data?.data)) {
              total = res.data.data.length;
            }

            return {
              title: ep.title,
              icon: ep.icon,
              value: total,
            };
          })
        );
        setDataDisplay(results);
      } catch (err) {
        console.error("Fetch data error:", err);
        setError("Gagal mengambil data dari server.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter pencarian
  const filteredDisplay = dataDisplay.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  const getInitials = (name = "") => {
    return name
      .split("|")[0]        // ambil nama sebelum "|"
      .trim()
      .split(" ")
      .map(word => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };


  return (
    <div className="flex h-screen w-full bg-white">
      {/* SIDEBAR FULL HEIGHT */}
      <Sidebar active={active} setActive={setActive} />

      {/* AREA HEADER + MAIN */}
      <div className="flex flex-col flex-1">
        {/* HEADER */}
        <Header query={query} setQuery={setQuery} user={user} />

        {/* Main content */}
        <main className="flex-1 p-6 bg-white overflow-auto rounded-tl-3xl">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-black font-semibold">Loading data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center bg-red-100 rounded-xl p-6 shadow-md">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : (
            <>
              {/* Dashboard Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto mb-8">
                {filteredDisplay.length > 0 ? (
                  filteredDisplay.map((item, idx) => (
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
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center bg-white rounded-xl p-10 shadow-md">
                    <p className="text-gray-600 font-medium">
                      Data tidak ditemukan
                    </p>
                  </div>
                )}
              </div>

              {/* Notifikasi Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
                {/* Notifikasi Perizinan */}
                <div className="bg-[#641E21] rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={bellIcon} alt="Bell" className="w-6 h-6" />
                    <h2 className="text-white text-xl font-semibold">Notifikasi Perizinan</h2>
                  </div>
                  
                  {/* Garis pembatas putih full width */}
                  <div className="-mx-6 mb-6">
                    <div className="w-full h-0.5" style={{ backgroundColor: 'white' }}></div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-4">
                      {notifikasiPerizinan.map((notif) => (
                        <div
                          key={notif.id}
                          className="bg-white rounded-xl p-4 hover:shadow-md transition-all"
                        >
                          {/* HEADER */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-sm">
                                  {getInitials(notif.nama)}
                                </span>
                              </div>


                              <div>
                                <h3 className="font-bold text-gray-900 text-sm">
                                  {notif.nama}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notif.keterangan}
                                </p>
                              </div>
                            </div>

                            <span className="text-xs text-gray-500">
                              {notif.waktu}
                            </span>
                          </div>

                          {/* ACTION */}
                          {/* <div className="flex gap-2 ml-14">
                            <button
                              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                              style={{ backgroundColor: "#BC2424" }}
                            >
                              Tolak
                            </button>

                            <button
                              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                              style={{ backgroundColor: "#EC933A" }}
                            >
                              Terima
                            </button>
                          </div> */}
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Notifikasi Permasalahan */}
                {/* Notifikasi Permasalahan */}
                <div className="bg-[#641E21] rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={bellIcon} alt="Bell" className="w-6 h-6" />
                    <h2 className="text-white text-xl font-semibold">Notifikasi Permasalahan</h2>
                  </div>

                  {/* Garis pembatas putih full width */}
                  <div className="-mx-6 mb-6">
                    <div className="w-full h-0.5" style={{ backgroundColor: 'white' }}></div>
                  </div>

                  <div className="space-y-4">
                    {notifikasiPermasalahan.map((notif, index) => (
                      <div key={notif.id} className="bg-white rounded-xl p-4 hover:shadow-md transition-all">
                        {/* HEADER */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-4">
                            {/* Avatar oranye dengan inisial nama */}
                            <div className="w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm">
                                {getInitials(notif.keterangan)}
                              </span>
                            </div>

                            <div>
                              <h3 className="font-bold text-gray-900 text-sm">{notif.judul}</h3>
                              <p className="text-sm text-gray-600 mt-1">{notif.keterangan}</p>
                            </div>
                          </div>

                          <span className="text-xs text-gray-500">{notif.waktu}</span>
                        </div>

                        {/* ACTION */}
                        <div className="flex justify-between items-center mt-3 ml-14">
                          {notif.status !== "Selesai" && (
                            <button
                              onClick={() => {
                                const updated = [...notifikasiPermasalahan];
                                updated[index].status = "Selesai";
                                setNotifikasiPermasalahan(updated);
                              }}
                              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                              style={{ backgroundColor: "#EC933A" }}
                            >
                              Proses
                            </button>
                          )}

                          <span
                            className={`text-xs font-semibold ${
                              notif.status === "Selesai" ? "text-green-600" : "text-orange-500"
                            }`}
                          >
                            {notif.status}
                          </span>
                        </div>
                      </div>
                    ))}
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