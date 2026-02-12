import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { getIndustri } from "../../utils/services/admin/get_industri";
import { getGuru } from "../../utils/services/admin/get_guru";
import empty from "../../assets/empty.jpg";
import { getActivePklMe, getPengajuanMe } from "../../utils/services/siswa/pengajuan_pkl";
import Detail from "./Detail"
import { getPindahPKLMe } from "../../utils/services/siswa/perpindahan";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  Clock3,
  Loader2,
  Building2,
  CircleDot,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  Notebook,
  UserCheck,
  UserCog,
  NotebookText,
  MessageSquareText
} from "lucide-react";

export default function StatusPengajuanPKL() {
  const [dataPindahPKL, setDataPindahPKL] = useState(null);
  const [isPindahPKL, setIsPindahPKL] = useState(false);
  const [namaIndustri, setNamaIndustri] = useState("-");
  const [namaPembimbing, setNamaPembimbing] = useState("-");
  const [namaKaprog, setNamaKaprog] = useState("-");
  const navigate = useNavigate();
  const [dataPKL, setDataPKL] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [loading, setLoading] = useState(true);

  const statusLabel = (status) => {
    if (!status) return "-";

    switch (status.toLowerCase()) {
      case "pending":
      case "pending_pembimbing":
      case "pending_kaprog":
        return "Tertunda";
      case "rejected":
        return "Ditolak";
      case "approved":
        return "Diterima";
      default:
        return status;
    }
  };
  
  // GET DATA PENGAJUAN - PRIORITAS: PINDAH PKL -> ACTIVE PKL -> PENGAJUAN BIASA
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. CEK PERPINDAHAN PKL DULU (PRIORITAS TERTINGGI)
        let pindah = null;
        try {
          pindah = await getPindahPKLMe();
        } catch (err) {
          console.log("Tidak ada data perpindahan PKL:", err.message);
        }

        if (pindah && Object.keys(pindah).length > 0) {
          setIsPindahPKL(true);
          setDataPindahPKL(pindah);

          // mapping ke bentuk dataPKL TANPA ubah UI
          setDataPKL({
            status: pindah.status,
            catatan: pindah.alasan,
            tanggal_permohonan: pindah.created_at,
            tanggal_mulai: pindah.tanggal_efektif,
            tanggal_selesai: pindah.tanggal_efektif,
            industri_id: pindah.industri_baru?.id,
            decided_at: pindah.updated_at,
            kaprog_note: pindah.kaprog_catatan,
            processed_by: null,
            pembimbing_guru_id: null,
          });

          setLoading(false);
          return; // stop, jangan ambil pengajuan biasa
        }

        // 2. CEK PKL AKTIF (PRIORITAS KEDUA)
        let activeData = null;
        try {
          activeData = await getActivePklMe();
        } catch (err) {
          console.log("Tidak ada PKL aktif:", err.message);
        }

        if (activeData && Object.keys(activeData).length > 0) {
          // Mapping data dari response getActivePklMe ke format yang diharapkan
          const mappedData = {
            id: activeData.id,
            status: activeData.status,
            industri_id: activeData.industri_id,
            tanggal_mulai: activeData.tanggal_mulai,
            tanggal_selesai: activeData.tanggal_selesai,
            pembimbing_guru_id: activeData.pembimbing_guru_id,
            created_at: activeData.created_at,
            updated_at: activeData.updated_at,
            application_id: activeData.application_id,
            // Field untuk kompatibilitas
            catatan: activeData.catatan || "",
            kaprog_note: activeData.kaprog_note || "",
            processed_by: activeData.processed_by || null,
            tanggal_permohonan: activeData.created_at,
            decided_at: activeData.updated_at,
          };
          
          setDataPKL(mappedData);
          setLoading(false);
          return;
        }

        // 3. CEK PENGAJUAN BIASA (PRIORITAS TERAKHIR)
        try {
          const pengajuanData = await getPengajuanMe();
          
          if (pengajuanData && pengajuanData.data && pengajuanData.data.length > 0) {
            // Ambil pengajuan terbaru (indeks pertama)
            const latestPengajuan = pengajuanData.data[0];
            
            // Format data untuk kompatibilitas
            const formattedData = {
              id: latestPengajuan.id,
              status: latestPengajuan.status,
              industri_id: latestPengajuan.industri_id,
              tanggal_mulai: latestPengajuan.tanggal_mulai,
              tanggal_selesai: latestPengajuan.tanggal_selesai,
              pembimbing_guru_id: latestPengajuan.pembimbing_guru_id,
              created_at: latestPengajuan.created_at,
              updated_at: latestPengajuan.updated_at || latestPengajuan.decided_at,
              application_id: latestPengajuan.application_id || latestPengajuan.id,
              catatan: latestPengajuan.catatan || "",
              kaprog_note: latestPengajuan.kaprog_note || "",
              processed_by: latestPengajuan.processed_by || null,
              tanggal_permohonan: latestPengajuan.tanggal_permohonan,
              decided_at: latestPengajuan.updated_at || latestPengajuan.decided_at,
            };
            
            setDataPKL(formattedData);
          } else {
            setDataPKL(null);
          }
        } catch (err) {
          console.error("Gagal mengambil data pengajuan biasa:", err);
          setDataPKL(null);
        }
      } catch (err) {
        console.error("Gagal mengambil data PKL", err);
        setDataPKL(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  
  // GET INDUSTRI DAN PEMBIMBING
  
  useEffect(() => {
    const fetchData = async () => {
      if (!dataPKL) return;
      
      try {
        // Get data industri untuk konversi ID ke nama
        const allIndustri = await getIndustri();
        
        if (dataPKL.industri_id) {
          const industri = allIndustri.find((i) => i.id === dataPKL.industri_id);
          setNamaIndustri(industri ? industri.nama : "-");
        } else {
          setNamaIndustri("-");
        }

        // Get data guru untuk konversi ID ke nama
        const allGuru = await getGuru();

        // Pembimbing
        if (dataPKL.pembimbing_guru_id) {
          const pembimbing = allGuru.find((g) => g.id === dataPKL.pembimbing_guru_id);
          setNamaPembimbing(pembimbing ? pembimbing.nama : "-");
        } else {
          setNamaPembimbing("-");
        }

        // Kaprog 
        if (dataPKL.processed_by) {
          const kaprog = allGuru.find((g) => g.id === dataPKL.processed_by);
          setNamaKaprog(kaprog ? kaprog.nama : "-");
        } else {
          setNamaKaprog("-");
        }

      } catch (error) {
        console.error("Gagal memuat data industri/guru", error);
      }
    };

    fetchData();
  }, [dataPKL]);

  
  if (loading) {
    return (
      <div className="w-[575px] bg-white rounded-2xl shadow-sm border border-[#6e0f0f] p-6 font-sans flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin w-8 h-8 text-[#6e0f0f] mb-2" />
          <p className="text-sm text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }
  
  if (!dataPKL) {
    return (
      <div className="p-10 bg-white border-[#6e0f0f] rounded-2xl border-2 text-center flex flex-col items-center w-[575px]">
        <img src={empty} className="w-40 opacity-80 mb-4" />

        <h2 className="text-xl font-semibold">Belum Ada Pengajuan PKL</h2>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          Anda belum melakukan pengajuan PKL sebelumnya.
        </p>

        <button
          onClick={() => navigate("/siswa/pengajuan_pkl")}
          className="px-5 py-2 !bg-[#EC933A] text-white rounded-lg hover:bg-[#530b0b] transition shadow-sm"
        >
          Tambah Pengajuan
        </button>
      </div>
    );
  }

  
  // FORMAT TANGGAL
  
  const formatTanggal = (t) => {
    if (!t) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(t));
  };

  const rawStatus = dataPKL.status?.toLowerCase();
  const status = rawStatus?.startsWith("pending") ? "pending" : rawStatus;

  // Fungsi untuk menentukan apakah status adalah pending
  const isPendingStatus = (status) => {
    const s = status?.toLowerCase();
    return s === "pending" || s?.includes("pending");
  };

  return (
    <div className="w-[575px] bg-white rounded-2xl shadow-sm border border-[#6e0f0f] p-6 font-sans">
      {/* STATUS BOX */}
      <div
        className={`rounded-xl p-5 border flex items-start gap-3 mb-6 
          ${
            status === "approved"
              ? "bg-green-100 border-green-300 text-green-900"
              : status === "rejected"
              ? "bg-red-100 border-red-300 text-red-900"
              : "bg-gray-100 border-gray-300 text-gray-800"
          }`}
      >
        <div className="flex-1">
          <h3 className="font-semibold text-lg">
            {status === "approved"
              ? "Pengajuan Diterima"
              : status === "rejected"
              ? "Pengajuan Ditolak"
              : "Pengajuan Diproses"}
          </h3>

          <p className="text-sm mt-1">
            {status === "approved"
              ? `Pengajuan Anda diterima pada ${formatTanggal(dataPKL.decided_at)}`
              : status === "rejected"
              ? `Pengajuan Anda ditolak pada ${formatTanggal(dataPKL.decided_at)}`
              : "Pengajuan anda sedang diproses."}
          </p>
        </div>

        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-white
          ${
            status === "approved"
              ? "bg-green-500"
              : status === "rejected"
              ? "bg-red-500"
              : "bg-gray-500"
          }`}
        >
         {status === "approved" ? (
            "✓"
          ) : status === "rejected" ? (
            "✕"
          ) : (
            <Clock3 size={18} />
          )}
        </div>
      </div>

      <h3 className="font-semibold text-lg mb-3">
        {isPindahPKL ? "Perpindahan PKL :" : "Pengajuan PKL :"}
      </h3>

      {/* VIEW KHUSUS PENDING */}
      {isPendingStatus(dataPKL.status) && (
        <div className="text-sm space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Building2 size={16} />
              <span>Industri :</span>
            </div>
            <span>{namaIndustri}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} />
              <span>Tanggal Permohonan :</span>
            </div>
            <span>{formatTanggal(dataPKL.tanggal_permohonan)}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <NotebookText size={16} />
              <span>Catatan :</span>
            </div>
            <span>{dataPKL.catatan || "-"}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CircleDot size={16} />
              <span>Status :</span>
            </div>
            <span>{statusLabel(dataPKL?.status) || "-"}</span>
          </div>

          <button
            type="button"
            onClick={() => setOpenDetail(true)}
            className="!bg-[#EC933A] text-white p-3 w-full rounded-md mt-4
                      flex items-center justify-center gap-1 transition-all duration-300 
                      hover:bg-[#b96927]"
          >
            Rincian
            <ArrowUpRight size={16} />
          </button>
        </div>
      )}

      {/* VIEW APPROVED / REJECTED */}
      {(status === "approved" || status === "rejected") && (
        <div className="text-sm space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Building2 size={16} />
              <span>Industri :</span>
            </div>
            <span>{namaIndustri}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CalendarRange size={16} />
              <span>Periode PKL :</span>
            </div>
            <span>
              {formatTanggal(dataPKL.tanggal_mulai)} -{" "}
              {formatTanggal(dataPKL.tanggal_selesai)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <UserCheck size={16} />
              <span>Nama Pembimbing :</span>
            </div>
            <span>{namaPembimbing}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <UserCog size={16} />
              <span>Diproses Oleh:</span>
            </div>
            <span>{namaKaprog}</span>
          </div>

          {/* BUTTON GROUP */}
          <div className="flex gap-3 mt-4">
            {/* DETAIL */}
            <button
              type="button"
              onClick={() => setOpenDetail(true)}
              className="flex-1 !bg-[#EC933A] text-white p-3 rounded-md
                        flex items-center justify-center gap-1
                        hover:!border hover:!border-[#EC933A] hover:!bg-transparent hover:!text-[#EC933A] transition"
            >
              Detail
              <ArrowUpRight size={16} />
            </button>

            {/* BUAT ULANG (HANYA REJECTED) */}
            {status === "rejected" && (
              <button
                type="button"
                onClick={() => navigate("/siswa/pengajuan_pkl")}
                className="!bg-transparent flex-1 !border border-[#EC933A] text-[#EC933A] p-3 rounded-md
                          flex items-center justify-center gap-1
                          hover:!bg-[#EC933A] hover:text-white transition"
              >
                Buat Ulang
                <ArrowUpRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {openDetail &&
        createPortal(
          <Detail
            size="half"
            title="Detail Pengajuan PKL"
            onClose={() => setOpenDetail(false)}
            initialData={{
              ...dataPKL,
              tanggal_permohonan: formatTanggal(dataPKL.tanggal_permohonan || dataPKL.created_at),
              tanggal_mulai: formatTanggal(dataPKL.tanggal_mulai),
              tanggal_selesai: formatTanggal(dataPKL.tanggal_selesai),
              nama_industri: namaIndustri,
              nama_pembimbing: namaPembimbing,
              status: statusLabel(dataPKL.status),
              nama_kaprog: namaKaprog,
              decided_at: formatTanggal(dataPKL.decided_at || dataPKL.updated_at),
            }}
            fields={[
              {
                name: "nama_industri",
                label: "Industri",
                icon: <Building2 size={16} />,
                full: true,
              },
              {
                name: "kaprog_note",
                label: "Catatan Kaprog",
                icon: <MessageSquareText size={16} />,
              },
              {
                name: "status",
                label: "Status",
                icon: <CircleDot size={16} />,
              },
              {
                name: "tanggal_permohonan",
                label: "Tanggal Permohonan",
                icon: <CalendarDays size={16} />,
              },
              {
                name: "tanggal_mulai",
                label: "Tanggal Mulai",
                icon: <CalendarRange size={16} />,
              },
              {
                name: "tanggal_selesai",
                label: "Tanggal Selesai",
                icon: <CalendarCheck size={16} />,
              },
              {
                name: "nama_pembimbing",
                label: "Pembimbing",
                icon: <UserCheck size={16} />,
              },
              {
                name: "nama_kaprog",
                label: "Diproses Oleh",
                icon: <UserCog size={16} />,
              },
              {
                name: "catatan",
                label: "Catatan",
                icon: <NotebookText size={16} />,
              },
            ]}
          />,
          document.body
        )
      }
    </div>
  );
}