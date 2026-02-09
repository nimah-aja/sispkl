import React, { useState, useEffect } from 'react';
import { Save, Download, Upload, X } from 'lucide-react';
import toast from "react-hot-toast";
import jsPDF from 'jspdf';
import logoSmk from "../assets/LOGOPROV.png";

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";

export default function Penilaian() {
  const [active, setActive] = useState("penilaian");
  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Koordinator",
  };

  // State untuk logo
  const [logo, setLogo] = useState({
    file: null,
    preview: localStorage.getItem('penilaian_logo_preview') || logoSmk,
    type: 'default'
  });

  const [showLogoModal, setShowLogoModal] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // State untuk data surat penilaian
  const [formData, setFormData] = useState({
  namaPesertaDidik: "",
  nisn: "",
  kelas: "",
  programKeahlian: "",
  konsentrasiKeahlian: "",
  tempat: "SMK Negeri 2 Singosari", // bisa tetap default
  tanggalMulai: "",
  tanggalSelesai: "",
  namaInstruktur: "",
  namaPembimbing: ""
});


  // State untuk nilai/skor setiap aspek penilaian
  const [penilaian, setPenilaian] = useState([
    {
      id: 1,
      aspek: "Menerapkan Soft skills yang dibutuhkan dalam dunia kerja (tempat PKL).",
      skor: "<75 (kurang)",
      deskripsi: "Peserta didik mampu menerapkan soft skill yang dimiliki dengan menunjukkan integritas (jujur, disiplin, komitmen, dan tanggung jawab), memiliki etos kerja, menunjukkan kemandirian, menunjukkan kerja sama, dan menunjukkan kepedulian sosial dan lingkungan dengan predikat kurang."
    },
    {
      id: 2,
      aspek: "Menerapkan norma ,POS, dan K3LH yang ada pada dunia kerja (tempat PKL).",
      skor: "<75 (kurang)",
      deskripsi: "Peserta didik mampu menerapkan norma, Prosedur Operasional Standar (POS), dan Kesehatan, Keselamatan Kerja, dan Lingkungan Hidup (K3LH) yang ditunjukkan dengan menggunakan APD dengan tertib dan benar, serta melaksanakan pekerjaan sesuai POS dengan predikat kurang."
    },
    {
      id: 3,
      aspek: "Menerapkan kompetensi teknis yang sudah dipelajari di sekolah dan/atau baru dipelajari pada dunia kerja (tempat PKL).",
      skor: "<75 (kurang)",
      deskripsi: "Peserta didik mampu menerapkan kompetensi teknis yang sudah dipelajari di sekolah dan/atau baru dipelajari di dunia kerja (tempat PKL) dengan predikat kurang."
    },
    {
      id: 4,
      aspek: "Memahami alur bisnis dunia kerja tempat PKL dan wawasan wirausaha.",
      skor: "<75 (kurang)",
      deskripsi: "Peserta didik mampu memahami alur bisnis dunia kerja tempat PKL dan wawasan wirausaha dengan predikat kurang."
    }
  ]);

  // State untuk kehadiran
  const [kehadiran, setKehadiran] = useState({
    sakit: "-",
    izin: "-",
    tanpaKeterangan: "-"
  });

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

        localStorage.setItem('penilaian_logo_preview', logoDataUrl);
        localStorage.setItem('penilaian_logo_type', 'custom');

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

    localStorage.removeItem('penilaian_logo_preview');
    localStorage.removeItem('penilaian_logo_type');

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

  // Handle perubahan kehadiran
  const handleKehadiranChange = (e) => {
    const { name, value } = e.target;
    setKehadiran(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle perubahan penilaian
  const handlePenilaianChange = (id, field, value) => {
    setPenilaian(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Simpan data
  const handleSaveData = () => {
    toast.success("Data penilaian berhasil disimpan!");
  };


  // Generate PDF
  const handleGeneratePDF = () => {
    setGeneratingPDF(true);

    try {
      const doc = new jsPDF("p", "mm", "a4");
      let y = 15;

      // ================= KOP =================
      // Logo
      if (logo.preview) {
        try {
          doc.addImage(logo.preview, 'PNG', 15, y, 18, 18);
        } catch (err) {
          console.warn("Gagal menambahkan logo:", err);
        }
      }

      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.text("PEMERINTAH PROVINSI JAWA TIMUR", 105, y, { align: "center" });
      y += 5;
      doc.text("DINAS PENDIDIKAN", 105, y, { align: "center" });
      y += 5;
      doc.text("SMK NEGERI 2 SINGOSARI", 105, y, { align: "center" });

      doc.setFontSize(9);
      doc.setFont("times", "normal");
      y += 4;
      doc.text(
        "Jalan Perusahaan No. 20, Tunjungtirto, Singosari, Malang, Jawa Timur 65153",
        105,
        y,
        { align: "center" }
      );
      y += 4;
      doc.text("Telepon (0341) 4345127", 105, y, { align: "center" });

      doc.setLineWidth(1);
      doc.line(15, y + 3, 195, y + 3);
      doc.setLineWidth(0.3);
      doc.line(15, y + 5, 195, y + 5);

      y += 15;

      // ================= JUDUL =================
      doc.setFontSize(11);
      doc.setFont("times", "bold");
      doc.text("DAFTAR NILAI PESERTA DIDIK", 105, y, { align: "center" });
      y += 6;
      doc.text("MATA PELAJARAN PKL", 105, y, { align: "center" });
      y += 6;
      doc.text("SMK NEGERI 2 SINGOSARI", 105, y, { align: "center" });
      y += 6;
      doc.text("TAHUN AJARAN 2025/2026", 105, y, { align: "center" });

      y += 10;
      doc.setFont("times", "normal");
      doc.setFontSize(10);

      // ================= IDENTITAS =================
      const identitas = [
        { label: "Nama Peserta Didik", value: formData.namaPesertaDidik },
        { label: "NISN", value: formData.nisn },
        { label: "Kelas", value: formData.kelas },
        { label: "Program Keahlian", value: formData.programKeahlian },
        { label: "Konsentrasi Keahlian", value: formData.konsentrasiKeahlian },
        { label: "Tempat PKL", value: formData.tempat },
        { label: "Tanggal PKL", value: `Mulai: ${formData.tanggalMulai}  Selesai: ${formData.tanggalSelesai}` },
        { label: "Nama Instruktur", value: formData.namaInstruktur },
        { label: "Nama Pembimbing", value: formData.namaPembimbing }
      ];

      identitas.forEach(item => {
        doc.setFont("times", "bold");
        doc.text(`${item.label}`, 20, y);
        doc.setFont("times", "normal");
        doc.text(`: ${item.value}`, 65, y);
        y += 6;
      });

      y += 5;

      // ================= TABEL NILAI =================
      doc.setFont("times", "bold");
      doc.setFontSize(9);

      const col = [10, 90, 20, 65];
      const header = ["NO", "TUJUAN PEMBELAJARAN", "SKOR", "DESKRIPSI"];
      let x = 15;

      header.forEach((h, i) => {
        doc.rect(x, y, col[i], 8);
        doc.text(h, x + col[i] / 2, y + 5, { align: "center" });
        x += col[i];
      });

      y += 8;
      doc.setFont("times", "normal");

      penilaian.forEach((item, i) => {
        x = 15;
        const rowHeight = 25;

        doc.rect(x, y, col[0], rowHeight);
        doc.text(String(i + 1), x + 4, y + 5);
        x += col[0];

        doc.rect(x, y, col[1], rowHeight);
        const aspekLines = doc.splitTextToSize(item.aspek, col[1] - 4);
        aspekLines.forEach((line, idx) => {
          doc.text(line, x + 2, y + 5 + (idx * 4));
        });
        x += col[1];

        doc.rect(x, y, col[2], rowHeight);
        doc.text(item.skor.split(" ")[0], x + col[2] / 2, y + 5, { align: "center" });
        x += col[2];

        doc.rect(x, y, col[3], rowHeight);
        const deskripsiLines = doc.splitTextToSize(item.deskripsi, col[3] - 4);
        deskripsiLines.slice(0, 6).forEach((line, idx) => {
          doc.text(line, x + 2, y + 5 + (idx * 3.5));
        });

        y += rowHeight;
      });

      // ================= TOTAL =================
      doc.setFont("times", "bold");
      doc.rect(15, y, 120, 8);
      doc.text("Total Skor", 20, y + 5);
      doc.rect(135, y, 60, 8);
      y += 8;

      doc.rect(15, y, 120, 8);
      doc.text("Nilai Akhir (Rata-rata Skor)", 20, y + 5);
      doc.rect(135, y, 60, 8);

      y += 12;
      doc.setFont("times", "normal");
      doc.setFontSize(9);
      doc.text(
        "Catatan:",
        15,
        y
      );

      // ================= HALAMAN 2 =================
      doc.addPage();
      y = 15;

      // KOP Halaman 2
      if (logo.preview) {
        try {
          doc.addImage(logo.preview, 'PNG', 15, y, 18, 18);
        } catch (err) {
          console.warn("Gagal menambahkan logo:", err);
        }
      }

      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.text("PEMERINTAH PROVINSI JAWA TIMUR", 105, y, { align: "center" });
      y += 5;
      doc.text("DINAS PENDIDIKAN", 105, y, { align: "center" });
      y += 5;
      doc.text("SMK NEGERI 2 SINGOSARI", 105, y, { align: "center" });

      doc.setFontSize(9);
      doc.setFont("times", "normal");
      y += 4;
      doc.text(
        "Jalan Perusahaan No. 20, Tunjungtirto, Singosari, Malang, Jawa Timur 65153",
        105,
        y,
        { align: "center" }
      );
      y += 4;
      doc.text("Telepon (0341) 4345127", 105, y, { align: "center" });

      doc.setLineWidth(1);
      doc.line(15, y + 3, 195, y + 3);
      doc.setLineWidth(0.3);
      doc.line(15, y + 5, 195, y + 5);

      y += 15;

      // KEHADIRAN
      doc.setFont("times", "bold");
      doc.setFontSize(10);
      doc.text("KEHADIRAN", 15, y);
      y += 6;

      doc.setFont("times", "normal");
      const hadir = [
        { label: "Sakit", value: kehadiran.sakit },
        { label: "Izin", value: kehadiran.izin },
        { label: "Tanpa Keterangan", value: kehadiran.tanpaKeterangan }
      ];

      hadir.forEach(h => {
        doc.rect(15, y, 40, 8);
        doc.text(h.label, 17, y + 5);
        doc.rect(55, y, 10, 8);
        doc.text(":", 58, y + 5);
        doc.rect(65, y, 20, 8);
        doc.text(h.value, 70, y + 5);
        doc.rect(85, y, 20, 8);
        doc.text("Hari", 90, y + 5);
        y += 8;
      });

      y += 20;

      // Tanda tangan
      doc.setFont("times", "bold");
      doc.text("Guru Mapel PKL,", 35, y);
      doc.text("Singosari,", 140, y - 8);
      doc.text("Instruktur Dunia Kerja,", 130, y);

      y += 25;
      doc.text("(............................)", 30, y);
      doc.text("(............................)", 130, y);

      doc.save("Daftar_Nilai_PKL.pdf");
      toast.success("PDF berhasil diunduh!");

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Gagal membuat PDF. Silakan coba lagi.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
        {/* SIDEBAR */}
        <Sidebar active={active} setActive={setActive} />
    
        {/* CONTENT AREA */}
        <div className="flex flex-col flex-1">
          <Header user={user} />
    
          <main className="flex-1 p-4 sm:p-6 md:p-10 bg-[#641E21] rounded-tl-3xl shadow-inner overflow-y-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-white font-bold text-base sm:text-lg">
                  Daftar Nilai Peserta Didik
                </h2>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoModal(true)}
                  className="flex items-center gap-2 px-4 py-2 !bg-white !text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <Upload size={18} />
                  Unggah Logo
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
            {/* KOLOM KIRI: PANDUAN SKOR DAN PREVIEW */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Panduan Skor dan Deskripsi</h3>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 space-y-4 max-h-[600px] overflow-y-auto">
                {/* Panduan untuk setiap aspek penilaian */}
                {[
                  {
                    title: "1. Menerapkan Soft skills yang dibutuhkan dalam dunia kerja (tempat PKL).",
                    scores: [
                      { range: "<75 (kurang)", desc: "Peserta didik mampu menerapkan soft skill yang dimiliki dengan menunjukkan integritas (jujur, disiplin, komitmen, dan tanggung jawab), memiliki etos kerja, menunjukkan kemandirian, menunjukkan kerja sama, dan menunjukkan kepedulian sosial dan lingkungan dengan predikat kurang." },
                      { range: "75-85 (baik)", desc: "Peserta didik mampu menerapkan soft skill yang dimiliki dengan menunjukkan integritas (jujur, disiplin, komitmen, dan tanggung jawab), memiliki etos kerja, menunjukkan kemandirian, menunjukkan kerja sama, dan menunjukkan kepedulian sosial dan lingkungan dengan predikat baik." },
                      { range: "86-100 (sangat baik)", desc: "Peserta didik mampu menerapkan soft skill yang dimiliki dengan menunjukkan integritas (jujur, disiplin, komitmen, dan tanggung jawab), memiliki etos kerja, menunjukkan kemandirian, menunjukkan kerja sama, dan menunjukkan kepedulian sosial dan lingkungan dengan predikat sangat baik." }
                    ]
                  },
                  {
                    title: "2. Menerapkan norma ,POS, dan K3LH yang ada pada dunia kerja (tempat PKL).",
                    scores: [
                      { range: "<75 (kurang)", desc: "Peserta didik mampu menerapkan norma, Prosedur Operasional Standar (POS), dan Kesehatan, Keselamatan Kerja, dan Lingkungan Hidup (K3LH) yang ditunjukkan dengan menggunakan APD dengan tertib dan benar, serta melaksanakan pekerjaan sesuai POS dengan predikat kurang." },
                      { range: "75-85 (baik)", desc: "Peserta didik mampu menerapkan norma, Prosedur Operasional Standar (POS), dan Kesehatan, Keselamatan Kerja, dan Lingkungan Hidup (K3LH) yang ditunjukkan dengan menggunakan APD dengan tertib dan benar, serta melaksanakan pekerjaan sesuai POS dengan predikat baik." },
                      { range: "86-100 (sangat baik)", desc: "Peserta didik mampu menerapkan norma, Prosedur Operasional Standar (POS), dan Kesehatan, Keselamatan Kerja, dan Lingkungan Hidup (K3LH) yang ditunjukkan dengan menggunakan APD dengan tertib dan benar, serta melaksanakan pekerjaan sesuai POS dengan predikat sangat baik." }
                    ]
                  },
                  {
                    title: "3. Menerapkan kompetensi teknis yang sudah dipelajari di sekolah dan/atau baru dipelajari pada dunia kerja (tempat PKL).",
                    scores: [
                      { range: "<75 (kurang)", desc: "Peserta didik mampu menerapkan kompetensi teknis yang sudah dipelajari di sekolah dan/atau baru dipelajari di dunia kerja (tempat PKL) dengan predikat kurang." },
                      { range: "75-85 (baik)", desc: "Peserta didik mampu menerapkan kompetensi teknis yang sudah dipelajari di sekolah dan/atau baru dipelajari di dunia kerja (tempat PKL) dengan predikat baik." },
                      { range: "86-100 (sangat baik)", desc: "Peserta didik mampu menerapkan kompetensi teknis yang sudah dipelajari di sekolah dan/atau baru dipelajari di dunia kerja (tempat PKL) dengan predikat sangat baik." }
                    ]
                  },
                  {
                    title: "4. Memahami alur bisnis dunia kerja tempat PKL dan wawasan wirausaha.",
                    scores: [
                      { range: "<75 (kurang)", desc: "Peserta didik mampu memahami alur bisnis dunia kerja tempat PKL dan wawasan wirausaha dengan predikat kurang." },
                      { range: "75-85 (baik)", desc: "Peserta didik mampu memahami alur bisnis dunia kerja tempat PKL dan wawasan wirausaha dengan predikat baik." },
                      { range: "86-100 (sangat baik)", desc: "Peserta didik mampu memahami alur bisnis dunia kerja tempat PKL dan wawasan wirausaha dengan predikat sangat baik." }
                    ]
                  }
                ].map((item, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 p-3 font-semibold text-sm">{item.title}</div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border-b border-r border-gray-200 p-2 text-left w-1/3">&lt;75 (kurang)</th>
                          <th className="border-b border-r border-gray-200 p-2 text-left w-1/3">75-85 (baik)</th>
                          <th className="border-b border-gray-200 p-2 text-left w-1/3">86-100 (sangat baik)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {item.scores.map((score, sIdx) => (
                            <td key={sIdx} className={`p-2 align-top ${sIdx < 2 ? 'border-r border-gray-200' : ''}`}>
                              {score.desc}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>

            {/* KOLOM KANAN: FORM INPUT */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ubah Surat Daftar Nilai Peserta Didik</h3>

              <div className="space-y-6">
                {/* Data Surat */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Data Surat</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Peserta Didik
                      </label>
                      <input
                        type="text"
                        name="namaPesertaDidik"
                        value={formData.namaPesertaDidik}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="-"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          NISN
                        </label>
                        <input
                          type="text"
                          name="nisn"
                          value={formData.nisn}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="-"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kelas
                        </label>
                        <input
                          type="text"
                          name="kelas"
                          value={formData.kelas}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="-"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Program Keahlian
                        </label>
                        <input
                          type="text"
                          name="programKeahlian"
                          value={formData.programKeahlian}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="-"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Konsentrasi Keahlian
                        </label>
                        <input
                          type="text"
                          name="konsentrasiKeahlian"
                          value={formData.konsentrasiKeahlian}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="-"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tempat
                      </label>
                      <input
                        type="text"
                        name="tempat"
                        value={formData.tempat}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="SMK Negeri 2 Singosari"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tanggal Mulai
                        </label>
                        <input
                          type="text"
                          name="tanggalMulai"
                          value={formData.tanggalMulai}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="-"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tanggal Selesai
                        </label>
                        <input
                          type="text"
                          name="tanggalSelesai"
                          value={formData.tanggalSelesai}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="-"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Instruktur
                      </label>
                      <input
                        type="text"
                        name="namaInstruktur"
                        value={formData.namaInstruktur}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="-"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Pembimbing
                      </label>
                      <input
                        type="text"
                        name="namaPembimbing"
                        value={formData.namaPembimbing}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="-"
                      />
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={handleSaveData}
                    className="flex items-center gap-2 px-6 py-3 !bg-[#641E21] text-white rounded-lg hover:bg-[#4a1618] font-semibold"
                  >
                    <Save size={18} />
                    Simpan Surat
                  </button>
                  <button
                    onClick={handleGeneratePDF}
                    disabled={generatingPDF}
                    className="flex items-center gap-2 px-6 py-3 !bg-[#641E21] text-white rounded-lg hover:bg-[#4a1618] font-semibold disabled:opacity-50"
                  >
                    <Download size={18} />
                    {generatingPDF ? 'Memproses...' : 'Download PDF'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PREVIEW SURAT - Di kiri bawah */}
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Pratinjau Daftar Nilai Peserta Didik</h3>

            <div>
              {/* HALAMAN 1 - NILAI */}
              <div className="p-6 border border-gray-300 bg-white shadow-sm">
                {/* Kop Surat */}
                <div className="flex items-start justify-between border-b-4 border-black pb-2 mb-1 border-double">
                                <div className="flex-shrink-0 -mt-2 -ml-2">
                                  <img src={logoSmk} alt="Logo" className="w-24 h-auto object-contain" />
                                </div>
                                <div className="flex-1 text-center -ml-10">
                                    <p className="font-bold text-sm uppercase">PEMERINTAH PROVINSI JAWA TIMUR</p>
                                    <p className="font-bold text-sm uppercase">DINAS PENDIDIKAN</p>
                                    <p className="font-bold text-lg uppercase tracking-wider">SMK NEGERI 2 SINGOSARI</p>
                                    <p className="text-[10px]">Jalan Perusahaan No. 20, Tunjungtirto, Singosari, Kab. Malang, Jawa Timur, 65153</p>
                                    <p className="text-[10px]">Telepon (0341) 4345127</p>
                                </div>
                              </div>
                              <div className="border-t border-gray-300 -mt-1 mb-2"></div>

                {/* Judul */}
                <div className="text-center mb-6">
                  <p className="font-bold text-base">DAFTAR NILAI PESERTA DIDIK</p>
                  <p className="font-bold text-sm">MATA PELAJARAN PKL</p>
                  <p className="font-bold text-sm">SMK NEGERI 2 SINGOSARI</p>
                  <p className="font-bold text-sm">TAHUN AJARAN 2025/2026</p>
                </div>

                {/* Identitas */}
                <div className="mb-6 text-sm space-y-1">
                  <p><span className="font-bold inline-block w-44">Nama Peserta Didik</span>: 
                  {formData.namaPesertaDidik}
                  
                  </p>
                  <p><span className="font-bold inline-block w-44">NISN</span>: 
                  
                  {formData.nisn}
                  </p>
                  <p><span className="font-bold inline-block w-44">Kelas</span>: 
                  
                  {formData.kelas}
                  </p>
                  <p><span className="font-bold inline-block w-44">Program Keahlian</span>: 
                  {formData.programKeahlian}
                  </p>
                  <p><span className="font-bold inline-block w-44">Konsentrasi Keahlian</span>:
                   {formData.konsentrasiKeahlian}
                   </p>
                  <p><span className="font-bold inline-block w-44">Tempat PKL</span>: 
                  
                  {formData.tempat}
                  </p>
                  <p><span className="font-bold inline-block w-44">Tanggal PKL</span>: Mulai: 
                  {formData.tanggalMulai} 
                  <span className="ml-8">Selesai: 
                    {formData.tanggalSelesai}
                    </span></p>
                  <p><span className="font-bold inline-block w-44">Nama Instruktur</span>: 
                  {formData.namaInstruktur}
                  </p>
                  <p><span className="font-bold inline-block w-44">Nama Pembimbing</span>:
                   {formData.namaPembimbing}
                   </p>
                </div>

                {/* Tabel Nilai */}
                <table className="w-full border-collapse border border-black mb-4 text-sm">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-black p-2 text-center font-bold" style={{ width: '40%' }}>TUJUAN PEMBELAJARAN</th>
                      <th className="border border-black p-2 text-center font-bold" style={{ width: '15%' }}>SKOR</th>
                      <th className="border border-black p-2 text-center font-bold" style={{ width: '45%' }}>DESKRIPSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {penilaian.map((item, index) => (
                      <tr key={item.id}>
                        <td className="border border-black p-2 align-top text-sm">{index + 1}. {item.aspek}</td>
                        <td className="border border-black p-2 text-center align-top">
                          {item.skor}
                          </td>
                        <td className="border border-black p-2 align-top text-sm">
                          {item.deskripsi}
                          
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Total */}
                <table className="w-full border-collapse border border-black mb-4 text-sm">
                  <tbody>
                    <tr>
                      <td className="border border-black p-2 font-bold" style={{ width: '55%' }}>Total Skor</td>
                      <td className="border border-black p-2"></td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 font-bold">Nilai Akhir (Rata-rata Skor)</td>
                      <td className="border border-black p-2"></td>
                    </tr>
                  </tbody>
                </table>

                <p className="text-sm">
                  Catatan: 
                </p>
              </div>

              {/* HALAMAN 2 - KEHADIRAN */}
              <div className="p-6 border border-gray-300 bg-white shadow-sm mt-6">
                {/* Kop Surat Halaman 2 */}
                <div className="flex items-start justify-between border-b-4 border-black pb-2 mb-1 border-double">
                                <div className="flex-shrink-0 -mt-2 -ml-2">
                                  <img src={logoSmk} alt="Logo" className="w-24 h-auto object-contain" />
                                </div>
                                <div className="flex-1 text-center -ml-10">
                                    <p className="font-bold text-sm uppercase">PEMERINTAH PROVINSI JAWA TIMUR</p>
                                    <p className="font-bold text-sm uppercase">DINAS PENDIDIKAN</p>
                                    <p className="font-bold text-lg uppercase tracking-wider">SMK NEGERI 2 SINGOSARI</p>
                                    <p className="text-[10px]">Jalan Perusahaan No. 20, Tunjungtirto, Singosari, Kab. Malang, Jawa Timur, 65153</p>
                                    <p className="text-[10px]">Telepon (0341) 4345127</p>
                                </div>
                              </div>
                              <div className="border-t border-gray-300 -mt-1 mb-2"></div>

          

                {/* Tabel KEHADIRAN */}
                <div className="mb-8">
                  <table className="border-collapse border border-black text-xs">
                    <thead>
                      <tr>
                        <th colSpan="3" className="border border-black p-2 text-center font-bold bg-gray-100">KEHADIRAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-2 w-32">Sakit</td>
                        <td className="border border-black p-2 w-6 text-center">:</td>
                        <td className="border border-black p-2 w-16 text-center">
                          {kehadiran.sakit} 
                          Hari</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2">Izin</td>
                        <td className="border border-black p-2 text-center">:</td>
                        <td className="border border-black p-2 text-center">
                          {kehadiran.izin}
                           Hari</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2">Tanpa Keterangan</td>
                        <td className="border border-black p-2 text-center">:</td>
                        <td className="border border-black p-2 text-center">
                          {kehadiran.tanpaKeterangan} 
                          Hari</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tanda Tangan */}
                <div className="flex justify-between items-start mt-12">
                  <div className="text-center">
                    <p className="font-bold text-sm mb-16">Guru Mapel PKL,</p>
                    <p className="font-bold text-sm">(............................)</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm mb-1">Singosari,</p>
                    <p className="font-bold text-sm mb-14">Instruktur Dunia Kerja</p>
                    <p className="font-bold text-sm">(............................)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
