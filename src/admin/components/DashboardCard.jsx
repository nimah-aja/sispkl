import React from "react";

export default function DashboardCard({ item, onClick }) {
  return (
    // wrapper card
    <div
      onClick={onClick}
      className="
        bg-[#641E21] rounded-xl p-10 text-white 
        transform transition duration-800 active:-translate-y-2
        active:shadow-[0_8px_30px_rgba(255,255,255,0.7)]
        shadow-[0_8px_0_rgba(255,255,255,1)]
      "
    >
      {/* isi */}
      <div className="flex items-center justify-between">
        {/* icon */}
        <div className="w-20 h-15 bg-[#EC933A] rounded-lg flex items-center justify-center">
          <img src={item.icon} alt={item.title} />
        </div>
        {/* judul */}
        <div>
          <h3 className="text-sm opacity-90 mb-2 mr-[63px]">{item.title}</h3>
          <p className="text-4xl font-bold">{item.value}</p>
        </div>
      </div>
    </div>
  );
}
