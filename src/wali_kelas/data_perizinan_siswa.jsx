import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  CheckCircle,
  XCircle,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Detail from "./components/Detail";

import { getIzinWaliKelas } from "../utils/services/wakel/izin";
import { getSiswa } from "../utils/services/admin/get_siswa";
import { getKelas } from "../utils/services/admin/get_kelas";
import { getGuru } from "../utils/services/admin/get_guru";

export default function DataPerizinanSiswa() {
  const [active, setActive] = useState("perizinan");
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);

  const [filterJenis, setFilterJenis] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef(null);

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru",
    role: "Wali Kelas",
  };

  // ================= FETCH DATA =================
  const fetchData = async () => {
    const izin = await getIzinWaliKelas();
    const siswa = await getSiswa();
    const kelas = await getKelas();
    const guru = await getGuru();

    const siswaMap = {};
    siswa.forEach((s) => (siswaMap[s.id] = s));

    const kelasMap = {};
    kelas.forEach((k) => (kelasMap[k.id] = k.nama));

    const guruMap = {};
    guru.forEach((g) => (guruMap[g.id] = g.nama));

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

        rejection_reason: i.rejection_reason || "-",
        bukti: i.bukti_foto_urls || [],

        pembimbing: guruMap[i.pembimbing_guru_id] || "-",
      };
    });

    mapped.sort((a, b) => new Date(b.waktu) - new Date(a.waktu));
    setData(mapped);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= FILTER =================
  const jenisOptions = [...new Set(data.map((d) => d.alasan))];
  const kelasOptions = [...new Set(data.map((d) => d.kelas))];
  const statusOptions = [...new Set(data.map((d) => d.statusLabel))];

  const filtered = data.filter((i) => {
    const q = search.toLowerCase();
    return (
      (i.nama + i.kelas + i.alasan).toLowerCase().includes(q) &&
      (filterJenis ? i.alasan === filterJenis : true) &&
      (filterKelas ? i.kelas === filterKelas : true) &&
      (filterStatus ? i.statusLabel === filterStatus : true)
    );
  });

  // ================= EXPORT DATA =================
  const exportData = filtered.map((i, idx) => ({
    No: idx + 1,
    Nama: i.nama,
    Kelas: i.kelas,
    Tanggal: i.tanggal,
    Jam: i.jam,
    Jenis: i.alasan,
    Keterangan: i.keterangan,
    Status: i.statusLabel,
    Pembimbing: i.pembimbing,
    "Bukti Foto": i.bukti.length ? "Ada" : "Tidak ada",
  }));

  const exportExcel = () => {
    if (!exportData.length) return;
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Perizinan PKL");
    XLSX.writeFile(wb, "perizinan_pkl.xlsx");
  };

  const exportPDF = () => {
    if (!exportData.length) return;
    const doc = new jsPDF();
    doc.text("Data Perizinan PKL", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map((d) => Object.values(d)),
      styles: { fontSize: 9 },
    });
    doc.save("perizinan_pkl.pdf");
  };

  // ================= UTIL =================
  const getStatusIcon = (s) =>
    s === "approved" ? (
      <CheckCircle className="text-green-600" />
    ) : s === "rejected" ? (
      <XCircle className="text-red-600" />
    ) : (
      <Clock className="text-orange-500" />
    );

  const groupedByDate = filtered.reduce((acc, item) => {
    if (!acc[item.tanggal]) acc[item.tanggal] = [];
    acc[item.tanggal].push(item);
    return acc;
  }, {});

  // ================= RENDER =================
  return (
    <div className="bg-white min-h-screen">
      <Header user={user} />

      <div className="flex">
        <Sidebar active={active} setActive={setActive} />

        <main className="flex-1 p-10 bg-[#641E21] rounded-l-3xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white font-bold text-lg">
              Perizinan PKL (Wali Kelas)
            </h2>

            <div className="relative " ref={exportRef}>
              <button
                onClick={() => setOpenExport(!openExport)}
                className="flex items-center gap-2 px-3 py-2 text-white !bg-transparent hover:bg-white/10 rounded-full -ml-290"
              >
                <Download />
              </button>

              {openExport && (
                <div className="absolute  mt-2 bg-white rounded-lg shadow-md p-2 z-50 -ml-290">
                  <button
                    onClick={exportExcel}
                    className="!bg-transparent flex items-center gap-2 px-3 py-2 text-sm w-full hover:!bg-gray-100"
                  >
                    <FileSpreadsheet size={16} className="text-green-600"/> Excel
                  </button>
                  <button
                    onClick={exportPDF}
                    className="!bg-transparent flex items-center gap-2 px-3 py-2 text-sm w-full hover:!bg-gray-100"
                  >
                    <FileText size={16} className="text-red-600"/> PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          <SearchBar
            query={search}
            setQuery={setSearch}
            filters={[
              { label: "Status", value: filterStatus, options: statusOptions, onChange: setFilterStatus },
              { label: "Jenis", value: filterJenis, options: jenisOptions, onChange: setFilterJenis },
              { label: "Kelas", value: filterKelas, options: kelasOptions, onChange: setFilterKelas },
            ]}
          />

          {Object.entries(groupedByDate).map(([tanggal, items]) => (
            <div key={tanggal}>
              <h2 className="text-white font-semibold mb-3 mt-6">{tanggal}</h2>

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setDetailData(item);
                      setOpenDetail(true);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <h3 className="font-bold">
                            {item.nama} | {item.kelas}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {item.alasan} • {item.statusLabel}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{item.jam}</span>
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
            mode="view"
            onClose={() => setOpenDetail(false)}
            title="Detail Izin"
            initialData={detailData}
            fields={[
              { name: "nama", label: "Nama" },
              { name: "kelas", label: "Kelas" },
              { name: "tanggal", label: "Tanggal Pengajuan" },
              { name: "jam", label: "Jam Pengajuan" },
              { name: "tanggal_putus", label: "Tanggal Diputuskan" },
              { name: "jam_putus", label: "Jam Diputuskan" },
              { name: "alasan", label: "Jenis" },
              { name: "keterangan", label: "Keterangan" },
              { name: "statusLabel", label: "Status" },
              { name: "pembimbing", label: "Pembimbing" },
              { name: "rejection_reason", label: "Alasan Ditolak" },
              { name: "bukti", label: "Bukti Foto" },
            ]}
          />,
          document.body
        )}
    </div>
  );
}
