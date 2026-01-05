import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { getIndustri } from "../../utils/services/admin/get_industri";
import emptys from "../../assets/emptyS.jpg";
import { Calendar, Clock, Flag } from "lucide-react";

dayjs.locale("id");

export default function JadwalPKLCard({ dataPKL}) {
  const [namaIndustri, setNamaIndustri] = useState("-");
  const [loadingIndustri, setLoadingIndustri] = useState(true);
  const pklStatus = dataPKL?.status?.toLowerCase();


  const iconColor = (status) =>
    status === "upcoming" ? "text-gray-400" : "text-white";

  const stepIconByIndex = (index) => {
    switch (index) {
      case 0:
        return <Calendar className="w-3 h-3" />;
      case 1:
        return <Clock className="w-3 h-3" />;
      case 2:
        return <Flag className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const circleStyle = (status) => {
    switch (status) {
      case "done":
        return "bg-green-500";
      case "ongoing":
        return "bg-blue-500";
      case "upcoming":
        return "bg-white border-2 border-gray-400";
      default:
        return "";
    }
  };

  // ================================
  // LOAD INDUSTRI
  // ================================
  useEffect(() => {
    const fetchIndustri = async () => {
      if (!dataPKL?.industri_id) {
        setLoadingIndustri(false);
        return;
      }

      try {
        const allIndustri = await getIndustri();
        const industri = allIndustri.find(
          (i) => i.id === dataPKL.industri_id
        );
        setNamaIndustri(industri ? industri.nama : "Tidak diketahui");
      } catch {
        setNamaIndustri("Tidak diketahui");
      } finally {
        setLoadingIndustri(false);
      }
    };

    fetchIndustri();
  }, [dataPKL]);

  // ================================
  // EMPTY STATE
  // ================================
  if (!dataPKL || pklStatus === "pending" || pklStatus === "rejected") {
    return (
      <div className="bg-white p-6 rounded-2xl border-2 border-[#6e0f0f]
        !w-[800px] !h-[375px] -ml-[110px]
        flex flex-col items-center justify-center text-center">
        <img src={emptys} alt="Empty" className="-mt-10 w-60 -mb-8" />
        <h2 className="text-2xl font-bold mb-2">Jadwal PKL</h2>
        <p className="text-gray-600">Belum ada PKL aktif.</p>
      </div>
    );
  }

  // ================================
  // FORMAT & STATUS
  // ================================
  const now = dayjs();

  const status = (start, end) => {
    if (now.isBefore(start)) return "upcoming";
    if (now.isAfter(end)) return "done";
    return "ongoing";
  };

  const badgeStyle = {
    done: "bg-green-100 text-green-700",
    ongoing: "bg-blue-100 text-blue-700",
    upcoming: "bg-gray-100 text-gray-600",
  };

  const badgeText = {
    done: "Selesai",
    ongoing: "Berlangsung",
    upcoming: "Mendatang",
  };

  const bulanPKL = dayjs(dataPKL.tanggal_selesai).diff(
    dayjs(dataPKL.tanggal_mulai),
    "month"
  );

  const items = [
    {
      title: "Tanggal Mulai PKL",
      desc: loadingIndustri ? "Memuat..." : `PKL di ${namaIndustri}`,
      status: status(dataPKL.tanggal_mulai, dataPKL.tanggal_mulai),
    },
    {
      title: "Periode Aktif",
      desc: `Masa PKL berlangsung selama ${bulanPKL} bulan`,
      status: status(dataPKL.tanggal_mulai, dataPKL.tanggal_selesai),
    },
    {
      title: "Tanggal Berakhir",
      desc: "Penyelesaian dan evaluasi PKL",
      status: status(dataPKL.tanggal_selesai, dataPKL.tanggal_selesai),
    },
  ];

  const getLeftDate = (index) => {
    if (index === 2) return dayjs(dataPKL.tanggal_selesai);
    return dayjs(dataPKL.tanggal_mulai);
  };

  

  return (
    <div className="bg-white !-ml-[110px] p-6 rounded-2xl shadow-sm border border-[#6e0f0f] w-full !w-[799px]">
      <h2 className="text-2xl font-bold mb-15">Jadwal PKL</h2>

      <div className="relative space-y-14">
        {items.map((item, index) => {
          const date = getLeftDate(index);

          return (
            <div key={index} className="flex gap-6 relative">
              {/* TANGGAL KIRI */}
              <div className="w-16 text-center -mt-10">
                <p className="text-sm font-bold text-gray-800">
                  {date.format("DD MMM YYYY")}
                </p>
              </div>

              {/* TIMELINE */}
              <div className="relative -mt-10">
                {/* DOUBLE BORDER CIRCLE */}
                <div className="relative w-6 h-6 flex items-center justify-center">
                  {item.status === "ongoing" && (
                    <span className="absolute inset-0 rounded-full border-2 border-blue-300"></span>
                  )}

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${circleStyle(
                      item.status
                    )}`}
                  >
                    <span className={iconColor(item.status)}>
                      {stepIconByIndex(index)}
                    </span>
                  </div>
                </div>

                {/* DASHED LINE */}
                {index < items.length - 1 && (
                  <div
                    className={`
                      absolute left-1/2 top-6 -translate-x-1/2
                      h-[75px] border-l-2 border-dashed
                      ${
                        item.status === "done"
                          ? "border-green-500"
                          : "border-gray-300"
                      }
                    `}
                  />
                )}
              </div>

              {/* CONTENT */}
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm -mt-10">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <span
                    className={`px-4 py-1 rounded-full text-sm font-semibold ${badgeStyle[item.status]}`}
                  >
                    {badgeText[item.status]}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
