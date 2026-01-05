import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { getIndustri } from "../../utils/services/admin/get_industri";
import { getGuru } from "../../utils/services/admin/get_guru";
import empty from "../../assets/empty.jpg";
import { getPengajuanMe } from "../../utils/services/siswa/pengajuan_pkl";
import Detail from "./Detail"
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
  const [namaIndustri, setNamaIndustri] = useState("-");
  const [namaPembimbing, setNamaPembimbing] = useState("-");
  const [namaKaprog, setNamaKaprog] = useState("-");
  const navigate = useNavigate();
  const [dataPKL, setDataPKL] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);

  const statusLabel = (status) => {
    if (!status) return "-";

    switch (status.toLowerCase()) {
      case "pending":
        return "Tertunda";
      case "rejected":
        return "Ditolak";
      case "approved":
        return "Diterima";
      default:
        return "-";
    }
  };



  // ====================================
  // GET DATA PENGAJUAN
  // ====================================
  useEffect(() => {
    const fetchPKL = async () => {
      try {
        const data = await getPengajuanMe();
         console.log("DATA PKL:", data);
        setDataPKL(data.data[0] || null);
      } catch (err) {
        console.error("Gagal mengambil data PKL", err);
      }
    };

    fetchPKL();
  }, []);

  // ====================================
  // GET INDUSTRI DAN PEMBIMBING
  // ====================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const allIndustri = await getIndustri();
        const industri = allIndustri.find(
          (i) => i.id === dataPKL.industri_id
        );
        setNamaIndustri(industri ? industri.nama : "-");

        const allGuru = await getGuru();

        // 🔹 Pembimbing
        const pembimbing = allGuru.find(
          (g) => g.id === dataPKL.pembimbing_guru_id
        );
        setNamaPembimbing(pembimbing ? pembimbing.nama : "-");

        // 🔹 Kaprog (SAMA CARANYA)
        const kaprog = allGuru.find(
          (g) => g.id === dataPKL.processed_by
        );
        setNamaKaprog(kaprog ? kaprog.nama : "-");

      } catch (error) {
        console.error("Gagal memuat data industri/guru", error);
      }
    };


    if (dataPKL) fetchData();
  }, [dataPKL]);

  // ====================================
  // TIDAK ADA DATA
  // ====================================
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

  // ====================================
  // FORMAT TANGGAL
  // ====================================
  const formatTanggal = (t) => {
    if (!t) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(t));
  };

  const status = dataPKL.status?.toLowerCase();

  return (
    <div className="w-[575px] bg-white rounded-2xl shadow-sm border border-[#6e0f0f] p-6 font-sans">
      {/* ====================== */}
      {/* STATUS BOX */}
      {/* ====================== */}
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

      <h3 className="font-semibold text-lg mb-3">Pengajuan PKL :</h3>

      {/* ====================== */}
      {/* VIEW KHUSUS PENDING */}
      {/* ====================== */}
      {status === "pending" && (
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
            Detail
            <ArrowUpRight size={16} />
          </button>
        </div>

      )}

      {/* ====================== */}
      {/* VIEW APPROVED / REJECTED */}
      {/* ====================== */}
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

      {/* {openDetail && (
        <Detail
          size="half"
          title="Detail Pengajuan PKL"
          onClose={() => setOpenDetail(false)}
          initialData={{
            ...dataPKL,

            // ⬇️ FORMAT TANGGAL DI SINI
            tanggal_permohonan: formatTanggal(dataPKL.tanggal_permohonan),
            tanggal_mulai: formatTanggal(dataPKL.tanggal_mulai),
            tanggal_selesai: formatTanggal(dataPKL.tanggal_selesai),

            nama_industri: namaIndustri,
            nama_pembimbing: namaPembimbing,
            status: statusLabel(status),
            nama_kaprog: namaKaprog,
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
              label: "Kaprog",
              icon: <UserCog size={16} />,
            },
            {
              name: "catatan",
              label: "Catatan",
              icon: <NotebookText size={16} />,
            },
          ]}

        />
      )} */}

      {openDetail &&
  createPortal(
    <Detail
      size="half"
      title="Detail Pengajuan PKL"
      onClose={() => setOpenDetail(false)}
      initialData={{
        ...dataPKL,
        tanggal_permohonan: formatTanggal(dataPKL.tanggal_permohonan),
        tanggal_mulai: formatTanggal(dataPKL.tanggal_mulai),
        tanggal_selesai: formatTanggal(dataPKL.tanggal_selesai),
        nama_industri: namaIndustri,
        nama_pembimbing: namaPembimbing,
        status: statusLabel(status),
        nama_kaprog: namaKaprog,
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
