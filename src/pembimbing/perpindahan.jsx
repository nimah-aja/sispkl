import React, { useState, useRef } from 'react';
import { FilePlus, CheckCircle, XCircle, User, Download, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

import { createPortal } from "react-dom";
import Detail from "./components/Detail";


import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";

const DataPengajuanPKL = () => {
  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const [active, setActive] = useState("perpindahanPKL");
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState("Status");
  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef(null);

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Pembimbing",
  };

  const getSubmissionIcon = (type) => {
    switch(type) {
      case "submit": return <FilePlus className="w-6 h-6 text-orange-500" />;
      case "approved": return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "rejected": return <XCircle className="w-6 h-6 text-red-600" />;
      default: return <FilePlus className="w-6 h-6 text-gray-400" />;
    }
  };

  const submissions = [
  {
    id: 1,
    type: "submit",
    name: "Mengajukan PKL",
    description: "Telah mengajukan tempat PKL di JV",
    time: "2026-01-04T10:00:00",
    industri: "JV Company",
    nama_siswa: "Mirza",
    nisn: "1234567890",
    kelas: "XI RPL 1",
    jurusan: "RPL",
    status: "Menunggu",
  },
  {
    id: 2,
    type: "approved",
    name: "Anda Menyetujui Pengajuan",
    description: "Persetujuan PKL di UBIG",
    time: "2026-01-04T09:00:00",
    industri: "UBIG",
    nama_siswa: "Azhar",
    nisn: "987654321",
    kelas: "XI RPL 2",
    jurusan: "RPL",
    status: "Disetujui",
  },
];


  const sortedSubmissions = submissions.sort((a,b) => new Date(b.time) - new Date(a.time));

  const filteredSubmissions = sortedSubmissions.filter(sub => {
    const lowerQuery = query.toLowerCase();
    const matchesQuery =
      sub.name.toLowerCase().includes(lowerQuery) ||
      sub.description.toLowerCase().includes(lowerQuery) ||
      dayjs(sub.time).format('YYYY-MM-DD HH:mm').toLowerCase().includes(lowerQuery);

    let matchesStatus = true;
    if (statusFilter === "Menunggu") matchesStatus = sub.type === "submit";
    if (statusFilter === "Disetujui") matchesStatus = sub.type === "approved";
    if (statusFilter === "Ditolak") matchesStatus = sub.type === "rejected";

    return matchesQuery && matchesStatus;
  });

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
    XLSX.writeFile(workbook, "DataPengajuanPKL.xlsx");
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

    doc.save("DataPengajuanPKL.pdf");
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
      <Header query={query} setQuery={setQuery} user={user} />
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 bg-[#641E21] rounded-none md:rounded-l-3xl shadow-inner">
          <div className="flex items-center mb-4 sm:mb-6 gap-1 w-full relative">
                              <h2 className="text-white font-bold text-base sm:text-lg">
                                Data Pengajuan Pindah PKL
                              </h2>
                  
                              <div className="relative" ref={exportRef}>
                                <button
                                  onClick={() => setOpenExport(!openExport)}
                                  className="flex items-center gap-2 px-3 py-2 text-white !bg-transparent hover:bg-white/10 rounded-full"
                                >
                                  <Download size={18} />
                                </button>
                  
                                {openExport && (
                                  <div className="absolute  left-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-md p-2 z-50">
                                    <button
                                      onClick={() => {
                                        handleExportExcel();
                                        setOpenExport(false);
                                      }}
                                      className="flex items-center gap-2 px-3 py-2 !bg-transparent hover:!bg-gray-100 text-sm w-full"
                                    >
                                      <FileSpreadsheet size={16} className="text-green-600" />
                                      Excel
                                    </button>
                  
                                    <button
                                      onClick={() => {
                                        handleExportPDF();
                                        setOpenExport(false);
                                      }}
                                      className="flex items-center gap-2 px-3 py-2 !bg-transparent hover:!bg-gray-100 text-sm w-full"
                                    >
                                      <FileText size={16} className="text-red-600" />
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

          <div className="mt-6 space-y-3" >
            {filteredSubmissions.map((sub, index) => (
              <div key={sub.id}>
                {renderDayLabel(sub, index) && (
                  <div className="text-white font-semibold mb-2">{renderDayLabel(sub, index)}</div>
                )}
                <div className="bg-white rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  setDetailData(sub);
                  setOpenDetail(true);
                }}>
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
              title="Detail Pengajuan Pindah PKL"
              size="half"
              onClose={() => {
                setOpenDetail(false);
                setDetailData(null);
              }}
              initialData={{
                nama_industri: detailData.industri || "-",
                nama_siswa: detailData.nama_siswa || "-",
                nisn: detailData.nisn || "-",
                kelas: detailData.kelas || "-",
                jurusan: detailData.jurusan || "-",
                status: detailData.status || "-",
                tanggal_permohonan: dayjs(detailData.time).format(
                  "DD MMM YYYY HH:mm"
                ),
              }}
              fields={[
                { name: "nama_industri", label: "Industri", full: true },
                { name: "nama_siswa", label: "Nama Siswa" },
                { name: "nisn", label: "NISN" },
                { name: "kelas", label: "Kelas" },
                { name: "jurusan", label: "Konsentrasi Keahlian" },
                { name: "status", label: "Status" },
                { name: "tanggal_permohonan", label: "Tanggal Pengajuan" },
              ]}
            />,
            document.body
          )}

      </div>
    </div>
  );
};

export default DataPengajuanPKL;
