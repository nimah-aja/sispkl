import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
  FilePlus,
  ArrowLeftRight,
  CalendarX,
  CheckCircle,
  Plus,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";

export default function SimpleFloatingActions({pklStatus}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  const dragging = useRef(false);
  const startPos = useRef({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  const actions = [
    {

      label: "Pengajuan PKL",
      onClick: () => navigate("/siswa/pengajuan_pkl"),
      icon: <FilePlus size={22} />,
      color: "text-blue-600",
      bg: "!bg-blue-100 hover:bg-blue-200",
      key: "pengajuan_pkl",
      disabled: pklStatus === "pending" || pklStatus === "approved",
    },
    {
      label: "Pindah PKL",
      onClick : () => navigate("/siswa/pengajuan_pindah_pkl"),
      icon: <ArrowLeftRight size={22} />,
      color: "text-green-600",
      bg: "!bg-green-100 hover:bg-green-200",
      key: "pindah_pkl",
    },
    {
      label: "Izin PKL",
      onClick : () => navigate("/siswa/perizinan_pkl"),
      icon: <CalendarX size={22} />,
      color: "text-purple-600",
      bg: "!bg-purple-100 hover:bg-purple-200",
      key: "izin_pkl",
    },
    {
      label: "Bukti Diterima",
      onClick : () => navigate("/siswa/bukti_terima"),
      icon: <CheckCircle size={22} />,
      color: "text-orange-600",
      bg: "!bg-orange-100 hover:bg-orange-200",
      key: "bukti_diterima",
    },
  ];


  /* ================= DRAG HANDLER ================= */
  const onMouseDown = (e) => {
    dragging.current = true;
    startPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: pos.x,
      startY: pos.y,
    };
  };

  const onMouseMove = (e) => {
    if (!dragging.current) return;

    const dx = e.clientX - startPos.current.mouseX;
    const dy = e.clientY - startPos.current.mouseY;

    setPos({
      x: startPos.current.startX + dx,
      y: startPos.current.startY + dy,
    });
  };

  const onMouseUp = () => {
    dragging.current = false;
  };

  /* ================= RENDER ================= */
  return createPortal(
    <div
      className="fixed inset-0 pointer-events-none z-[999999]"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div
        className="absolute pointer-events-auto"
        style={{
          right: 24,
          bottom: 24,
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          transition: dragging.current
            ? "none"
            : "transform 0.15s ease-out",
        }}
      >
        {/* ACTION LIST */}
        <div
          className={`-ml-[120px] mb-3 flex flex-col items-end space-y-3 transition-all duration-300 ${
            isOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        >
          {actions.map((action) => {
            const isDisabled = action.disabled;

            return (
              <div
                key={action.key}
                className={`flex items-center space-x-2 ${
                  isDisabled ? "opacity-50" : ""
                }`}
              >
                <span className="!bg-white text-gray-700 text-sm font-medium px-3 py-1 rounded-lg shadow">
                  {action.label}
                </span>

                <button
                disabled={action.disabled}
                onClick={() => {
                  if (action.disabled) return;
                  action.onClick();
                  setIsOpen(false);
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow ${
                  action.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : action.bg
                }`}
              >
                  <span className={action.color}>{action.icon}</span>
                </button>
              </div>
            );
          })}

        </div>

        {/* MAIN FAB */}
        <button
          onMouseDown={onMouseDown}
          onClick={() => setIsOpen((v) => !v)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-blue-600 font-bold shadow-2xl transition-all duration-300 cursor-pointer active:scale-95 ${
            isOpen
              ? "!bg-blue-200 rotate-45"
              : "!bg-blue-200 hover:bg-yellow-600"
          }`}
        >
          {isOpen ? <X size={26} /> : <Plus size={26} />}
        </button>
      </div>
    </div>,
    document.body
  );
}
