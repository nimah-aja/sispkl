import { ArrowUpRight } from "lucide-react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

export default function DaftarSiswaPKL({
  title = "Daftar Siswa PKL",
  data = [],
  onViewAll,
  onItemClick,
}) {
  const navigate = useNavigate();
  
  return (
    <div className="bg-white rounded-2xl p-6 border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900 font-semibold text-lg">{title}</h2>
        {onViewAll && (
          <span
             onClick={() => navigate("/guru/pembimbing/siswa")}
            className="text-sm text-blue-600 cursor-pointer"
          >
            Lihat Semua
          </span>
        )}
      </div>

      <div className="h-px bg-gray-300 mb-4"></div>

      <div className="space-y-3 max-h-[180px] overflow-y-auto">
        {data.length === 0 ? (
          <p className="text-sm text-gray-500">Tidak ada siswa</p>
        ) : (
          data.map((item) => {
            const mulai = dayjs(item.tanggal_mulai);
            const selesai = dayjs(item.tanggal_selesai);

            // hitung hari berjalan dan hari tersisa
            const hariBerjalan = dayjs().isBefore(mulai)
              ? 0
              : dayjs().diff(mulai, "day");
            const hariTersisa = selesai.diff(dayjs(), "day");

            return (
              <div
                key={item.siswa_id}
                onClick={() => onItemClick?.(item)}
                className="bg-[#641E21] rounded-xl p-4 flex items-center gap-4 cursor-pointer relative group"
              >
                {/* Inisial */}
                <div className="w-10 h-10 rounded-full bg-white text-[#641E21] flex items-center justify-center font-bold">
                  {item.inisial}
                </div>

                {/* Nama & Industri */}
                <div>
                  <p className="text-white font-semibold text-sm">{item.nama_ssw}</p>
                  <p className="text-white text-xs opacity-80">{item.industri_ssw}</p>
                </div>

                {/* Panah kanan atas */}
                <ArrowUpRight className="absolute top-2 right-2 w-4 h-4 text-white opacity-50 group-hover:opacity-100 transition" />

                {/* Hari berjalan & sisa hari */}
                <p className="absolute top-9 right-2 text-xs text-white opacity-80">
                  {hariBerjalan} hari berjalan • {hariTersisa} hari tersisa
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
