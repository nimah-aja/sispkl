import { useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  User,
  Building2,
  ClipboardList,
  AlertTriangle,
  Upload,
  Users,
} from "lucide-react";

export default function TugasTerbaru({
  title = "Kegiatan Terbaru",
  data = [],
  onViewAll,
  onUploadBukti,
}) {
  const navigate = useNavigate();
  const ITEM_HEIGHT = 88;
  const MAX_VISIBLE = 3;

  const [popup, setPopup] = useState(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });

  const hitungSisaHari = (tanggalSelesai) => {
    if (!tanggalSelesai) return undefined;
    const end = dayjs(tanggalSelesai);
    if (!end.isValid()) return undefined;
    return end.startOf("day").diff(dayjs().startOf("day"), "day");
  };

  // Sort deadline terdekat
  const sortedData = [...data].sort((a, b) => {
    const aDay = hitungSisaHari(a.tanggal_selesai);
    const bDay = hitungSisaHari(b.tanggal_selesai);
    if (aDay === undefined) return 1;
    if (bDay === undefined) return -1;
    return aDay - bDay;
  });

  const openPopup = (type, payload, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupPos({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
    });
    setPopup({ type, data: payload });
  };

  // Fungsi untuk navigate ke upload
  const handleUploadClick = (item) => {
    console.log("Upload clicked:", item);
    
    // Cek struktur item untuk debug
    console.log("Item structure:", {
      id: item.id,
      nama: item.nama,
      industri_id: item.industri_id,
      industri_nama: item.industri_nama,
      siswa_count: item.jumlahSiswa,
      siswa_list: item.siswa
    });
    
    // Navigasi ke halaman upload dengan semua data yang diperlukan
    navigate("/guru/pembimbing/uploadPengantaran", {
      state: { 
        tugas: item, // Kirim seluruh objek item
        id_kegiatan: item.id, // ID kegiatan
        id_industri: item.industri_id, // ID industri
        industri_nama: item.industri_nama || item.industri?.nama,
        nama_kegiatan: item.nama,
        deskripsi: item.deskripsi,
        tanggal_selesai: item.tanggal_selesai,
        siswa_list: item.siswa || []
      }
    });
  };

  return (
    <div className="bg-[#641E21] rounded-2xl p-6 flex flex-col relative">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          {data.length > 0 && (
            <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
              {data.length} tugas
            </span>
          )}
        </div>
        {onViewAll && (
          <p
            onClick={() => navigate("/guru/pembimbing/kegiatan")}
            className="text-gray-100 text-sm cursor-pointer hover:underline"
          >
            Lihat Semua
          </p>

        )}
      </div>

      {/* DIVIDER */}
      <div className="-mx-6 mb-5">
        <div className="w-full h-0.5 bg-white" />
      </div>

      {/* LIST */}
      <div className="relative">
        <div
          className="space-y-3 overflow-y-auto pr-1"
          style={{ maxHeight: ITEM_HEIGHT * MAX_VISIBLE }}
        >
          {sortedData.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-white text-sm opacity-80 mb-2">🎉 Tidak ada tugas!</p>
              <p className="text-white/60 text-xs">Semua kegiatan sudah direalisasikan</p>
            </div>
          ) : (
            sortedData.map((item, i) => {
              const sisaHari = hitungSisaHari(item.tanggal_selesai);
              const isHariIni = sisaHari === 0;
              const isLewat = sisaHari < 0;
              const canSubmit = item.can_submit === true && !isLewat;
              
              // Format industri name
              const industriNama = item.industri_nama || item.industri?.nama || item.industri || "Tidak diketahui";
              
              return (
                <div
                  key={item.task_key || i}
                  className="bg-white rounded-xl p-4 flex items-start justify-between hover:shadow-md transition-shadow"
                >
                  {/* ICON */}
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5 text-gray-600" />
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1 mx-4 min-w-0">
                    {/* TITLE + STATUS */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">
                          {item.nama}
                        </p>
                        {item.deskripsi && (
                          <p className="text-xs text-gray-500 truncate">
                            {item.deskripsi}
                          </p>
                        )}
                      </div>

                      {sisaHari !== undefined && (
                        <div
                          className={`text-xs font-semibold flex items-center gap-1 whitespace-nowrap
                            ${
                              isHariIni
                                ? "text-red-600"
                                : isLewat
                                ? "text-gray-400"
                                : "text-red-500"
                            }
                          `}
                        >
                          {isHariIni && <AlertTriangle className="w-4 h-4" />}
                          {isLewat
                            ? "terlewat"
                            : isHariIni
                            ? "hari ini"
                            : `sisa ${sisaHari} hari`}
                        </div>
                      )}
                    </div>

                    {/* ROW BAWAH */}
                    <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
                      {/* KIRI */}
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Tombol Daftar Siswa */}
                        <button
                          onClick={(e) => openPopup("siswa", item.siswa, e)}
                          className="-ml-2 !bg-transparent flex items-center gap-1 hover:text-[#641E21] group"
                          title="Lihat daftar siswa"
                        >
                          {item.siswa && item.siswa.length > 0 ? (
                            <>
                              <Users className="w-3 h-3" />
                              <span>{item.siswa.length} siswa</span>
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3" />
                              <span>{item.jumlahSiswa || 0} siswa</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1 min-w-0" title={industriNama}>
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {industriNama}
                          </span>
                        </div>
                      </div>

                      {/* KANAN - Tombol Upload */}
                      <button
                        disabled={!canSubmit}
                        onClick={() => handleUploadClick(item)}
                        className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md whitespace-nowrap transition-colors
                          ${
                            canSubmit
                              ? "!bg-[#641E21] text-white hover:opacity-90"
                              : "!bg-gray-200 text-gray-400 cursor-not-allowed"
                          }
                        `}
                        title={!canSubmit ? "Tidak dapat mengunggah" : "Unggah bukti realisasi"}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {isLewat ? "Terlewat" : "Unggah"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= POPUP SISWA ================= */}
      {popup && (
        <div
          className="fixed inset-0 z-[9999]"
          onClick={() => setPopup(null)}
        >
          <div
            className="absolute bg-white border border-gray-300 rounded-xl shadow-lg p-4 w-[320px]"
            style={{ 
              top: popupPos.top, 
              left: Math.min(popupPos.left, window.innerWidth - 340) // Pastikan tidak keluar layar
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {popup.type === "siswa" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-gray-800">Daftar Siswa</p>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {popup.data?.length || 0} siswa
                  </span>
                </div>
                
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {popup.data && popup.data.length > 0 ? (
                    popup.data.map((s, i) => (
                      <div
                        key={s.id || i}
                        className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">
                            {(s.nama || s.siswa_nama || '?').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-gray-800 truncate">
                              {s.nama || s.siswa_nama || `Siswa ${i+1}`}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{s.kelas || '-'}</span>
                              {s.nisn && <span>• NISN: {s.nisn}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      <User className="w-8 h-8 mx-auto mb-2 -ml-2 text-gray-300" />
                      <p>Tidak ada data siswa</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}