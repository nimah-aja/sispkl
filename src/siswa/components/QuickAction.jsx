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
import { getPindahPKLMe } from "../../utils/services/siswa/perpindahan";
import { getPengajuanMe } from "../../utils/services/siswa/pengajuan_pkl";
import { getActivePKL } from "../../utils/services/siswa/active";

export default function QuickActions({ onAction, isPKLActive }) {
  const navigate = useNavigate();
  const [todayIzin, setTodayIzin] = useState(null);
  const [pengajuanPKLStatus, setPengajuanPKLStatus] = useState(null);
  const [hasPindahPKL, setHasPindahPKL] = useState(false);
  const [hasActivePKL, setHasActivePKL] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // State untuk bukti diterima
  const [buktiDiterimaData, setBuktiDiterimaData] = useState({
    canUpload: false,
    hasUploaded: false,
    pklId: null
  });

  // CEK PENGAJUAN PINDAH PKL
  useEffect(() => {
    const fetchPindahPKL = async () => {
      try {
        const res = await getPindahPKLMe();
        setHasPindahPKL(!!res);
      } catch (error) {
        console.error("Gagal mengambil data pindah PKL:", error);
        setHasPindahPKL(false);
      }
    };

    fetchPindahPKL();
  }, []);

  // CEK IZIN HARI INI
  useEffect(() => {
    const fetchIzin = async () => {
      try {
        const res = await getIzinMe();
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

  // CEK STATUS PENGAJUAN PKL DAN BUKTI DITERIMA
  useEffect(() => {
    const fetchPKLStatus = async () => {
      setLoading(true);
      try {
        // STEP 1: Ambil data dari active/me
        let activePKLData = null;
        let activePKLExists = false;
        
        try {
          const activeRes = await getActivePKL();
          console.log("Active PKL Response:", activeRes);
          
          // Cek berbagai kemungkinan struktur response
          if (activeRes) {
            if (activeRes.status === "Approved") {
              activePKLExists = true;
              setHasActivePKL(true);
              activePKLData = activeRes;
            } else if (activeRes.data && activeRes.data.status === "Approved") {
              activePKLExists = true;
              setHasActivePKL(true);
              activePKLData = activeRes.data;
            }
          }
        } catch (activeError) {
          console.log("Tidak ada PKL aktif:", activeError.message);
          setHasActivePKL(false);
        }

        // STEP 2: Ambil data dari pengajuanMe
        let latestApprovedPKL = null;
        let hasPending = false;
        let allApprovedPKLs = [];
        
        try {
          const pengajuanRes = await getPengajuanMe();
          console.log("Pengajuan Response:", pengajuanRes);
          
          // Handle berbagai kemungkinan struktur response
          let list = [];
          if (pengajuanRes?.data && Array.isArray(pengajuanRes.data)) {
            list = pengajuanRes.data;
          } else if (Array.isArray(pengajuanRes)) {
            list = pengajuanRes;
          } else if (pengajuanRes?.data?.data && Array.isArray(pengajuanRes.data.data)) {
            list = pengajuanRes.data.data;
          }

          // Cek apakah ada yang pending
          hasPending = list.some(
            (item) => item.status?.toLowerCase() === "pending"
          );
          setPengajuanPKLStatus(hasPending ? "pending" : null);

          // Ambil semua PKL Approved dan sort by tanggal_permohonan terbaru
          allApprovedPKLs = list
            .filter(item => item.status === "Approved")
            .sort((a, b) => dayjs(b.tanggal_permohonan).valueOf() - dayjs(a.tanggal_permohonan).valueOf());
          
          if (allApprovedPKLs.length > 0) {
            latestApprovedPKL = allApprovedPKLs[0];
          }
        } catch (pengajuanError) {
          console.error("Gagal mengambil pengajuan:", pengajuanError);
        }

        // STEP 3: Logic untuk Bukti Diterima
        // Cek apakah ID dari activePKL sama dengan ID PKL terbaru
        let targetPKL = null;
        let idMatch = false;

        if (activePKLData && latestApprovedPKL) {
          // Jika ada activePKL dan latestApprovedPKL, cek apakah ID-nya sama
          idMatch = activePKLData.id === latestApprovedPKL.id;
          if (idMatch) {
            targetPKL = activePKLData; // atau latestApprovedPKL (sama)
          }
        } else if (activePKLData && !latestApprovedPKL) {
          // Hanya ada activePKL (seharusnya ini tidak terjadi karena activePKL pasti berasal dari pengajuan)
          targetPKL = activePKLData;
        } else if (!activePKLData && latestApprovedPKL) {
          // Tidak ada PKL aktif, tapi ada PKL Approved terbaru
          targetPKL = latestApprovedPKL;
        }

        if (targetPKL) {
          const hasUploaded = targetPKL.dokumen_urls && targetPKL.dokumen_urls.length > 0;
          
          setBuktiDiterimaData({
            canUpload: true,
            hasUploaded: hasUploaded,
            pklId: targetPKL.id,
            idMatch: idMatch // untuk info tambahan
          });
        } else {
          setBuktiDiterimaData({
            canUpload: false,
            hasUploaded: false,
            pklId: null,
            idMatch: false
          });
        }

      } catch (error) {
        console.error("Error in fetchPKLStatus:", error);
        setHasActivePKL(false);
        setPengajuanPKLStatus(null);
        setBuktiDiterimaData({
          canUpload: false,
          hasUploaded: false,
          pklId: null,
          idMatch: false
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPKLStatus();
  }, []);

  // LOGIC DISABLE IZIN PKL
  const hasIzinToday = !!todayIzin;
  const izinStatus = todayIzin?.status?.toLowerCase();

  const izinDisabled =
    hasIzinToday && ["pending", "approved", "rejected"].includes(izinStatus);

  // LOGIC DISABLE PENGAJUAN PKL
  const pengajuanPKLDisabled = 
    hasActivePKL || // Prioritas utama: cek PKL aktif
    pengajuanPKLStatus === 'pending' || // Kedua: cek pengajuan pending
    isPKLActive; // Ketiga: dari props (fallback)

  // LOGIC DISABLE BUKTI DITERIMA
  // Bisa upload jika:
  // 1. Ada target PKL (canUpload = true)
  // 2. Belum upload (hasUploaded = false)
  // 3. ID cocok (untuk activePKL) ATAU tidak ada activePKL (berarti pakai latestApprovedPKL)
  const buktiDiterimaDisabled = 
    !buktiDiterimaData.canUpload || // Tidak ada PKL yang bisa diupload
    buktiDiterimaData.hasUploaded; // Sudah pernah upload

  // ACTION LIST
  const actions = [
    {
      label: "Pengajuan PKL",
      onClick: () => navigate("/siswa/pengajuan_pkl"),
      icon: <FilePlus size={28} className="text-blue-600" />,
      bg: "bg-blue-100",
      key: "pengajuan_pkl",
      disabled: pengajuanPKLDisabled,
    },
    {
      label: "Pengajuan Pindah PKL",
      onClick: () => navigate("/siswa/pengajuan_pindah_pkl"),
      icon: <ArrowLeftRight size={28} className="text-green-600" />,
      bg: "bg-green-100",
      key: "pindah_pkl",
      disabled: hasPindahPKL,
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
      onClick: () => navigate("/siswa/bukti_terima", { 
        state: { 
          pklId: buktiDiterimaData.pklId,
          idMatch: buktiDiterimaData.idMatch 
        } 
      }),
      icon: <CheckCircle size={28} className="text-orange-600" />,
      bg: "bg-orange-100",
      key: "bukti_diterima",
      disabled: buktiDiterimaDisabled,
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-xl p-6 border border-[#6e0f0f]">
        <h2 className="font-semibold text-lg mb-4">Fitur Utama</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-[#6e0f0f] rounded-xl p-4 animate-pulse">
              <div className="bg-gray-200 p-3 rounded-lg mb-2 h-16 w-16 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
                  {hasActivePKL 
                    ? "Anda sedang dalam masa PKL aktif" 
                    : pengajuanPKLStatus === 'pending'
                    ? "Pengajuan PKL sedang diproses"
                    : "Tidak dapat mengajukan PKL"}
                </span>
              )}

              {/* INFO LABEL UNTUK IZIN PKL */}
              {isDisabled && item.key === "izin_pkl" && (
                <span className="text-xs text-gray-500 mt-1 text-center">
                  Izin hari ini sudah diajukan
                </span>
              )}

              {/* INFO LABEL UNTUK PINDAH PKL */}
              {isDisabled && item.key === "pindah_pkl" && (
                <span className="text-xs text-gray-500 mt-1 text-center">
                  Pengajuan pindah PKL sudah diajukan
                </span>
              )}

              {/* INFO LABEL UNTUK BUKTI DITERIMA */}
              {isDisabled && item.key === "bukti_diterima" && (
                <span className="text-xs text-gray-500 mt-1 text-center">
                  {!buktiDiterimaData.canUpload 
                    ? "Belum ada PKL yang dapat diupload buktinya"
                    : buktiDiterimaData.hasUploaded
                    ? "Bukti diterima sudah diupload"
                    : !buktiDiterimaData.idMatch && buktiDiterimaData.canUpload
                    ? "ID PKL tidak cocok"
                    : "Tidak dapat upload bukti"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}