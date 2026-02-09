  import React, { useEffect, useState, useRef } from "react";
  import { createPortal } from "react-dom";
  import dayjs from "dayjs";
  import "dayjs/locale/id";
  dayjs.locale("id");

  import {
    CheckCircle,
    XCircle,
    Clock,
    Download,
    FileSpreadsheet,
    FileText,
  } from "lucide-react";

  import * as XLSX from "xlsx";
  import jsPDF from "jspdf";
  import autoTable from "jspdf-autotable";

  import Sidebar from "./components/SidebarBiasa";
  import Header from "./components/HeaderBiasa";
  import SearchBar from "./components/Search";
  import Detail from "./components/Detail";
  import toast from "react-hot-toast";

  import { getIzinPembimbing, decideIzin } from "../utils/services/pembimbing/izin";
  import { getSiswa } from "../utils/services/admin/get_siswa";
  import { getKelas } from "../utils/services/admin/get_kelas";

  export default function DataPerizinanSiswa() {
    const [active, setActive] = useState("perizinan");
    const [search, setSearch] = useState("");
    const [data, setData] = useState([]);
    const [filterStatus, setFilterStatus] = useState("");
    const [filterJenis, setFilterJenis] = useState("");
    const [filterKelas, setFilterKelas] = useState("");
    const [openDetail, setOpenDetail] = useState(false);
    const [detailMode, setDetailMode] = useState("view");
    const [detailData, setDetailData] = useState(null);
    const [openExport, setOpenExport] = useState(false);
    const exportRef = useRef(null);

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

    const handleChangeMode = (mode) => {
      setDetailMode(mode);
    };

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

    // ================= FILTER =================
    const statusOptions = ["approved", "rejected", "pending"];
    const jenisOptions = [...new Set(data.map((d) => d.alasan))];
    const kelasOptions = [...new Set(data.map((d) => d.kelas))];

    const filtered = data.filter((i) => {
      const s = search.toLowerCase();
      return (
        (i.nama + i.kelas + i.alasan).toLowerCase().includes(s) &&
        (filterStatus ? i.status === filterStatus : true) &&
        (filterJenis ? i.alasan === filterJenis : true) &&
        (filterKelas ? i.kelas === filterKelas : true)
      );
    });

    const groupedByDate = filtered.reduce((acc, item) => {
      if (!acc[item.tanggal]) acc[item.tanggal] = [];
      acc[item.tanggal].push(item);
      return acc;
    }, {});

    // ================= EXPORT =================
    const exportData = filtered.map((d, i) => ({
      No: i + 1,
      Nama: d.nama,
      Kelas: d.kelas,
      Jenis: d.alasan,
      Status: d.statusLabel,
      Tanggal: `${d.tanggal} ${d.jam}`,
    }));

    const handleExportExcel = () => {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "PerizinanPKL");
      XLSX.writeFile(wb, "Data_Perizinan_PKL.xlsx");
      setOpenExport(false);
    };

    const handleExportPDF = () => {
      const doc = new jsPDF();
      doc.text("Data Perizinan PKL", 14, 15);
      autoTable(doc, {
        startY: 20,
        head: [["No", "Nama", "Kelas", "Jenis", "Status", "Tanggal"]],
        body: exportData.map((d) => Object.values(d)),
      });
      doc.save("Data_Perizinan_PKL.pdf");
      setOpenExport(false);
    };

    return (
      <div className="bg-white min-h-screen">
        <Header user={user} />

        <div className="flex">
          <Sidebar active={active} setActive={setActive} />

          <main className="flex-1 p-10 bg-[#641E21] rounded-l-3xl">
            <div className="flex items-center mb-6 gap-2 relative">
              <h2 className="text-white font-bold text-lg">Perizinan PKL</h2>

              <div className="relative" ref={exportRef}>
                <button
                  onClick={() => setOpenExport(!openExport)}
                  className="flex items-center gap-2 px-3 py-2 text-white !bg-transparent hover:bg-white/10 rounded-full"
                >
                  <Download size={18} />
                </button>

                {openExport && (
                  <div className="absolute left-10 mt-2 bg-white rounded-lg shadow-md p-2 z-50">
                    <button
                      onClick={handleExportExcel}
                      className="!bg-transparent flex items-center gap-2 px-3 py-2 text-sm w-full hover:!bg-gray-100"
                    >
                      <FileSpreadsheet size={16} className="text-green-600" />
                      Excel
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="!bg-transparent flex items-center gap-2 px-3 py-2 text-sm w-full hover:!bg-gray-100"
                    >
                      <FileText size={16} className="text-red-600" />
                      PDF
                    </button>
                  </div>
                )}
              </div>
            </div>

            <SearchBar
              query={search}
              setQuery={setSearch}
              filters={[
                // { label: "Status", value: filterStatus, options: statusOptions, onChange: setFilterStatus },
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
                      className="bg-white p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setDetailData(item);
                        setDetailMode("view");
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
              mode={detailMode}
              onChangeMode={handleChangeMode}
              onSubmit={handleSubmitDetail}
              onClose={() => setOpenDetail(false)}
              title="Detail Izin"
              initialData={detailData}
              fields={
                detailMode === "view"
                  ? [
                      { name: "nama", label: "Nama" },
                      { name: "kelas", label: "Kelas" },
                      { name: "tanggal", label: "Tanggal" },
                      { name: "jam", label: "Jam" },
                      { name: "alasan", label: "Jenis" },
                      { name: "keterangan", label: "Keterangan" },
                      { name: "statusLabel", label: "Status" },
                      { name: "rejection_reason", label: "Alasan Ditolak" },
                      { name: "bukti", label: "Bukti Foto" },
                    ]
                  : [
                      {
                        name: "status",
                        label: "Keputusan",
                        type: "select",
                        options: [
                          { label: "Disetujui", value: "approved" },
                          { label: "Ditolak", value: "rejected" },
                        ],
                        required: true,
                        full: true,
                      },
                      {
                        name: "rejection_reason",
                        label: "Alasan",
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
  }