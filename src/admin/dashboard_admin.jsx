import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// import components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardCard from "./components/DashboardCard";

// import request
import axios from "../utils/axiosInstance";

// import assets
import gradIcon from "../assets/grad.svg";
import bookIcon from "../assets/book.svg";
import usersIcon from "../assets/users.svg";
import chalkIcon from "../assets/chalk.svg";
import corporateIcon from "../assets/corporate.svg";

// import charts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import dayjs from "dayjs";
import "dayjs/locale/id";

export default function PKLDashboard() {
  const [active, setActive] = useState("sidebarDashboard");
  const [query, setQuery] = useState("");
  const [dataDisplay, setDataDisplay] = useState([]);
  const [kelasPerJurusan, setKelasPerJurusan] = useState([]);
  const [guruPerRole, setGuruPerRole] = useState([]);
  const [muridPerKelas, setMuridPerKelas] = useState([]);
  const [waktu, setWaktu] = useState(dayjs().locale("id").format("dddd, DD MMMM YYYY HH:mm:ss"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Pengguna", role: "Admin" };

  // warna grafik utama
  const COLORS = [
    "#C04C36", // Terracotta
    "#E07A5F", // Dusty orange
    "#D9CFC1", // Warm gray
    "#A65A44", // Deep warm brown
    "#F4A261", // Sunset orange
    "#F2E8CF", // Beige terang
    "#800000", // Maroon (utama)
    "#A67C7C", // Mauve / rose brown
    "#F2C6B4", // Blush pink
    "#D4A29C", // Dusty rose
    "#F5E9DC", // Beige muda
    "#FFF4E6", // Cream lembut
    "#B58E80", // Warm taupe
    "#C7A49A", // Soft rose
  ];

  // fungsi untuk acak urutan warna secara stabil
  const shuffleColors = (colors, seed = 1) => {
    const shuffled = [...colors];
    let currentIndex = shuffled.length;
    let randomIndex;
    let random = seed;

    while (currentIndex !== 0) {
      random = (random * 9301 + 49297) % 233280;
      randomIndex = Math.floor((random / 233280) * currentIndex);
      currentIndex--;
      [shuffled[currentIndex], shuffled[randomIndex]] = [
        shuffled[randomIndex],
        shuffled[currentIndex],
      ];
    }
    return shuffled;
  };

  // buat versi warna berbeda untuk tiap chart
  const COLORS_JURUSAN = shuffleColors(COLORS, 2);
  const COLORS_ROLE = shuffleColors(COLORS, 5);
  const COLORS_MURID = shuffleColors(COLORS, 8);

  // waktu realtime
  useEffect(() => {
    const interval = setInterval(() => {
      setWaktu(dayjs().locale("id").format("dddd, DD MMMM YYYY HH:mm:ss"));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // === FetchData dengan caching ===
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const cached = sessionStorage.getItem("dashboardData");
      const cachedTime = sessionStorage.getItem("dashboardTimestamp");
      const now = Date.now();
      const cacheExpired = !cachedTime || now - cachedTime > 5 * 60 * 1000;

      if (cached && !cacheExpired) {
        const parsed = JSON.parse(cached);
        setDataDisplay(parsed.dataDisplay);
        setKelasPerJurusan(parsed.kelasPerJurusan);
        setGuruPerRole(parsed.guruPerRole);
        setMuridPerKelas(parsed.muridPerKelas);
        setLoading(false);
        return;
      }

      const [jurusanRes, kelasRes, siswaRes, guruRes, industriRes] = await Promise.all([
        axios.get("/api/jurusan"),
        axios.get("/api/kelas"),
        axios.get("/api/siswa"),
        axios.get("/api/guru"),
        axios.get("/api/industri"),
      ]);

      const jurusanData = jurusanRes.data?.data?.data || jurusanRes.data?.data || [];
      const kelasData = kelasRes.data?.data?.data || kelasRes.data?.data || [];
      const siswaData = siswaRes.data?.data?.data || siswaRes.data?.data || [];
      const guruData = guruRes.data?.data?.data || guruRes.data?.data || [];

      const dataDisplayTemp = [
        { title: "Jumlah Jurusan", icon: gradIcon, value: jurusanData.length },
        { title: "Jumlah Kelas", icon: bookIcon, value: kelasData.length },
        { title: "Peserta Didik", icon: usersIcon, value: siswaData.length },
        { title: "Jumlah Guru", icon: chalkIcon, value: guruData.length },
        { title: "Jumlah Industri", icon: corporateIcon, value: (industriRes.data?.data?.data || industriRes.data?.data || []).length },
      ];

      // === KELAS PER JURUSAN ===
      const jurusanMap = {};
      jurusanData.forEach((j) => {
        jurusanMap[j.id] = j.kode || j.kode_jurusan || `JRS${j.id}`;
      });

      const kelasGrouped = {};
      kelasData.forEach((k) => {
        const jurusanName = jurusanMap[k.jurusan_id] || "Tidak diketahui";
        kelasGrouped[jurusanName] = (kelasGrouped[jurusanName] || 0) + 1;
      });

      const kelasPerJurusanTemp = Object.keys(kelasGrouped).map((j) => ({
        name: j,
        value: kelasGrouped[j],
      }));

      // === GURU PER ROLE ===
      const roleGrouped = { Koordinator: 0, Pembimbing: 0, Wali_Kelas: 0, Kaprog: 0 };
      guruData.forEach((g) => {
        if (g.is_koordinator) roleGrouped.Koordinator++;
        if (g.is_pembimbing) roleGrouped.Pembimbing++;
        if (g.is_wali_kelas) roleGrouped.Wali_Kelas++;
        if (g.is_kaprog) roleGrouped.Kaprog++;
      });

      const guruPerRoleTemp = Object.keys(roleGrouped).map((r) => ({
        name: r.replace("_", " "),
        value: roleGrouped[r],
      }));

      // === MURID PER KELAS ===
      const muridGrouped = {};
      kelasData.forEach((k) => {
        const jumlah = siswaData.filter((s) => s.kelas_id === k.id).length;
        muridGrouped[k.nama || `Kelas ${k.id}`] = jumlah;
      });

      const muridPerKelasTemp = Object.keys(muridGrouped).map((k) => ({
        name: k,
        value: muridGrouped[k],
      }));

      setDataDisplay(dataDisplayTemp);
      setKelasPerJurusan(kelasPerJurusanTemp);
      setGuruPerRole(guruPerRoleTemp);
      setMuridPerKelas(muridPerKelasTemp);

      sessionStorage.setItem(
        "dashboardData",
        JSON.stringify({
          dataDisplay: dataDisplayTemp,
          kelasPerJurusan: kelasPerJurusanTemp,
          guruPerRole: guruPerRoleTemp,
          muridPerKelas: muridPerKelasTemp,
        })
      );
      sessionStorage.setItem("dashboardTimestamp", now);
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data dari server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredDisplay = dataDisplay.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="bg-white min-h-screen w-full relative">
      <Header query={query} setQuery={setQuery} user={user} />
      <div className="flex flex-col md:flex-row">
        <div className="hidden md:block">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 bg-[#E1D6C4] rounded-none md:rounded-l-3xl shadow-inner">
          {loading ? (
            <p className="text-center text-gray-700 font-semibold">Memuat data...</p>
          ) : error ? (
            <p className="text-center text-red-600 font-medium">{error}</p>
          ) : (
            <>
              {/* CARD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {filteredDisplay.map((item, idx) => (
                  <DashboardCard
                    key={idx}
                    item={item}
                    onClick={() => {
                      if (item.title.includes("Jurusan")) navigate("/admin/jurusan");
                      else if (item.title.includes("Kelas")) navigate("/admin/kelas");
                      else if (item.title.includes("Peserta")) navigate("/admin/siswa");
                      else if (item.title.includes("Guru")) navigate("/admin/guru");
                      else if (item.title.includes("Industri")) navigate("/admin/industri");
                    }}
                  />
                ))}
              </div>

              {/* BAR CHART UTAMA */}
              <div className="mt-10 bg-white rounded-2xl p-6 shadow-lg max-w-6xl mx-auto">
                <div className="text-right text-gray-700 font-semibold mb-2">{waktu}</div>
                <h2 className="font-semibold text-gray-800 mb-4">Statistik Data PKL</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dataDisplay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" />
                    <YAxis label={{ value: "Jumlah", angle: -90, position: "insideLeft" }} />
                    <Tooltip formatter={(value) => [`${value}`, "Jumlah"]} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {dataDisplay.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* PIE CHART */}
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h2 className="font-semibold text-gray-800 mb-4">Kelas per Jurusan</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={kelasPerJurusan}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {kelasPerJurusan.map((_, i) => (
                          <Cell key={i} fill={COLORS_JURUSAN[i % COLORS_JURUSAN.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h2 className="font-semibold text-gray-800 mb-4">Guru Berdasarkan Role</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={guruPerRole}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {guruPerRole.map((_, i) => (
                          <Cell key={i} fill={COLORS_ROLE[i % COLORS_ROLE.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* MURID PER KELAS */}
              <div className="mt-10 bg-white rounded-2xl p-6 shadow-lg max-w-6xl mx-auto">
                <h2 className="font-semibold text-gray-800 mb-4">Murid per Kelas</h2>
                <div className="h-96 overflow-x-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={muridPerKelas}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={70}
                      />
                      <YAxis label={{ value: "Jumlah", angle: -90, position: "insideLeft" }} />
                      <Tooltip formatter={(value) => [`${value}`, "Jumlah"]} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {muridPerKelas.map((_, i) => (
                          <Cell key={i} fill={COLORS_MURID[i % COLORS_MURID.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
