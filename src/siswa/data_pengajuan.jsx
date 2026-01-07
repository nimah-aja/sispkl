import React, { useState, useRef, useEffect } from 'react';
import { FilePlus, CheckCircle, XCircle, User, Download, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";

import dayjs from "dayjs";
import { getPengajuanMe } from "../utils/services/siswa/pengajuan_pkl";
import { getIndustri } from "../utils/services/admin/get_industri";
import { getGuru } from "../utils/services/admin/get_guru";
import { createPortal } from "react-dom";
import Detail from "./components/Detail";


const RiwayatPengajuan = () => {
  const [submissions, setSubmissions] = useState([]);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [active, setActive] = useState("riwayat_pengajuan");
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState("Status");
  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef(null);

  const [user] = useState(
      JSON.parse(localStorage.getItem("user")) || { name: "Guest", role: "Siswa" }
    );

  useEffect(() => {
  const fetchRiwayat = async () => {
    try {
      const [pengajuanRes, industriRes, guruRes] = await Promise.all([
        getPengajuanMe(),
        getIndustri(),
        getGuru(),
      ]);

      // 🔁 bikin map
      const industriMap = {};
      industriRes.forEach(i => {
        industriMap[i.id] = i.nama;
      });

      const guruMap = {};
      guruRes.forEach(g => {
        guruMap[g.id] = g.nama;
      });

      const list = pengajuanRes.data || [];
      const riwayatList = [];

      list.forEach(item => {
        const namaIndustri =
          industriMap[item.industri_id] || "Industri tidak diketahui";

        // SUBMIT
        if (item.tanggal_permohonan) {
          riwayatList.push({
            id: `submit-${item.id}`,
            type: "submit",
            name: "Anda Mengajukan PKL",
            description: `Pengajuan PKL di ${namaIndustri}`,
            time: item.tanggal_permohonan,

            onClick: () => {
              setDetailData({
                ...item,
                namaIndustri,
                namaGuru: guruMap[item.processed_by] || "-",
              });
              setOpenDetail(true);
            },
          });
        }

        // APPROVED / REJECTED
        if (item.decided_at) {
          const namaGuru =
            guruMap[item.processed_by] || "Kaprog";

          riwayatList.push({
            id: `decide-${item.id}`,
            type: item.status === "Approved" ? "approved" : "rejected",
            name:
              item.status === "Approved"
                ? `${namaGuru} Menyetujui Pengajuan`
                : `${namaGuru} Menolak Pengajuan`,
            description: `Pengajuan PKL di ${namaIndustri}`,
            time: item.decided_at,

            onClick: () => {
              setDetailData({
                ...item,
                namaIndustri,
                namaGuru,
              });
              setOpenDetail(true);
            },
          });
        }
      });

      // urutkan terbaru
      riwayatList.sort(
        (a, b) => new Date(b.time) - new Date(a.time)
      );

      setSubmissions(riwayatList);
    } catch (err) {
      console.error("Gagal ambil riwayat pengajuan", err);
    }
  };

  fetchRiwayat();
}, []);


  const getSubmissionIcon = (type) => {
    switch(type) {
      case "submit": return <FilePlus className="w-6 h-6 text-orange-500" />;
      case "approved": return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "rejected": return <XCircle className="w-6 h-6 text-red-600" />;
      default: return <FilePlus className="w-6 h-6 text-gray-400" />;
    }
  };

  

  const sortedSubmissions = submissions.sort((a,b) => new Date(b.time) - new Date(a.time));

  const filteredSubmissions = submissions.filter(sub => {
    const lowerQuery = query.toLowerCase();

    const matchesQuery =
      sub.name.toLowerCase().includes(lowerQuery) ||
      sub.description.toLowerCase().includes(lowerQuery) ||
      dayjs(sub.time).format("YYYY-MM-DD HH:mm").includes(lowerQuery);

    let matchesStatus = true;
    if (statusFilter === "Menunggu") matchesStatus = sub.type === "submit";
    if (statusFilter === "Disetujui") matchesStatus = sub.type === "approved";
    if (statusFilter === "Ditolak") matchesStatus = sub.type === "rejected";

    return matchesQuery && matchesStatus;
  });

  const notifications = submissions.map((item) => ({
    type: item.type, // submit | approved | rejected
    title: item.name,
    description: item.description,
    time: item.time,
    onClick: item.onClick,
  }));

  const safeValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    return value;
  };




  const exportData = filteredSubmissions.map((sub, i) => ({
    No: i + 1,
    Nama: sub.name,
    Deskripsi: sub.description,
    Waktu: dayjs(sub.time).format('DD/MM/YYYY HH:mm'),
    Status: sub.type,
  }));

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PengajuanPKL");
    XLSX.writeFile(workbook, "RiwayatPengajuan.xlsx");
    setOpenExport(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Data Pengajuan PKL", 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [['No','Nama','Deskripsi','Waktu','Status']],
      body: exportData.map(r => [r.No,r.Nama,r.Deskripsi,r.Waktu,r.Status]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [100, 30, 33] },
    });

    doc.save("RiwayatPengajuan.pdf");
    setOpenExport(false);
  };

  // Penanda hari
  const renderDayLabel = (current, index) => {
    const currentDate = dayjs(current.time).format('YYYY-MM-DD');
    const prevDate = index > 0 ? dayjs(filteredSubmissions[index-1].time).format('YYYY-MM-DD') : null;

    if (currentDate !== prevDate) {
      const today = dayjs().format('YYYY-MM-DD');
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

      if (currentDate === today) return "Hari Ini";
      if (currentDate === yesterday) return "Kemarin";
      return dayjs(current.time).format('DD MMM YYYY');
    }
    return null;
  };

  return (
    <div className="bg-white min-h-screen w-full">
      <Header query={query} setQuery={setQuery} user={user}  notifications={notifications}/>
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 bg-[#641E21] rounded-none md:rounded-l-3xl shadow-inner">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-2xl font-bold">Riwayat Pengajuan PKL</h2>

            {/* EXPORT DROPDOWN */}
            <div className="relative  -left-262" ref={exportRef}>
              <button
                onClick={() => setOpenExport(!openExport)}
                className="flex items-center gap-2 px-4 py-2 !bg-transparent
                  text-white rounded-full font-semibold text-sm hover:bg-gray-100"
              >
                <Download size={20} />
              </button>

              {openExport && (
                <div className="absolute -right-24 top-4 mt-2 p-2 bg-white border border-gray-300 rounded-lg shadow-md z-50">
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-3 py-2 text-sm w-full hover:!bg-gray-100 !bg-transparent"
                  >
                    <FileSpreadsheet size={16} className="text-green-500" />
                    Excel
                  </button>

                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-3 py-2 text-sm w-full hover:!bg-gray-100 !bg-transparent"
                  >
                    <FileText size={16} className="text-red-500" />
                    PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          <SearchBar
            query={query}
            setQuery={setQuery}
            placeholder="Pencarian"
            filters={[{
              label: "Status",
              value: statusFilter,
              options: ["Menunggu","Disetujui","Ditolak"],
              onChange: val => setStatusFilter(val)
            }]}
          />

          <div className="mt-6 space-y-3">
            {filteredSubmissions.map((sub, index) => (
              <div key={sub.id}>
                {renderDayLabel(sub, index) && (
                  <div className="text-white font-semibold mb-2">{renderDayLabel(sub, index)}</div>
                )}
                <div className="bg-white rounded-lg p-4 hover:shadow-md transition-all"   onClick={sub.onClick}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-full">
                        {getSubmissionIcon(sub.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{sub.name}</h3>
                        <p className="text-sm text-gray-600 mt-0.5">{sub.description}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 flex-shrink-0">{dayjs(sub.time).format('HH:mm')}</span>
                  </div>

                  {sub.hasActions && (
                    <div className="flex gap-2 ml-14">
                      <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition" style={{backgroundColor:'#EC933A'}}>Terima</button>
                      <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition" style={{backgroundColor:'#BC2424'}}>Tolak</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </main>
        {openDetail && detailData &&
          createPortal(
            <Detail
              mode="view"
              title="Detail PKL"
              size="half"
              onClose={() => {
                setOpenDetail(false);
                setDetailData(null);
              }}
              initialData={{
                nama_industri: safeValue(detailData.namaIndustri),
                status: safeValue(detailData.status),
                tanggal_permohonan: safeValue(dayjs(
                  detailData.tanggal_permohonan || detailData.decided_at
                ).format("DD MMMM YYYY HH:mm")),
                tanggal_mulai: safeValue(detailData.tanggal_mulai),
                tanggal_selesai: safeValue(detailData.tanggal_selesai),
                pembimbing: safeValue(detailData.namaGuru),
              }}
              fields={[
                { name: "nama_industri", label: "Industri", full: true },
                { name: "status", label: "Status" },
                { name: "tanggal_permohonan", label: "Tanggal Pengajuan" },
                { name: "tanggal_mulai", label: "Tanggal Mulai PKL" },
                { name: "tanggal_selesai", label: "Tanggal Selesai PKL" },
                { name: "pembimbing", label: "Pembimbing " },
              ]}
            />,
            document.body
          )
        }

      </div>
    </div>
  );
};

export default RiwayatPengajuan;
