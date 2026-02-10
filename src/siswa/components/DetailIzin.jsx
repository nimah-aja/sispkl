import React, { useEffect, useState } from "react";
import { Link } from "lucide-react";
import dayjs from "dayjs";
import { getIzinMe, deleteIzin } from "../../utils/services/siswa/izin";
import { getGuru } from "../../utils/services/admin/get_guru";
import Detail from "../components/Detail";
import "dayjs/locale/id";
dayjs.locale("id");
import { useNavigate } from "react-router-dom";
import DeleteConfirmationModal from "../components/Delete";
import toast from "react-hot-toast";
import deleteImg from "../../assets/deleteGrafik.svg";

export default function IzinCard() {
  const [izinHariIni, setIzinHariIni] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImage, setShowImage] = useState(false);
  const [namaGuru, setNamaGuru] = useState("-");
  const [showDetail, setShowDetail] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIzin = async () => {
      try {
        const res = await getIzinMe();
        const today = dayjs().format("YYYY-MM-DD");

        const izinToday = res?.find(
          (i) => dayjs(i.tanggal).format("YYYY-MM-DD") === today
        );

        setIzinHariIni(izinToday || null);

        if (izinToday?.pembimbing_guru_id) {
          const guruRes = await getGuru();
          const guru = guruRes?.find(
            (g) => g.id === izinToday.pembimbing_guru_id
          );
          setNamaGuru(guru?.nama || "-");
        }
      } catch (err) {
        console.log("izin error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIzin();
  }, []);

  if (loading) return null;

  if (!izinHariIni)
    return (
      <div className="bg-white border border-[#6e0f0f] rounded-xl p-6 text-center text-gray-500 col-span-full">
        Tidak ada pengajuan izin hari ini
      </div>
    );

  const isPending = izinHariIni.status === "Pending";

  const statusBg =
    izinHariIni.status === "Approved"
      ? "bg-green-100 border-green-400"
      : izinHariIni.status === "Rejected"
      ? "bg-red-100 border-red-400"
      : "bg-gray-100 border-gray-300";

  const statusLabel =
    izinHariIni.status === "Approved"
      ? "Diterima"
      : izinHariIni.status === "Rejected"
      ? "Ditolak"
      : "Diproses";

  return (
    <div className="border border-[#6e0f0f] rounded-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6 bg-white col-span-full">

      {/* LEFT */}
      <div
        className={`${statusBg} rounded-xl p-6 flex flex-col justify-between md:col-span-2 border`}
      >
        <div>
          <h2 className="font-semibold text-gray-800">
            Pengajuan Izin Siswa
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Status: {statusLabel}
          </p>
        </div>

        <div className="mt-6">
          <button
            onClick={() => setShowDetail(true)}
            className="w-full !bg-[#EC933A] hover:bg-orange-500 text-white py-3 rounded-lg"
          >
            Detail
          </button>
        </div>
      </div>

      {/* RIGHT */}
      <div className="md:col-span-2 space-y-3">
        <h3 className="font-semibold text-gray-800 mb-2">
          Pengajuan Izin:
        </h3>

        <div className="flex justify-between">
          <span className="text-gray-500">Pembimbing:</span>
          <span className="font-medium">{namaGuru}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Tanggal:</span>
          <span>{dayjs(izinHariIni.tanggal).format("D MMMM YYYY")}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Jenis:</span>
          <span className="text-red-600 font-semibold">
            {izinHariIni.jenis}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Keterangan:</span>
          <span>{izinHariIni.keterangan || "-"}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-500">Bukti Foto:</span>
          <button
            onClick={() => setShowImage(true)}
            className="flex items-center gap-2 !bg-[#1447E6] text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            <Link size={16} />
            Lihat Bukti
          </button>
        </div>

        {/* EDIT & DELETE */}
        {isPending && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <button
              onClick={() =>
                navigate("/siswa/ubah_perizinan_pkl", {
                  state: { izin: izinHariIni },
                })
              }
              className="w-full !bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
            >
              Edit
            </button>

            <button
              onClick={() => setShowDelete(true)}
              className="w-full !bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg"
            >
              Hapus
            </button>
          </div>
        )}
      </div>

      {/* MODAL FOTO */}
      {showImage && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowImage(false)}
        >
          <div
            className="bg-white p-4 rounded-xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={izinHariIni.bukti_foto_urls?.[0]}
              alt="Bukti Izin"
              className="w-full object-contain rounded-lg max-h-[70vh]"
            />
            <button
              onClick={() => setShowImage(false)}
              className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* DETAIL */}
      {showDetail && (
        <Detail
          title="Detail Pengajuan Izin"
          fields={[
            { name: "jenis", label: "Jenis Izin" },
            { name: "tanggal", label: "Tanggal" },
            { name: "keterangan", label: "Catatan Siswa" },
            { name: "status", label: "Status" },
            { name: "pembimbing", label: "Pembimbing" },
            { name: "bukti_foto_urls", label: "Bukti Foto" },
            { name: "alasan_tolak", label: "Alasan Menolak" },
          ]}
          initialData={{
            ...izinHariIni,
            pembimbing: namaGuru,
            status: statusLabel,
            tanggal: dayjs(izinHariIni.tanggal).format("D MMMM YYYY"),
            bukti_foto_urls: izinHariIni.bukti_foto_urls || [],
            alasan_tolak: izinHariIni.rejection_reason || "-",
          }}
          onClose={() => setShowDetail(false)}
        />
      )}

      {/* DELETE MODAL */}
      <DeleteConfirmationModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        imageSrc={deleteImg}
        onDelete={async () => {
          try {
            await deleteIzin(izinHariIni.id);
            toast.success("Pengajuan izin berhasil dihapus");
            setShowDelete(false);
            window.location.reload();
          } catch {
            toast.error("Gagal menghapus izin");
          }
        }}
      />
    </div>
  );
}
