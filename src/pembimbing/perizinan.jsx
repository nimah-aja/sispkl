import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

import { CheckCircle, XCircle, Clock } from "lucide-react";

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Detail from "./components/Detail";
import toast from "react-hot-toast";

import { getIzinPembimbing, decideIzin } from "../utils/services/pembimbing/izin";
import { getSiswa } from "../utils/services/admin/get_siswa";
import { getKelas } from "../utils/services/admin/get_kelas";

export default function DataPerizinanSiswa() {
  const [active] = useState("perizinan");
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);

  const [filterJenis, setFilterJenis] = useState("");
  const [filterKelas, setFilterKelas] = useState("");

  const [openDetail, setOpenDetail] = useState(false);
  const [detailMode, setDetailMode] = useState("view");
  const [detailData, setDetailData] = useState(null);

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru",
    role: "Pembimbing",
  };

  const fetchData = async () => {
    const izin = await getIzinPembimbing();
    const siswa = await getSiswa();
    const kelas = await getKelas();

    const siswaMap = {};
    siswa.forEach((s) => (siswaMap[s.id] = s));

    const kelasMap = {};
    kelas.forEach((k) => (kelasMap[k.id] = k.nama));

    const mapped = izin.map((i) => {
      const s = siswaMap[i.siswa_id];
      const waktu = i.created_at || i.tanggal;
      const status = (i.status || "pending").toLowerCase();

      return {
        id: i.id,
        nama: s?.nama_lengkap || "-",
        kelas: kelasMap[s?.kelas_id] || "-",

        waktu,
        tanggal: dayjs(waktu).format("DD MMMM YYYY"),
        jam: dayjs(waktu).format("HH:mm"),

        // ✅ keputusan
        decided_at: i.decided_at,
        tanggal_putus: i.decided_at
          ? dayjs(i.decided_at).format("DD MMMM YYYY")
          : "-",
        jam_putus: i.decided_at
          ? dayjs(i.decided_at).format("HH:mm")
          : "-",

        alasan: i.jenis,
        keterangan: i.keterangan || "-",
        status,
        statusLabel:
          status === "approved"
            ? "Disetujui"
            : status === "rejected"
            ? "Ditolak"
            : "Proses",

        rejection_reason: i.rejection_reason || "",
        bukti: i.bukti_foto_urls || [],
        pembimbing: i.pembimbing_nama || "-",
      };
    });

    mapped.sort((a, b) => new Date(b.waktu) - new Date(a.waktu));
    setData(mapped);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitDetail = async (_, payload) => {
    try {
      await decideIzin(detailData.id, payload.status, payload.rejection_reason);
      toast.success("Berhasil memproses izin");
      setOpenDetail(false);
      fetchData();
    } catch {
      toast.error("Gagal memproses izin");
    }
  };

  const getStatusIcon = (s) =>
    s === "approved" ? (
      <CheckCircle className="text-green-600" />
    ) : s === "rejected" ? (
      <XCircle className="text-red-600" />
    ) : (
      <Clock className="text-orange-500" />
    );

  const jenisOptions = [...new Set(data.map((d) => d.alasan))];
  const kelasOptions = [...new Set(data.map((d) => d.kelas))];

  const filtered = data.filter((i) => {
    const s = search.toLowerCase();

    const matchSearch =
      (i.nama + i.kelas + i.alasan).toLowerCase().includes(s);

    const matchJenis = filterJenis ? i.alasan === filterJenis : true;
    const matchKelas = filterKelas ? i.kelas === filterKelas : true;

    return matchSearch && matchJenis && matchKelas;
  });

  const groupedByDate = filtered.reduce((acc, item) => {
    if (!acc[item.tanggal]) acc[item.tanggal] = [];
    acc[item.tanggal].push(item);
    return acc;
  }, {});

  const handleChangeMode = (newMode) => {
    setDetailData((prev) => ({
      ...prev,
      status: newMode === "approve" ? "approved" : "rejected",
    }));

    setDetailMode(newMode);
  };

  return (
    <div className="bg-white min-h-screen">
      <Header user={user} />

      <div className="flex">
        <Sidebar active={active} />

        <main className="flex-1 p-10 bg-[#641E21] rounded-l-3xl">
          <SearchBar
            query={search}
            setQuery={setSearch}
            filters={[
              {
                label: "Jenis",
                value: filterJenis,
                options: jenisOptions,
                onChange: setFilterJenis,
              },
              {
                label: "Kelas",
                value: filterKelas,
                options: kelasOptions,
                onChange: setFilterKelas,
              },
            ]}
          />

          {Object.entries(groupedByDate).map(([tanggal, items]) => (
            <div key={tanggal}>
              <h2 className="text-white font-semibold mb-3 mt-6">{tanggal}</h2>

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-lg cursor-pointer"
                    onClick={() => {
                      setDetailData(item);
                      setDetailMode("view");
                      setOpenDetail(true);
                    }}
                  >
                    <div className="flex justify-between">
                      <div className="flex gap-3">
                        {getStatusIcon(item.status)}

                        <div>
                          <h3 className="font-bold">
                            {item.nama} | {item.kelas}
                          </h3>

                          <p className="text-sm">
                            {item.alasan} • {item.statusLabel}
                          </p>
                        </div>
                      </div>

                      <span className="text-sm">{item.jam}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>

      {openDetail &&
        createPortal(
          <Detail
            mode={detailMode}
            onChangeMode={handleChangeMode}
            onSubmit={handleSubmitDetail}
            onClose={() => setOpenDetail(false)}
            title="Detail Izin"
            initialData={detailData}
            fields={[
              { name: "nama", label: "Nama" },
              { name: "kelas", label: "Kelas" },
              { name: "tanggal", label: "Tanggal Pengajuan" },
              { name: "jam", label: "Jam Pengajuan" },

              // ✅ keputusan
              { name: "tanggal_putus", label: "Tanggal Diputuskan" },
              { name: "jam_putus", label: "Jam Diputuskan" },

              { name: "alasan", label: "Jenis" },
              { name: "keterangan", label: "Keterangan" },
              { name: "statusLabel", label: "Status" },
              { name: "rejection_reason", label: "Alasan Ditolak" },
              { name: "bukti", label: "Bukti Foto" },
            ]}
          />,
          document.body
        )}
    </div>
  );
}
