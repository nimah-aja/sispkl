import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Printer, Save } from "lucide-react";
import logoSmk from "../../assets/logo.png";

// components
import Sidebar from "./SidebarBiasa";
import Header from "./HeaderBiasa";

export default function DataPengajuan() {
  const [showModal, setShowModal] = useState(false);
  const [active, setActive] = useState("pengajuanPKL");
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
    guru1: { nama: "Inasni Dyah Rahmatika, S.Pd.", jabatan: "Guru", dinas: "SMK Negeri 2 Singosari" },
    guru2: { nama: "Budi Santoso, S.Kom.", jabatan: "Guru Kejuruan", dinas: "SMK Negeri 2 Singosari" }
  });

  // State untuk guru yang ditugaskan
  const [guruPenugasan, setGuruPenugasan] = useState([
    { id: 1, nama: "Inasni Dyah Rahmatika, S.Pd.", jabatan: "Guru", dinas: "SMK Negeri 2 Singosari" },
    { id: 2, nama: "Budi Santoso, S.Kom.", jabatan: "Guru Kejuruan", dinas: "SMK Negeri 2 Singosari" }
  ]);

  const user = {
    name: "Admin",
    role: "Koordinator",
  };

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

  // Simpan perubahan dan update preview
  const handleSave = () => {
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
    setGuruPenugasan([
      { id: 1, ...formData.guru1 },
      { id: 2, ...formData.guru2 }
    ]);

    alert("Data berhasil disimpan!");
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

      // Logo
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

      // Spasi
      yPosition += 10;

      //  JUDUL SURAT TUGAS 
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SURAT TUGAS", pageWidth / 2, yPosition, { align: 'center' });

      // Nomor Surat
      yPosition += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Nomor : ${dataSuratTugas.nomorSurat}`, pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 15;

      //  ISI SURAT 
      doc.setFontSize(11);
      doc.text("Kepala SMK Negeri 2 Singosari Dinas Pendidikan Kabupaten Malang", marginLeft, yPosition);
      yPosition += 6;
      doc.text("menugaskan kepada :", marginLeft, yPosition);

      yPosition += 10;

      // Tabel Guru yang Ditugaskan
      const tableHeaders = [['NO', 'NAMA', 'JABATAN', 'DINAS']];
      const tableBody = guruPenugasan.map((guru, index) => [
        `${index + 1}`,
        guru.nama,
        guru.jabatan,
        guru.dinas
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

      //  DATA PELAKSANAAN 
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

      //  PENUTUP SURAT 
      doc.text("Demikian surat tugas ini dibuat untuk dilaksanakan dengan sebaik-baiknya", marginLeft, yPosition);
      yPosition += 6;
      doc.text("dan melaporkan hasilnya kepada kepala sekolah.", marginLeft, yPosition);

      yPosition += 20;

      //  TANDA TANGAN 
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

      //  AUTO PRINT 
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
      console.error(" Error generating PDF:", error);
      alert("Gagal membuat PDF. Silakan coba lagi.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      <Sidebar active={active} setActive={setActive} />

      <div className="flex flex-col flex-1">
        <Header user={user} />

        <main className="flex-1 p-6 bg-[#641E21] rounded-tl-3xl">
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-white text-3xl font-bold mb-8">Surat Tugas Pengantaran Siswa PKL</h1>
            
            <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-lg">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#641E21] mb-4">Buat Surat Tugas</h2>
                <p className="text-gray-600 mb-6">
                  Klik tombol di bawah untuk membuka editor surat tugas pengantaran siswa PKL
                </p>
              </div>
              
              <button
                onClick={() => setShowModal(true)}
                className="!bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-3 mx-auto"
              >
                <Printer size={24} />
                Buka Editor Surat Tugas
              </button>
              
              <div className="mt-8 text-sm text-gray-500">
                <p>Anda dapat mengedit:</p>
                <ul className="list-disc list-inside text-left mt-2 space-y-1">
                  <li>Nomor Surat</li>
                  <li>Data Guru yang Ditugaskan</li>
                  <li>Keperluan dan Waktu</li>
                  <li>Tempat dan Alamat</li>
                  <li>Data Kepala Sekolah</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL POPUP EDITOR SURAT TUGAS */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-2xl font-bold text-gray-800">Editor Surat Tugas Pengantaran Siswa PKL</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Body - Split Layout */}
            <div className="flex h-[calc(90vh-80px)]">
              {/* KOLOM KIRI: PREVIEW SURAT */}
              <div className="w-1/2 border-r border-gray-200 overflow-y-auto p-6">
                <div className="sticky top-0 bg-white pb-4 z-10">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Preview Surat Tugas</h3>
                  <p className="text-sm text-gray-600">Preview akan otomatis update saat Anda menyimpan perubahan</p>
                </div>

                <div className="bg-white p-6 border border-gray-200 rounded-lg mt-4">
                  {/* KOP SURAT */}
                  <div className="text-center mb-6">
                    <p className="font-bold text-lg">PEMERINTAH PROVINSI JAWA TIMUR</p>
                    <p className="font-bold text-lg">DINAS PENDIDIKAN</p>
                    <p className="font-bold text-lg">SMK NEGERI 2 SINGOSARI</p>
                    <p className="text-sm mt-2">
                      Jalan Perusahaan No. 20, Tunjungtirto, Singosari, Malang, Jawa Timur, 65153<br />
                      Telepon (0341) 4345127
                    </p>
                  </div>

                  <hr className="border-black my-4" />

                  {/* JUDUL */}
                  <div className="text-center mb-8">
                    <p className="font-bold text-xl">SURAT TUGAS</p>
                    <p className="text-sm">Nomor : {dataSuratTugas.nomorSurat}</p>
                  </div>

                  {/* PENUGASAN */}
                  <div className="mb-6">
                    <p>Kepala SMK Negeri 2 Singosari Dinas Pendidikan Kabupaten Malang</p>
                    <p>menugaskan kepada :</p>
                  </div>

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
                        <tr key={index}>
                          <td className="border border-black p-2 text-center">{index + 1}</td>
                          <td className="border border-black p-2">{guru.nama}</td>
                          <td className="border border-black p-2">{guru.jabatan}</td>
                          <td className="border border-black p-2">{guru.dinas}</td>
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
                <div className="sticky top-0 bg-white pb-4 z-10">
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
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-3">Data Guru yang Ditugaskan</h4>

                    {[0, 1].map((index) => (
                      <div key={index} className="mb-4 p-3 bg-white rounded border border-gray-200">
                        <h5 className="font-medium text-gray-600 mb-2">Guru {index + 1}</h5>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Nama *</label>
                            <input
                              type="text"
                              value={formData[`guru${index + 1}`].nama}
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
                                value={formData[`guru${index + 1}`].jabatan}
                                onChange={(e) => handleGuruInputChange(index, 'jabatan', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Contoh: Guru"
                              />
                            </div>

                            <div>
                              <label className="block text-sm text-gray-600 mb-1">Dinas *</label>
                              <input
                                type="text"
                                value={formData[`guru${index + 1}`].dinas}
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
                      onClick={() => setShowModal(false)}
                      className="!bg-gray-500 text-white px-6 py-3 rounded-lg !text-md font-semibold hover:bg-gray-600 transition"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={handleSave}
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
    </div>
  );
}