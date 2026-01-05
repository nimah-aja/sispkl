import React from "react";

export default function DashboardCard({ data = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
      {data.map((item, index) => (
        <div
          key={index}
          className="
            bg-[#641E21] rounded-xl p-10 text-white 
            transform transition duration-800 active:-translate-y-2
            active:shadow-[0_8px_30px_rgba(255,255,255,0.7)]
            shadow-[0_8px_0_rgba(255,255,255,1)]
            max-w-sm w-full mx-auto
          "
        >

          <div className="flex items-center justify-between">
            <div className="w-20 h-15 bg-[#EC933A] rounded-lg flex items-center justify-center">
              <img src={item.icon} alt={item.title} />
            </div>

            <div>
              <h3 className="text-sm opacity-90 mb-2 mr-[63px]">{item.title}</h3>
              <p className="text-3xl font-bold">{item.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
