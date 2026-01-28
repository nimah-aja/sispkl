import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getPKLApplications } from "../utils/services/kapro/pengajuanPKL";
import { X, Edit } from "lucide-react";
import { fetchGuruById, getGuru as getAllGuru } from "../utils/services/admin/get_guru";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoSmk from "../assets/logo.png"

// components
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import EditPengajuan from "./components/editPengajuan";

export default function DataPengajuan() {
  const [showPreview, setShowPreview] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSurat, setSelectedSurat] = useState(null);
  const [active, setActive] = useState("pengajuanPKL");
  const [query, setQuery] = useState("");
  const [pengajuanList, setPengajuanList] = useState([]);
  const [kelas, setKelas] = useState("");
  const [guruList, setGuruList] = useState([]);
  const [guruDetail, setGuruDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfGuruDetail, setPdfGuruDetail] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const previewRef = useRef(null);
  const navigate = useNavigate();
  const namaGuru = localStorage.getItem("nama_guru") || "Guru SMK";

  const user = {
    name: namaGuru,
    role: "Koordinator",
  };

  const kelasOptions = Array.from(
    new Set(pengajuanList.map(item => item.class))
  );

  const filters = [
    {
      label: "Kelas",
      value: kelas,
      options: kelasOptions,
      onChange: setKelas,
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pklRes, guruRes] = await Promise.all([
          getPKLApplications(),
          getAllGuru(),
        ]);

        setGuruList(guruRes || []);

        const approvedList = (pklRes?.data || [])
          .filter((item) => item.application?.status === "Approved")
          .map((item) => ({
            id: item.application.id,
            name: item.siswa_username,
            class: item.kelas_nama,
            nisn: item.siswa_nisn,
            industri: item.industri_nama,
            jurusan: item.jurusan_nama,
            tanggal_mulai: item.application.tanggal_mulai,
            tanggal_selesai: item.application.tanggal_selesai,
            processed_by: item.application.processed_by,
            description: `PKL di ${item.industri_nama} telah disetujui`,
            siswa_id: item.application.siswa_id,
            siswa_names: item.siswa_username,
            jumlah_siswa: 1,
            nama_perusahaan: item.industri_nama,
            alamat_perusahaan: item.industri_alamat || "Jl. Contoh No. 123",
            kota_perusahaan: item.industri_kota || "Malang",
          }));

        setPengajuanList(approvedList);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedSurat?.processed_by) return;

    const getGuruDetail = async () => {
      try {
        const data = await fetchGuruById(selectedSurat.processed_by);
        setGuruDetail(data);
        setPdfGuruDetail(data);
      } catch (err) {
        console.error("Error fetching guru detail:", err);
        setGuruDetail(null);
        setPdfGuruDetail(null);
      }
    };

    getGuruDetail();
  }, [selectedSurat]);

  const formatTanggal = (isoString) => {
    if (!isoString) return "";
    try {
      const [year, month, day] = isoString.split('-');
      return `${day}-${month}-${year}`;
    } catch (err) {
      return isoString;
    }
  };

  const formatTanggalSurat = () => {
    const now = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return now.toLocaleDateString('id-ID', options);
  };

  const getInitials = (name) => {
    if (!name) return "";
    const words = name.trim().split(" ");
    return words.length === 1
      ? words[0][0].toUpperCase()
      : (words[0][0] + words[1][0]).toUpperCase();
  };

  const handleEditClick = (item) => {
    console.log("✏️ Edit clicked for:", item.name, "ID:", item.id);
    setSelectedSurat(item);
    setShowEditModal(true);
    setShowPreview(false);
  };

  // Fungsi untuk handle export dari edit modal
  const handleExportFromEdit = (payload, isGroupMode = false, selectedStudents = []) => {
    console.log("=== DataPengajuan: handleExportFromEdit ===");
    
    // Validasi payload
    if (!payload) {
      console.error("Payload tidak valid");
      return;
    }
    
    // Untuk PDF lokal, langsung panggil fungsi generate
    generateLembarPersetujuanPDF(payload, selectedStudents);
  };

  // Fungsi untuk update data setelah edit
  const handleSaveEdit = (updatedData) => {
    console.log("💾 Menyimpan perubahan data:", updatedData);
    
    // Update state dengan data yang sudah diedit
    setPengajuanList(prev => 
      prev.map(item => 
        item.id === updatedData.id ? {
          ...item,
          // Update semua field yang mungkin diubah
          name: updatedData.name || item.name,
          class: updatedData.class || item.class,
          nisn: updatedData.nisn || item.nisn,
          jurusan: updatedData.jurusan || item.jurusan,
          nama_perusahaan: updatedData.nama_perusahaan || item.nama_perusahaan,
          industri: updatedData.industri || item.industri,
          tanggal_mulai: updatedData.tanggal_mulai || item.tanggal_mulai,
          tanggal_selesai: updatedData.tanggal_selesai || item.tanggal_selesai,
          periode: updatedData.periode || item.periode
        } : item
      )
    );
    
    // Update juga selectedSurat jika sedang diedit
    if (selectedSurat?.id === updatedData.id) {
      setSelectedSurat(prev => ({
        ...prev,
        ...updatedData
      }));
    }
    
    setShowEditModal(false);
  };

  // Fungsi untuk generate PDF Lembar Persetujuan menggunakan jsPDF dengan autoTable
  // Fungsi untuk generate PDF Lembar Persetujuan menggunakan jsPDF dengan autoTable
const generateLembarPersetujuanPDF = async (data, selectedStudents = []) => {
  if (!data) return;
  
  setGeneratingPDF(true);
  
  try {
    console.log("📄 Membuat PDF dengan jsPDF untuk:", data.nama_perusahaan);
    
    // Buat PDF baru
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set background putih untuk seluruh dokumen
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F'); // Mengisi seluruh halaman dengan putih
    
    // Set font dan ukuran
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    const margin = 15;
    let yPosition = margin;
    
    // HEADER - Logo dan Info Sekolah
    yPosition = 15;
    
    // Logo kiri (jika ada)
    if (logoSmk) {
      try {
        // Tambahkan gambar logo lokal
        doc.addImage(logoSmk, 'PNG', margin, yPosition, 20, 20);
      } catch (err) {
        console.warn("Gagal menambahkan logo:", err);
      }
    }
    
    // Header teks (dengan logo di tengah)
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0); // Pastikan teks hitam
    doc.text("PEMERINTAH PROVINSI JAWA TIMUR", 105, yPosition + 8, { align: 'center' });
    doc.text("DINAS PENDIDIKAN", 105, yPosition + 14, { align: 'center' });
    doc.text("SMK NEGERI 2 SINGOSARI", 105, yPosition + 20, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Jalan Perusahaan No. 20, Kab. Malang, Jawa Timur, 65153", 105, yPosition + 28, { align: 'center' });
    doc.text("Telepon (0341) 458823", 105, yPosition + 33, { align: 'center' });
    
    // Garis pemisah
    yPosition = yPosition + 40;
    doc.setDrawColor(0, 0, 0); // Garis hitam
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, 210 - margin, yPosition);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition + 1, 210 - margin, yPosition + 1);
    
    // Judul LEMBAR PERSETUJUAN
    yPosition = yPosition + 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0); // Pastikan teks hitam
    doc.text("LEMBAR PERSETUJUAN", 105, yPosition, { align: 'center' });
    
    // Tambahkan garis underline
    doc.setDrawColor(0, 0, 0); // Garis hitam
    doc.setLineWidth(0.5);
    const titleWidth = doc.getStringUnitWidth("LEMBAR PERSETUJUAN") * 14 / doc.internal.scaleFactor;
    const titleX = 105 - (titleWidth / 2);
    doc.line(titleX, yPosition + 2, titleX + titleWidth, yPosition + 2);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    // Tabel utama
    yPosition = yPosition + 15;
    
    // Header tabel
    const tableHeaders = [[' NO ', 'PERIHAL', 'DISETUJUI OLEH PIHAK DU/DI', 'KETERANGAN']];
    
    // Konten tabel
    const siswaList = data.students?.map((student, index) => 
      `${index + 1}. ${student.nama || student.name?.toUpperCase() || "NAMA SISWA"}`
    ).join('\n') || "1. NAMA SISWA";
    
    const tableBody = [
      [
        '1.',
        `Permohonan pelaksanaan Pembelajaran Praktik Industri (PJBL)\n\nuntuk ${data.students?.length || 1} orang siswa, atas nama:\n\n${siswaList}`,
        `Nama :\n.......................................................\nTanggal :\n.......................................................\nParaf :\n\n\nCatatan :\n1. Mulai PKL pada tanggal :\n.................................................sd........................................................\n2. Diterima Sebanyak ……… siswa.`,
        `Telah disetujui Siswa Siswi SMK NEGERI 2 SINGOSARI\nuntuk melaksanakan PKL di ${data.nama_perusahaan || "JTV MALANG"}`
      ]
    ];
    
    // Buat tabel menggunakan autoTable
    autoTable(doc, {
      startY: yPosition,
      head: tableHeaders,
      body: tableBody,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 3,
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
        0: { 
          cellWidth: 15, 
          halign: 'center',
          fillColor: [255, 255, 255],
        },
        1: { 
          cellWidth: 'auto',
          fillColor: [255, 255, 255],
        },
        2: { 
          cellWidth: 55,
          fillColor: [255, 255, 255],
        },
        3: { 
          cellWidth: 55,
          fillColor: [255, 255, 255],
        },
      },
      bodyStyles: {
        valign: 'top',
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      theme: 'grid',
    });
    
    // Footer (tempat dan tanggal)
    const finalY = doc.lastAutoTable?.finalY || yPosition + 80;
    yPosition = finalY + 20;
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(data.tempat_tanggal || `Malang, ${formatTanggalSurat()}`, 176, yPosition, { align: 'right' });
    yPosition += 7;
    doc.text("Bapak / Ibu Pimpinan", 174, yPosition, { align: 'right' });
    
    // Tanda tangan
    yPosition += 40;
    doc.text("( ................................................................ )", 195, yPosition, { align: 'right' });
    
    // AUTO PRINT - Langsung buka dialog print
    doc.autoPrint({ variant: 'non-conform' });
    
    // Buka PDF di tab baru dan langsung trigger print dialog
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl, '_blank');
    
    // Set timeout untuk memastikan PDF sudah terbuka
    setTimeout(() => {
      if (printWindow) {
        // Focus ke window print
        printWindow.focus();
        
        // Set timeout tambahan untuk memastikan PDF siap
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    }, 500);
    
  } catch (error) {
    console.error("❌ Error generating PDF:", error);
  } finally {
    setGeneratingPDF(false);
  }
};

  // Fungsi untuk generate Lembar Persetujuan langsung dari card
  const handleExportLembarPersetujuan = async (surat, printDirectly = false) => {
    if (!surat) return;
    
    setGeneratingPDF(true);
    
    try {
      console.log("🖨️ Mencetak Lembar Persetujuan untuk:", surat.name);
      
      const payload = {
        school_info: {
          nama_sekolah: "SMK NEGERI 2 SINGOSARI",
          logo_url: "https://upload.wikimedia.org/wikipedia/commons/d/d6/Logo_SMKN_2_Singosari.png"
        },
        students: [{
          nama: surat.name.toUpperCase(),
          nisn: surat.nisn || "",
          kelas: surat.class || "",
          jurusan: surat.jurusan || ""
        }],
        nama_perusahaan: surat.nama_perusahaan || surat.industri || "JTV MALANG",
        tempat_tanggal: `Malang, ${formatTanggalSurat()}`,
        nama_kaprog: guruDetail?.nama || namaGuru,
        nip_kaprog: guruDetail?.nip || ""
      };
      
      await generateLembarPersetujuanPDF(payload, [], printDirectly);
      
    } catch (error) {
      console.error("❌ Error generating Lembar Persetujuan:", error);
      setGeneratingPDF(false);
    }
  };

  // Fungsi untuk generate Surat Tugas dengan jsPDF
  const handleGenerateSuratTugas = async (surat, printDirectly = false) => {
    if (!surat) return;
    
    setGeneratingPDF(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set background putih
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, 'F');
      
      // Set font
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      
      const margin = 20;
      let yPosition = margin;
      
      // Header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("PEMERINTAH PROVINSI JAWA TIMUR", 105, yPosition, { align: 'center' });
      yPosition += 6;
      doc.text("DINAS PENDIDIKAN", 105, yPosition, { align: 'center' });
      yPosition += 6;
      doc.text("SMK NEGERI 2 SINGOSARI", 105, yPosition, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      yPosition += 6;
      doc.text("Jalan Perusahaan No. 20, Kab. Malang, Jawa Timur, 65153", 105, yPosition, { align: 'center' });
      yPosition += 5;
      doc.text("Telepon (0341) 458823", 105, yPosition, { align: 'center' });
      
      // Garis pemisah
      yPosition += 8;
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, 210 - margin, yPosition);
      
      // Judul SURAT TUGAS
      yPosition += 15;
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("SURAT TUGAS", 105, yPosition, { align: 'center' });
      
      // Nomor surat
      yPosition += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Nomor: ST/${new Date().getFullYear()}/${String(surat.id).padStart(3, '0')}`, 105, yPosition, { align: 'center' });
      
      // Isi surat
      yPosition += 15;
      doc.setFontSize(12);
      doc.text("Yang bertanda tangan di bawah ini:", margin, yPosition);
      
      yPosition += 10;
      doc.text("Nama", margin, yPosition);
      doc.text(":", margin + 35, yPosition);
      doc.text(surat.name || "NAMA SISWA", margin + 40, yPosition);
      
      yPosition += 7;
      doc.text("NISN", margin, yPosition);
      doc.text(":", margin + 35, yPosition);
      doc.text(surat.nisn || "-", margin + 40, yPosition);
      
      yPosition += 7;
      doc.text("Kelas/Jurusan", margin, yPosition);
      doc.text(":", margin + 35, yPosition);
      doc.text(`${surat.class || ""} / ${surat.jurusan || "Teknik Komputer dan Jaringan"}`, margin + 40, yPosition);
      
      yPosition += 7;
      doc.text("Untuk melaksanakan", margin, yPosition);
      doc.text(":", margin + 35, yPosition);
      doc.text("Praktik Kerja Lapangan (PKL)", margin + 40, yPosition);
      
      yPosition += 7;
      doc.text("Di", margin, yPosition);
      doc.text(":", margin + 35, yPosition);
      doc.text(surat.nama_perusahaan || surat.industri || "JTV MALANG", margin + 40, yPosition);
      
      yPosition += 7;
      doc.text("Alamat", margin, yPosition);
      doc.text(":", margin + 35, yPosition);
      doc.text(surat.alamat_perusahaan || "Jl. Contoh No. 123, Malang", margin + 40, yPosition);
      
      yPosition += 7;
      doc.text("Waktu Pelaksanaan", margin, yPosition);
      doc.text(":", margin + 35, yPosition);
      doc.text(`${surat.tanggal_mulai ? formatTanggal(surat.tanggal_mulai) : ""} s/d ${surat.tanggal_selesai ? formatTanggal(surat.tanggal_selesai) : ""}`, margin + 40, yPosition);
      
      // Penutup
      yPosition += 20;
      doc.text("Demikian surat tugas ini dibuat untuk dapat dilaksanakan dengan sebaik-baiknya.", margin, yPosition);
      
      // Tanda tangan
      yPosition += 30;
      doc.text(`Malang, ${formatTanggalSurat()}`, 160, yPosition, { align: 'right' });
      
      yPosition += 20;
      doc.text("Kepala SMK Negeri 2 Singosari,", 160, yPosition, { align: 'right' });
      
      yPosition += 30;
      doc.setFont("helvetica", "bold");
      doc.text(guruDetail?.nama || namaGuru, 160, yPosition, { align: 'right' });
      
      yPosition += 6;
      doc.setFont("helvetica", "normal");
      doc.text(`NIP. ${guruDetail?.nip || "-"}`, 160, yPosition, { align: 'right' });
      
      // Buat nama file dengan format: namaSiswa_namaIndustri_SuratTugas
      const cleanSiswaName = surat.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toUpperCase();
      const cleanPerusahaanName = (surat.nama_perusahaan || surat.industri || "JTV MALANG")
        .replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toUpperCase();
      
      const fileName = `Surat_Tugas_${cleanSiswaName}_${cleanPerusahaanName}.pdf`;
      
      if (printDirectly) {
        // Untuk print langsung
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const printWindow = window.open(pdfUrl, '_blank');
        
        setTimeout(() => {
          if (printWindow) {
            printWindow.focus();
            printWindow.print();
          }
        }, 500);
        
      } else {
        // Simpan PDF ke file
        doc.save(fileName);
      }
      
    } catch (error) {
      console.error("❌ Error generating Surat Tugas:", error);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleCardClick = async (item) => {
    setSelectedSurat(item);
    setShowPreview(true);
    setShowEditModal(false);
  };

  const filteredPengajuan = pengajuanList.filter((item) => {
    const searchText = query.toLowerCase();

    const matchSearch =
      item.name.toLowerCase().includes(searchText) ||
      item.class.toLowerCase().includes(searchText) ||
      item.description.toLowerCase().includes(searchText);

    const matchKelas = kelas === "" || item.class === kelas;

    return matchSearch && matchKelas;
  });

  return (
    <div className="flex min-h-screen w-full bg-white">
      <Sidebar active={active} setActive={setActive} />

      <div className="flex flex-col flex-1">
        <Header user={user} />

        <main className="flex-1 p-6 bg-[#641E21] rounded-tl-3xl">
          <h2 className="text-white font-bold mb-4">Data Persetujuan PKL</h2>

          <SearchBar
            query={query}
            setQuery={setQuery}
            filters={filters}
            placeholder="Cari siswa..."
          />

          {loading ? (
            <div className="text-white mt-4">Memuat data...</div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredPengajuan.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className="bg-white rounded-xl p-4 flex justify-between items-center shadow cursor-pointer hover:bg-gray-50 transition"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 mr-4 rounded-full bg-[#641E21] text-white flex items-center justify-center font-bold">
                      {getInitials(item.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#641E21]">
                        {item.name} | {item.class} 
                      </h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Industri: {item.nama_perusahaan || item.industri}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(item);
                      }}
                      className="!bg-red-800 text-white px-4 py-1 rounded-md hover:bg-red-900 transition flex items-center gap-2"
                    >
                      <Edit size={16} />
                      Edit Surat
                    </button>
                    
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await handleExportLembarPersetujuan(item, false); // Simpan ke file
                      }}
                      disabled={generatingPDF}
                      className="!bg-[#EC933A] text-white px-4 py-1 rounded-md hover:bg-orange-500 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      Cetak Lembar Persetujuan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* MODAL EDIT */}
      {showEditModal && selectedSurat && (
        <EditPengajuan
          selectedSurat={selectedSurat}
          guruDetail={guruDetail}
          allSiswa={pengajuanList}
          onSave={handleSaveEdit}
          onClose={() => setShowEditModal(false)}
          onExportPDF={handleExportFromEdit}
          onGenerateSuratTugas={handleGenerateSuratTugas}
        />
      )}

      {/* SIDE PANEL PREVIEW */}
      {showPreview && selectedSurat && !showEditModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowPreview(false);
              setGuruDetail(null);
              setPdfGuruDetail(null);
            }}
          />

          <div
            onClick={() => {
              setShowPreview(false);
              setGuruDetail(null);
              setPdfGuruDetail(null);
            }}
            className="absolute top-4 right-[789px] z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg transition hover:bg-gray-100 cursor-pointer"
          >
            <X className="text-black w-5 h-5" />
          </div>

          <div className="relative bg-white h-full w-full max-w-3xl rounded-2xl shadow-2xl animate-slide-in-right overflow-y-auto">
            <div className="p-12 text-black text-[12px] leading-relaxed">
              <div className="bg-white p-8 rounded-lg shadow-sm text-[12px] leading-relaxed">
                <div className="flex items-center justify-center mb-4 -ml-9">
                  <div className="mr-4">
                    <img 
                      src={logoSmk} 
                      alt="Logo SMK Negeri 2 Singosari" 
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                  
                  <div className="text-center mb-8">
                    <p className="font-bold text-lg uppercase">PEMERINTAH PROVINSI JAWA TIMUR</p>
                    <p className="font-bold text-lg uppercase">DINAS PENDIDIKAN</p>
                    <p className="font-bold text-lg uppercase">SMK NEGERI 2 SINGOSARI</p>
                    <p className="text-sm">
                      Jalan Perusahaan No. 20, Kab. Malang, Jawa Timur, 65153<br />
                      Telepon (0341) 458823
                    </p>
                  </div>
                </div>

                <div className="border border-black my-4 -mt-7"></div>

                <div className="text-center my-6">
                  <p className="font-bold text-lg underline">LEMBAR PERSETUJUAN</p>
                </div>

                <div className="border border-black">
                  <div className="flex border-b border-black">
                    <div className="w-12 border-r border-black p-2 text-center font-bold">NO</div>
                    <div className="flex-1 border-r border-black p-2 font-bold text-center">PERIHAL</div>
                    <div className="w-1/3 border-r border-black p-2 font-bold text-center">DISETUJUI OLEH PIHAK DU/DI</div>
                    <div className="w-1/3 p-2 font-bold text-center">KETERANGAN</div>
                  </div>

                  <div className="flex">
                    <div className="w-12 border-r border-black p-2 text-center">1.</div>
                    <div className="flex-1 border-r border-black p-2">
                      <p>Permohonan pelaksanaan Pembelajaran Praktik Industri (PJBL)</p>
                      <p className="mt-1">
                        untuk 1 orang siswa, atas nama:
                      </p>
                      <p className="ml-4">1. {selectedSurat?.name?.toUpperCase() || "NAMA SISWA"}</p>
                    </div>
                    
                    <div className="w-1/3 border-r border-black p-2">
                      <p>Nama :</p>
                      <p>............................................................</p>
                      <p>Tanggal : </p>
                      <p>............................................................</p>
                      <p className="mt-2">Paraf : </p>
                      
                      <p className="mt-7">Catatan : </p>
                      <p className="">1. Mulai PKL pada tanggal : ................................................... s/d</p>
                      <p>...........................................................</p>
                      <p>2. Diterima Sebanyak ……… siswa.</p>
                    </div>
                    
                    <div className="w-1/3 p-2">
                      <p>Telah disetujui Siswa Siswi SMK NEGERI 2 SINGOSARI</p>
                      <p>untuk melaksanakan PKL di {selectedSurat?.nama_perusahaan || selectedSurat?.industri || "JTV MALANG"}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-end">
                  <p className="mr-7">Malang, {formatTanggalSurat()}</p>
                  <p className="mt-2 mr-10">Bapak / Ibu Pimpinan</p>
                  <div className="mt-16">
                    <p>( ................................................................ )</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex justify-start gap-4">
                <button
                  onClick={() => handleEditClick(selectedSurat)}
                  className="!bg-red-800 text-white px-6 py-3 rounded-lg !text-md font-semibold hover:bg-red-900 transition flex items-center gap-2"
                >
                  <Edit size={18} />
                  Edit Surat
                </button>
                
                <div className="relative group">
                  <button
                    onClick={async () => {
                          await handleExportLembarPersetujuan(selectedSurat, false); // Simpan ke file
                        }} // Simpan ke file
                    className="!bg-[#EC933A] text-white px-6 py-3 rounded-lg !text-md font-semibold hover:bg-orange-500 transition disabled:opacity-50"
                  >
                    {generatingPDF ? "Loading..." : "Cetak Lembar Persetujuan"}
                  </button>
                </div>
              </div>
            </div>
          </div>        
        </div>
      )}
    </div>
  );
}