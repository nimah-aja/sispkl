import React, { useState, useEffect, useRef } from 'react';
import { Download, FileSpreadsheet, FileText, AlertTriangle, Building2, Users, User, Upload, ClipboardList, Printer, Save, X } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import logoSmk from "../assets/logo.png"

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

  // ==================== STATE UNTUK MODAL SURAT TUGAS ====================
  const [showSuratTugasModal, setShowSuratTugasModal] = useState(false);
  const [selectedTugas, setSelectedTugas] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // State untuk data surat tugas yang ditampilkan di preview
  const [dataSuratTugas, setDataSuratTugas] = useState({
    nomorSurat: "800/123/SMK.2/2024",
    keperluan: "Pengantaran Siswa Praktik Kerja Lapangan (PKL)",
    hariTanggal: "Senin, 1 Juli 2024",
    waktu: "08.00 - Selesai",
    tempat: "BACAMALANG.COM",
    alamat: "JL. MOROJANTEK NO. 87 B, PANGENTAN, KEC. SINGOSARI, KAB. MALANG",
    tanggalDibuat: "1 Juli 2024",
    namaKepsek: "SUMIAH, S.PD., M.SI.",
    nipKepsek: "19700210 199802 2009"
  });

  // State untuk guru yang ditugaskan - AWALNYA HANYA 1 BARIS
  const [guruPenugasan, setGuruPenugasan] = useState([
    { id: Date.now(), nama: "Inasni Dyah Rahmatika, S.Pd.", jabatan: "Guru", dinas: "SMK Negeri 2 Singosari" }
  ]);

  // State untuk form input - AWALNYA HANYA GURU 1
  const [formData, setFormData] = useState({
    nomorSurat: "800/123/SMK.2/2024",
    keperluan: "Pengantaran Siswa Praktik Kerja Lapangan (PKL)",
    hariTanggal: "Senin, 1 Juli 2024",
    waktu: "08.00 - Selesai",
    tempat: "BACAMALANG.COM",
    alamat: "JL. MOROJANTEK NO. 87 B, PANGENTAN, KEC. SINGOSARI, KAB. MALANG",
    tanggalDibuat: "1 Juli 2024",
    namaKepsek: "SUMIAH, S.PD., M.SI.",
    nipKepsek: "19700210 199802 2009",
    // Hanya guru1 untuk awal
    guru1: { nama: "Inasni Dyah Rahmatika, S.Pd.", jabatan: "Guru", dinas: "SMK Negeri 2 Singosari" }
  });


    const handleCetakBeritaAcara = (item) => {
      navigate("/guru/pembimbing/berita_acara", {
        state: {
          tugas: item,
          id_kegiatan: item.id,
          id_industri: item.industri_id,
          industri_nama: item.industri_nama,
          alamat: item.alamat,
          siswa: item.siswa || [],
        }
      });
    };

  // Fungsi untuk tambah baris guru
const handleTambahGuru = () => {
  const newId = Date.now() + Math.random(); // ID unik
  const guruCount = guruPenugasan.length + 1;
  
  // Tambah ke guruPenugasan
  setGuruPenugasan(prev => [
    ...prev,
    { id: newId, nama: "", jabatan: "", dinas: "SMK Negeri 2 Singosari" }
  ]);
  
  // Tambah ke formData
  setFormData(prev => ({
    ...prev,
    [`guru${guruCount}`]: { nama: "", jabatan: "", dinas: "SMK Negeri 2 Singosari" }
  }));
};

// Fungsi untuk hapus guru
const handleHapusGuru = (index) => {
  if (guruPenugasan.length <= 1) {
    toast.error("Minimal harus ada 1 guru yang ditugaskan");
    return;
  }
  
  // Hapus dari guruPenugasan
  const updatedGuru = guruPenugasan.filter((_, i) => i !== index);
  setGuruPenugasan(updatedGuru);
  
  // Update formData (reindex)
  const updatedFormData = { ...formData };
  
  // Hapus guru yang dihapus
  delete updatedFormData[`guru${index + 1}`];
  
  // Reindex yang tersisa
  updatedGuru.forEach((guru, i) => {
    updatedFormData[`guru${i + 1}`] = guru;
  });
  
  setFormData(updatedFormData);
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

  // ==================== FUNGSI UNTUK MODAL SURAT TUGAS ====================
// Handle perubahan input form umum
const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

// Handle perubahan input guru
const handleGuruInputChange = (index, field, value) => {
  setFormData(prev => {
    const guruKey = `guru${index + 1}`;
    return {
      ...prev,
      [guruKey]: {
        ...prev[guruKey],
        [field]: value
      }
    };
  });
};

const handleSaveSuratTugas = () => {
  // Update dataSuratTugas untuk preview
  setDataSuratTugas({
    nomorSurat: formData.nomorSurat,
    keperluan: formData.keperluan,
    hariTanggal: formData.hariTanggal,
    waktu: formData.waktu,
    tempat: formData.tempat,
    alamat: formData.alamat,
    tanggalDibuat: formData.tanggalDibuat,
    namaKepsek: formData.namaKepsek,
    nipKepsek: formData.nipKepsek
  });

  // Update guruPenugasan untuk preview
  const updatedGuru = [];
  for (let i = 1; i <= guruPenugasan.length; i++) {
    if (formData[`guru${i}`]) {
      updatedGuru.push({
        id: guruPenugasan[i-1]?.id || Date.now() + i,
        ...formData[`guru${i}`]
      });
    }
  }
  
  setGuruPenugasan(updatedGuru);

  toast.success("Data berhasil disimpan!");
};

// Fungsi untuk buka modal surat tugas
const handleOpenSuratTugasModal = (item) => {
  setSelectedTugas(item);
  
  // Update form data dengan info dari tugas
  const keperluanBaru = `Pengantaran Siswa untuk Praktik Kerja Lapangan di ${item.industri_nama}`;
  
  setFormData(prev => ({
    ...prev,
    keperluan: keperluanBaru,
    tempat: item.industri_nama,
    alamat: item.alamat
  }));

  setShowSuratTugasModal(true);
};

// Fungsi untuk generate dan print PDF
// Fungsi untuk generate dan print PDF
const handlePrintPDF = () => {
  setGeneratingPDF(true);

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set font
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const marginLeft = 20;
    const marginRight = 20;
    const pageWidth = 210;
    let yPosition = 20;

    // ===== KOP SURAT =====
    // Logo (jika ada)
    if (logoSmk) {
      try {
        doc.addImage(logoSmk, 'PNG', marginLeft, yPosition, 20, 20);
      } catch (err) {
        console.warn("Gagal menambahkan logo:", err);
      }
    }

    // Header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("PEMERINTAH PROVINSI JAWA TIMUR", pageWidth / 2, yPosition + 8, { align: 'center' });
    doc.text("DINAS PENDIDIKAN", pageWidth / 2, yPosition + 14, { align: 'center' });
    doc.text("SMK NEGERI 2 SINGOSARI", pageWidth / 2, yPosition + 20, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Jalan Perusahaan No. 20, Tunjungtirto, Singosari, Malang, Jawa Timur, 65153",
             pageWidth / 2, yPosition + 28, { align: 'center' });
    doc.text("Telepon (0341) 4345127", pageWidth / 2, yPosition + 33, { align: 'center' });

    // Garis pemisah
    yPosition = yPosition + 40;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, yPosition + 1, pageWidth - marginRight, yPosition + 1);

    // Spasi
    yPosition += 10;

    // ===== JUDUL SURAT TUGAS =====
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("SURAT TUGAS", pageWidth / 2, yPosition, { align: 'center' });

    // Tambahkan garis underline
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    const titleWidth = doc.getStringUnitWidth("SURAT TUGAS") * 14 / doc.internal.scaleFactor;
    const titleX = pageWidth / 2 - (titleWidth / 2);
    doc.line(titleX, yPosition + 2, titleX + titleWidth, yPosition + 2);

    // Nomor Surat
    yPosition += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Nomor : ${dataSuratTugas.nomorSurat}`, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 15;

    // ===== ISI SURAT =====
    doc.setFontSize(11);
    doc.text("Kepala SMK Negeri 2 Singosari Dinas Pendidikan Kabupaten Malang", marginLeft, yPosition);
    yPosition += 6;
    doc.text("menugaskan kepada :", marginLeft, yPosition);

    yPosition += 10;

    // Tabel Guru yang Ditugaskan
    const tableHeaders = [['NO', 'NAMA', 'JABATAN', 'DINAS']];
    const tableBody = guruPenugasan.map((guru, index) => [
      `${index + 1}`,
      guru.nama || "-",
      guru.jabatan || "-",
      guru.dinas || "-"
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: tableHeaders,
      body: tableBody,
      margin: { left: marginLeft, right: marginRight },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        minCellHeight: 8,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 60 },
        2: { cellWidth: 40 },
        3: { cellWidth: 'auto' }
      },
      theme: 'grid',
    });

    let finalY = doc.lastAutoTable?.finalY || yPosition + 50;
    yPosition = finalY + 10;

    // ===== DATA PELAKSANAAN =====
    doc.setFontSize(11);

    // Keperluan
    doc.text("Keperluan", marginLeft, yPosition);
    doc.text(":", marginLeft + 25, yPosition);
    doc.text(dataSuratTugas.keperluan, marginLeft + 30, yPosition);
    yPosition += 7;

    // Hari/Tanggal
    doc.text("Hari / Tanggal", marginLeft, yPosition);
    doc.text(":", marginLeft + 25, yPosition);
    doc.text(dataSuratTugas.hariTanggal, marginLeft + 30, yPosition);
    yPosition += 7;

    // Waktu
    doc.text("Waktu", marginLeft, yPosition);
    doc.text(":", marginLeft + 25, yPosition);
    doc.text(dataSuratTugas.waktu, marginLeft + 30, yPosition);
    yPosition += 7;

    // Tempat
    doc.text("Tempat", marginLeft, yPosition);
    doc.text(":", marginLeft + 25, yPosition);
    doc.text(dataSuratTugas.tempat, marginLeft + 30, yPosition);
    yPosition += 7;

    // Alamat
    doc.text("Alamat", marginLeft, yPosition);
    doc.text(":", marginLeft + 25, yPosition);
    
    const maxAlamatWidth = pageWidth - marginLeft - marginRight - 30;
    const alamatLines = doc.splitTextToSize(dataSuratTugas.alamat, maxAlamatWidth);
    doc.text(alamatLines, marginLeft + 30, yPosition);
    yPosition += (alamatLines.length * 5);

    yPosition += 15;

    // ===== PENUTUP SURAT =====
    doc.text("Demikian surat tugas ini dibuat untuk dilaksanakan dengan sebaik-baiknya", marginLeft, yPosition);
    yPosition += 6;
    doc.text("dan melaporkan hasilnya kepada kepala sekolah.", marginLeft, yPosition);

    yPosition += 20;

    // ===== TANDA TANGAN =====
    doc.text(`Singosari, ${dataSuratTugas.tanggalDibuat}`, pageWidth - marginRight, yPosition, { align: 'right' });
    yPosition += 20;
    doc.text("Kepala SMK Negeri 2 Singosari", pageWidth - marginRight, yPosition, { align: 'right' });

    yPosition += 25;
    doc.setFont("helvetica", "bold");
    doc.text(dataSuratTugas.namaKepsek, pageWidth - marginRight, yPosition, { align: 'right' });

    yPosition += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`NIP. ${dataSuratTugas.nipKepsek}`, pageWidth - marginRight, yPosition, { align: 'right' });

    // ===== AUTO PRINT =====
    doc.autoPrint({ variant: 'non-conform' });

    // Buka PDF di tab baru dan langsung print
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl, '_blank');

    setTimeout(() => {
      if (printWindow) {
        printWindow.focus();
        printWindow.print();
      }
    }, 500);

  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    toast.error("Gagal membuat PDF. Silakan coba lagi.");
  } finally {
    setGeneratingPDF(false);
  }
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

  const handlePrintSurat = (item) => {
  navigate("/guru/pembimbing/surat-tugas/add", {
    state: {
      tugas: item
    }
  });
};


  return (
   <div className="bg-white min-h-screen w-full">
         <Header user={user} />
   
         <div className="flex flex-col md:flex-row">
           <div className="md:block hidden">
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
                        {/* KANAN - Tombol Upload & Print */}
                        <div className="flex items-center gap-2">
                          <button 
                            disabled={!canSubmit}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUploadClick(item);
                            }}
                            className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md
                              ${
                                canSubmit
                                  ? "!bg-[#641E21] text-white"
                                  : "!bg-gray-200 text-gray-400 cursor-not-allowed"
                              }`}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Unggah
                          </button>

                          {/* BUTTON PRINT - Buka Modal */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCetakBeritaAcara(item);
                          }}
                          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md
                            !bg-[#EC933A] text-white hover:opacity-90"
                        >

                          <FileText className="w-3.5 h-3.5" />
                          Cetak
                        </button>
                        </div>

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

      {/* ==================== MODAL SURAT TUGAS ==================== */}
{showSuratTugasModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Overlay */}
    <div
      className="absolute inset-0 bg-black/50"
      onClick={() => setShowSuratTugasModal(false)}
    />

    {/* Modal Content */}
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden animate-scale-in">
      {/* Modal Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Surat Tugas</h2>
          <p className="text-sm text-gray-600 mt-1">
            Untuk: {selectedTugas?.industri_nama || "Industri"}
          </p>
        </div>
        <button
          onClick={() => setShowSuratTugasModal(false)}
          className="!bg-transparent text-gray-500 hover:text-gray-700 text-2xl"
        >
          <X size={24} />
        </button>
      </div>

      {/* Modal Body - Split Layout */}
      <div className="flex h-[calc(90vh-80px)]">
        {/* KOLOM KIRI: PREVIEW SURAT */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto p-6">
          <div className="sticky -top-7 bg-white pb-4 z-10">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Preview Surat Tugas</h3>
            <p className="text-sm text-gray-600">Preview akan otomatis update saat Anda menyimpan perubahan</p>
          </div>

          <div className="bg-white p-6 border border-gray-200 rounded-lg mt-4">

             <div className="mr-6 -ml-3">
                                <img 
                                  src={logoSmk} 
                                  alt="Logo SMK Negeri 2 Singosari" 
                                  className="w-20 h-20 object-contain"
                                />
                              </div>
            {/* KOP SURAT */}
            <div className="text-center mb-6 -mt-22">
              <p className="font-bold text-lg">PEMERINTAH PROVINSI JAWA TIMUR</p>
              <p className="font-bold text-lg">DINAS PENDIDIKAN</p>
              <p className="font-bold text-lg">SMK NEGERI 2 SINGOSARI</p>
              <p className="text-sm mt-2">
                Jalan Perusahaan No. 20, Tunjungtirto, Singosari, Malang, Jawa Timur, 65153<br />
                Telepon (0341) 4345127
              </p>
            </div>

            <div className="border border-black my-4 -mt-2"></div>
            <div className="border border-black my-4 -mt-3.5"></div>

            {/* JUDUL */}
            <div className="text-center mb-8">
              <p className="font-bold text-xl underline">SURAT TUGAS</p>
              <p className="text-sm">Nomor : {dataSuratTugas.nomorSurat}</p>
            </div>

            {/* PENUGASAN */}
            <div className="mb-6">
              <p>Kepala SMK Negeri 2 Singosari Dinas Pendidikan Kabupaten Malang</p>
              <p>menugaskan kepada :</p>
            </div>

            {/* TABEL GURU */}
            {/* TABEL GURU */}
            <table className="w-full border-collapse border border-black mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 text-center">NO</th>
                  <th className="border border-black p-2 text-center">NAMA</th>
                  <th className="border border-black p-2 text-center">JABATAN</th>
                  <th className="border border-black p-2 text-center">DINAS</th>
                </tr>
              </thead>
              <tbody>
                {guruPenugasan.map((guru, index) => (
                  <tr key={guru.id || index}>
                    <td className="border border-black p-2 text-center">{index + 1}</td>
                    <td className="border border-black p-2">{guru.nama || "-"}</td>
                    <td className="border border-black p-2">{guru.jabatan || "-"}</td>
                    <td className="border border-black p-2">{guru.dinas || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* DETAIL PELAKSANAAN */}
            <div className="space-y-2 mb-8">
              <p><span className="font-semibold">Keperluan</span> : {dataSuratTugas.keperluan}</p>
              <p><span className="font-semibold">Hari / Tanggal</span> : {dataSuratTugas.hariTanggal}</p>
              <p><span className="font-semibold">Waktu</span> : {dataSuratTugas.waktu}</p>
              <p><span className="font-semibold">Tempat</span> : {dataSuratTugas.tempat}</p>
              <p><span className="font-semibold">Alamat</span> : {dataSuratTugas.alamat}</p>
            </div>

            {/* PENUTUP */}
            <div className="mb-8">
              <p>Demikian surat tugas ini dibuat untuk dilaksanakan dengan sebaik-baiknya</p>
              <p>dan melaporkan hasilnya kepada kepala sekolah.</p>
            </div>

            {/* TANDA TANGAN */}
            <div className="text-right mt-12">
              <p>Singosari, {dataSuratTugas.tanggalDibuat}</p>
              <p className="mt-8">Kepala SMK Negeri 2 Singosari</p>
              <p className="mt-16 font-bold">{dataSuratTugas.namaKepsek}</p>
              <p className="text-sm">NIP. {dataSuratTugas.nipKepsek}</p>
            </div>
          </div>

          {/* TOMBOL CETAK */}
          <div className="mt-6">
            <button
              onClick={handlePrintPDF}
              disabled={generatingPDF}
              className="w-full !bg-green-600 text-white px-6 py-3 rounded-lg !text-md font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Printer size={20} />
              {generatingPDF ? "Memproses..." : "Cetak Surat Tugas"}
            </button>
          </div>
        </div>

        {/* KOLOM KANAN: FORM EDIT */}
        <div className="w-1/2 overflow-y-auto p-6">
          <div className="sticky -top-7 bg-white pb-4 z-10">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Form Edit Data</h3>
            <p className="text-sm text-gray-600">Edit data di sini, lalu klik "Simpan Perubahan" untuk update preview</p>
          </div>

          <div className="space-y-6 pt-4">
            {/* DATA UMUM */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Data Surat</h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Surat *
                  </label>
                  <input
                    type="text"
                    name="nomorSurat"
                    value={formData.nomorSurat}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Contoh: 800/123/SMK.2/2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keperluan *
                  </label>
                  <textarea
                    name="keperluan"
                    value={formData.keperluan}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                    placeholder="Contoh: Pengantaran Siswa Praktik Kerja Lapangan (PKL)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hari / Tanggal *
                    </label>
                    <input
                      type="text"
                      name="hariTanggal"
                      value={formData.hariTanggal}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Contoh: Senin, 1 Juli 2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Waktu *
                    </label>
                    <input
                      type="text"
                      name="waktu"
                      value={formData.waktu}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Contoh: 08.00 - Selesai"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempat *
                  </label>
                  <input
                    type="text"
                    name="tempat"
                    value={formData.tempat}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Contoh: BACAMALANG.COM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat *
                  </label>
                  <textarea
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                    placeholder="Contoh: JL. MOROJANTEK NO. 87 B, PANGENTAN, KEC. SINGOSARI, KAB. MALANG"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Dibuat Surat *
                  </label>
                  <input
                    type="text"
                    name="tanggalDibuat"
                    value={formData.tanggalDibuat}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Contoh: 1 Juli 2024"
                  />
                </div>
              </div>
            </div>

            {/* DATA GURU */}
            {/* DATA GURU */}
<div className="bg-gray-50 p-4 rounded-lg">
  <div className="flex justify-between items-center mb-3">
    <h4 className="font-semibold text-gray-700">Data Guru yang Ditugaskan</h4>
    <button
      type="button"
      onClick={handleTambahGuru}
      className="!bg-green-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-green-700 transition flex items-center gap-1"
    >
      <span className="text-lg">+</span>
      Tambah Guru
    </button>
  </div>

  {guruPenugasan.map((guru, index) => (
    <div key={index} className="mb-4 p-3 bg-white rounded border border-gray-200 relative">
      <div className="flex justify-between items-center mb-2">
        <h5 className="font-medium text-gray-600">Guru {index + 1}</h5>
        {guruPenugasan.length > 1 && (
          <button
            type="button"
            onClick={() => handleHapusGuru(index)}
            className="!bg-transparent text-red-600 hover:text-red-800 text-sm"
          >
            Hapus
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Nama *</label>
          <input
            type="text"
            value={formData[`guru${index + 1}`]?.nama || ""}
            onChange={(e) => handleGuruInputChange(index, 'nama', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Contoh: Inasni Dyah Rahmatika, S.Pd."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Jabatan *</label>
            <input
              type="text"
              value={formData[`guru${index + 1}`]?.jabatan || ""}
              onChange={(e) => handleGuruInputChange(index, 'jabatan', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Contoh: Guru"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Dinas *</label>
            <input
              type="text"
              value={formData[`guru${index + 1}`]?.dinas || ""}
              onChange={(e) => handleGuruInputChange(index, 'dinas', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Contoh: SMK Negeri 2 Singosari"
            />
          </div>
        </div>
      </div>
    </div>
  ))}
</div>

            {/* DATA KEPALA SEKOLAH */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Data Kepala Sekolah</h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Kepala Sekolah *
                  </label>
                  <input
                    type="text"
                    name="namaKepsek"
                    value={formData.namaKepsek}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Contoh: SUMIAH, S.PD., M.SI."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIP Kepala Sekolah *
                  </label>
                  <input
                    type="text"
                    name="nipKepsek"
                    value={formData.nipKepsek}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Contoh: 19700210 199802 2009"
                  />
                </div>
              </div>
            </div>

            {/* TOMBOL SIMPAN */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSuratTugasModal(false)}
                className="!bg-gray-500 text-white px-6 py-3 rounded-lg !text-md font-semibold hover:bg-gray-600 transition"
              >
                Tutup
              </button>
              <button
                onClick={handleSaveSuratTugas}
                className="!bg-blue-600 text-white px-6 py-3 rounded-lg !text-md font-semibold hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Save size={20} />
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      </div>
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