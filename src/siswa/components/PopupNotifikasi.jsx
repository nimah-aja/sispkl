import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PopupNotifikasi({
  isOpen,
  onClose,

  // Header
  headerTitle = "Notifikasi",
  headerIcon = null,

  // Tabs
  tabs = [], // [{ key: "all", label: "Semua" }]
  defaultTab,

  // Data
  notifications = [],

  width = 420,
}) {
  const [activeTab, setActiveTab] = useState(
    defaultTab || tabs?.[0]?.key || "all"
  );
  const ITEM_HEIGHT = 80;
  const MAX_VISIBLE = 4;
  const navigate = useNavigate(); 


  // 🔁 Sync activeTab kalau tabs / defaultTab berubah
  useEffect(() => {
    if (tabs.length === 0) return;

    if (!activeTab || !tabs.find((t) => t.key === activeTab)) {
      setActiveTab(defaultTab || tabs[0].key);
    }
  }, [tabs, defaultTab, activeTab]);

  if (!isOpen) return null;

  // 🔍 Filter notifications
  const filteredNotifications =
    activeTab === "all" || !activeTab
      ? notifications
      : notifications.filter((n) => n.tab === activeTab);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Container */}
      <div
        className="fixed right-6 top-20 z-50 bg-[#641E20] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ width }}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            {headerIcon}
            <span className="font-bold text-lg">
              {headerTitle}
            </span>
          </div>

          <button
            onClick={onClose}
            className="!bg-transparent"
          >
            <X className="w-5 h-5 text-white opacity-80 hover:opacity-100" />
          </button>
        </div>

        {/* TABS */}
        {tabs.length > 0 && (
          <div className="flex border-b border-white/20">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 text-sm font-medium transition !bg-transparent ${
                  activeTab === tab.key
                    ? "text-white border-b-2 border-[#EC933A]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* LIST */}
        <div
          className="p-4 space-y-3 overflow-y-auto"
          style={{
            maxHeight: ITEM_HEIGHT * MAX_VISIBLE,
          }}
        >
          {filteredNotifications.length === 0 ? (
            <div className="text-center text-white/70 py-8">
              Tidak ada notifikasi
            </div>
          ) : (
            filteredNotifications.map((notif, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  {/* ICON */}
                  {notif.icon && (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: notif.iconBg || "#fb923c",
                      }}
                    >
                      {notif.icon}
                    </div>
                  )}

                  {/* CONTENT */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold text-gray-800 text-sm">
                        {notif.title}
                      </h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {notif.time}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mt-1">
                      {notif.description}
                    </p>

                    {/* ACTIONS */}
                    {notif.actions?.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {notif.actions.map((btn, idx) => (
                          <button
                            key={idx}
                            onClick={btn.onClick}
                            className="px-4 py-1.5 rounded-md text-xs font-medium text-white"
                            style={{ backgroundColor: btn.color }}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>


        {/* FOOTER */}
        <div className="border-t border-white/20">
          <button onClick={() => navigate("/aktivitas")} className="w-full py-3 text-sm text-white !bg-transparent">
            Lihat Riwayat Notifikasi
          </button>
          
        </div>
      </div>
    </>
  );
}
