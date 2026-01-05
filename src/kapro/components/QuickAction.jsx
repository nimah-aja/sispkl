import React from "react";
import {
  FilePlus,
  ArrowLeftRight,
  CalendarX,
  CheckCircle,
} from "lucide-react";

export default function QuickActions({ onAction }) {
  const actions = [
    {
      label: "Pengajuan PKL",
      icon: <FilePlus size={20} className="text-blue-600" />,
      bg: "bg-blue-100",
      key: "pengajuan_pkl",
    },
    {
      label: "Pengajuan Pindah PKL",
      icon: <ArrowLeftRight size={20} className="text-green-600" />,
      bg: "bg-green-100",
      key: "pindah_pkl",
    },
    {
      label: "Izin PKL",
      icon: <CalendarX size={20} className="text-purple-600" />,
      bg: "bg-purple-100",
      key: "izin_pkl",
    },
    {
      label: "Kirim Bukti Diterima",
      icon: <CheckCircle size={20} className="text-orange-600" />,
      bg: "bg-orange-100",
      key: "bukti_diterima",
    },
  ];

  return (
    <div className="bg-white shadow-sm rounded-xl p-4 border-2 border-[#641E21]">
      <h2 className="font-semibold text-base mb-3">Fitur Utama</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((item) => (
          <div
            key={item.key}
            onClick={() => onAction?.(item.key)}
            className="cursor-pointer border border-gray-300 rounded-xl p-3 flex flex-col items-center justify-center hover:shadow-md transition"
          >
            <div className={`${item.bg} p-2 rounded-lg mb-1.5`}>
              {item.icon}
            </div>
            <p className="text-[10px] font-medium text-gray-700 text-center leading-tight">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}