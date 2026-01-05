import React, { useEffect, useState } from "react";
import dayjs from "dayjs";

export default function PKLProgressCircle({ startDate, endDate }) {

  // 🔒 Kalau tanggal belum ada / invalid
  if (!startDate || !endDate) {
    return (
      <ProgressView percentage={0} remainingDays={0} />
    );
  }

  const start = dayjs(startDate).startOf("day");
  const end = dayjs(endDate).startOf("day");
  const today = dayjs().startOf("day");

  const totalDays = end.diff(start, "day");

  let passedDays = 0;
  let remainingDays = 0;
  let percentage = 0;

  // 🔒 Jika total hari 0 atau negatif (anti NaN)
  if (totalDays <= 0) {
    percentage = 0;
    remainingDays = 0;
  } else if (today.isBefore(start)) {
    // PKL belum mulai
    percentage = 0;
    remainingDays = totalDays;
  } else if (today.isAfter(end)) {
    // PKL selesai
    percentage = 100;
    remainingDays = 0;
  } else {
    // PKL berjalan
    passedDays = today.diff(start, "day");
    remainingDays = end.diff(today, "day");
    percentage = Math.round((passedDays / totalDays) * 100);
  }

  return (
    <ProgressView
      percentage={percentage}
      remainingDays={remainingDays}
    />
  );
}

/* 🔹 Komponen tampilan dipisah (lebih rapi & aman) */
function ProgressView({ percentage, remainingDays }) {
  const radius = 78;
  const strokeWidth = 30;
  const circumference = 2 * Math.PI * radius;

  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setAnimatedPercent(percentage);
    }, 100);
    return () => clearTimeout(t);
  }, [percentage]);

  const progressOffset =
    circumference - (animatedPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center bg-white border rounded-2xl p-10 shadow-sm w-[450px]">
      <div className="relative w-[240px] h-[240px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            strokeDasharray="6 8"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="#EC933A"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.4s ease-out" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold">
            {animatedPercent}%
          </span>
          <span className="text-sm text-gray-600 mt-1">
            Sisa {remainingDays} hari
          </span>
        </div>
      </div>

      <p className="mt-4 text-xl font-bold">Progress PKL</p>
    </div>
  );
}
