import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// import components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardCard from "./components/DashboardCard";

// import request
import axios from "../utils/axiosInstance";
import { getPKLApplications } from "../utils/services/kapro/pengajuanPKL";

// import assets
import gradIcon from "../assets/grad.svg";
import bookIcon from "../assets/book.svg";
import usersIcon from "../assets/users.svg";
import chalkIcon from "../assets/chalk.svg";
import corporateIcon from "../assets/corporate.svg";
import pengajuanPKLIcon from "../assets/pengajuan_PKL.svg";

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
  const [pengajuanPerKelas, setPengajuanPerKelas] = useState([]);
  const [perbandinganPengajuan, setPerbandinganPengajuan] = useState([]);
  const [pengajuanPerKelasStacked, setPengajuanPerKelasStacked] = useState([]);
  const [pengajuanPerJurusanStacked, setPengajuanPerJurusanStacked] = useState([]);
  const [jurusanMap, setJurusanMap] = useState({});
  const [jurusanColorMap, setJurusanColorMap] = useState({});
  const [active, setActive] = useState("sidebarDashboard");
  const [query, setQuery] = useState("");
  const [dataDisplay, setDataDisplay] = useState([]);
  const [kelasPerJurusan, setKelasPerJurusan] = useState([]);
  const [guruPerRole, setGuruPerRole] = useState([]);
  const [waktu, setWaktu] = useState(dayjs().locale("id").format("dddd, DD MMMM YYYY HH:mm:ss"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Pengguna", role: "admin" };

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

  // Warna untuk setiap jurusan (konsisten untuk semua varian nama)
  const JURUSAN_COLORS = {
    // RPL / Rekayasa Perangkat Lunak
    "rpl": "#FF9800", // Orange
    "rekayasa perangkat lunak": "#FF9800", // Orange
    
    // BC / Broadcasting
    "bc": "#F44336", // Merah
    "broadcasting": "#F44336", // Merah
    "broadcast": "#F44336", // Merah
    
    // TKJ / Teknik Komputer Jaringan
    "tkj": "#FFC107", // Kuning
    "teknik komputer jaringan": "#FFC107", // Kuning
    "teknik komputer": "#FFC107", // Kuning
    
    // DKV / Desain Komunikasi Visual
    "dkv": "#2196F3", // Biru
    "desain komunikasi visual": "#2196F3", // Biru
    
    // MT / TMT / Mekatronika / Teknik Mekatronika
    "mt": "#4CAF50", // Hijau
    "tmt": "#4CAF50", // Hijau
    "mekatronika": "#4CAF50", // Hijau
    "teknik mekatronika": "#4CAF50", // Hijau
    
    // EI / TEI / Elektronika Industri
    "ei": "#00BCD4", // Biru Muda
    "tei": "#00BCD4", // Biru Muda
    "elektronika industri": "#00BCD4", // Biru Muda
    
    // AN / Animasi
    "an": "#9C27B0", // Ungu
    "animasi": "#9C27B0", // Ungu
    
    // AV / AK / Akuntansi
    "av": "#3F51B5", // Biru Tua
    "ak": "#3F51B5", // Biru Tua
    "akuntansi": "#3F51B5", // Biru Tua
  };

  // Warna khusus untuk perbandingan pengajuan
  const COLORS_PERBANDINGAN = ["#800000", "#e1a148"]; // Maroon untuk yang sudah, Warm gray untuk yang belum
  const COLORS_STACKED = {
    sudah: "#800000", // Maroon
    belum: "#e1a148"  // Warm gray
  };

  // fungsi untuk mendapatkan warna berdasarkan jurusan
  const getJurusanColor = (jurusanNama) => {
    if (!jurusanNama) return null;
    
    const lowerNama = jurusanNama.toLowerCase();
    
    for (const [key, color] of Object.entries(JURUSAN_COLORS)) {
      if (lowerNama.includes(key)) {
        return color;
      }
    }
    
    return null;
  };

  // fungsi untuk mendapatkan warna random yang konsisten per jurusan
  const getRandomColorForJurusan = (jurusanId, jurusanNama, existingMap) => {
    if (existingMap[jurusanId]) {
      return existingMap[jurusanId];
    }
    
    const seed = jurusanId || jurusanNama.length;
    const randomIndex = Math.abs(seed.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % COLORS.length;
    
    return COLORS[randomIndex];
  };

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
  // const COLORS_ROLE = shuffleColors(COLORS, 5);
  // Ganti dengan warna-warna solid yang konsisten untuk setiap peran
  const COLORS_ROLE = [
    "#800000", // Maroon untuk Koordinator
    "#C04C36", // Terracotta untuk Pembimbing
    "#E07A5F", // Dusty orange untuk Wali Kelas
    "#F4A261"  // Sunset orange untuk Kepala Konsentrasi Keahlian
  ];

  // FetchData dengan caching 
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
        setPerbandinganPengajuan(parsed.perbandinganPengajuan);
        setPengajuanPerKelas(parsed.pengajuanPerKelas || []);
        setPengajuanPerKelasStacked(parsed.pengajuanPerKelasStacked || []);
        setPengajuanPerJurusanStacked(parsed.pengajuanPerJurusanStacked || []);
        setJurusanMap(parsed.jurusanMap || {});
        setJurusanColorMap(parsed.jurusanColorMap || {});
        setLoading(false);
        return;
      }

      const [
        jurusanRes,
        kelasRes,
        siswaRes,
        guruRes,
        industriRes,
        pengajuanRes,
      ] = await Promise.all([
        axios.get("/api/jurusan"),
        axios.get("/api/kelas"),
        axios.get("/api/siswa"),
        axios.get("/api/guru"),
        axios.get("/api/industri"),
        getPKLApplications(),
      ]);

      const jurusanData = jurusanRes.data?.data?.data || jurusanRes.data?.data || [];
      const kelasData   = kelasRes.data?.data?.data || kelasRes.data?.data || [];
      const siswaData   = siswaRes.data?.data?.data || siswaRes.data?.data || [];
      const guruData    = guruRes.data?.data?.data || guruRes.data?.data || [];
      const industriData = industriRes.data?.data?.data || industriRes.data?.data || [];
      const pengajuanData = pengajuanRes?.data || [];

      // Buat map jurusan
      const jurusanMapTemp = {};
      jurusanData.forEach((j) => {
        jurusanMapTemp[j.id] = {
          nama: j.nama || j.nama_jurusan || `Jurusan ${j.id}`,
          kode: j.kode || j.kode_jurusan || ""
        };
      });
      setJurusanMap(jurusanMapTemp);

      // Buat map warna untuk setiap jurusan (konsisten)
      const jurusanColorMapTemp = {};
      
      // Pertama, assign warna untuk jurusan yang ada di JURUSAN_COLORS
      jurusanData.forEach((j) => {
        const jurusanNama = j.nama || j.nama_jurusan || "";
        const jurusanKode = j.kode || j.kode_jurusan || "";
        
        let warna = getJurusanColor(jurusanNama);
        if (!warna) {
          warna = getJurusanColor(jurusanKode);
        }
        
        if (warna) {
          jurusanColorMapTemp[j.id] = warna;
        }
      });
      
      // Kedua, assign warna random untuk jurusan yang belum punya warna
      jurusanData.forEach((j) => {
        if (!jurusanColorMapTemp[j.id]) {
          jurusanColorMapTemp[j.id] = getRandomColorForJurusan(j.id, j.nama, jurusanColorMapTemp);
        }
      });
      
      setJurusanColorMap(jurusanColorMapTemp);

      // HITUNG PERBANDINGAN PENGAJUAN SISWA (GLOBAL)
      const totalSiswa = siswaRes.data?.data?.total_all || siswaData.length;
      
      // Ambil ID siswa unik dari pengajuan (tidak double)
      const uniqueSiswaIds = new Set();
      pengajuanData.forEach((p) => {
        if (p.application?.siswa_id) {
          uniqueSiswaIds.add(p.application.siswa_id);
        } else if (p.siswa_id) {
          uniqueSiswaIds.add(p.siswa_id);
        }
      });
      
      const jumlahSiswaSudahPengajuan = uniqueSiswaIds.size;
      const jumlahSiswaBelumPengajuan = totalSiswa - jumlahSiswaSudahPengajuan;

      const perbandinganPengajuanTemp = [
        { name: "Sudah Mengajukan", value: jumlahSiswaSudahPengajuan },
        { name: "Belum Mengajukan", value: jumlahSiswaBelumPengajuan },
      ];

      // PENGAJUAN PKL PER KELAS (untuk pie chart)
      const pengajuanKelasGrouped = {};
      pengajuanData.forEach((p) => {
        const kelas =
          p.kelas_nama ||
          p.siswa?.kelas_nama ||
          p.siswa?.kelas?.nama ||
          "Tidak diketahui";

        pengajuanKelasGrouped[kelas] =
          (pengajuanKelasGrouped[kelas] || 0) + 1;
      });

      const pengajuanPerKelasTemp = Object.keys(pengajuanKelasGrouped).map(
        (k) => ({
          name: k,
          value: pengajuanKelasGrouped[k],
        })
      );

      setPengajuanPerKelas(pengajuanPerKelasTemp);

      // DATA UNTUK STACKED BAR CHART (Siswa per Kelas - Sudah vs Belum)
      const validKelasIds = new Set(kelasData.map(k => k.id));
      
      const totalSiswaPerKelas = new Map();
      kelasData.forEach((kelas) => {
        totalSiswaPerKelas.set(kelas.id, 0);
      });

      siswaData.forEach((s) => {
        if (s.kelas_id && validKelasIds.has(s.kelas_id)) {
          totalSiswaPerKelas.set(s.kelas_id, (totalSiswaPerKelas.get(s.kelas_id) || 0) + 1);
        }
      });

      const siswaSudahPerKelas = new Map();
      kelasData.forEach((kelas) => {
        siswaSudahPerKelas.set(kelas.id, new Set());
      });

      pengajuanData.forEach((p) => {
        let kelasId = null;
        
        if (p.kelas_id && validKelasIds.has(p.kelas_id)) {
          kelasId = p.kelas_id;
        } else if (p.siswa?.kelas_id && validKelasIds.has(p.siswa.kelas_id)) {
          kelasId = p.siswa.kelas_id;
        } else if (p.application?.siswa_id) {
          const siswa = siswaData.find(s => s.id === p.application.siswa_id);
          if (siswa && siswa.kelas_id && validKelasIds.has(siswa.kelas_id)) {
            kelasId = siswa.kelas_id;
          }
        }
        
        const siswaId = p.application?.siswa_id || p.siswa_id;
        
        if (kelasId && siswaId) {
          siswaSudahPerKelas.get(kelasId).add(siswaId);
        }
      });

      const pengajuanPerKelasStackedTemp = [];

      kelasData.forEach((kelas) => {
        const kelasId = kelas.id;
        const namaKelas = kelas.nama;
        const jurusanId = kelas.jurusan_id;
        const jurusanNama = jurusanMapTemp[jurusanId]?.nama || "Lainnya";
        const jurusanKode = jurusanMapTemp[jurusanId]?.kode || "";
        
        const total = totalSiswaPerKelas.get(kelasId) || 0;
        const sudah = siswaSudahPerKelas.get(kelasId)?.size || 0;
        const belum = total - sudah;
        
        const warnaJurusan = jurusanColorMapTemp[jurusanId] || "#9E9E9E";
        
        pengajuanPerKelasStackedTemp.push({
          name: namaKelas,
          Sudah: sudah,
          Belum: belum,
          total: total,
          kelasId: kelasId,
          jurusanId: jurusanId,
          jurusanNama: jurusanNama,
          jurusanKode: jurusanKode,
          warna: warnaJurusan
        });
      });

      pengajuanPerKelasStackedTemp.sort((a, b) => {
        if (a.jurusanNama !== b.jurusanNama) {
          return a.jurusanNama.localeCompare(b.jurusanNama);
        }
        return a.name.localeCompare(b.name);
      });

      setPengajuanPerKelasStacked(pengajuanPerKelasStackedTemp);

      // DATA UNTUK STACKED BAR CHART PER JURUSAN
      const totalSiswaPerJurusan = new Map();
      const siswaSudahPerJurusan = new Map();

      // Inisialisasi
      jurusanData.forEach((j) => {
        totalSiswaPerJurusan.set(j.id, 0);
        siswaSudahPerJurusan.set(j.id, new Set());
      });

      // Hitung total siswa per jurusan
      siswaData.forEach((s) => {
        if (s.kelas_id) {
          const kelas = kelasData.find(k => k.id === s.kelas_id);
          if (kelas && kelas.jurusan_id) {
            const jurusanId = kelas.jurusan_id;
            totalSiswaPerJurusan.set(jurusanId, (totalSiswaPerJurusan.get(jurusanId) || 0) + 1);
          }
        }
      });

      // Hitung siswa yang sudah mengajukan per jurusan
      pengajuanData.forEach((p) => {
        let jurusanId = null;
        let siswaId = p.application?.siswa_id || p.siswa_id;
        
        // Cari jurusan_id dari berbagai sumber
        if (p.jurusan_id) {
          jurusanId = p.jurusan_id;
        } else if (p.kelas_id) {
          const kelas = kelasData.find(k => k.id === p.kelas_id);
          if (kelas) jurusanId = kelas.jurusan_id;
        } else if (p.siswa?.kelas_id) {
          const kelas = kelasData.find(k => k.id === p.siswa.kelas_id);
          if (kelas) jurusanId = kelas.jurusan_id;
        } else if (p.application?.siswa_id) {
          const siswa = siswaData.find(s => s.id === p.application.siswa_id);
          if (siswa && siswa.kelas_id) {
            const kelas = kelasData.find(k => k.id === siswa.kelas_id);
            if (kelas) jurusanId = kelas.jurusan_id;
          }
        }
        
        if (jurusanId && siswaId) {
          if (!siswaSudahPerJurusan.has(jurusanId)) {
            siswaSudahPerJurusan.set(jurusanId, new Set());
          }
          siswaSudahPerJurusan.get(jurusanId).add(siswaId);
        }
      });

      const pengajuanPerJurusanStackedTemp = [];

      jurusanData.forEach((j) => {
        const jurusanId = j.id;
        const jurusanNama = j.nama || j.nama_jurusan || `Jurusan ${j.id}`;
        const jurusanKode = j.kode || j.kode_jurusan || "";
        
        const total = totalSiswaPerJurusan.get(jurusanId) || 0;
        const sudah = siswaSudahPerJurusan.get(jurusanId)?.size || 0;
        const belum = total - sudah;
        
        const warnaJurusan = jurusanColorMapTemp[jurusanId] || "#9E9E9E";
        
        pengajuanPerJurusanStackedTemp.push({
          name: jurusanNama,
          kode: jurusanKode,
          Sudah: sudah,
          Belum: belum,
          total: total,
          jurusanId: jurusanId,
          warna: warnaJurusan
        });
      });

      // Urutkan berdasarkan total siswa (descending)
      pengajuanPerJurusanStackedTemp.sort((a, b) => b.total - a.total);

      setPengajuanPerJurusanStacked(pengajuanPerJurusanStackedTemp);

      const dataDisplayTemp = [
        { title: "Konsentrasi Keahlian", icon: gradIcon, value: jurusanData.length },
        { title: "Jumlah Kelas", icon: bookIcon, value: kelasData.length },
        { title: "Jumlah Siswa", icon: usersIcon, value: totalSiswa },
        { title: "Jumlah Guru", icon: chalkIcon, value: guruData.length },
        {
          title: "Pengajuan PKL",
          icon: pengajuanPKLIcon, 
          value: pengajuanData.length,
        },
        { title: "Jumlah Industri", icon: corporateIcon, value: industriData.length },
      ];

      // KELAS PER JURUSAN
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

      // GURU PER ROLE 
      // const roleGrouped = { Koordinator: 0, Pembimbing: 0, Wali_Kelas: 0, Kaprog: 0 };
      // guruData.forEach((g) => {
      //   if (g.is_koordinator) roleGrouped.Koordinator++;
      //   if (g.is_pembimbing) roleGrouped.Pembimbing++;
      //   if (g.is_wali_kelas) roleGrouped.Wali_Kelas++;
      //   if (g.is_kaprog) roleGrouped.Kaprog++;
      // });

        const roleGrouped = { 
          Koordinator: 0, 
          Pembimbing: 0, 
          Wali_Kelas: 0, 
          "Kepala Konsentrasi Keahlian": 0 
        };
        guruData.forEach((g) => {
          if (g.is_koordinator) roleGrouped.Koordinator++;
          if (g.is_pembimbing) roleGrouped.Pembimbing++;
          if (g.is_wali_kelas) roleGrouped.Wali_Kelas++;
          if (g.is_kaprog) roleGrouped["Kepala Konsentrasi Keahlian"]++;
        });

      // const guruPerRoleTemp = Object.keys(roleGrouped).map((r) => ({
      //   name: r.replace("_", " "),
      //   value: roleGrouped[r],
      // }));

      const guruPerRoleTemp = Object.keys(roleGrouped).map((r) => ({
        name: r.replace("_", " "),
        value: roleGrouped[r],
      }));

      setDataDisplay(dataDisplayTemp);
      setKelasPerJurusan(kelasPerJurusanTemp);
      setGuruPerRole(guruPerRoleTemp);
      setPerbandinganPengajuan(perbandinganPengajuanTemp);

      sessionStorage.setItem(
        "dashboardData",
        JSON.stringify({
          dataDisplay: dataDisplayTemp,
          kelasPerJurusan: kelasPerJurusanTemp,
          guruPerRole: guruPerRoleTemp,
          pengajuanPerKelas: pengajuanPerKelasTemp,
          perbandinganPengajuan: perbandinganPengajuanTemp,
          pengajuanPerKelasStacked: pengajuanPerKelasStackedTemp,
          pengajuanPerJurusanStacked: pengajuanPerJurusanStackedTemp,
          jurusanMap: jurusanMapTemp,
          jurusanColorMap: jurusanColorMapTemp,
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

  // Custom tooltip untuk stacked bar chart per kelas
  const CustomKelasTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = data.total;
      const sudah = data.Sudah;
      const belum = data.Belum;
      const persenSudah = total > 0 ? ((sudah / total) * 100).toFixed(1) : 0;
      const persenBelum = total > 0 ? ((belum / total) * 100).toFixed(1) : 0;
      
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{label}</p>
          {/* <p className="text-sm text-gray-600">
            Konsentrasi Keahlian: {data.jurusanNama} {data.jurusanKode && `(${data.jurusanKode})`}
          </p> */}
          <p className="text-[#800000] mt-1">Sudah Mengajukan: {sudah} ({persenSudah}%)</p>
          <p className="text-[#D9CFC1]">Belum Mengajukan: {belum} ({persenBelum}%)</p>
          <p className="font-medium mt-1">Total: {total} siswa</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip untuk stacked bar chart per jurusan
  const CustomJurusanTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = data.total;
      const sudah = data.Sudah;
      const belum = data.Belum;
      const persenSudah = total > 0 ? ((sudah / total) * 100).toFixed(1) : 0;
      const persenBelum = total > 0 ? ((belum / total) * 100).toFixed(1) : 0;
      const warna = data.warna;
      
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">Konsentrasi Keahlian {label}</p>
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: warna, opacity: 0.9 }}></div>
              <span>Sudah Mengajukan: {sudah} ({persenSudah}%)</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: warna, opacity: 0.5 }}></div>
              <span>Belum Mengajukan: {belum} ({persenBelum}%)</span>
            </div>
          </div>
          <p className="font-medium mt-2">Total: {total} siswa</p>
        </div>
      );
    }
    return null;
  };

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
                      if (item.title.includes("Konsentrasi")) navigate("/admin/konsentrasi_keahlian");
                      else if (item.title.includes("Kelas")) navigate("/admin/kelas");
                      else if (item.title.includes("Siswa")) navigate("/admin/siswa");
                      else if (item.title.includes("Guru")) navigate("/admin/guru");
                      else if (item.title.includes("Industri")) navigate("/admin/industri");
                      else if (item.title.includes("Pengajuan")) navigate("/admin/pengajuan");
                    }}
                  />
                ))}
              </div>

              {/* PIE CHART PERBANDINGAN PENGAJUAN SISWA */}
              <div className="mt-10 bg-white rounded-2xl p-6 shadow-lg max-w-6xl mx-auto">
                <h2 className="font-semibold text-gray-800 mb-4">
                  Perbandingan Siswa yang Sudah & Belum Mengajukan PKL
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Total Siswa: {dataDisplay.find(d => d.title === "Jumlah Siswa")?.value || 0} | 
                  Sudah Mengajukan: {perbandinganPengajuan[0]?.value || 0} | 
                  Belum Mengajukan: {perbandinganPengajuan[1]?.value || 0}
                </p>

                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={perbandinganPengajuan}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={130}
                      label={({ name, value, percent }) => 
                        `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
                      }
                    >
                      {perbandinganPengajuan.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS_PERBANDINGAN[index % COLORS_PERBANDINGAN.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => {
                        const total = perbandinganPengajuan.reduce((sum, item) => sum + item.value, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return [`${value} siswa (${percentage}%)`, name];
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* DUA STACKED BAR CHART */}
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {/* STACKED BAR CHART - SISWA PER JURUSAN */}
                <div className="bg-white rounded-2xl p-5 shadow-lg">
                  <h2 className="font-semibold text-gray-800 mb-4">
                    Perbandingan Siswa per Konsentrasi Keahlian
                  </h2>
                  <div className="h-110 overflow-x-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={pengajuanPerJurusanStacked}
                        margin={{ top: 20, right: 10, left: -70, bottom: 10 }}
                        barSize={40}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number"
                          label={{ 
                            value: "Jumlah Siswa", 
                            position: "insideBottom",
                            offset: -5
                          }} 
                        />
                        <YAxis 
                          type="category"
                          dataKey="kode"
                          width={120}
                          tick={{ fontSize: 11 }}
                          interval={0}
                        />
                        <Tooltip content={<CustomJurusanTooltip />} />
                        {/* Legend dihapus */}
                        <Bar 
                          dataKey="Sudah" 
                          stackId="a" 
                          radius={[0, 4, 4, 0]}
                        >
                          {pengajuanPerJurusanStacked.map((entry, index) => (
                            <Cell 
                              key={`cell-sudah-${index}`} 
                              fill={entry.warna}
                              style={{ opacity: 0.9 }}
                            />
                          ))}
                        </Bar>
                        <Bar 
                          dataKey="Belum" 
                          stackId="a" 
                          radius={[0, 4, 4, 0]}
                        >
                          {pengajuanPerJurusanStacked.map((entry, index) => (
                            <Cell 
                              key={`cell-belum-${index}`} 
                              fill={entry.warna}
                              style={{ opacity: 0.5 }}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* STACKED BAR CHART - GURU PER ROLE (PIE CHART SEBELUMNYA) */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h2 className="font-semibold text-gray-800 mb-4">Guru Berdasarkan Peran</h2>
                  <ResponsiveContainer width="100%" height={400}>
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

              {/* STACKED BAR CHART - SISWA PER KELAS */}
              <div className="mt-10 bg-white rounded-2xl p-6 shadow-lg max-w-6xl mx-auto">
                <h2 className="font-semibold text-gray-800 mb-4">
                  Perbandingan Siswa Sudah & Belum Mengajukan PKL per Kelas
                </h2>
                <div className="h-106 overflow-x-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={pengajuanPerKelasStacked}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      barSize={600}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={100}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        label={{ 
                          value: "Jumlah Siswa", 
                          angle: -90, 
                          position: "insideLeft",
                          style: { textAnchor: 'middle' }
                        }} 
                      />
                      <Tooltip content={<CustomKelasTooltip />} />
                      <Legend />
                      <Bar 
                        dataKey="Sudah" 
                        stackId="a" 
                        fill={COLORS_STACKED.sudah}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="Belum" 
                        stackId="a" 
                        fill={COLORS_STACKED.belum}
                        radius={[4, 4, 0, 0]}
                      />
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