import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);


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
import perpindahan from "../assets/pindahPKL.svg";


export default function PKLDashboard() {
  const [active, setActive] = useState("sidebarDashboard");
  const [query, setQuery] = useState("");
  const [dataDisplay, setDataDisplay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Notifikasi state
  const [izinNotif, setIzinNotif] = useState([
    { id: 1, nama: "Mirza Kholila | XII RPL 1", keterangan: "Mengajukan izin sakit - 2 hari", waktu: "2 jam yang lalu", status: "" },
    { id: 2, nama: "Mirza Kholila | XII RPL 1", keterangan: "Izin keluarga mendadak - 1 hari", waktu: "4 jam yang lalu", status: "" },
    { id: 3, nama: "Mirza Kholila | XII RPL 1", keterangan: "Izin mengikuti seminar - 1 minggu", waktu: "30 menit yang lalu", status: "" },
  ]);

  const [permasalahanNotif, setPermasalahanNotif] = useState([
    { id: 1, judul: "Konflik dengan BK", keterangan: "Dilaporkan oleh: Mirza", waktu: "2 jam yang lalu", status: "Proses" },
    { id: 2, judul: "Keterlambatan Berulang", keterangan: "Dilaporkan oleh: Fifii", waktu: "4 jam yang lalu", status: "Proses" },
    { id: 3, judul: "Kesulitan Adaptasi", keterangan: "Dilaporkan oleh: Nimah", waktu: "30 menit yang lalu", status: "Selesai" },
  ]);

  const [perpindahanNotif, setPerpindahanNotif] = useState([...izinNotif]);

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

  // Avatar inisial
  const getInitials = (name = "") => {
    return name
      .split("|")[0]
      .trim()
      .split(" ")
      .map(word => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Status color
  const getStatusColor = (status) => {
    if (status === "Tindak" || status === "Ditolak") return "#BC2424";
    if (status === "Konseling" || status === "Diterima") return "#C9B42C";
    if (status === "Selesai") return "#22C55E";
    return "#EC933A"; // default untuk Proses / Periksa
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

            return { title: ep.title, icon: ep.icon, value: total };
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

  const submissions = [
  {
    id: 1,
    type: "submit",
    name: "Mengajukan PKL",
    description: "Telah mengajukan tempat PKL di JV",
    time: "2026-01-04T10:00:00",
    industri: "JV Company",
    nama_siswa: "Mirza",
    nisn: "1234567890",
    kelas: "XI RPL 1",
    jurusan: "RPL",
    status: "Menunggu",
  },
  {
    id: 2,
    type: "approved",
    name: "Anda Menyetujui Pengajuan",
    description: "Persetujuan PKL di UBIG",
    time: "2026-01-04T09:00:00",
    industri: "UBIG",
    nama_siswa: "Azhar",
    nisn: "987654321",
    kelas: "XI RPL 2",
    jurusan: "RPL",
    status: "Disetujui",
  },
];

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
                  if (item.title.includes("Data Peserta PKL")) navigate("/guru/pembimbing/siswa");
                  else if (item.title.includes("Permasalahan")) navigate("/guru/pembimbing/permasalahan");
                  else if (item.title.includes("Perizinan")) navigate("/guru/pembimbing/perizinan");
                  else if (item.title.includes("Perpindahan PKL")) navigate("/guru/pembimbing/perpindahan");
                }}
              />
            ))}
          </div>

          {/* KALENDER */}
          <CalendarPanel />

          {/* NOTIFIKASI */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {[
              { title: "Notifikasi Perizinan", data: izinNotif, setData: setIzinNotif, type: "perizinan" },
              { title: "Notifikasi Permasalahan", data: permasalahanNotif, setData: setPermasalahanNotif, type: "permasalahan" },
            ].map((box, i) => (
              <div key={i} className="bg-[#641E21] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <img src={bellIcon} alt="bell" className="w-6" />
                  <h2 className="text-white font-semibold">{box.title}</h2>
                </div>

                <div className="h-0.5 bg-white mb-4"></div>

                {box.data.map((item, index) => (
                  <div key={item.id} className="bg-white rounded-xl p-4 mb-3 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-4">
                        {/* Avatar oranye */}
                        <div className="w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">{getInitials(item.nama || item.judul)}</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{item.nama || item.judul}</p>
                          <p className="text-gray-600 text-sm">{item.keterangan}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{item.waktu}</span>
                    </div>

                    {/* ACTION */}
                    <div className="flex gap-2 mt-3 ml-10 items-center">
                      {box.type === "perizinan" ? (
                        item.status !== "Ditolak" && item.status !== "Diterima" && (
                          <>
                            <button
                              onClick={() => {
                                const updated = [...box.data];
                                updated[index].status = "Ditolak";
                                box.setData(updated);
                              }}
                              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                              style={{ backgroundColor: "#BC2424" }}
                            >
                              Tolak
                            </button>

                            <button
                              onClick={() => {
                                const updated = [...box.data];
                                updated[index].status = "Diterima";
                                box.setData(updated);
                              }}
                              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                              style={{ backgroundColor: "#EC933A" }}
                            >
                              Terima
                            </button>
                          </>
                        )
                      ) : (
                        item.status !== "Selesai" && (
                          <button
                            onClick={() => {
                              const updated = [...box.data];
                              updated[index].status = "Selesai";
                              box.setData(updated);
                            }}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                            style={{ backgroundColor: "#EC933A" }}
                          >
                            Proses
                          </button>
                        )
                      )}

                      <span
                        className={`text-xs font-semibold ml-auto ${
                          item.status === "Selesai" || item.status === "Diterima"
                            ? "text-green-600"
                            : item.status === "Ditolak"
                            ? "text-red-600"
                            : "text-orange-500"
                        }`}
                      >
                        {item.status || ""}
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* NOTIFIKASI PERPINDAHAN */}
          {/* NOTIFIKASI PERPINDAHAN */}
          <div className="bg-[#641E21] rounded-2xl p-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <img src={bellIcon} alt="bell" className="w-6" />
              <h2 className="text-white font-semibold">Notifikasi Perpindahan</h2>
            </div>

            <div className="h-0.5 bg-white mb-4"></div>

            {submissions.map((item, index) => {
              // Inisial nama siswa
              const initials = item.nama_siswa
                .split(" ")
                .map(word => word[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div key={item.id} className="bg-white rounded-xl p-4 mb-3 flex gap-4 items-center">
                  {/* Circle dengan inisial */}
                  <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center bg-orange-400">
                    <span className="text-white text-lg font-bold">{initials}</span>
                  </div>

                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-gray-800">{item.nama_siswa} | {item.kelas}</p>
                    <p className="text-gray-600">{item.description}</p>
                    <p className="text-xs text-gray-500">{dayjs(item.time).fromNow()}</p>
                  </div>

                  {/* Tombol Tolak / Terima */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const updated = [...submissions];
                        updated[index].status = "Ditolak";
                        // Biasanya disini kamu mau update state submissions kalau pakai state
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ backgroundColor: "#BC2424" }}
                    >
                      Tolak
                    </button>

                    <button
                      onClick={() => {
                        const updated = [...submissions];
                        updated[index].status = "Diterima";
                        // Biasanya disini kamu mau update state submissions kalau pakai state
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ backgroundColor: "#EC933A" }}
                    >
                      Terima
                    </button>
                  </div>
                </div>
              );
            })}
          </div>


        </main>
      </div>
    </div>
  );
}
