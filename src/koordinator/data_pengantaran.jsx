import React, { useState, useEffect } from 'react';
import { Printer, Save, Plus, Trash2, FileText, Download, Search, Upload, X } from 'lucide-react';
import toast from "react-hot-toast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoSmk from "../assets/logo.png"; // Logo default

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";

// Import utils guru sesuai dengan yang Anda berikan
import { getGuru, mapGuruToUser } from "../utils/services/admin/get_guru";

export default function SuratPengantaranPage() {
  const [active, setActive] = useState("suratPengantaran");
  const [query, setQuery] = useState('');
  const [guruList, setGuruList] = useState([]);
  const [loadingGuru, setLoadingGuru] = useState(false);
  
  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Koordinator",
  };

  // State untuk logo - default dari import, bisa diubah
  const [logo, setLogo] = useState({
    file: null,
    preview: localStorage.getItem('surat_logo_preview') || logoSmk, // Default ke logoSmk
    type: 'default' // 'default' atau 'custom'
  });

  // State untuk data surat tugas
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

  // State untuk guru yang ditugaskan
  const [guruPenugasan, setGuruPenugasan] = useState([
    { id: 1, nama: "", jabatan: "Guru", dinas: "SMK Negeri 2 Singosari", guruId: "" }
  ]);

  // State untuk form input
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
    guru1: { guruId: "", nama: "", jabatan: "Guru", dinas: "SMK Negeri 2 Singosari" }
  });

  // Data dummy untuk daftar surat
  const [suratList, setSuratList] = useState([
    {
      id: 1,
      nomorSurat: "800/123/SMK.2/2024",
      keperluan: "Pengantaran Siswa PKL",
      tempat: "BACAMALANG.COM",
      tanggal: "1 Juli 2024",
      guru: "Inasni Dyah Rahmatika, S.Pd.",
      status: "Selesai"
    },
    {
      id: 2,
      nomorSurat: "800/124/SMK.2/2024",
      keperluan: "Monitoring Siswa PKL",
      tempat: "TOKO BUKU MURAH",
      tanggal: "5 Juli 2024",
      guru: "Budi Santoso, S.Pd.",
      status: "Pending"
    },
    {
      id: 3,
      nomorSurat: "800/125/SMK.2/2024",
      keperluan: "Pengantaran Siswa PKL",
      tempat: "CV. MAJU JAYA",
      tanggal: "10 Juli 2024",
      guru: "Siti Aminah, S.Pd.",
      status: "Selesai"
    }
  ]);

  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

  // Fetch data guru saat komponen dimount
  useEffect(() => {
    fetchGuruList();
  }, []);

  // Fungsi untuk fetch data guru menggunakan utils Anda
  const fetchGuruList = async () => {
    try {
      setLoadingGuru(true);
      
      // Menggunakan getGuru() dari utils Anda
      const guruData = await getGuru();
      
      // Filter hanya guru dengan is_pembimbing: true
      const pembimbingGuru = guruData.filter(guru => guru.is_pembimbing === true);
      
      if (pembimbingGuru.length === 0) {
        toast.warning("Tidak ada data pembimbing guru yang tersedia");
      }
      
      // Format data untuk dropdown sesuai struktur dari API
      const formattedGuru = pembimbingGuru.map(guru => ({
        id: guru.id,
        value: guru.id,
        label: guru.nama || "-",
        nama: guru.nama || "-",
        jabatan: guru.jabatan || "Guru",
        nip: guru.nip || "-",
        kode_guru: guru.kode_guru || "-",
        no_telp: guru.no_telp || "-",
        is_pembimbing: guru.is_pembimbing || false
      })).sort((a, b) => a.label.localeCompare(b.label)); // Urutkan berdasarkan nama
      
      setGuruList(formattedGuru);
      
      // Jika ada data guru pembimbing, isi otomatis guru pertama
      if (formattedGuru.length > 0) {
        const firstGuru = formattedGuru[0];
        setFormData(prev => ({
          ...prev,
          guru1: {
            guruId: firstGuru.id,
            nama: firstGuru.label,
            jabatan: firstGuru.jabatan,
            dinas: "SMK Negeri 2 Singosari"
          }
        }));
        
        setGuruPenugasan(prev => {
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            id: firstGuru.id,
            nama: firstGuru.label,
            jabatan: firstGuru.jabatan,
            guruId: firstGuru.id
          };
          return updated;
        });
      }
      
    } catch (error) {
      console.error("Error fetching guru list:", error);
      toast.error("Gagal memuat data guru");
      
      // Fallback data dummy jika API error (dummy pembimbing)
      setGuruList([
        { id: 1, value: 1, label: "Inasni Dyah Rahmatika, S.Pd.", nama: "Inasni Dyah Rahmatika", jabatan: "Guru Pembimbing", nip: "123456", is_pembimbing: true },
        { id: 2, value: 2, label: "Budi Santoso, S.Pd.", nama: "Budi Santoso", jabatan: "Guru Pembimbing", nip: "234567", is_pembimbing: true },
        { id: 3, value: 3, label: "Siti Aminah, M.Pd.", nama: "Siti Aminah", jabatan: "Guru Pembimbing", nip: "345678", is_pembimbing: true },
        { id: 4, value: 4, label: "Ahmad Rifai, S.T.", nama: "Ahmad Rifai", jabatan: "Guru Pembimbing", nip: "456789", is_pembimbing: true }
      ]);
    } finally {
      setLoadingGuru(false);
    }
  };

  // Handle upload logo
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi tipe file
      if (!file.type.match('image.*')) {
        toast.error('File harus berupa gambar (JPG, PNG, GIF)');
        return;
      }
      
      // Validasi ukuran file (max 2MB)
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
        
        // Simpan ke localStorage
        localStorage.setItem('surat_logo_preview', logoDataUrl);
        localStorage.setItem('surat_logo_type', 'custom');
        
        toast.success('Logo berhasil diupload');
        setShowLogoModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle reset ke logo default
  const handleResetLogo = () => {
    setLogo({
      file: null,
      preview: logoSmk,
      type: 'default'
    });
    
    localStorage.removeItem('surat_logo_preview');
    localStorage.removeItem('surat_logo_type');
    
    toast.success('Logo direset ke default');
  };

  // Handle hapus logo custom
  const handleRemoveLogo = () => {
    if (logo.type === 'custom') {
      handleResetLogo();
    }
  };

  // Fungsi untuk tambah baris guru
  const handleTambahGuru = () => {
    const newId = guruPenugasan.length + 1;
    
    setGuruPenugasan(prev => [
      ...prev,
      { id: newId, nama: "", jabatan: "Guru", dinas: "SMK Negeri 2 Singosari", guruId: "" }
    ]);
    
    setFormData(prev => ({
      ...prev,
      [`guru${newId}`]: { guruId: "", nama: "", jabatan: "Guru", dinas: "SMK Negeri 2 Singosari" }
    }));
  };

  // Fungsi untuk hapus guru
  const handleHapusGuru = (index) => {
    if (guruPenugasan.length <= 1) {
      toast.error("Minimal harus ada 1 guru yang ditugaskan");
      return;
    }
    
    const updatedGuru = guruPenugasan.filter((_, i) => i !== index);
    setGuruPenugasan(updatedGuru);
    
    const updatedFormData = { ...formData };
    delete updatedFormData[`guru${index + 1}`];
    
    // Reindex
    updatedGuru.forEach((guru, i) => {
      updatedFormData[`guru${i + 1}`] = {
        guruId: guru.guruId,
        nama: guru.nama,
        jabatan: guru.jabatan,
        dinas: guru.dinas
      };
    });
    
    setFormData(updatedFormData);
  };

  // Handle perubahan input form umum
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle perubahan input guru (dropdown) - menggunakan ID guru
  const handleGuruSelectChange = (index, guruId) => {
    const selectedGuru = guruList.find(g => g.id === parseInt(guruId));
    
    if (selectedGuru) {
      setFormData(prev => {
        const guruKey = `guru${index + 1}`;
        return {
          ...prev,
          [guruKey]: {
            ...prev[guruKey],
            guruId: selectedGuru.id,
            nama: selectedGuru.label,
            jabatan: selectedGuru.jabatan
          }
        };
      });

      // Update guruPenugasan untuk preview
      setGuruPenugasan(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          id: selectedGuru.id,
          nama: selectedGuru.label,
          jabatan: selectedGuru.jabatan,
          guruId: selectedGuru.id
        };
        return updated;
      });
    }
  };

  // Handle perubahan input manual guru
  const handleGuruInputChange = (index, field, value) => {
    setFormData(prev => {
      const guruKey = `guru${index + 1}`;
      return {
        ...prev,
        [guruKey]: {
          ...prev[guruKey],
          [field]: value,
          // Reset guruId jika diubah manual
          ...(field === 'nama' ? { guruId: '' } : {})
        }
      };
    });
  };

  const handleSaveSuratTugas = () => {
    // Validasi minimal ada 1 guru dengan nama
    const hasValidGuru = guruPenugasan.some(guru => guru.nama.trim() !== '');
    if (!hasValidGuru) {
      toast.error("Minimal harus ada 1 guru yang ditugaskan");
      return;
    }

    // Validasi nomor surat
    if (!formData.nomorSurat.trim()) {
      toast.error("Nomor surat harus diisi");
      return;
    }

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
    const updatedGuru = guruPenugasan.map((guru, i) => {
      const formGuru = formData[`guru${i + 1}`];
      return {
        ...guru,
        nama: formGuru?.nama || guru.nama,
        jabatan: formGuru?.jabatan || guru.jabatan,
        dinas: formGuru?.dinas || guru.dinas
      };
    });
    
    setGuruPenugasan(updatedGuru);

    // Tambahkan ke daftar surat
    const newSurat = {
      id: suratList.length + 1,
      nomorSurat: formData.nomorSurat,
      keperluan: formData.keperluan,
      tempat: formData.tempat,
      tanggal: new Date().toLocaleDateString('id-ID'),
      guru: updatedGuru.map(g => g.nama).filter(Boolean).join(', '),
      status: "Selesai"
    };

    setSuratList(prev => [newSurat, ...prev]);
    
    toast.success("Surat tugas berhasil disimpan!");
  };

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
      // Tambahkan logo jika ada (baik default maupun custom)
      if (logo.preview) {
        try {
          // Untuk logo default (import) dan custom (base64) bisa langsung digunakan
          doc.addImage(logo.preview, 'PNG', marginLeft, yPosition, 20, 20);
        } catch (err) {
          console.warn("Gagal menambahkan logo ke PDF:", err);
          // Fallback jika error
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

      // ===== SAVE PDF =====
      const fileName = `Surat_Tugas_${formData.nomorSurat.replace(/\//g, '_')}.pdf`;
      doc.save(fileName);

      toast.success("PDF berhasil diunduh!");

    } catch (error) {
      console.error("❌ Error generating PDF:", error);
      toast.error("Gagal membuat PDF. Silakan coba lagi.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Filter daftar surat berdasarkan query
  const filteredSurat = suratList.filter(surat =>
    surat.nomorSurat.toLowerCase().includes(query.toLowerCase()) ||
    surat.keperluan.toLowerCase().includes(query.toLowerCase()) ||
    surat.tempat.toLowerCase().includes(query.toLowerCase()) ||
    surat.guru.toLowerCase().includes(query.toLowerCase())
  );

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
                  Surat Tugas
                </h2>
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

          {/* KONTEN UTAMA - PREVIEW DAN FORM */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* KOLOM KIRI: PREVIEW SURAT */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Preview Surat Tugas</h3>
                <span className="text-sm text-gray-500">
                  Logo: {logo.type === 'default' ? 'Default' : 'Custom'}
                </span>
              </div>

              <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
                {/* KOP SURAT */}
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src={logo.preview} 
                    alt="Logo SMK" 
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      // Fallback jika logo error
                      e.target.src = logoSmk;
                    }}
                  />
                  <div className="text-center flex-1">
                    <p className="font-bold text-lg">PEMERINTAH PROVINSI JAWA TIMUR</p>
                    <p className="font-bold text-lg">DINAS PENDIDIKAN</p>
                    <p className="font-bold text-lg">SMK NEGERI 2 SINGOSARI</p>
                    <p className="text-sm mt-1 text-gray-600">
                      Jalan Perusahaan No. 20, Tunjungtirto, Singosari, Malang, Jawa Timur, 65153
                    </p>
                    <p className="text-sm text-gray-600">Telepon (0341) 4345127</p>
                  </div>
                </div>

                <div className="border border-black my-3"></div>
                <div className="border border-black my-3 -mt-4"></div>

                {/* JUDUL */}
                <div className="text-center mb-6">
                  <p className="font-bold text-xl underline">SURAT TUGAS</p>
                  <p className="text-sm mt-1">Nomor : {dataSuratTugas.nomorSurat}</p>
                </div>

                {/* PENUGASAN */}
                <div className="mb-4">
                  <p>Kepala SMK Negeri 2 Singosari Dinas Pendidikan Kabupaten Malang</p>
                  <p>menugaskan kepada :</p>
                </div>

                {/* TABEL GURU */}
                <table className="w-full border-collapse border border-black mb-4">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-2 text-center text-sm">NO</th>
                      <th className="border border-black p-2 text-center text-sm">NAMA</th>
                      <th className="border border-black p-2 text-center text-sm">JABATAN</th>
                      <th className="border border-black p-2 text-center text-sm">DINAS</th>
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
                <div className="space-y-2 mb-6">
                  <p><span className="font-semibold">Keperluan</span> : {dataSuratTugas.keperluan}</p>
                  <p><span className="font-semibold">Hari / Tanggal</span> : {dataSuratTugas.hariTanggal}</p>
                  <p><span className="font-semibold">Waktu</span> : {dataSuratTugas.waktu}</p>
                  <p><span className="font-semibold">Tempat</span> : {dataSuratTugas.tempat}</p>
                  <p><span className="font-semibold">Alamat</span> : {dataSuratTugas.alamat}</p>
                </div>

                {/* PENUTUP */}
                <div className="mb-6">
                  <p>Demikian surat tugas ini dibuat untuk dilaksanakan dengan sebaik-baiknya</p>
                  <p>dan melaporkan hasilnya kepada kepala sekolah.</p>
                </div>

                {/* TANDA TANGAN */}
                <div className="text-right">
                  <p>Singosari, {dataSuratTugas.tanggalDibuat}</p>
                  <p className="mt-6">Kepala SMK Negeri 2 Singosari</p>
                  <p className="mt-12 font-bold">{dataSuratTugas.namaKepsek}</p>
                  <p className="text-sm">NIP. {dataSuratTugas.nipKepsek}</p>
                </div>
              </div>
            </div>

            {/* KOLOM KANAN: FORM EDIT */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Form Input Surat Tugas</h3>
              
              <div className="space-y-6">
                {/* DATA UMUM */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Data Surat</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nomor Surat <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nomorSurat"
                        value={formData.nomorSurat}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: 800/123/SMK.2/2024"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Keperluan <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="keperluan"
                        value={formData.keperluan}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="2"
                        placeholder="Contoh: Pengantaran Siswa Praktik Kerja Lapangan (PKL)"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hari / Tanggal <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="hariTanggal"
                          value={formData.hariTanggal}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Contoh: Senin, 1 Juli 2024"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Waktu <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="waktu"
                          value={formData.waktu}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Contoh: 08.00 - Selesai"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tempat <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="tempat"
                        value={formData.tempat}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: BACAMALANG.COM"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alamat <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="alamat"
                        value={formData.alamat}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="2"
                        placeholder="Contoh: JL. MOROJANTEK NO. 87 B, PANGENTAN, KEC. SINGOSARI, KAB. MALANG"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Dibuat Surat <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="tanggalDibuat"
                        value={formData.tanggalDibuat}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: 1 Juli 2024"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* DATA GURU - HANYA PEMBIMBING */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-700">Data Guru yang Ditugaskan</h4>
                      <p className="text-xs text-gray-500 mt-1">Hanya menampilkan guru pembimbing</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleTambahGuru}
                      className="flex items-center gap-1 px-3 py-1.5 !bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      <Plus size={16} />
                      Tambah Guru
                    </button>
                  </div>

                  {guruPenugasan.map((guru, index) => (
                    <div key={index} className="mb-4 p-3 bg-white rounded border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium text-gray-600">Guru {index + 1}</h5>
                        {guruPenugasan.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleHapusGuru(index)}
                            className="flex items-center gap-1 !bg-transparent !text-red-600 hover:text-red-800 text-sm"
                          >
                            <Trash2 size={14} />
                            Hapus
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Pilih Guru Pembimbing <span className="text-red-500">*</span></label>
                          <select
                            value={formData[`guru${index + 1}`]?.guruId || ""}
                            onChange={(e) => handleGuruSelectChange(index, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Pilih Guru Pembimbing</option>
                            {loadingGuru ? (
                              <option value="" disabled>Memuat data guru pembimbing...</option>
                            ) : guruList.length === 0 ? (
                              <option value="" disabled>Tidak ada guru pembimbing tersedia</option>
                            ) : (
                              guruList.map((guruItem) => (
                                <option key={guruItem.id} value={guruItem.id}>
                                  {guruItem.label} {guruItem.nip ? `(${guruItem.nip})` : ''}
                                </option>
                              ))
                            )}
                          </select>
                          
                          {/* Tampilkan jumlah guru pembimbing */}
                          {!loadingGuru && guruList.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {guruList.length} guru pembimbing tersedia
                            </p>
                          )}
                          
                          {/* Input manual jika tidak dipilih dari dropdown */}
                          <div className="mt-2">
                            <label className="block text-sm text-gray-600 mb-1">Atau Ketik Manual</label>
                            <input
                              type="text"
                              value={formData[`guru${index + 1}`]?.nama || ""}
                              onChange={(e) => handleGuruInputChange(index, 'nama', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Nama Guru"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Jabatan <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={formData[`guru${index + 1}`]?.jabatan || ""}
                              onChange={(e) => handleGuruInputChange(index, 'jabatan', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Contoh: Guru Pembimbing"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Dinas <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={formData[`guru${index + 1}`]?.dinas || ""}
                              onChange={(e) => handleGuruInputChange(index, 'dinas', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Contoh: SMK Negeri 2 Singosari"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    <span className="text-red-500">*</span> Hanya menampilkan guru dengan status pembimbing. Data diambil dari sistem.
                  </div>
                </div>

                {/* DATA KEPALA SEKOLAH */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Data Kepala Sekolah</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Kepala Sekolah <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="namaKepsek"
                        value={formData.namaKepsek}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: SUMIAH, S.PD., M.SI."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NIP Kepala Sekolah <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nipKepsek"
                        value={formData.nipKepsek}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: 19700210 199802 2009"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* TOMBOL AKSI */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={handleSaveSuratTugas}
                    className="flex items-center gap-2 px-6 py-3 !bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    <Save size={18} />
                    Simpan Surat
                  </button>
                  <button
                    onClick={handlePrintPDF}
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