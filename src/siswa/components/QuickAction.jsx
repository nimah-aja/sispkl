import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FilePlus,
  ArrowLeftRight,
  CalendarX,
  CheckCircle,
} from "lucide-react";

export default function QuickActions({ onAction, pklStatus }) {
  const navigate = useNavigate();

  const actions = [
    {
      label: "Pengajuan PKL",
      onClick: () => navigate("/siswa/pengajuan_pkl"),
      icon: <FilePlus size={28} className="text-blue-600" />,
      bg: "bg-blue-100",
      key: "pengajuan_pkl",
      disabled: pklStatus === "pending" || pklStatus === "approved",
    },
    {
      onClick : () => navigate("/siswa/pengajuan_pindah_pkl"),
      label: "Pengajuan Pindah PKL",
      icon: <ArrowLeftRight size={28} className="text-green-600" />,
      bg: "bg-green-100",
      key: "pindah_pkl",
    },
    {
      onClick : () => navigate("/siswa/perizinan_pkl"),
      label: "Izin PKL",
      icon: <CalendarX size={28} className="text-purple-600" />,
      bg: "bg-purple-100",
      key: "izin_pkl",
    },
    {
      onClick : () => navigate("/siswa/bukti_terima"),
      label: "Kirim Bukti Diterima",
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

                if (item.onClick) {
                  item.onClick();
                } else {
                  onAction?.(item.key);
                }
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

              {/* OPTIONAL LABEL */}
              {isDisabled && item.key === "pengajuan_pkl" && (
                <span className="text-xs text-gray-500 mt-1">
                  Pengajuan sedang aktif
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
