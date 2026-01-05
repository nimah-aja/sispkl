import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import Sidebar from "./components/Sidebar";
import KalenderPKL from "./components/Calender";
import StatusPengajuanPKL from "./components/Notification";
import JadwalPKLCard from "./components/JadwalPKL";
import AktivitasTerkini from "./components/AktivitasTerkini";
import DashboardCard from "./components/DashboardCard";
import Header from "./components/Header";
import QuickActions from "./components/QuickAction";
import QuickActionsPager from "./components/dot";
import PKLProgressCircle from "./components/Progress";
import { getPengajuanMe } from "../utils/services/siswa/pengajuan_pkl";
import {getIndustri} from "../utils/services/admin/get_industri";
import {getGuru} from "../utils/services/admin/get_guru";
import ChatbotIframe from "./components/Chatbot";




// ICONS
import userIcon from "../assets/sidebarUsers.svg";
import timeIcon from "../assets/timewalkel.png";

// axios instance
import axios from "../utils/axiosInstance";

// DAYJS
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);


export default function DashboardSiswa() {
  const [active, setActive] = useState("sidebarDashboard");
  const [industriMap, setIndustriMap] = useState({});
  const [guruMap, setGuruMap] = useState({});
  const [aktivitas, setAktivitas] = useState([]);
  const [activePKLData, setActivePKLData] = useState(null);
  const [user] = useState(
    JSON.parse(localStorage.getItem("user")) || { name: "Guest", role: "Siswa" }
  );

  const [dashboardData, setDashboardData] = useState([
    { title: "Status PKL", value: "-", icon: userIcon },
    { title: "Sisa Hari PKL", value: "-", icon: timeIcon },
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
  const fetchIndustri = async () => {
    try {
      const res = await getIndustri();
      const map = {};
      res.forEach((i) => {
        map[i.id] = i.nama;
      });
      setIndustriMap(map);
    } catch (err) {
      console.error("Gagal ambil industri", err);
    }
  };

  fetchIndustri();
}, []);

useEffect(() => {
  const fetchGuru = async () => {
    try {
      const res = await getGuru();
      const map = {};
      res.forEach((g) => {
        map[g.id] = g.nama;
      });
      setGuruMap(map);
    } catch (err) {
      console.error("Gagal ambil guru", err);
    }
  };

  fetchGuru();
}, []);

useEffect(() => {
  if (
    Object.keys(industriMap).length === 0 ||
    Object.keys(guruMap).length === 0
  )
    return;

  const formatWaktu = (time) => {
    const now = dayjs();
    const t = dayjs(time);
  
    if (!t.isValid()) return "-";
  
    if (t.isSame(now, "day")) {
      return `Hari ini • ${t.format("HH:mm")}`;
    }
  
    if (t.isSame(now.subtract(1, "day"), "day")) {
      return `Kemarin • ${t.format("HH:mm")}`;
    }
  
    return t.format("DD MMMM YYYY • HH:mm");
  };
  


  const fetchPKL = async () => {
    try {
      const res = await getPengajuanMe();
      const list = res.data || [];

      const aktivitasList = [];

      list.forEach((item) => {
        const namaIndustri =
          industriMap[item.industri_id] || "Industri tidak diketahui";

        if (item.tanggal_permohonan) {
          aktivitasList.push({
            type: "submit",
            title: "Anda Mengajukan PKL",
            description: `Pengajuan PKL di ${namaIndustri}`,
            time: dayjs(item.tanggal_permohonan),
          });
        }

        if (item.decided_at) {
          const namaGuru =
            guruMap[item.processed_by] || "Kaprog";

          aktivitasList.push({
            type: item.status === "Approved" ? "approved" : "rejected",
            title:
              item.status === "Approved"
                ? `${namaGuru} telah menyetujui pengajuan anda`
                : `${namaGuru} telah menolak pengajuan anda`,
            description: `Pengajuan PKL di ${namaIndustri}`,
            time: dayjs(item.decided_at),
          });
        }
      });

      const sevenDaysAgo = dayjs().subtract(7, "day");

      aktivitasList.sort((a, b) => b.time.valueOf() - a.time.valueOf());

      const aktivitasTerbaru = aktivitasList.map((a) => ({
        ...a,
        time: formatWaktu(a.time),
      }));


      setAktivitas(aktivitasTerbaru);


    } catch (err) {
      console.error("Gagal mengambil aktivitas PKL", err);
    }
  };

  fetchPKL();
}, [industriMap, guruMap]);



  useEffect(() => {
    const fetchPKL = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await axios.get("/api/pkl/applications/me");
        const data = res.data.data[0];
        setActivePKLData(data);

        if (data) {
          const today = dayjs().startOf("day");
          const endDate = dayjs(data.tanggal_selesai).startOf("day");

          const diffDays = endDate.diff(today, "day");

          setDashboardData([
            {
              title: "Status PKL",
              value: data.status === "Approved" ? "Aktif" : "Tidak Aktif",
              icon: userIcon,
            },
            {
              title: "Sisa Hari PKL",
              value: diffDays > 0 ? diffDays : 0,
              icon: timeIcon,
            },
          ]);
        } else {
          setDashboardData([
            { title: "Status PKL", value: "Tidak Aktif", icon: userIcon },
            { title: "Sisa Hari PKL", value: 0, icon: timeIcon },
          ]);
        }
      } catch (err) {
        console.error(err);
        setError("Gagal mengambil data PKL.");
        setDashboardData([
          { title: "Status PKL", value: "Tidak Aktif", icon: userIcon },
          { title: "Sisa Hari PKL", value: 0, icon: timeIcon },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPKL();
  }, []);

  return (
    <div className="flex h-screen bg-white">
      {/* SIDEBAR */}
      <Sidebar active={active} setActive={setActive}/>

      {/* RIGHT AREA */}
      <div className="flex flex-col flex-1">
        {/* HEADER */}
        <Header user={user} notifications={aktivitas} />

        {/* MAIN CONTENT */}
        <main className="p-6 overflow-auto">
          {/* Grid Status & Jadwal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <div className="space-y-6">
              <StatusPengajuanPKL dataPKL={activePKLData} />
            </div>
            <div className="space-y-6">
              <JadwalPKLCard dataPKL={activePKLData} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6">
            <QuickActions
              pklStatus={activePKLData?.status?.toLowerCase()}
              onAction={(key) => {
                if (key === "pengajuan_pkl") {
                  navigate("/siswa/pengajuan_pkl");
                }
              }}
            />
          </div>

          {/* Kalender */}
          <div className="mt-6">
            <KalenderPKL pklData={activePKLData} />
          </div>

          {/* Aktivitas + Progress */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <AktivitasTerkini
                title="Notifikasi"
                icon={<Bell size={22} />}
                items={aktivitas}
              />
            </div>

            {activePKLData && (
              <div className="flex justify-center">
                <PKLProgressCircle
                  startDate={activePKLData?.tanggal_mulai}
                  endDate={activePKLData?.tanggal_selesai}
                  status={activePKLData?.status}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}