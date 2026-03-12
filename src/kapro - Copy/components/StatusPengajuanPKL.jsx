import React, { useState } from "react";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";

export default function StatusPengajuan_PKL({ data = [] }) {
  const [openPopup, setOpenPopup] = useState(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });

  const getStatusColor = (status) => {
    switch (status) {
      case "disetujui":
        return "#0BE33A";
      case "belum_diproses":
        return "#160BE3";
      case "ditolak":
        return "#E30B0B";
      default:
        return "#9CA3AF";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "disetujui":
        return <CheckCircle2 size={22} />;
      case "belum_diproses":
        return <Clock3 size={22} />;
      case "ditolak":
        return <XCircle size={22} />;
      default:
        return <span>•</span>;
    }
  };

  const getInitials = (name = "") => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0]?.toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const openStudentPopup = (item, e) => {
    if (!item.students || item.students.length === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const popupHeight = 180;
    const spaceBelow = window.innerHeight - rect.bottom;

    const top =
      spaceBelow < popupHeight
        ? rect.top + window.scrollY - popupHeight - 8
        : rect.bottom + window.scrollY + 8;

    setPopupPos({
      top,
      left: rect.left + window.scrollX,
    });

    setOpenPopup(item);
  };

  const closeModal = () => {
    setOpenPopup(null);
  };


  return (
    <div
      className="bg-white rounded-2xl shadow-lg p-6 w-full"
      style={{ border: "2px solid #641E21" }}
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Status Pengajuan PKL
      </h2>

      <div className="space-y-6">
        {data.map((item, idx) => (
          <div key={idx}>
            {/* HEADER BAR */}
            <div
              className="flex items-center gap-4 cursor-pointer"
              onClick={(e) => openStudentPopup(item, e)}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: getStatusColor(item.status) }}
              >
                {getStatusIcon(item.status)}
              </div>

              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  {item.label}
                </h3>

                {/* PROGRESS BAR */}
                <div className="relative w-full h-2 bg-gray-200 rounded-full group">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: getStatusColor(item.status),
                    }}
                  >
                    <div
                      className="
                        absolute -top-9 left-1/2 -translate-x-1/2
                        opacity-0 group-hover:opacity-100
                        transition
                        bg-gray-900 text-white text-xs px-3 py-1 rounded
                        whitespace-nowrap z-50
                        pointer-events-none
                      "
                    >
                      {item.total} siswa
                    </div>
                  </div>
                </div>

              </div>

              <span className="text-sm font-medium text-gray-400">
                {item.percentage}%
              </span>
            </div>

            {/* POPUP LIST SISWA */}
            {openPopup && (
              <div
                className="-ml-76 fixed inset-0 z-[9999]"
                onClick={closeModal}
              >
                <div
                  className="
                    absolute
                    bg-white
                    w-[360px]
                    border border-gray-300
                    rounded-xl
                    shadow-sm
                    p-4
                  "
                  style={{
                    top: popupPos.top,
                    left: popupPos.left,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* LIST SISWA */}
                  <div className="space-y-3 max-h-[168px] overflow-y-auto">
                    {openPopup.students?.length > 0 ? (
                      openPopup.students.map((siswa, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 hover:!bg-gray-200 p-3 rounded-lg"
                        >
                          {/* AVATAR */}
                          <div className="w-8 h-8 rounded-full bg-[#641E21] text-white flex items-center justify-center font-bold text-sm">
                            {getInitials(siswa.name)}
                          </div>

                          {/* INFO */}
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">
                              {siswa.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Mengajukan PKL di {siswa.pkl_place}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 text-center">
                        Tidak ada siswa
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}


          </div>
        ))}
      </div>
    </div>
  );
}
