import React, { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Pagination from "./components/Pagination";
import Detail from "./components/Detail";

import { getIzinMe } from "../utils/services/siswa/izin";
import { getGuru } from "../utils/services/admin/get_guru";

export default function DataPerizinanSiswa() {
  const exportRef = useRef(null);

  const [active, setActive] = useState("riwayat_perizinan");
  const [openExport, setOpenExport] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dataPerizinan, setDataPerizinan] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);

  const itemsPerPage = 10;

  const user =
    JSON.parse(localStorage.getItem("user")) || { name: "Guest", role: "Siswa" };

  const mapStatus = (status) => {
    if (status === "Approved") return "Disetujui";
    if (status === "Rejected") return "Ditolak";
    return "Diproses";
  };

  const getStatusIcon = (status) => {
    if (status === "Disetujui")
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    if (status === "Ditolak")
      return <XCircle className="w-6 h-6 text-red-600" />;
    return <Clock className="w-6 h-6 text-orange-500" />;
  };

  useEffect(() => {
    const fetchIzin = async () => {
      const izinRes = await getIzinMe();
      const guruRes = await getGuru();

      const guruMap = {};
      guruRes.forEach((g) => (guruMap[g.id] = g.nama));

      const izin = izinRes?.data || izinRes || [];

      const mapped = izin.map((item) => ({
        id: item.id,
        title: `${item.jenis} - ${item.keterangan || "Tidak ada keterangan"}`,
        jenis: item.jenis,
        keterangan: item.keterangan || "-",
        tanggal: item.tanggal,
        time: item.created_at,

        // ✅ keputusan
        decided_at: item.decided_at,
        tanggal_putus: item.decided_at
          ? dayjs(item.decided_at).format("D MMMM YYYY")
          : "-",
        jam_putus: item.decided_at
          ? dayjs(item.decided_at).format("HH:mm")
          : "-",

        lampiran: item.bukti_foto_urls?.length ? "Ada" : "Tidak Ada",
        status: mapStatus(item.status),
        pembimbing: guruMap[item.pembimbing_guru_id] || "-",
        bukti: item.bukti_foto_urls || [],
        alasan_tolak: item.rejection_reason,
        raw: item,
      }));

      mapped.sort((a, b) => new Date(b.time) - new Date(a.time));
      setDataPerizinan(mapped);
    };

    fetchIzin();
  }, []);

  useEffect(() => setCurrentPage(1), [search, statusFilter]);

  const filteredData = dataPerizinan.filter((item) => {
    const q = search.toLowerCase();

    const matchSearch =
      item.title.toLowerCase().includes(q) ||
      item.lampiran.toLowerCase().includes(q);

    const matchStatus = statusFilter ? item.status === statusFilter : true;

    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportData = filteredData.map((i, idx) => ({
    No: idx + 1,
    Jenis: i.jenis,
    Keterangan: i.keterangan,
    Tanggal: dayjs(i.tanggal).format("D MMMM YYYY"),
    Status: i.status,
  }));

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Perizinan");
    XLSX.writeFile(wb, "izin.xlsx");
    setOpenExport(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [Object.keys(exportData[0])],
      body: exportData.map((d) => Object.values(d)),
    });
    doc.save("izin.pdf");
    setOpenExport(false);
  };

  const statusOptions = [...new Set(dataPerizinan.map((d) => d.status))];

  const renderDayLabel = (cur, idx) => {
    const d = dayjs(cur.time).format("YYYY-MM-DD");
    const p =
      idx > 0
        ? dayjs(filteredData[idx - 1].time).format("YYYY-MM-DD")
        : null;

    if (d !== p) {
      if (d === dayjs().format("YYYY-MM-DD")) return "Hari Ini";
      if (d === dayjs().subtract(1, "day").format("YYYY-MM-DD")) return "Kemarin";
      return dayjs(cur.time).format("D MMMM YYYY");
    }
    return null;
  };

  return (
    <div className="bg-white min-h-screen">
      <Header user={user} />

      <div className="flex">
        <Sidebar active={active} setActive={setActive} />

        <main className="flex-1 p-10 bg-[#641E21] rounded-l-3xl">
          <SearchBar
            query={search}
            setQuery={setSearch}
            placeholder="Cari izin..."
            filters={[
              {
                label: "Status",
                value: statusFilter,
                options: statusOptions,
                onChange: setStatusFilter,
              },
            ]}
          />

          <div className="mt-6 space-y-3">
            {paginatedData.map((item, idx) => (
              <div key={item.id}>
                {renderDayLabel(item, idx) && (
                  <div className="text-white font-semibold mb-2">
                    {renderDayLabel(item, idx)}
                  </div>
                )}

                <div
                  onClick={() => setSelectedItem(item)}
                  className="bg-white p-4 rounded-lg cursor-pointer"
                >
                  <div className="flex justify-between">
                    <div className="flex gap-4">
                      {getStatusIcon(item.status)}
                      <div>
                        <h3 className="font-bold">{item.title}</h3>
                        <p className="text-sm">
                          Lampiran : {item.lampiran}
                        </p>
                      </div>
                    </div>

                    <span>{dayjs(item.time).format("HH:mm")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </main>

        {selectedItem && (
          <Detail
            title="Detail Izin"
            onClose={() => setSelectedItem(null)}
            fields={[
              { name: "jenis", label: "Jenis" },
              { name: "tanggal", label: "Tanggal Pengajuan" },
              { name: "tanggal_putus", label: "Tanggal Diputuskan" },
              { name: "jam_putus", label: "Jam Diputuskan" },
              { name: "keterangan", label: "Keterangan" },
              { name: "status", label: "Status" },
              { name: "pembimbing", label: "Pembimbing" },
              { name: "bukti", label: "Bukti Foto" },
              { name: "alasan_tolak", label: "Alasan Menolak" },
            ]}
            initialData={{
              jenis: selectedItem.jenis,
              tanggal: dayjs(selectedItem.tanggal).format("D MMMM YYYY"),
              tanggal_putus: selectedItem.tanggal_putus,
              jam_putus: selectedItem.jam_putus,
              keterangan: selectedItem.keterangan,
              status: selectedItem.status,
              pembimbing: selectedItem.pembimbing,
              bukti: selectedItem.bukti,
              alasan_tolak: selectedItem.alasan_tolak,
            }}
          />
        )}
      </div>
    </div>
  );
}
