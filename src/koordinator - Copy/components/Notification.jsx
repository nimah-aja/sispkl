import React from "react";

export default function NotificationCard({
  title = "Notifikasi",
  icon = "🔔",
  items = [],
  color = "#641E21", // default warna coklat PKL
}) {
  return (
    <div
      className="rounded-2xl p-6 shadow-lg"
      style={{ backgroundColor: color }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-white text-2xl">{icon}</span>
        <h2 className="text-white text-xl font-semibold">{title}</h2>
      </div>

      <div className="-mx-6 mb-6">
        <div className="w-full h-0.5 bg-white"></div>
      </div>

      {/* Body / Items */}
      <div className="space-y-4">
        {items.length > 0 ? (
          items.map((notif, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-4 flex items-center gap-4"
            >
              {/* Profile image */}
              {notif.profile && (
                <img
                  src={notif.profile}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              )}

              <div className="flex-1 min-w-0">
                {/* Judul / Nama */}
                <h3 className="text-gray-900 font-semibold text-sm mb-1">
                  {notif.title || notif.name}
                  {notif.class ? ` | ${notif.class}` : ""}
                </h3>

                {/* Deskripsi */}
                {notif.description && (
                  <p className="text-gray-600 text-xs mb-1">
                    {notif.description}
                  </p>
                )}

                {/* Waktu */}
                {notif.time && (
                  <p className="text-gray-500 text-xs">{notif.time}</p>
                )}
              </div>

              {/* Button */}
              {notif.buttons && notif.buttons.length > 0 && (
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {notif.buttons.map((btn, bIdx) => (
                    <button
                      key={bIdx}
                      className="px-4 py-1.5 rounded-lg font-medium text-xs text-white"
                      style={{ backgroundColor: btn.color || "#666" }}
                      onClick={btn.onClick}
                    >
                      {btn.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-white text-center opacity-70">
            Tidak ada notifikasi
          </p>
        )}
      </div>
    </div>
  );
}
