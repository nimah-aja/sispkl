import React, { useEffect, useState } from "react";
import dayjs from "dayjs";

export default function PKLProgressCircle({ startDate, endDate }) {
  // Kalau tanggal belum ada / invalid
  if (!startDate || !endDate) {
    return <ProgressView percentage={0} remainingTime={formatRemainingTime(0)} />;
  }

  const start = dayjs(startDate).startOf("day");
  const end = dayjs(endDate).startOf("day");
  const today = dayjs().startOf("day");

  const totalDays = end.diff(start, "day");

  let passedDays = 0;
  let remainingDays = 0;
  let percentage = 0;

  // Jika total hari 0 atau negatif (anti NaN)
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

  // Format sisa hari menjadi bulan, minggu, hari
  const remainingTime = formatRemainingTime(remainingDays);

  return (
    <ProgressView
      percentage={percentage}
      remainingTime={remainingTime}
    />
  );
}

/* Fungsi untuk mengubah jumlah hari menjadi format: X bulan Y minggu Z hari */
function formatRemainingTime(days) {
  if (days <= 0) return { text: "Selesai", displayText: "Selesai" };

  const months = Math.floor(days / 30);
  const remainingAfterMonths = days % 30;
  const weeks = Math.floor(remainingAfterMonths / 7);
  const remainingDays = remainingAfterMonths % 7;

  let parts = [];
  
  if (months > 0) {
    parts.push(`${months} bulan`);
  }
  if (weeks > 0) {
    parts.push(`${weeks} minggu`);
  }
  if (remainingDays > 0 || parts.length === 0) {
    parts.push(`${remainingDays} hari`);
  }

  return {
    text: parts.join(" "),
    displayText: parts.length > 1 ? parts.join(" ") : parts[0]
  };
}

/* Komponen tampilan dipisah (lebih rapi & aman) */
function ProgressView({ percentage, remainingTime }) {
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
      <div className="relative w-[290px] h-[290px]">
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
            Sisa {remainingTime.displayText}
          </span>
        </div>
      </div>

      <p className="mt-4 text-xl font-bold">Progres PKL</p>
    </div>
  );
}