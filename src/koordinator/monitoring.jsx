import React, { useState, useEffect } from 'react';
import { Printer, Save, Download, Calendar, Users, Building, MapPin, X, Plus, Trash2, FileText, Search, Upload } from 'lucide-react';
import toast from "react-hot-toast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoSmk from "../assets/logo.png";

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";

export default function SuratBeritaAcaraPage() {
  const [active, setActive] = useState("berita_acara");
  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Koordinator PKL",
  };

  // State untuk logo
  const [logo, setLogo] = useState({
    file: null,
    preview: localStorage.getItem('berita_acara_logo_preview') || logoSmk,
    type: 'default'
  });

  // State untuk data berita acara dengan format baru
  const [formData, setFormData] = useState({
    hari: "Rabu",
    tanggalPembuatan: "19 Desember 2025",
    namaIndustri: "JOTUN SINGOSARI",
    alamatIndustri: "Jl. Panglima Sudirman No.148 Kavling E2, Pangetan, Kec. Singosari, Kab. Malang, Jawa Timur 65153",
    jumlahPraktikan: "5",
    tanggalAwal: "1 Desember 2025",
    tanggalAkhir: "19 Desember 2025",
    tanggalMonitoring: "19 Desember 2025",
    judulPenjemputan: "PENJEMPUTAN PRAKTIK KERJA INDUSTRI (PKL)",
    tahun: "TAHUN 2025",
    catatanPembimbingIndustri: [
      "Siswa telah menunjukkan kemampuan yang baik dalam mengikuti prosedur kerja",
      "Disiplin waktu perlu ditingkatkan",
      "Komunikasi dengan tim sudah cukup baik"
    ],
    catatanPembimbingSekolah: [
      "Perlu meningkatkan tanggung jawab dalam menyelesaikan tugas",
      "Disiplin dalam mengikuti aturan industri",
      "Kerja sama dengan pembimbing industri sudah baik"
    ],
    namaPembimbingIndustri: "Muhammad Ali Zainal Abidin",
    jabatanPembimbingIndustri: "Pembimbing Industri",
    namaPembimbingSekolah: "TRANA ADILAM",
    jabatanPembimbingSekolah: "Pembimbing Sekolah"
  });

  // State untuk daftar siswa dengan format baru
  const [daftarSiswa, setDaftarSiswa] = useState([
    { 
      id: 1, 
      nama: "ZAHIRA MUTIA", 
      hadir: "S", 
      sakit: "3", 
      izin: "0", 
      keterangan: "Hadir sesuai jadwal" 
    },
    { 
      id: 2, 
      nama: "ABDUL HALIM AL FIROS", 
      hadir: "9", 
      sakit: "0", 
      izin: "5", 
      keterangan: "Izin 5 hari" 
    },
    { 
      id: 3, 
      nama: "ANDIKA SATRIAL E", 
      hadir: "15", 
      sakit: "0", 
      izin: "0", 
      keterangan: "Hadir penuh" 
    },
    { 
      id: 4, 
      nama: "ANGGER A", 
      hadir: "8", 
      sakit: "2", 
      izin: "0", 
      keterangan: "Sakit 2 hari" 
    },
    { 
      id: 5, 
      nama: "DARUL ALIM", 
      hadir: "8", 
      sakit: "0", 
      izin: "2", 
      keterangan: "Izin keluarga" 
    }
  ]);

  // State untuk daftar surat yang sudah dibuat
  const [suratList, setSuratList] = useState([
    {
      id: 1,
      nomorIndustri: "JOTUN SINGOSARI",
      tanggal: "19 Desember 2025",
      jumlahSiswa: "5",
      pembimbing: "Muhammad Ali Zainal Abidin",
      status: "Selesai"
    },
    {
      id: 2,
      nomorIndustri: "PT. MAJU JAYA",
      tanggal: "15 Desember 2025",
      jumlahSiswa: "3",
      pembimbing: "Siti Aminah, S.Pd.",
      status: "Pending"
    }
  ]);

  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [newCatatanIndustri, setNewCatatanIndustri] = useState("");
  const [newCatatanSekolah, setNewCatatanSekolah] = useState("");
  const [query, setQuery] = useState('');

  // Handle upload logo
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        toast.error('File harus berupa gambar (JPG, PNG, GIF)');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const logoDataUrl = reader.result;
        setLogo({
          file: file,
          preview: logoDataUrl,
          type: 'custom'
        });
        
        localStorage.setItem('berita_acara_logo_preview', logoDataUrl);
        localStorage.setItem('berita_acara_logo_type', 'custom');
        
        toast.success('Logo berhasil diupload');
        setShowLogoModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle reset logo
  const handleResetLogo = () => {
    setLogo({
      file: null,
      preview: logoSmk,
      type: 'default'
    });
    
    localStorage.removeItem('berita_acara_logo_preview');
    localStorage.removeItem('berita_acara_logo_type');
    
    toast.success('Logo direset ke default');
  };

  // Handle perubahan input form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle perubahan data siswa
  const handleSiswaChange = (id, field, value) => {
    setDaftarSiswa(prev => prev.map(siswa => 
      siswa.id === id ? { ...siswa, [field]: value } : siswa
    ));
  };

  // Tambah siswa baru
  const handleTambahSiswa = () => {
    const newId = daftarSiswa.length > 0 ? Math.max(...daftarSiswa.map(s => s.id)) + 1 : 1;
    setDaftarSiswa(prev => [
      ...prev,
      { 
        id: newId, 
        nama: "", 
        hadir: "", 
        sakit: "", 
        izin: "", 
        keterangan: "" 
      }
    ]);
    // Update jumlah praktikan
    setFormData(prev => ({
      ...prev,
      jumlahPraktikan: (parseInt(prev.jumlahPraktikan) + 1).toString()
    }));
  };

  // Hapus siswa
  const handleHapusSiswa = (id) => {
    if (daftarSiswa.length <= 1) {
      toast.error("Minimal harus ada 1 siswa");
      return;
    }
    setDaftarSiswa(prev => prev.filter(siswa => siswa.id !== id));
    // Update jumlah praktikan
    setFormData(prev => ({
      ...prev,
      jumlahPraktikan: (parseInt(prev.jumlahPraktikan) - 1).toString()
    }));
  };

  // Tambah catatan industri
  const handleTambahCatatanIndustri = () => {
    if (newCatatanIndustri.trim()) {
      setFormData(prev => ({
        ...prev,
        catatanPembimbingIndustri: [...prev.catatanPembimbingIndustri, newCatatanIndustri]
      }));
      setNewCatatanIndustri("");
    }
  };

  // Hapus catatan industri
  const handleHapusCatatanIndustri = (index) => {
    setFormData(prev => ({
      ...prev,
      catatanPembimbingIndustri: prev.catatanPembimbingIndustri.filter((_, i) => i !== index)
    }));
  };

  // Tambah catatan sekolah
  const handleTambahCatatanSekolah = () => {
    if (newCatatanSekolah.trim()) {
      setFormData(prev => ({
        ...prev,
        catatanPembimbingSekolah: [...prev.catatanPembimbingSekolah, newCatatanSekolah]
      }));
      setNewCatatanSekolah("");
    }
  };

  // Hapus catatan sekolah
  const handleHapusCatatanSekolah = (index) => {
    setFormData(prev => ({
      ...prev,
      catatanPembimbingSekolah: prev.catatanPembimbingSekolah.filter((_, i) => i !== index)
    }));
  };

  // Fungsi untuk generate dan download PDF
const handleGeneratePDF = () => {
  setGeneratingPDF(true);

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFont("helvetica", "normal");

    const marginLeft = 15;
    const marginRight = 15;
    const pageWidth = 210;
    let yPosition = 15;

    //  KOP SURAT 
    if (logo.preview) {
      try {
        doc.addImage(logo.preview, 'PNG', marginLeft, yPosition, 18, 18);
      } catch (err) {
        console.warn("Gagal menambahkan logo:", err);
      }
    }

    // Header 
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("PEMERINTAH PROVINSI JAWA TIMUR", pageWidth / 2, yPosition + 6, { align: 'center' });
    doc.text("DINAS PENDIDIKAN", pageWidth / 2, yPosition + 12, { align: 'center' });
    doc.text("SMK NEGERI 2 SINGOSARI", pageWidth / 2, yPosition + 18, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Jalan Perusahaan No. 20, Tunjungtirto, Singosari, Kab. Malang, Jawa Timur, 65153",
             pageWidth / 2, yPosition + 24, { align: 'center' });
    doc.text("Telepon (0341) 4345127", pageWidth / 2, yPosition + 29, { align: 'center' });

    // Garis pemisah
    yPosition = yPosition + 36;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, yPosition + 0.8, pageWidth - marginRight, yPosition + 0.8);

    yPosition += 10;

    //  JUDUL BERITA ACARA  
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("BERITA ACARA", marginLeft, yPosition);

    yPosition += 12;

    //  JUDUL PENJEMPUTAN PKL 
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(formData.judulPenjemputan, pageWidth / 2, yPosition, { align: 'center' });
    doc.setFontSize(11);
    doc.text(formData.tahun, pageWidth / 2, yPosition + 5, { align: 'center' });

    yPosition += 15;

    //  INFORMASI MONITORING 
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    doc.text("Hari ini", marginLeft, yPosition);
    doc.text(":", marginLeft + 18, yPosition);
    doc.text(`${formData.hari}, ${formData.tanggalMonitoring}`, marginLeft + 22, yPosition);
    yPosition += 6;

    doc.text("Telah melaksanakan monitoring dan pembimbingan peserta didik PKL SMK Negeri 2 Singosari pada Industri/Lembaga :", marginLeft, yPosition);
    yPosition += 6;

    doc.text("Nama Industri/Lembaga", marginLeft, yPosition);
    doc.text(":", marginLeft + 18, yPosition);
    doc.text(formData.namaIndustri, marginLeft + 22, yPosition);
    yPosition += 6;

    doc.text("Alamat Industri/Lembaga", marginLeft, yPosition);
    doc.text(":", marginLeft + 18, yPosition);
    const alamatLines = doc.splitTextToSize(formData.alamatIndustri, 150);
    alamatLines.forEach(line => {
      doc.text(line, marginLeft + 22, yPosition);
      yPosition += 5;
    });

    doc.text("Jumlah Praktikan", marginLeft, yPosition);
    doc.text(":", marginLeft + 18, yPosition);
    doc.text(`${formData.jumlahPraktikan} siswa`, marginLeft + 22, yPosition);
    yPosition += 8;

    doc.text("Dengan hasil-hasil monitoring sebagai berikut :", marginLeft, yPosition);
    
    yPosition += 10;

    //  CATATAN KEHADIRAN 
    doc.setFont("helvetica", "bold");
    const catatanKehadiran = `A. Catatan tentang kehadiran siswa mulai tanggal ${formData.tanggalAwal} S.d tanggal ${formData.tanggalAkhir} Tahun 2025`;
    const catatanLines = doc.splitTextToSize(catatanKehadiran, 180);
    catatanLines.forEach(line => {
      doc.text(line, marginLeft, yPosition);
      yPosition += 5;
    });

    yPosition += 5;

    //  TABEL KEHADIRAN 
    const tableTop = yPosition;
    
    // Lebar kolom
    const colNoWidth = 12;
    const colNamaWidth = 70;
    const colRekapWidth = 45; 
    const colKeteranganWidth = 63;
    const subColWidth = colRekapWidth / 3; 
    
    // Header utama tabel
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    
    // No
    doc.rect(marginLeft, tableTop, colNoWidth, 8);
    doc.text("No", marginLeft + colNoWidth/2, tableTop + 5, { align: 'center' });
    
    // Nama
    doc.rect(marginLeft + colNoWidth, tableTop, colNamaWidth, 8);
    doc.text("Nama", marginLeft + colNoWidth + colNamaWidth/2, tableTop + 5, { align: 'center' });
    
    // Rekap Kehadiran 
    doc.rect(marginLeft + colNoWidth + colNamaWidth, tableTop, colRekapWidth, 8);
    doc.text("Rekap Kehadiran", marginLeft + colNoWidth + colNamaWidth + colRekapWidth/2, tableTop + 5, { align: 'center' });
    
    // Keterangan
    doc.rect(marginLeft + colNoWidth + colNamaWidth + colRekapWidth, tableTop, colKeteranganWidth, 8);
    doc.text("Keterangan", marginLeft + colNoWidth + colNamaWidth + colRekapWidth + colKeteranganWidth/2, tableTop + 5, { align: 'center' });
    
    // Sub-header untuk Rekap Kehadiran
    const subHeaderTop = tableTop + 8;
    
    // No
    doc.rect(marginLeft, subHeaderTop, colNoWidth, 6);
    
    // Nama 
    doc.rect(marginLeft + colNoWidth, subHeaderTop, colNamaWidth, 6);
    
    // Sub-kolom S
    doc.rect(marginLeft + colNoWidth + colNamaWidth, subHeaderTop, subColWidth, 6);
    doc.setFontSize(8);
    doc.text("S", marginLeft + colNoWidth + colNamaWidth + subColWidth/2, subHeaderTop + 3.5, { align: 'center' });
    
    // Sub-kolom I
    doc.rect(marginLeft + colNoWidth + colNamaWidth + subColWidth, subHeaderTop, subColWidth, 6);
    doc.text("I", marginLeft + colNoWidth + colNamaWidth + subColWidth + subColWidth/2, subHeaderTop + 3.5, { align: 'center' });
    
    // Sub-kolom A
    doc.rect(marginLeft + colNoWidth + colNamaWidth + subColWidth*2, subHeaderTop, subColWidth, 6);
    doc.text("A", marginLeft + colNoWidth + colNamaWidth + subColWidth*2 + subColWidth/2, subHeaderTop + 3.5, { align: 'center' });
    
    // Keterangan 
    doc.rect(marginLeft + colNoWidth + colNamaWidth + colRekapWidth, subHeaderTop, colKeteranganWidth, 6);
    
    // Data siswa
    const dataStartY = subHeaderTop + 6;
    let currentY = dataStartY;
    const rowHeight = 8;
    
    daftarSiswa.forEach((siswa, index) => {
      // Kolom No
      doc.rect(marginLeft, currentY, colNoWidth, rowHeight);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${index + 1}.`, marginLeft + colNoWidth/2, currentY + rowHeight/2 + 1, { align: 'center' });
      
      // Kolom Nama
      doc.rect(marginLeft + colNoWidth, currentY, colNamaWidth, rowHeight);
      const namaLines = doc.splitTextToSize(siswa.nama || "-", colNamaWidth - 4);
      if (namaLines.length > 1) {
        doc.text(namaLines[0], marginLeft + colNoWidth + 2, currentY + 3);
        if (namaLines[1]) doc.text(namaLines[1], marginLeft + colNoWidth + 2, currentY + 6);
      } else {
        doc.text(siswa.nama || "-", marginLeft + colNoWidth + 2, currentY + rowHeight/2 + 1);
      }
      
      // Sub-kolom S 
      doc.rect(marginLeft + colNoWidth + colNamaWidth, currentY, subColWidth, rowHeight);
      doc.text(siswa.hadir || "-", marginLeft + colNoWidth + colNamaWidth + subColWidth/2, currentY + rowHeight/2 + 1, { align: 'center' });
      
      // Sub-kolom I 
      doc.rect(marginLeft + colNoWidth + colNamaWidth + subColWidth, currentY, subColWidth, rowHeight);
      doc.text(siswa.sakit || "-", marginLeft + colNoWidth + colNamaWidth + subColWidth + subColWidth/2, currentY + rowHeight/2 + 1, { align: 'center' });
      
      // Sub-kolom A 
      doc.rect(marginLeft + colNoWidth + colNamaWidth + subColWidth*2, currentY, subColWidth, rowHeight);
      doc.text(siswa.izin || "-", marginLeft + colNoWidth + colNamaWidth + subColWidth*2 + subColWidth/2, currentY + rowHeight/2 + 1, { align: 'center' });
      
      // Kolom Keterangan
      doc.rect(marginLeft + colNoWidth + colNamaWidth + colRekapWidth, currentY, colKeteranganWidth, rowHeight);
      const keteranganLines = doc.splitTextToSize(siswa.keterangan || "-", colKeteranganWidth - 4);
      if (keteranganLines.length > 1) {
        doc.text(keteranganLines[0], marginLeft + colNoWidth + colNamaWidth + colRekapWidth + 2, currentY + 3);
        if (keteranganLines[1]) doc.text(keteranganLines[1], marginLeft + colNoWidth + colNamaWidth + colRekapWidth + 2, currentY + 6);
      } else {
        doc.text(siswa.keterangan || "-", marginLeft + colNoWidth + colNamaWidth + colRekapWidth + 2, currentY + rowHeight/2 + 1);
      }
      
      currentY += rowHeight;
      
      if ((index + 1) % 8 === 0 && (index + 1) < daftarSiswa.length) {
        doc.addPage();
        currentY = 20;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        
        // Header utama
        doc.rect(marginLeft, currentY, colNoWidth, 8);
        doc.text("No", marginLeft + colNoWidth/2, currentY + 5, { align: 'center' });
        doc.rect(marginLeft + colNoWidth, currentY, colNamaWidth, 8);
        doc.text("Nama", marginLeft + colNoWidth + colNamaWidth/2, currentY + 5, { align: 'center' });
        doc.rect(marginLeft + colNoWidth + colNamaWidth, currentY, colRekapWidth, 8);
        doc.text("Rekap Kehadiran", marginLeft + colNoWidth + colNamaWidth + colRekapWidth/2, currentY + 5, { align: 'center' });
        doc.rect(marginLeft + colNoWidth + colNamaWidth + colRekapWidth, currentY, colKeteranganWidth, 8);
        doc.text("Keterangan", marginLeft + colNoWidth + colNamaWidth + colRekapWidth + colKeteranganWidth/2, currentY + 5, { align: 'center' });
        
        // Sub-header
        const newSubHeaderTop = currentY + 8;
        doc.rect(marginLeft, newSubHeaderTop, colNoWidth, 6);
        doc.rect(marginLeft + colNoWidth, newSubHeaderTop, colNamaWidth, 6);
        doc.rect(marginLeft + colNoWidth + colNamaWidth, newSubHeaderTop, subColWidth, 6);
        doc.setFontSize(8);
        doc.text("S", marginLeft + colNoWidth + colNamaWidth + subColWidth/2, newSubHeaderTop + 3.5, { align: 'center' });
        doc.rect(marginLeft + colNoWidth + colNamaWidth + subColWidth, newSubHeaderTop, subColWidth, 6);
        doc.text("I", marginLeft + colNoWidth + colNamaWidth + subColWidth + subColWidth/2, newSubHeaderTop + 3.5, { align: 'center' });
        doc.rect(marginLeft + colNoWidth + colNamaWidth + subColWidth*2, newSubHeaderTop, subColWidth, 6);
        doc.text("A", marginLeft + colNoWidth + colNamaWidth + subColWidth*2 + subColWidth/2, newSubHeaderTop + 3.5, { align: 'center' });
        doc.rect(marginLeft + colNoWidth + colNamaWidth + colRekapWidth, newSubHeaderTop, colKeteranganWidth, 6);
        
        currentY = newSubHeaderTop + 6;
      }
    });
    
    yPosition = currentY + 15;

    //  CATATAN KINERJA SISWA 
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("B. Catatan tentang kinerja siswa", marginLeft, yPosition);

    yPosition += 10;

    // Catatan Pembimbing Industri
    doc.setFont("helvetica", "bold");
    doc.text("1. Catatan pembimbing Industri", marginLeft, yPosition);
    yPosition += 6;
    doc.setFont("helvetica", "normal");
    
    formData.catatanPembimbingIndustri.forEach((catatan, index) => {
      if (index < 3) {
        const catatanLines = doc.splitTextToSize(`- ${catatan}`, 170);
        catatanLines.forEach(line => {
          doc.text(line, marginLeft, yPosition);
          yPosition += 5;
        });
      }
    });

    // Tambahan jika catatan kurang dari 3
    for (let i = formData.catatanPembimbingIndustri.length; i < 3; i++) {
      doc.text("-", marginLeft, yPosition);
      yPosition += 5;
    }

    yPosition += 6;

    // Catatan Pembimbing Sekolah
    doc.setFont("helvetica", "bold");
    doc.text("2. Catatan pembimbing sekolah", marginLeft, yPosition);
    yPosition += 6;
    doc.setFont("helvetica", "normal");
    
    if (formData.catatanPembimbingSekolah.length > 0) {
      formData.catatanPembimbingSekolah.forEach((catatan, index) => {
        if (index < 2) {
          const catatanLines = doc.splitTextToSize(catatan, 170);
          catatanLines.forEach(line => {
            doc.text(line, marginLeft, yPosition);
            yPosition += 5;
          });
        }
      });
    } else {
      doc.text("Perpustakaan, disiplin, dan tanggung jawab untuk sekolah kerja di ...", marginLeft, yPosition);
      yPosition += 5;
      doc.text("...", marginLeft, yPosition);
      yPosition += 5;
    }

    yPosition += 25; 

    //  TANDA TANGAN
    const colWidth = (pageWidth - marginLeft - marginRight) / 2;
    
    // Kiri: Pembimbing Industri
    doc.setFont("helvetica", "normal");
    doc.text("Pembimbing Industri", marginLeft + colWidth - 60, yPosition, { align: 'center' });
    doc.setFont("helvetica", "bold");
    doc.text(formData.namaPembimbingIndustri, marginLeft + colWidth - 60, yPosition + 25, { align: 'center' });
    
    // Kanan: Tanggal dan Pembimbing Sekolah
    doc.setFont("helvetica", "normal");
    doc.text(`Singosari, ${formData.tanggalPembuatan}`, marginLeft + colWidth + 40, yPosition - 15, { align: 'center' });
    doc.text("Pembimbing Sekolah", marginLeft + colWidth + 40, yPosition, { align: 'center' });
    doc.setFont("helvetica", "bold");
    doc.text(formData.namaPembimbingSekolah, marginLeft + colWidth + 40, yPosition + 25, { align: 'center' });

    //  SAVE PDF 
    const fileName = `Berita_Acara_PKL_${formData.namaIndustri.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);

    toast.success("Berita Acara berhasil diunduh!");

  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Gagal membuat PDF. Silakan coba lagi.");
  } finally {
    setGeneratingPDF(false);
  }
};

  // Simpan data
  const handleSaveData = () => {
    // Validasi
    if (!formData.namaIndustri.trim()) {
      toast.error("Nama industri harus diisi");
      return;
    }

    if (daftarSiswa.some(siswa => !siswa.nama.trim())) {
      toast.error("Semua nama siswa harus diisi");
      return;
    }

    // Tambahkan ke daftar surat
    const newSurat = {
      id: suratList.length + 1,
      nomorIndustri: formData.namaIndustri,
      tanggal: formData.tanggalPembuatan,
      jumlahSiswa: formData.jumlahPraktikan,
      pembimbing: `${formData.namaPembimbingIndustri} & ${formData.namaPembimbingSekolah}`,
      status: "Selesai"
    };

    setSuratList(prev => [newSurat, ...prev]);
    
    toast.success("Berita Acara berhasil disimpan!");
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    switch(status) {
      case 'Selesai':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Selesai</span>;
      case 'Pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{status}</span>;
    }
  };

  // Filter daftar surat
  const filteredSurat = suratList.filter(surat =>
    surat.nomorIndustri.toLowerCase().includes(query.toLowerCase()) ||
    surat.pembimbing.toLowerCase().includes(query.toLowerCase()) ||
    surat.tanggal.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar active={active} setActive={setActive} />

      <div className="flex flex-col flex-1">
        <Header user={user} />

        <main className="flex-1 p-6 bg-[#641E21] rounded-tl-3xl">
          {/* Header dengan tombol toggle */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-white font-bold text-base sm:text-lg">
                  Berita Acara PKL
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  Formulir Penjemputan dan Monitoring PKL
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoModal(true)}
                  className="flex items-center gap-2 px-4 py-2 !bg-white !text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <Upload size={18} />
                  {logo.type === 'default' ? 'Upload Logo' : 'Ganti Logo'}
                </button>
              </div>
            </div>
          </div>

          {/* MODAL UPLOAD LOGO */}
          {showLogoModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowLogoModal(false)} />
              <div className="relative bg-white rounded-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Logo Sekolah</h3>
                  <button onClick={() => setShowLogoModal(false)} className="!bg-transparent text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="text-center mb-6">
                  <div className="inline-block p-4 border-2 border-dashed border-gray-300 rounded-lg mb-4">
                    <img 
                      src={logo.preview} 
                      alt="Preview Logo" 
                      className="w-40 h-40 object-contain mx-auto"
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    Logo saat ini: <span className="font-medium">{logo.type === 'default' ? 'Logo Default' : 'Logo Custom'}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Format: JPG, PNG (Maksimal 2MB)
                  </p>
                </div>
                
                <div className="space-y-3">
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="w-full py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition">
                      Upload Logo Baru
                    </div>
                  </label>
                  
                  {logo.type === 'custom' && (
                    <button
                      onClick={handleResetLogo}
                      className="w-full py-3 !bg-gray-200 !text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      Reset ke Logo Default
                    </button>
                  )}
                </div>
                
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowLogoModal(false)}
                    className="px-4 py-2 !bg-transparent !text-gray-600 hover:text-gray-800"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* KONTEN UTAMA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* KOLOM KIRI: PREVIEW SURAT */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Preview Berita Acara</h3>
                <span className="text-sm text-gray-500">
                  Logo: {logo.type === 'default' ? 'Default' : 'Custom'}
                </span>
              </div>

              <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
                {/* Kop Surat */}
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src={logo.preview} 
                    alt="Logo SMK" 
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      e.target.src = logoSmk;
                    }}
                  />
                  <div className="text-center flex-1">
                    <p className="font-bold text-lg">PEMERINTAH PROVINSI JAWA TIMUR</p>
                    <p className="font-bold text-lg">DINAS PENDIDIKAN</p>
                    <p className="font-bold text-lg">SMK NEGERI 2 SINGOSARI</p>
                    <p className="text-sm mt-1 text-gray-600">
                      Jalan Perusahaan No. 20, Tunjungtirto, Singosari, Kab. Malang, Jawa Timur, 65153
                    </p>
                    <p className="text-sm text-gray-600">Telepon (0341) 4345127</p>
                  </div>
                </div>

                <div className="border border-black my-3"></div>
                <div className="border border-black my-3 -mt-4"></div>

                {/* Judul BERITA ACARA  */}
                <div className="mb-4">
                  <p className="font-bold text-xl">BERITA ACARA</p>
                </div>

                {/* Judul Penjemputan PKL  */}
                <div className="text-center mb-6">
                  <p className="font-bold text-lg">{formData.judulPenjemputan}</p>
                  <p className="font-bold">{formData.tahun}</p>
                </div>


                {/* Informasi Monitoring */}
                <div className="mb-6">
                  <div className="space-y-2 mb-4">
                    <p><span className="font-semibold">Hari ini</span> : {formData.hari}, {formData.tanggalMonitoring}</p>
                    <p>Telah melaksanakan monitoring dan pembimbingan peserta didik PKL SMK Negeri 2 Singosari pada Industri/Lembaga :</p>
                    <p><span className="font-semibold">Nama Industri/Lembaga</span> : {formData.namaIndustri}</p>
                    <p><span className="font-semibold">Alamat Industri/Lembaga</span> : {formData.alamatIndustri}</p>
                    <p><span className="font-semibold">Jumlah Praktikan</span> : {formData.jumlahPraktikan} siswa</p>
                  </div>
                  
                  <p className="font-semibold">Dengan hasil-hasil monitoring sebagai berikut :</p>
                </div>

                {/* Catatan Kehadiran */}
                <div className="mb-6">
                  <p className="font-bold mb-2">
                    A. Catatan tentang kehadiran siswa mulai tanggal {formData.tanggalAwal} S.d tanggal {formData.tanggalAkhir} Tahun 2025
                  </p>
                  
                  <table className="w-full border-collapse border border-black mb-4">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-2 text-center">No</th>
                        <th className="border border-black p-2 text-center">Nama</th>
                        <th className="border border-black p-2 text-center" colSpan="3">Rekap Kehadiran</th>
                        <th className="border border-black p-2 text-center">Keterangan</th>
                      </tr>
                      <tr className="bg-gray-50">
                        <th className="border border-black p-2"></th>
                        <th className="border border-black p-2"></th>
                        <th className="border border-black p-2 text-center text-xs">S</th>
                        <th className="border border-black p-2 text-center text-xs">I</th>
                        <th className="border border-black p-2 text-center text-xs">A</th>
                        <th className="border border-black p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {daftarSiswa.map((siswa, index) => (
                        <tr key={siswa.id}>
                          <td className="border border-black p-2 text-center">{index + 1}.</td>
                          <td className="border border-black p-2">{siswa.nama || "-"}</td>
                          <td className="border border-black p-2 text-center">{siswa.hadir || "-"}</td>
                          <td className="border border-black p-2 text-center">{siswa.sakit || "-"}</td>
                          <td className="border border-black p-2 text-center">{siswa.izin || "-"}</td>
                          <td className="border border-black p-2">{siswa.keterangan || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Catatan Kinerja */}
                <div className="mb-6">
                  <p className="font-bold mb-2">B. Catatan tentang kinerja siswa</p>
                  
                  <div className="mb-4">
                    <p className="font-bold mb-1">1. Catatan pembimbing Industri</p>
                    <ul className="list-disc pl-5">
                      {formData.catatanPembimbingIndustri.map((catatan, index) => (
                        <li key={index}>{catatan}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="font-bold mb-1">2. Catatan pembimbing sekolah</p>
                    <ul className="list-disc pl-5">
                      {formData.catatanPembimbingSekolah.map((catatan, index) => (
                        <li key={index}>{catatan}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Tanda Tangan */}
                <div className="flex justify-between items-start mt-20">
                  <div className="text-center flex-1">
                    <p className="font-bold">Pembimbing Industri</p>
                    <div className="mt-16">
                      <p className="font-bold">{formData.namaPembimbingIndustri}</p>
                    </div>
                  </div>
                  
                  <div className="text-center flex-1 -mt-8">
                    <p>Singosari, {formData.tanggalPembuatan}</p>
                    <p className="font-bold mt-2">Pembimbing Sekolah</p>
                    <div className="mt-16">
                      <p className="font-bold">{formData.namaPembimbingSekolah}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KOLOM KANAN: FORM INPUT */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Form Input Berita Acara</h3>
              
              <div className="space-y-6">
                {/* Data Umum */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Data Umum</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Judul Penjemputan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="judulPenjemputan"
                        value={formData.judulPenjemputan}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: PENJEMPUTAN PRAKTIK KERJA INDUSTRI (PKL)"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tahun <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="tahun"
                        value={formData.tahun}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: TAHUN 2025"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hari <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="hari"
                          value={formData.hari}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Contoh: Rabu"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tanggal Monitoring <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="tanggalMonitoring"
                          value={formData.tanggalMonitoring}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Contoh: 19 Desember 2025"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Industri/Lembaga <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="namaIndustri"
                        value={formData.namaIndustri}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: JOTUN SINGOSARI"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alamat Industri/Lembaga <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="alamatIndustri"
                        value={formData.alamatIndustri}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Contoh: Jl. Panglima Sudirman No.148 Kavling E2, Pangetan, Kec. Singosari, Kab. Malang, Jawa Timur 65153"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Jumlah Praktikan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="jumlahPraktikan"
                          value={formData.jumlahPraktikan}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Contoh: 5"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tanggal Pembuatan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="tanggalPembuatan"
                          value={formData.tanggalPembuatan}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Contoh: 19 Desember 2025"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tanggal Awal <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="tanggalAwal"
                          value={formData.tanggalAwal}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Contoh: 1 Desember 2025"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tanggal Akhir <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="tanggalAkhir"
                          value={formData.tanggalAkhir}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Contoh: 19 Desember 2025"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Siswa  */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-700">Data Kehadiran Siswa</h4>
                    <button
                      type="button"
                      onClick={handleTambahSiswa}
                      className="flex items-center gap-1 px-3 py-1.5 !bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      <Plus size={16} />
                      Tambah Siswa
                    </button>
                  </div>

                  {daftarSiswa.map((siswa, index) => (
                    <div key={siswa.id} className="mb-4 p-3 bg-white rounded border border-gray-200">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-gray-600">Siswa {index + 1}</h5>
                        {daftarSiswa.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleHapusSiswa(siswa.id)}
                            className="flex items-center gap-1 !bg-transparent !text-red-600 hover:text-red-800 text-sm"
                          >
                            <Trash2 size={14} />
                            Hapus
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Nama Siswa <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={siswa.nama}
                            onChange={(e) => handleSiswaChange(siswa.id, 'nama', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nama lengkap"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Sakit (S)</label>
                            <input
                              type="text"
                              value={siswa.hadir}
                              onChange={(e) => handleSiswaChange(siswa.id, 'hadir', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Contoh: 15"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Izin (I)</label>
                            <input
                              type="text"
                              value={siswa.sakit}
                              onChange={(e) => handleSiswaChange(siswa.id, 'sakit', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Contoh: 2"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Alpa (A)</label>
                            <input
                              type="text"
                              value={siswa.izin}
                              onChange={(e) => handleSiswaChange(siswa.id, 'izin', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Contoh: 3"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Keterangan</label>
                          <input
                            type="text"
                            value={siswa.keterangan}
                            onChange={(e) => handleSiswaChange(siswa.id, 'keterangan', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: Hadir penuh"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Catatan Pembimbing Industri */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Catatan Pembimbing Industri</h4>

                  <div className="space-y-3">
                    {formData.catatanPembimbingIndustri.map((catatan, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={catatan}
                          onChange={(e) => {
                            const newCatatan = [...formData.catatanPembimbingIndustri];
                            newCatatan[index] = e.target.value;
                            setFormData(prev => ({ ...prev, catatanPembimbingIndustri: newCatatan }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Masukkan catatan"
                        />
                        <button
                          type="button"
                          onClick={() => handleHapusCatatanIndustri(index)}
                          className="p-2 !bg-transparent !text-red-600 hover:text-red-800"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCatatanIndustri}
                        onChange={(e) => setNewCatatanIndustri(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tambah catatan baru"
                        onKeyPress={(e) => e.key === 'Enter' && handleTambahCatatanIndustri()}
                      />
                      <button
                        type="button"
                        onClick={handleTambahCatatanIndustri}
                        className="px-4 py-2 !bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                </div>

                {/* Catatan Pembimbing Sekolah */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Catatan Pembimbing Sekolah</h4>

                  <div className="space-y-3">
                    {formData.catatanPembimbingSekolah.map((catatan, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <textarea
                          value={catatan}
                          onChange={(e) => {
                            const newCatatan = [...formData.catatanPembimbingSekolah];
                            newCatatan[index] = e.target.value;
                            setFormData(prev => ({ ...prev, catatanPembimbingSekolah: newCatatan }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="2"
                          placeholder="Masukkan catatan"
                        />
                        <button
                          type="button"
                          onClick={() => handleHapusCatatanSekolah(index)}
                          className="p-2 !bg-transparent !text-red-600 hover:text-red-800"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <textarea
                        value={newCatatanSekolah}
                        onChange={(e) => setNewCatatanSekolah(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="2"
                        placeholder="Tambah catatan baru"
                      />
                      <button
                        type="button"
                        onClick={handleTambahCatatanSekolah}
                        className="px-4 py-2 !bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                </div>

                {/* Data Pembimbing */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Data Pembimbing</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Pembimbing Industri <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="namaPembimbingIndustri"
                        value={formData.namaPembimbingIndustri}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: Muhammad Ali Zainal Abidin"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jabatan Pembimbing Industri
                      </label>
                      <input
                        type="text"
                        name="jabatanPembimbingIndustri"
                        value={formData.jabatanPembimbingIndustri}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: Pembimbing Industri"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Pembimbing Sekolah <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="namaPembimbingSekolah"
                        value={formData.namaPembimbingSekolah}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: TRANA ADILAM"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jabatan Pembimbing Sekolah
                      </label>
                      <input
                        type="text"
                        name="jabatanPembimbingSekolah"
                        value={formData.jabatanPembimbingSekolah}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: Pembimbing Sekolah"
                      />
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={handleSaveData}
                    className="flex items-center gap-2 px-6 py-3 !bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    <Save size={18} />
                    Simpan Berita Acara
                  </button>
                  <button
                    onClick={handleGeneratePDF}
                    disabled={generatingPDF}
                    className="flex items-center gap-2 px-6 py-3 !bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
                  >
                    <Download size={18} />
                    {generatingPDF ? 'Memproses...' : 'Download PDF'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}