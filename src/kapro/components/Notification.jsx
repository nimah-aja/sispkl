import React from "react";
import bellIcon from "../../assets/bell-notification-social-media 1.png";

export default function Notification({
  title = "Notifikasi",
  items = [],
  color = "#641E21",
}) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ backgroundColor: color }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={bellIcon}
          alt="Notification"
          className="w-6 h-6"
        />
        <h2 className="text-white text-xl font-semibold">
          {title}
        </h2>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/70 mb-4" />

      {/* Notification Items */}
      <div className="space-y-4">
        {items.map((n, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 flex items-center gap-4"
          >
            {/* Profile */}
            <img
              src={n.profile}
              alt={n.name}
              className="w-12 h-12 rounded-full object-cover"
            />

            {/* Content */}
            <div className="flex-1">
              <h3 className="font-semibold text-sm">
                {n.name} | {n.class}
              </h3>

              <p className="text-xs text-[#3A3D3D]">
                {n.description}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                {n.time}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {n.buttons?.map((b, idx) => (
                <button
                  key={idx}
                  className="w-20 h-10 rounded-lg text-xs font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: b.color }}
                >
                  {b.text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
