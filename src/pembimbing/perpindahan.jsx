import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FilePlus,
  CheckCircle,
  XCircle,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import toast from "react-hot-toast";

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Detail from "./components/Detail";

import {
  getPindahPklPembimbing,
  decidePindahPklPembimbing,
} from "../utils/services/pembimbing/perpindahan";

const PembimbingPindahPKL = () => {
  const [submissions, setSubmissions] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Status");
  const [openDetail, setOpenDetail] = useState(false);
  const [detailMode, setDetailMode] = useState("view"); // view | approve | reject
  const [detailData, setDetailData] = useState(null);
  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef(null);

  const user = {
    name: localStorage.getItem("nama_guru") || "Pembimbing",
    role: "PEMBIMBING",
  };

  const fetchData = async () => {
    try {
      const res = await getPindahPklPembimbing();

      const mapped = res.map((item) => {
        let type = "submit";
        if (item.status === "approved") type = "approved";
        if (item.status === "rejected") type = "rejected";

        return {
          id: item.id,
          type,
          hasActions: type === "submit",
          name: item.nama_siswa,
          description: `Pindah PKL dari ${item.industri_lama?.nama} ke ${item.industri_baru?.nama}`,
          time: item.created_at,
          raw: item,
        };
      });

      setSubmissions(mapped);
    } catch (err) {
      toast.error("Gagal memuat data pindah PKL");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getIcon = (type) => {
    if (type === "submit") return <FilePlus className="text-orange-500" />;
    if (type === "approved") return <CheckCircle className="text-green-600" />;
    if (type === "rejected") return <XCircle className="text-red-600" />;
  };

  const filtered = submissions.filter((s) => {
    const q = query.toLowerCase();
    const matchQuery =
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q);

    let matchStatus = true;
    if (statusFilter === "Menunggu") matchStatus = s.type === "submit";
    if (statusFilter === "Disetujui") matchStatus = s.type === "approved";
    if (statusFilter === "Ditolak") matchStatus = s.type === "rejected";

    return matchQuery && matchStatus;
  });

  const handleDecision = async (mode, payload) => {
    try {
      await decidePindahPklPembimbing(detailData.id, {
        status: mode === "approve" ? "approved" : "rejected",
        catatan: payload.catatan || null,
      });

      toast.success("Pengajuan berhasil diproses");
      setOpenDetail(false);
      setDetailMode("view");
      fetchData();
    } catch {
      toast.error("Gagal memproses pengajuan");
    }
  };

  const exportData = filtered.map((s, i) => ({
    No: i + 1,
    Nama: s.name,
    Deskripsi: s.description,
    Waktu: dayjs(s.time).format("DD/MM/YYYY HH:mm"),
    Status:
      s.type === "submit"
        ? "Menunggu"
        : s.type === "approved"
        ? "Disetujui"
        : "Ditolak",
  }));

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PindahPKL");
    XLSX.writeFile(wb, "PindahPKL_Pembimbing.xlsx");
    setOpenExport(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Data Pindah PKL", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [["No", "Nama", "Deskripsi", "Waktu", "Status"]],
      body: exportData.map((r) => Object.values(r)),
    });
    doc.save("PindahPKL_Pembimbing.pdf");
    setOpenExport(false);
  };

  return (
    <div className="bg-white min-h-screen">
      <Header query={query} setQuery={setQuery} user={user} />
      <div className="flex">
        <Sidebar active="pindah_pkl" />
        <main className="flex-1 p-6 bg-[#641E21] rounded-l-3xl">
          <div className="flex justify-between mb-4">
            <h2 className="text-white font-bold">Pengajuan Pindah PKL</h2>

            <div ref={exportRef} className="relative">
              <button onClick={() => setOpenExport(!openExport)}>
                <Download className="text-white" />
              </button>
              {openExport && (
                <div className="absolute right-0 bg-white rounded shadow">
                  <button onClick={exportExcel} className="p-2 flex gap-2">
                    <FileSpreadsheet size={16} /> Excel
                  </button>
                  <button onClick={exportPDF} className="p-2 flex gap-2">
                    <FileText size={16} /> PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          <SearchBar
            query={query}
            setQuery={setQuery}
            filters={[
              {
                label: "Status",
                value: statusFilter,
                options: ["Status", "Menunggu", "Disetujui", "Ditolak"],
                onChange: setStatusFilter,
              },
            ]}
          />

          <div className="mt-6 space-y-3">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-lg p-4 cursor-pointer"
                onClick={() => {
                  setDetailData(s.raw);
                  setDetailMode("view");
                  setOpenDetail(true);
                }}
              >
                <div className="flex justify-between">
                  <div className="flex gap-3">
                    {getIcon(s.type)}
                    <div>
                      <p className="font-bold">{s.name}</p>
                      <p className="text-sm text-gray-600">{s.description}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {dayjs(s.time).format("HH:mm")}
                  </span>
                </div>

                {s.hasActions && (
                  <div className="flex gap-2 mt-3 ml-9">
                    <button
                      className="px-4 py-2 rounded-lg text-white bg-[#EC933A]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailData(s.raw);
                        setDetailMode("approve");
                        setOpenDetail(true);
                      }}
                    >
                      Terima
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-white bg-[#BC2424]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailData(s.raw);
                        setDetailMode("reject");
                        setOpenDetail(true);
                      }}
                    >
                      Tolak
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>

      {openDetail &&
        createPortal(
          <Detail
            mode={detailMode}
            onSubmit={handleDecision}
            onClose={() => setOpenDetail(false)}
            title="Detail Pindah PKL"
            size="half"
            initialData={{
              siswa: detailData?.nama_siswa,
              industri_lama: detailData?.industri_lama?.nama,
              industri_baru: detailData?.industri_baru?.nama,
              status: detailData?.status,
            }}
            fields={
              detailMode === "view"
                ? [
                    { name: "siswa", label: "Nama Siswa" },
                    { name: "industri_lama", label: "Industri Lama" },
                    { name: "industri_baru", label: "Industri Baru" },
                    { name: "status", label: "Status" },
                  ]
                : [
                    {
                      name: "catatan",
                      label:
                        detailMode === "approve"
                          ? "Catatan Persetujuan"
                          : "Alasan Penolakan",
                      type: "textarea",
                      full: true,
                    },
                  ]
            }
          />,
          document.body
        )}
    </div>
  );
};

export default PembimbingPindahPKL;
