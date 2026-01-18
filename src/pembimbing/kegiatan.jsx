import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Download, FileSpreadsheet, FileText, AlertTriangle, Building2, Users, User, Upload, ClipboardList } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import Detail from "./components/Detail"; 
import SearchBar from "./components/Search";
import toast from "react-hot-toast";

// Import services untuk tugas terbaru
import { getGuruTasks } from "../utils/services/pembimbing/guru"; 
import { getMyRealisasiKegiatan } from "../utils/services/pembimbing/realisasi";

const TugasTerbaruPage = () => {
  const navigate = useNavigate();
  const [openDetail, setOpenDetail] = useState(false);
  const [detailMode, setDetailMode] = useState("view");
  const [detailData, setDetailData] = useState(null);
  const [active, setActive] = useState("kegiatan");
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [openExport, setOpenExport] = useState(false);
  const [tugasData, setTugasData] = useState([]);
  const exportRef = useRef(null);
  const [popup, setPopup] = useState(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Pembimbing",
  };

  const fetchTugas = async () => {
    try {
      const tasksRes = await getGuruTasks();
      const realisasiRes = await getMyRealisasiKegiatan();

      const completedTasks = new Set(
        (realisasiRes || []).map(r => `${r.kegiatan_id}-${r.industri_id}`)
      );

      const filteredTasks = tasksRes.data.flatMap((industriGroup) =>
        industriGroup.tasks
          .filter(task => {
            const kegiatanId = task.kegiatan?.id;
            const industriId = industriGroup.industri?.id;
            const taskKey = `${kegiatanId}-${industriId}`;
            const isCompleted = completedTasks.has(taskKey);
            
            return !isCompleted;
          })
          .map((task) => ({
            id: task.kegiatan?.id,
            nama: task.kegiatan?.jenis || "Tidak ada nama",
            deskripsi: task.kegiatan?.deskripsi || "Tidak ada deskripsi",
            tanggal_mulai: task.kegiatan?.tanggal_mulai,
            tanggal_selesai: task.kegiatan?.tanggal_selesai,
            is_active: task.kegiatan?.is_active || false,
            industri_id: industriGroup.industri?.id,
            industri_nama: industriGroup.industri?.nama || "Tidak diketahui",
            alamat : industriGroup.industri?.alamat || "Tidak diketahui",
            jenis_industri : industriGroup.industri?.jenis_industri || "Tidak Diketahui",
            siswa: industriGroup.siswa || [],
            jumlahSiswa: industriGroup.siswa_count || 0,
            task_key: `${task.kegiatan?.id}-${industriGroup.industri?.id}`
          }))
      );

      setTugasData(filteredTasks);
    } catch (err) {
      console.error("Gagal ambil data tugas", err);
      toast.error("Gagal memuat data tugas");
    }
  };

  useEffect(() => {
    fetchTugas();
  }, []);

  // Fungsi untuk membuka popup di atas ikon siswa
  const openPopup = (type, payload, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupPos({
      top: rect.top + window.scrollY - 10, // Posisikan di atas ikon
      left: rect.left + window.scrollX,
    });
    setPopup({ type, data: payload });
  };

  // Fungsi untuk navigate ke upload
  const handleUploadClick = (item) => {
    console.log("Upload clicked:", item);
    
    navigate("/guru/pembimbing/uploadPengantaran", {
      state: { 
        tugas: item,
        id_kegiatan: item.id,
        id_industri: item.industri_id,
        industri_nama: item.industri_nama,
        nama_kegiatan: item.nama,
        deskripsi: item.deskripsi,
        tanggal_selesai: item.tanggal_selesai,
        siswa_list: item.siswa || []
      }
    });
  };

  // Filter data berdasarkan query dan status
  const filteredTugas = tugasData.filter(item => {
    const lowerQuery = query.toLowerCase();
    const matchesQuery =
      item.nama.toLowerCase().includes(lowerQuery) ||
      item.deskripsi.toLowerCase().includes(lowerQuery) ||
      item.industri_nama.toLowerCase().includes(lowerQuery);

    let matchesStatus = true;
    if (statusFilter === "Hari Ini") {
      const sisaHari = hitungSisaHari(item.tanggal_selesai);
      matchesStatus = sisaHari === 0;
    } else if (statusFilter === "Terlewatkan") {
      const sisaHari = hitungSisaHari(item.tanggal_selesai);
      matchesStatus = sisaHari < 0;
    }

    return matchesQuery && matchesStatus;
  });

  // Fungsi hitung sisa hari
  const hitungSisaHari = (tanggalSelesai) => {
    if (!tanggalSelesai) return null;
    const end = dayjs(tanggalSelesai);
    if (!end.isValid()) return null;
    return end.startOf("day").diff(dayjs().startOf("day"), "day");
  };

  // Fungsi export
  const exportData = filteredTugas.map((item, i) => ({
    No: i + 1,
    Tugas: item.nama,
    Deskripsi: item.deskripsi,
    Industri: item.industri_nama,
    Jumlah_Siswa: item.jumlahSiswa,
    Deadline: dayjs(item.tanggal_selesai).format('DD/MM/YYYY'),
    Status: item.is_active ? "Aktif" : "Tidak Aktif"
  }));

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TugasTerbaru");
    XLSX.writeFile(workbook, "DataTugasTerbaru.xlsx");
    setOpenExport(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Data Tugas Terbaru", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['No', 'Tugas', 'Deskripsi', 'Industri', 'Jumlah Siswa', 'Deadline', 'Status']],
      body: exportData.map(r => [r.No, r.Tugas, r.Deskripsi, r.Industri, r.Jumlah_Siswa, r.Deadline, r.Status]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [100, 30, 33] },
    });
    doc.save("DataTugasTerbaru.pdf");
    setOpenExport(false);
  };

  // Render label hari
  const renderDayLabel = (current, index) => {
    if (!current.tanggal_selesai) return null;
    const currentDate = dayjs(current.tanggal_selesai).format('YYYY-MM-DD');
    const prevDate = index > 0 ? dayjs(filteredTugas[index-1].tanggal_selesai).format('YYYY-MM-DD') : null;

    if (currentDate !== prevDate) {
      const today = dayjs().format('YYYY-MM-DD');
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

      if (currentDate === today) return "Hari Ini";
      if (currentDate === yesterday) return "Kemarin";
      return dayjs(current.tanggal_selesai).format('DD MMM YYYY');
    }
    return null;
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setOpenExport(false);
      }
    };

    if (openExport) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openExport]);

  const handleOpenDetail = (item) => {
    setDetailData({
      nama: item.nama,
      deskripsi: item.deskripsi || "-",
      tanggal_mulai: dayjs(item.tanggal_mulai).format("DD-MM-YYYY"),
      tanggal_selesai: dayjs(item.tanggal_selesai).format("DD-MM-YYYY"),
      is_active: item.is_active,

      industri_nama: item.industri_nama,
      jenis_industri : item.jenis_industri,
      alamat: item.alamat,
      jumlah_siswa: item.jumlahSiswa,

      // 🔥 INI YANG PENTING
      siswa: item.siswa?.length
        ? item.siswa.map(s => s.nama).join(", ")
        : "-",
    });

    setDetailMode("view");
    setOpenDetail(true);
  };



  const detailFields = [
    {
      name: "nama",
      label: "Nama Kegiatan",
      icon: <ClipboardList className="w-4 h-4" />,
      full: true,
    },
    {
      name: "deskripsi",
      label: "Deskripsi",
      full: true,
    },
    {
      name: "industri_nama",
      label: "Industri",
    },
    {
      name: "jenis_industri",
      label: "Jenis Industri",
    },
    {
      name: "alamat",
      label: "Alamat",
    },
    {
      name: "tanggal_mulai",
      label: "Tanggal Mulai",
    },
    {
      name: "tanggal_selesai",
      label: "Tanggal Selesai",
    },
    {
      name: "jumlah_siswa",
      label: "Jumlah Siswa",
    },
    {
      name: "siswa",
      label: "Nama Siswa",
      render: (value) => (
        <ul className="list-disc pl-4">
          {value.map((s, i) => (
            <li key={i}>{s.nama}</li>
          ))}
        </ul>
      )
    }

  ];



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
              Jadwal Kegiatan
            </h2>
            
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setOpenExport(!openExport)}
                className="flex items-center gap-2 px-3 py-2 text-white !bg-transparent hover:bg-white/10 rounded-full"
              >
                <Download size={18} />
              </button>

              {openExport && (
                <div className="absolute left-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-md p-2 z-50">
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-3 py-2 !bg-transparent hover:!bg-gray-100 text-sm w-full"
                  >
                    <FileSpreadsheet size={16} className="text-green-600" />
                    Excel
                  </button>

                  <button
                    onClick={handleExportPDF}
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
            placeholder="Cari tugas, industri, ..."
          />

          <div className="mt-6 space-y-3">
            {filteredTugas.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-white text-lg mb-2">Tidak ada tugas!</p>
                <p className="text-white/60 text-sm">Semua kegiatan sudah direalisasikan</p>
              </div>
            ) : (
              filteredTugas.map((item, index) => {
                const sisaHari = hitungSisaHari(item.tanggal_selesai);
                const isHariIni = sisaHari === 0;
                const isLewat = sisaHari < 0;
                // Tombol upload disabled jika: is_active false atau sudah lewat
                const canSubmit = item.is_active === true && !isLewat;
                
                return (
                  <div key={item.id || item.task_key || index}>
                    {renderDayLabel(item, index) && (
                      <div className="text-white font-semibold mb-2" onClick={() => handleOpenDetail(item)}>{renderDayLabel(item, index)}</div>
                    )}
                    
                    <div className="bg-white rounded-lg p-4 hover:shadow-md transition-all"  onClick={() => handleOpenDetail(item)}>
                      {/* Bagian atas dengan ikon, nama, dan waktu */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <ClipboardList className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-base">{item.nama}</h3>
                            <p className="text-sm text-gray-600 mt-0.5">{item.deskripsi}</p>
                          </div>
                        </div>
                        
                        {sisaHari !== null && (
                          <div className={`text-xs font-semibold flex items-center gap-1 whitespace-nowrap
                            ${
                              isHariIni
                                ? "text-red-600"
                                : isLewat
                                ? "text-gray-400"
                                : "text-red-500"
                            }
                          `}>
                            {isHariIni && <AlertTriangle className="w-4 h-4" />}
                            {isLewat
                              ? "terlewat"
                              : isHariIni
                              ? "hari ini"
                              : `sisa ${sisaHari} hari`}
                          </div>
                        )}
                      </div>

                      {/* Bagian bawah dengan tombol */}
                      <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
                        {/* KIRI */}
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Tombol Daftar Siswa dengan ikon lebih besar dan jelas */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openPopup("siswa", item.siswa, e);
                              }}
                              className="flex items-center gap-2 px-2 py-1 !bg-transparent hover:bg-gray-100 rounded-md group"
                              title="Lihat daftar siswa"
                            >
                              <div className="relative">
                                <Users className="w-4 h-4 text-gray-600 group-hover:text-[#641E21]" />
                              </div>
                              <span className="text-gray-600 group-hover:text-[#641E21]">
                                {item.jumlahSiswa || 0} siswa
                              </span>
                            </button>

                          </div>

                          <div className="flex items-center gap-1 min-w-0" title={item.industri_nama}>
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-[120px]">
                              {item.industri_nama}
                            </span>
                          </div>
                        </div>

                        {/* KANAN - Tombol Upload */}
                        <button
                          disabled={!canSubmit}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUploadClick(item);
                          }}
                          className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md whitespace-nowrap transition-colors
                            ${
                              canSubmit
                                ? "!bg-[#641E21] text-white hover:opacity-90"
                                : "!bg-gray-200 text-gray-400 cursor-not-allowed"
                            }
                          `}
                          title={!canSubmit ? `Tidak dapat mengunggah${!item.is_active ? ' (tidak aktif)' : isLewat ? ' (terlewat)' : ''}` : "Unggah bukti realisasi"}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {isLewat ? "Terlewat" : "Unggah"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* POPUP SISWA - DIPOSISIKAN DI ATAS IKON */}
      {popup && (
        <div
          className="fixed inset-0 z-[9999]"
          onClick={() => setPopup(null)}
        >
          <div
            className="absolute bg-white border border-gray-300 rounded-xl shadow-lg p-4 w-[320px] max-h-[400px]"
            style={{ 
              top: Math.max(10, popupPos.top - 320), // Pastikan tidak keluar dari atas layar
              left: Math.min(popupPos.left, window.innerWidth - 340)
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {popup.type === "siswa" && (
              <>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-300 ">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">Daftar Siswa</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {popup.data?.length || 0} siswa
                  </span>
                </div>
                
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar ">
                  {popup.data && popup.data.length > 0 ? (
                    popup.data.map((s, i) => (
                      <div
                        key={s.id || i}
                        className="p-3 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-bold">
                            {(s.nama || '?').charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-gray-800 truncate">
                              {s.nama || `Siswa ${i+1}`}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {s.kelas && <span>{s.kelas}</span>}
                              {s.nisn && <span>• NISN: {s.nisn}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      <p>Tidak ada data siswa</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <button
                    onClick={() => setPopup(null)}
                    className="w-full py-2 text-sm !bg-gray-100 hover:bg-gray-200  rounded-lg transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL DETAIL */}
      {openDetail &&
        detailData &&
        createPortal(
          <Detail
            title="Detail Kegiatan"
            mode={detailMode}
            onChangeMode={setDetailMode}
            initialData={detailData}
            fields={detailFields}
            size="half"
            onClose={() => {
              setOpenDetail(false);
              setDetailData(null);
            }}
          />,
          document.body
        )}
    </div>
  );
};

export default TugasTerbaruPage;