import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import IzinCard from "./DetailIzin";
import { getIzinMe } from "../../utils/services/siswa/izin";

export default function IzinHariIni() {
  const [izinToday, setIzinToday] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIzin = async () => {
      try {
        const res = await getIzinMe();

        const today = dayjs().format("YYYY-MM-DD");

        const todayIzin = res?.data?.find(
          (i) => dayjs(i.tanggal).format("YYYY-MM-DD") === today
        );

        setIzinToday(todayIzin || null);
      } catch (err) {
        console.log("izin error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIzin();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6">
        Loading izin hari ini...
      </div>
    );
  }

  if (!izinToday) {
    return (
      <div className="bg-white rounded-xl p-6 border border-dashed text-center text-gray-500">
        Tidak ada pengajuan izin hari ini
      </div>
    );
  }

  return (
    <IzinCard
      data={izinToday}
      onDetail={() => console.log("detail")}
    />
  );
}
