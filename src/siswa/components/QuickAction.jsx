import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import {
  FilePlus,
  ArrowLeftRight,
  CalendarX,
  CheckCircle,
} from "lucide-react";

import { getIzinMe } from "../../utils/services/siswa/izin";

export default function QuickActions({ onAction, isPKLActive }) {
  const navigate = useNavigate();
  const [todayIzin, setTodayIzin] = useState(null);
  const [pengajuanPKLStatus, setPengajuanPKLStatus] = useState(null);

  useEffect(() => {
    const fetchIzin = async () => {
      try {
        const res = await getIzinMe();

        // ⚠️ samakan dengan struktur API kamu
        const data = res?.data?.data || res || [];

        const today = dayjs().format("YYYY-MM-DD");

        const izinHariIni = data.find(
          (i) => dayjs(i.tanggal).format("YYYY-MM-DD") === today
        );

        setTodayIzin(izinHariIni || null);
      } catch (err) {
        console.error("Gagal mengambil izin:", err);
        setTodayIzin(null);
      }
    };

    fetchIzin();
  }, []);

  // ===============================
  // 🔑 AMBIL STATUS PENGAJUAN PKL (tambahkan ini)
  // ===============================
  useEffect(() => {
    const fetchPengajuanPKL = async () => {
      try {
        // Ganti dengan API yang mengambil status pengajuan PKL
        const response = await getPengajuanPKLStatus();
        setPengajuanPKLStatus(response.status); // 'pending', 'approved', 'rejected', dll
      } catch (error) {
        console.error("Gagal mengambil status pengajuan PKL:", error);
        setPengajuanPKLStatus(null);
      }
    };

    fetchPengajuanPKL();
  }, []);

  // ===============================
  // 🔑 LOGIC DISABLE IZIN PKL
  // ===============================
  const hasIzinToday = !!todayIzin;
  const izinStatus = todayIzin?.status?.toLowerCase();

  // Disable jika hari ini ADA izin & status Pending / Approved
  const izinDisabled =
    hasIzinToday && ["pending", "approved"].includes(izinStatus);

  // ===============================
  // 🔑 LOGIC DISABLE PENGAJUAN PKL (DIPERBAIKI)
  // ===============================
  // Disable jika:
  // 1. isPKLActive = true (sudah aktif)
  // 2. Status pengajuan = 'pending' (menunggu persetujuan)
  const pengajuanPKLDisabled = 
    isPKLActive || 
    pengajuanPKLStatus === 'pending';

  // ===============================
  // ACTION LIST
  // ===============================
  const actions = [
    {
      label: "Pengajuan PKL",
      onClick: () => navigate("/siswa/pengajuan_pkl"),
      icon: <FilePlus size={28} className="text-blue-600" />,
      bg: "bg-blue-100",
      key: "pengajuan_pkl",
      disabled: pengajuanPKLDisabled, // Gunakan logika baru
    },
    {
      label: "Pengajuan Pindah PKL",
      onClick: () => navigate("/siswa/pengajuan_pindah_pkl"),
      icon: <ArrowLeftRight size={28} className="text-green-600" />,
      bg: "bg-green-100",
      key: "pindah_pkl",
    },
    {
      label: "Izin PKL",
      onClick: () => navigate("/siswa/perizinan_pkl"),
      icon: <CalendarX size={28} className="text-purple-600" />,
      bg: "bg-purple-100",
      key: "izin_pkl",
      disabled: izinDisabled,
    },
    {
      label: "Kirim Bukti Diterima",
      onClick: () => navigate("/siswa/bukti_terima"),
      icon: <CheckCircle size={28} className="text-orange-600" />,
      bg: "bg-orange-100",
      key: "bukti_diterima",
    },
  ];

  return (
    <div className="bg-white shadow-sm rounded-xl p-6 border border-[#6e0f0f]">
      <h2 className="font-semibold text-lg mb-4">Fitur Utama</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((item) => {
          const isDisabled = item.disabled;

          return (
            <div
              key={item.key}
              onClick={() => {
                if (isDisabled) return;
                item.onClick?.();
                onAction?.(item.key);
              }}
              className={`
                border border-[#6e0f0f] rounded-xl p-4
                flex flex-col items-center justify-center
                transition
                ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:shadow-md"
                }
              `}
            >
              <div
                className={`${item.bg} p-3 rounded-lg mb-2 ${
                  isDisabled ? "opacity-60" : ""
                }`}
              >
                {item.icon}
              </div>

              <p className="text-sm font-medium text-gray-700 text-center">
                {item.label}
              </p>

              {/* INFO LABEL UNTUK PENGAJUAN PKL */}
              {isDisabled && item.key === "pengajuan_pkl" && (
                <span className="text-xs text-gray-500 mt-1 text-center">
                  {isPKLActive 
                    ? "Pengajuan PKL sedang aktif" 
                    : "Pengajuan PKL sedang diproses"}
                </span>
              )}

              {/* INFO LABEL UNTUK IZIN PKL */}
              {isDisabled && item.key === "izin_pkl" && (
                <span className="text-xs text-gray-500 mt-1 text-center">
                  Izin hari ini sudah diajukan
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}