import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";

// Components
import Sidebar from "./components/SidebarDashboard";
import Header from "./components/HeaderDashboard";
import DashboardCard from "./components/DashboardCard";
import CalendarPanel from "./components/Calender";

// Assets
import userIcon from "../assets/sidebarUsers.svg";
import timeIcon from "../assets/timewalkel.png";
import surrelIcon from "../assets/envelope.png";
import bellIcon from "../assets/bell-notification-social-media 1.png";
import perpindahan from "../assets/pindahPKL.svg"

export default function PKLDashboard() {
  const [active, setActive] = useState("sidebarDashboard");
  const [query, setQuery] = useState("");
  const [dataDisplay, setDataDisplay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
    const user = {
      name: localStorage.getItem("nama_guru") || "Guru SMK",
      role: "Pembimbing",
    };

  const endpoints = [
    { title: "Data Peserta PKL", icon: userIcon, url: "/api/jurusan" },
    { title: "Perizinan", icon: surrelIcon, url: "/api/kelas" },
    { title: "Permasalahan", icon: timeIcon, url: "/api/siswa" },
    { title: "Perpindahan PKL", icon: perpindahan, url: "/api/siswa" },
  ];

  const notifikasiPerizinan = [
    {
      id: 1,
      nama: "Mirza Kholila | XII RPL 1",
      keterangan: "Mengajukan izin sakit - 2 hari",
      waktu: "2 jam yang lalu",
      status: "Periksa",
    },
    {
      id: 2,
      nama: "Mirza Kholila | XII RPL 1",
      keterangan: "Izin keluarga mendadak - 1 hari",
      waktu: "4 jam yang lalu",
      status: "Periksa",
    },
    {
      id: 3,
      nama: "Mirza Kholila | XII RPL 1",
      keterangan: "Izin mengikuti seminar - 1 minggu",
      waktu: "30 menit yang lalu",
      status: "Periksa",
    },
  ];

  const notifikasiPermasalahan = [
    {
      id: 1,
      judul: "Konflik dengan BK",
      keterangan: "Dilaporkan oleh: Mirza",
      waktu: "2 jam yang lalu",
      status: "Tindak",
    },
    {
      id: 2,
      judul: "Keterlambatan Berulang",
      keterangan: "Dilaporkan oleh: Fifii",
      waktu: "4 jam yang lalu",
      status: "Tindak",
    },
    {
      id: 3,
      judul: "Kesulitan Adaptasi",
      keterangan: "Dilaporkan oleh: Nimah",
      waktu: "30 menit yang lalu",
      status: "Konseling",
    },
  ];

  const notifikasiPerpindahan = [...notifikasiPerizinan];

  // Function untuk menentukan warna berdasarkan status
  const getStatusColor = (status) => {
    if (status === "Tindak") return "#BC2424";
    if (status === "Konseling") return "#C9B42C";
    return "#EC933A"; // default untuk Periksa
  };

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
        setError("Gagal mengambil data dari server.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
     <div className="flex h-screen w-full bg-white">
          {/* SIDEBAR FULL HEIGHT */}
          <Sidebar active={active} setActive={setActive} />
    
          {/* AREA HEADER + MAIN */}
          <div className="flex flex-col flex-1">
            {/* HEADER */}
            <Header query={query} setQuery={setQuery} user={user} />

        <main className="flex-1 p-6 bg-white overflow-auto rounded-tl-3xl">
          {/* DASHBOARD CARD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto mb-10">
            {dataDisplay.map((item, i) => (
              <DashboardCard key={i} item={item} />
            ))}
          </div>

          {/* KALENDER */}
          <CalendarPanel />

          {/* NOTIFIKASI PERIZINAN & PERMASALAHAN */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                      {[
                        { title: "Notifikasi Perizinan", data: notifikasiPerizinan },
                        {
                          title: "Notifikasi Permasalahan",
                          data: notifikasiPermasalahan,
                        },
                      ].map((box, i) => (
                        <div key={i} className="bg-[#641E21] rounded-2xl p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <img src={bellIcon} alt="bell" className="w-6" />
                            <h2 className="text-white font-semibold">{box.title}</h2>
                          </div>
          
                          <div className="h-0.5 bg-white mb-4"></div>
          
                          {box.data.map((item) => {
                            const statusColor = getStatusColor(item.status);
          
                            return (
                              <div
                                key={item.id}
                                className="bg-white rounded-xl p-4 mb-3 flex gap-4 items-center"
                              >
                                {/* ICON dengan warna sesuai status */}
                                <div
                                  className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center"
                                  style={{ backgroundColor: statusColor }}
                                >
                                  <span className="text-white text-2xl font-bold">
                                    !
                                  </span>
                                </div>
          
                                <div className="flex-1 text-sm">
                                  <p className="font-semibold text-gray-800">
                                    {item.nama || item.judul}
                                  </p>
                                  <p className="text-gray-600">{item.keterangan}</p>
                                  <p className="text-xs text-gray-500">{item.waktu}</p>
                                </div>
          
                                <button
                                  className="text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition"
                                  style={{ backgroundColor: statusColor }}
                                >
                                  {item.status}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
          
                    {/* NOTIFIKASI PERPINDAHAN */}
                    <div className="bg-[#641E21] rounded-2xl p-6 mt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <img src={bellIcon} alt="bell" className="w-6" />
                        <h2 className="text-white font-semibold">
                          Notifikasi Perpindahan
                        </h2>
                      </div>
          
                      <div className="h-0.5 bg-white mb-4"></div>
          
                      {notifikasiPerpindahan.map((item) => {
                        const statusColor = getStatusColor(item.status);
          
                        return (
                          <div
                            key={item.id}
                            className="bg-white rounded-xl p-4 mb-3 flex gap-4 items-center"
                          >
                            {/* ICON dengan warna sesuai status */}
                            <div
                              className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center"
                              style={{ backgroundColor: statusColor }}
                            >
                              <span className="text-white text-2xl font-bold">!</span>
                            </div>
          
                            <div className="flex-1 text-sm">
                              <p className="font-semibold text-gray-800">{item.nama}</p>
                              <p className="text-gray-600">{item.keterangan}</p>
                              <p className="text-xs text-gray-500">{item.waktu}</p>
                            </div>
          
                            <button
                              className="text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition"
                              style={{ backgroundColor: statusColor }}
                            >
                              {item.status}
                            </button>
                          </div>
                        );
                      })}
          </div>
        </main>
      </div>
    </div>
  );
}