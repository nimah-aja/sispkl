import React from "react";
import {
  FilePlus,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AktivitasTerkini({
  title = "Aktivitas Terkini",
  icon = "🔔",
  items = [],
  color = "#641E21",
  showFooter = true,
}) {
  const navigate = useNavigate();

  const ITEM_HEIGHT = 90;
  const MAX_VISIBLE = 3;

  const getIconByType = (type) => {
    switch (type) {
      case "submit":
        return <FilePlus className="w-6 h-6 text-orange-500" />;
      case "approved":
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "rejected":
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <FilePlus className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div
      className="rounded-2xl shadow-lg flex flex-col"
      style={{ backgroundColor: color }}
    >
      {/* HEADER */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-white text-2xl">{icon}</span>
          <h2 className="text-white text-2xl font-semibold">
            {title}
          </h2>
        </div>

        <div className="-mx-6">
          <div className="w-full h-0.5 bg-white" />
        </div>
      </div>

      {/* LIST */}
      <div
        className="px-6 space-y-4 overflow-y-auto"
        style={{ maxHeight: ITEM_HEIGHT * MAX_VISIBLE }}
      >
        {items.length > 0 ? (
          items.map((notif, idx) => (
            <div
              key={idx}
              onClick={notif.onClick}
              className={`
                bg-white p-4 rounded-lg flex gap-4
                ${notif.onClick ? "cursor-pointer hover:bg-gray-50" : ""}
              `}
            >

              {/* ICON */}
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                {getIconByType(notif.type)}
              </div>

              {/* CONTENT */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-gray-900 font-semibold truncate">
                    {notif.title}
                  </h3>
                  {notif.time && (
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {notif.time}
                    </span>
                  )}
                </div>

                {notif.description && (
                  <p className="text-gray-500 text-sm mt-1 truncate">
                    {notif.description}
                  </p>
                )}

                {/* ACTION BUTTONS */}
                {notif.actions?.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {notif.actions.map((btn, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          btn.onClick();
                        }}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold text-white"
                        style={{ backgroundColor: btn.color }}
                      >
                        {btn.label}
                      </button>

                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-white text-center opacity-70 py-6">
            Tidak ada aktivitas
          </p>
        )}
      </div>

      {/* FOOTER */}
      {showFooter && items.length > 0 && (
        <div
          onClick={() => navigate("/siswa/riwayat_pengajuan")}
          className="
            mt-4
            py-3
            text-center
            text-white
            font-bold
            cursor-pointer
            hover:bg-white/10
            transition
            border-t border-white/20
          "
        >
          Lihat Riwayat Notifikasi
        </div>
      )}
    </div>
  );
}
