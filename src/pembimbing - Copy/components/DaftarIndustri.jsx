import { User } from "lucide-react";
import industriIcon from "../../assets/industri.svg";
import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DaftarIndustri({
  title = "Daftar Industri",
  data = [],
  onViewAll,
  onItemClick,
}) {
  // Batasi tampilan awal 3 item, sisanya scroll
  const displayData = data.slice(0, data.length);
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl p-6 border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900 font-semibold text-lg">{title}</h2>
        {onViewAll && (
          <span
             onClick={() => navigate("/guru/pembimbing/industri")}
            className="text-sm text-blue-600 cursor-pointer"
          >
            Lihat Semua
          </span>
        )}
      </div>

      <div className="h-px bg-gray-300 mb-4"></div>

      {/* Container scroll jika lebih dari 3 */}
      <div
        className={`space-y-3 ${
          data.length > 2 ? "max-h-[180px] overflow-y-auto" : ""
        }`}
      >
        {displayData.length === 0 ? (
          <p className="text-sm text-gray-500">Tidak ada industri</p>
        ) : (
          displayData.map((item, i) => (
            <div
              key={i}
              onClick={() => onItemClick?.(item)}
              className="relative bg-[#641E21] rounded-xl p-4 flex items-center gap-4 cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <img
                  src={item.logo || industriIcon}
                  alt="industri"
                  className="w-7 h-7"
                />

                <div>
                  <p className="text-white font-semibold text-sm">{item.nama}</p>
                  <p className="text-white text-xs opacity-80 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {item.jumlahSiswa} Siswa aktif
                  </p>
                </div>
              </div>

              {/* Panah kanan atas */}
              <ArrowUpRight className="absolute top-2 right-2 w-4 h-4 text-white opacity-80 group-hover:opacity-100 transition z-10" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
