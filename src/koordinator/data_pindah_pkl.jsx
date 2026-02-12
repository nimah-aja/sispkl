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
  getPindahPklKoordinator,
  decidePindahPklKoordinator,
} from "../utils/services/koordinator/perpindahan";

const KoordinatorPindahPKL = () => {
  const [submissions, setSubmissions] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Status");
  const [openDetail, setOpenDetail] = useState(false);
  const [detailMode, setDetailMode] = useState("view"); // view | approve | reject
  const [detailData, setDetailData] = useState(null);
  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef(null);
  const [active, setActive] = useState("perpindahanPKL");

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Koordinator",
  };

  // =============================
  // FETCH DATA
  // =============================
  const fetchData = async () => {
    try {
      const res = await getPindahPklKoordinator();
      const items = res?.items || [];

      const mapped = items.map((item) => {
        let type = "submit";
        if (item.status === "approved") type = "approved";
        if (item.status === "rejected") type = "rejected";

        return {
          id: item.id,
          type,
          hasActions: item.status === "pending_koordinator",
          name: item.siswa_nama,
          description: `Pindah PKL dari ${item.industri_lama_nama} ke ${item.industri_baru_nama}`,
          time: item.created_at,
          raw: {
            ...item,
            catatan: item.catatan || "-",
            tanggal_efektif: item.tanggal_efektif || null,
          },
        };
      });

      setSubmissions(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data pindah PKL");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =============================
  // ICON
  // =============================
  const getIcon = (type) => {
    if (type === "submit") return <FilePlus className="text-orange-500" />;
    if (type === "approved") return <CheckCircle className="text-green-600" />;
    if (type === "rejected") return <XCircle className="text-red-600" />;
    return null;
  };

  // =============================
  // FILTER
  // =============================
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

  // =============================
  // DECISION
  // =============================
  const handleDecision = async (mode, payload) => {
    try {
      // Prepare data for API
      const requestData = {
        status: mode === "approve" ? "approved" : "rejected",
        catatan: payload.catatan?.trim() || "-",
      };

      // Add tanggal_efektif only for approval
      if (mode === "approve" && payload.tanggal_efektif) {
        requestData.tanggal_efektif = payload.tanggal_efektif;
      }

      await decidePindahPklKoordinator(detailData.id, requestData);

      toast.success("Pengajuan berhasil diproses");
      setOpenDetail(false);
      setDetailMode("view");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Gagal memproses pengajuan");
    }
  };

  // =============================
  // EXPORT
  // =============================
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
    "Tanggal Efektif": s.raw.tanggal_efektif 
      ? dayjs(s.raw.tanggal_efektif).format("DD/MM/YYYY")
      : "-",
  }));

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PindahPKL");
    XLSX.writeFile(wb, "PindahPKL_Koordinator.xlsx");
    setOpenExport(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Data Pindah PKL", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [["No", "Nama", "Deskripsi", "Waktu", "Status", "Tanggal Efektif"]],
      body: exportData.map((r) => Object.values(r)),
    });
    doc.save("PindahPKL_Koordinator.pdf");
    setOpenExport(false);
  };

  // =============================
  // RENDER
  // =============================
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar active={active} setActive={setActive} />

      <div className="flex flex-col flex-1">
        <Header query={query} setQuery={setQuery} user={user} />

        <main className="flex-1 p-6 bg-[#641E21] rounded-tl-3xl">
          <div className="flex justify-between mb-4">
            <h2 className="text-white font-bold">Pengajuan Pindah PKL</h2>

            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setOpenExport(!openExport)}
                className="flex items-center gap-2 px-3 py-2 text-white !bg-transparent hover:bg-white/10 rounded-full -ml-310 -mt-2"
              >
                <Download />
              </button>

              {openExport && (
                <div className="absolute left-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-md p-2 z-50 -ml-310">
                  <button onClick={exportExcel} className="flex items-center gap-2 px-3 py-2 !bg-transparent hover:!bg-gray-100 text-sm w-full">
                    <FileSpreadsheet size={16} className="text-green-600"/> Excel
                  </button>
                  <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-2 !bg-transparent hover:!bg-gray-100 text-sm w-full">
                    <FileText size={16} className="text-red-600" /> PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          <SearchBar
            query={query}
            setQuery={setQuery}
            // filters={[
            //   {
            //     label: "Status",
            //     value: statusFilter,
            //     options: ["Status", "Menunggu", "Disetujui", "Ditolak"],
            //     onChange: setStatusFilter,
            //   },
            // ]}
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
                      className="px-4 py-2 rounded-lg text-white !bg-[#EC933A]"
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
                      className="px-4 py-2 rounded-lg text-white !bg-[#BC2424]"
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
              siswa: detailData?.siswa_nama,
              industri_lama: detailData?.industri_lama_nama,
              industri_baru: detailData?.industri_baru_nama,
              status: detailData?.status,
              catatan: detailData?.catatan || "-",
              tanggal_efektif: detailData?.tanggal_efektif || dayjs().add(1, 'day').format('YYYY-MM-DD'),
            }}
            fields={
              detailMode === "view"
                ? [
                    { name: "siswa", label: "Nama Siswa" },
                    { name: "industri_lama", label: "Industri Lama" },
                    { name: "industri_baru", label: "Industri Baru" },
                    { name: "status", label: "Status" },
                    detailData?.tanggal_efektif && {
                      name: "tanggal_efektif",
                      label: "Tanggal Efektif",
                      type: "date",
                      full : true,
                      readOnly: true,
                      format: "DD/MM/YYYY",
                    },
                    {
                      name: "catatan",
                      label: "Catatan",
                      type: "textarea",
                      full: true,
                      readOnly: true,
                    },
                  ].filter(Boolean)
                : [
                    detailMode === "approve"
                      ? {
                          name: "tanggal_efektif",
                          label: "Tanggal Efektif Perpindahan",
                          type: "date",
                          required: true,
                          full : true,
                          min: dayjs().format('YYYY-MM-DD'),
                          helpText: "Tanggal mulai siswa pindah ke industri baru",
                        }
                      : null,
                    {
                      name: "catatan",
                      label:
                        detailMode === "approve"
                          ? "Catatan Persetujuan"
                          : "Alasan Penolakan",
                      type: "textarea",
                      full: true,
                      required: true,
                      helpText: detailMode === "approve" 
                        ? "Berikan catatan atau instruksi untuk siswa" 
                        : "Jelaskan alasan penolakan dengan jelas",
                    },
                  ].filter(Boolean)
            }
            customValidation={
              detailMode === "approve"
                ? (data) => {
                    if (!data.tanggal_efektif) {
                      return "Tanggal efektif wajib diisi";
                    }
                    if (dayjs(data.tanggal_efektif).isBefore(dayjs(), 'day')) {
                      return "Tanggal efektif tidak boleh di masa lalu";
                    }
                    return null;
                  }
                : null
            }
          />,
          document.body
        )}
    </div>
  );
};

export default KoordinatorPindahPKL;