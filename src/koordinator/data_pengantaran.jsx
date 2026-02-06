import React, { useState, useEffect } from "react";
import {
  Printer,
  Save,
  Plus,
  Trash2,
  FileText,
  Download,
  Search,
  Upload,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoProv from "../assets/LOGOPROV.png"; // Logo Provinsi

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";

// Import utils guru sesuai dengan yang Anda berikan
import { getGuru, mapGuruToUser } from "../utils/services/admin/get_guru";

export default function SuratPengantaranPage() {
  const [active, setActive] = useState("suratPengantaran");
  const [query, setQuery] = useState("");
  const [guruList, setGuruList] = useState([]);
  const [loadingGuru, setLoadingGuru] = useState(false);

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Koordinator",
  };

  // State untuk logo - hanya menggunakan LOGOPROV.png
  const [logo] = useState({
    preview: logoProv,
    type: "default",
  });

  // State untuk data surat tugas - SESUAI GAMBAR
  const [dataSuratTugas, setDataSuratTugas] = useState({
    nomorSurat: "800 / 376 / 101.6.9.19 /2025",
    keperluan: "Penjemputan Siswa Praktik Kerja Lapangan (PKL)",
    hariTanggal: "Rabu, 10 Desember 2025",
    waktu: "08.00 – Selesai",
    tempat: "JOTUN SINGOSARI",
    alamat: "Jl. Panglima Sudirman No.148 Kavling E2, Pangetan, Kec. Singosari, Kab. Malang, Jawa Timur 65153",
    tanggalDibuat: "03 Desember 2025",
    namaKepsek: "SUMIAH, S.Pd., M.Si.",
    pangkatGolongan: "Pembina Utama Muda (IV/c)",
    nipKepsek: "19700210 199802 2009",
  });

  // State untuk guru yang ditugaskan 
  const [guruPenugasan, setGuruPenugasan] = useState([
    {
      id: 1,
      nama: "Triana Ardiani, S.Pd",
      jabatan: "Guru",
      dinas: "SMK Negeri 2 Singosari",
      guruId: "",
    },
  ]);

  // State untuk form input 
  const [formData, setFormData] = useState({
    nomorSurat: "800 / 376 / 101.6.9.19 /2025",
    keperluan: "Penjemputan Siswa Praktik Kerja Lapangan (PKL)",
    hariTanggal: "Rabu, 10 Desember 2025",
    waktu: "08.00 – Selesai",
    tempat: "JOTUN SINGOSARI",
    alamat: "Jl. Panglima Sudirman No.148 Kavling E2, Pangetan, Kec. Singosari, Kab. Malang, Jawa Timur 65153",
    tanggalDibuat: "03 Desember 2025",
    namaKepsek: "SUMIAH, S.Pd., M.Si.",
    pangkatGolongan: "Pembina Utama Muda (IV/c)",
    nipKepsek: "19700210 199802 2009",
    guru1: {
      guruId: "",
      nama: "Triana Ardiani, S.Pd",
      jabatan: "Guru",
      dinas: "SMK Negeri 2 Singosari",
    },
  });

  // Data dummy untuk daftar surat
  const [suratList, setSuratList] = useState([
    {
      id: 1,
      nomorSurat: "800 / 376 / 101.6.9.19 /2025",
      keperluan: "Penjemputan Siswa PKL",
      tempat: "JOTUN SINGOSARI",
      tanggal: "03 Desember 2025",
      guru: "Triana Ardiani, S.Pd",
      status: "Selesai",
    },
    {
      id: 2,
      nomorSurat: "800 / 124 / SMK.2/2024",
      keperluan: "Monitoring Siswa PKL",
      tempat: "TOKO BUKU MURAH",
      tanggal: "5 Juli 2024",
      guru: "Budi Santoso, S.Pd.",
      status: "Pending",
    },
    {
      id: 3,
      nomorSurat: "800 / 125 / SMK.2/2024",
      keperluan: "Pengantaran Siswa PKL",
      tempat: "CV. MAJU JAYA",
      tanggal: "10 Juli 2024",
      guru: "Siti Aminah, S.Pd., M.Pd.",
      status: "Selesai",
    },
  ]);

  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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
      const pembimbingGuru = guruData.filter(
        (guru) => guru.is_pembimbing === true,
      );

      if (pembimbingGuru.length === 0) {
        toast.warning("Tidak ada data pembimbing guru yang tersedia");
      }

      // Format data untuk dropdown sesuai struktur dari API
      const formattedGuru = pembimbingGuru
        .map((guru) => {
          // Format gelar dengan benar
          const nama = guru.nama || "-";
          let gelar = "";

          // Tambahkan gelar jika ada
          if (guru.gelar) {
            gelar = guru.gelar.includes(",") ? guru.gelar : `, ${guru.gelar}`;
          }

          // Format jabatan
          let jabatan = "Guru";
          if (guru.jabatan) {
            if (
              guru.jabatan.toLowerCase().includes("kepala") ||
              guru.jabatan.toLowerCase().includes("kasek")
            ) {
              jabatan = "Kepala Sekolah";
            } else if (
              guru.jabatan.toLowerCase().includes("wakil") ||
              guru.jabatan.toLowerCase().includes("waka")
            ) {
              jabatan = "Wakil Kepala Sekolah";
            } else if (guru.jabatan.toLowerCase().includes("pembimbing")) {
              jabatan = "Guru";
            }
          }

          return {
            id: guru.id,
            value: guru.id,
            label: `${nama}${gelar}`,
            nama: nama,
            gelar: guru.gelar || "",
            jabatan: jabatan,
            nip: guru.nip || "-",
            kode_guru: guru.kode_guru || "-",
            no_telp: guru.no_telp || "-",
            is_pembimbing: guru.is_pembimbing || false,
          };
        })
        .sort((a, b) => a.nama.localeCompare(b.nama)); // Urutkan berdasarkan nama

      setGuruList(formattedGuru);

      // Jika ada data guru pembimbing, isi otomatis guru pertama
      if (formattedGuru.length > 0) {
        const firstGuru = formattedGuru[0];
        setFormData((prev) => ({
          ...prev,
          guru1: {
            guruId: firstGuru.id,
            nama: `${firstGuru.nama}${firstGuru.gelar ? ", " + firstGuru.gelar : ""}`,
            jabatan: firstGuru.jabatan,
            dinas: "SMK Negeri 2 Singosari",
          },
        }));

        setGuruPenugasan((prev) => {
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            id: firstGuru.id,
            nama: `${firstGuru.nama}${firstGuru.gelar ? ", " + firstGuru.gelar : ""}`,
            jabatan: firstGuru.jabatan,
            guruId: firstGuru.id,
          };
          return updated;
        });
      }
    } catch (error) {
      console.error("Error fetching guru list:", error);
      toast.error("Gagal memuat data guru");

      // Fallback data dummy jika API error (dummy pembimbing)
      setGuruList([
        {
          id: 1,
          value: 1,
          label: "Triana Ardiani, S.Pd",
          nama: "Triana Ardiani",
          gelar: "S.Pd",
          jabatan: "Guru",
          nip: "123456",
          is_pembimbing: true,
        },
        {
          id: 2,
          value: 2,
          label: "Budi Santoso, S.Pd., M.Pd.",
          nama: "Budi Santoso",
          gelar: "S.Pd., M.Pd.",
          jabatan: "Guru",
          nip: "234567",
          is_pembimbing: true,
        },
        {
          id: 3,
          value: 3,
          label: "Siti Aminah, S.Pd.",
          nama: "Siti Aminah",
          gelar: "S.Pd.",
          jabatan: "Guru",
          nip: "345678",
          is_pembimbing: true,
        },
      ]);
    } finally {
      setLoadingGuru(false);
    }
  };

  // Handle perubahan input form umum
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Format khusus untuk nama kepala sekolah
    if (name === "namaKepsek") {
      // Pastikan format gelar benar
      const formattedValue = value
        .replace(/\s*,\s*/g, ", ")
        .replace(/\s*\.\s*/g, ".");
      setFormData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle perubahan input guru 
  const handleGuruSelectChange = (guruId) => {
    const selectedGuru = guruList.find((g) => g.id === parseInt(guruId));

    if (selectedGuru) {
      setFormData((prev) => ({
        ...prev,
        guru1: {
          guruId: selectedGuru.id,
          nama: selectedGuru.label,
          jabatan: selectedGuru.jabatan,
          dinas: "SMK Negeri 2 Singosari",
        },
      }));

      // Update guruPenugasan untuk preview
      setGuruPenugasan((prev) => {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          id: selectedGuru.id,
          nama: selectedGuru.label,
          jabatan: selectedGuru.jabatan,
          guruId: selectedGuru.id,
        };
        return updated;
      });
    }
  };

  // Handle perubahan input manual guru
  const handleGuruInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      guru1: {
        ...prev.guru1,
        [field]: value,
        ...(field === "nama" ? { guruId: "" } : {}),
      },
    }));
  };

  const handleSaveSuratTugas = () => {
    // Validasi minimal ada 1 guru dengan nama
    const hasValidGuru = guruPenugasan.some((guru) => guru.nama.trim() !== "");
    if (!hasValidGuru) {
      toast.error("Harus ada 1 guru yang ditugaskan");
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
      pangkatGolongan: formData.pangkatGolongan,
      nipKepsek: formData.nipKepsek,
    });

    // Update guruPenugasan untuk preview
    setGuruPenugasan((prev) => {
      const updated = [...prev];
      updated[0] = {
        ...updated[0],
        nama: formData.guru1?.nama || "",
        jabatan: formData.guru1?.jabatan || "Guru",
        dinas: formData.guru1?.dinas || "SMK Negeri 2 Singosari",
      };
      return updated;
    });

    // Tambahkan ke daftar surat
    const newSurat = {
      id: suratList.length + 1,
      nomorSurat: formData.nomorSurat,
      keperluan: formData.keperluan,
      tempat: formData.tempat,
      tanggal: new Date().toLocaleDateString("id-ID"),
      guru: formData.guru1?.nama || "",
      status: "Selesai",
    };

    setSuratList((prev) => [newSurat, ...prev]);

    toast.success("Surat tugas berhasil disimpan!");
  };

  // Fungsi untuk generate dan print PDF 
  const handlePrintPDF = () => {
    setGeneratingPDF(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Set font Times New Roman
      doc.setFont("times", "normal");
      doc.setFontSize(12);

      const marginLeft = 25;
      const marginRight = 25;
      const pageWidth = 210;
      let yPosition = 30;

      //  KOP SURAT 
      // Logo di kiri (ukuran lebih besar sesuai gambar)
      if (logo.preview) {
        try {
          // Logo lebih besar sesuai gambar
          doc.addImage(logo.preview, "PNG", marginLeft, 15, 25, 35);
        } catch (err) {
          console.warn("Gagal menambahkan logo ke PDF:", err);
        }
      }

      // Header teks 
      const textStartX = marginLeft + 30; logo

      // PEMERINTAH PROVINSI JAWA TIMUR
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.text("PEMERINTAH PROVINSI JAWA TIMUR", pageWidth / 2, 25, {
        align: "center",
      });

      // DINAS PENDIDIKAN
      doc.text("DINAS PENDIDIKAN", pageWidth / 2, 32, { align: "center" });

      // SMK NEGERI 2 SINGOSARI
      doc.setFontSize(16);
      doc.text("SMK NEGERI 2 SINGOSARI", pageWidth / 2, 40, { align: "center" });

      // Alamat 
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.text(
        "Jalan Perusahaan No. 20, Tunjungtirto, Singosari, Kab. Malang, Jawa Timur, 65153",
        pageWidth / 2,
        48,
        { align: "center" },
      );
      doc.text("Telepon (0341) 4346127", pageWidth / 2, 54, {
        align: "center",
      });

      yPosition = 60;

      // Garis pemisah tipis 
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);

      yPosition += 15;

      //  JUDUL SURAT TUGAS 
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.text("SURAT TUGAS", pageWidth / 2, yPosition, { align: "center" });

      // Nomor Surat
      yPosition += 10;
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text(
        `Nomor: ${dataSuratTugas.nomorSurat}`,
        pageWidth / 2,
        yPosition,
        { align: "center" },
      );

      yPosition += 15;

      //  ISI SURAT 
      doc.setFontSize(12);
      doc.text(
        "Kepala SMK Negeri 2 Singosari Dinas Pendidikan Kabupaten Malang menugaskan kepada :",
        marginLeft,
        yPosition,
      );

      yPosition += 10;

      // Tabel Guru yang Ditugaskan
      const tableHeaders = [["NO", "NAMA", "JABATAN", "DINAS"]];
      const tableBody = guruPenugasan.map((guru, index) => [
        `${index + 1}`,
        guru.nama || "-",
        guru.jabatan || "-",
        guru.dinas || "-",
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: tableHeaders,
        body: tableBody,
        margin: { left: marginLeft, right: marginRight },
        styles: {
          fontSize: 11,
          cellPadding: 4,
          lineColor: [0, 0, 0],
          lineWidth: 0.5,
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          minCellHeight: 7,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "center",
          lineWidth: 0.5,
          lineColor: [0, 0, 0],
          fontSize: 11,
        },
        columnStyles: {
          0: { cellWidth: 20, halign: "center" },
          1: { cellWidth: 55 },
          2: { cellWidth: 35 },
          3: { cellWidth: 75 },
        },
        theme: "grid",
      });

      let finalY = doc.lastAutoTable?.finalY || yPosition + 20;
      yPosition = finalY + 10;

      //  DATA PELAKSANAAN 
      doc.setFontSize(12);
      doc.setFont("times", "normal");

      // Label bold
      const labelWidth = 40;
      const colonWidth = 5;
      const valueStartX = marginLeft + labelWidth + colonWidth;

      // Keperluan
      doc.setFont("times", "bold");
      doc.text("Keperluan", marginLeft, yPosition);
      doc.setFont("times", "normal");
      doc.text(`: ${dataSuratTugas.keperluan}`, valueStartX, yPosition);
      yPosition += 7;

      // Hari/Tanggal
      doc.setFont("times", "bold");
      doc.text("Hari / Tanggal", marginLeft, yPosition);
      doc.setFont("times", "normal");
      doc.text(`: ${dataSuratTugas.hariTanggal}`, valueStartX, yPosition);
      yPosition += 7;

      // Waktu
      doc.setFont("times", "bold");
      doc.text("Waktu", marginLeft, yPosition);
      doc.setFont("times", "normal");
      doc.text(`: ${dataSuratTugas.waktu}`, valueStartX, yPosition);
      yPosition += 7;

      // Tempat
      doc.setFont("times", "bold");
      doc.text("Tempat", marginLeft, yPosition);
      doc.setFont("times", "normal");
      doc.text(`: ${dataSuratTugas.tempat}`, valueStartX, yPosition);
      yPosition += 7;

      // Alamat 
      doc.setFont("times", "bold");
      doc.text("Alamat", marginLeft, yPosition);
      doc.setFont("times", "normal");
      
      const maxAlamatWidth = pageWidth - marginLeft - marginRight - labelWidth - colonWidth;
      const alamatLines = doc.splitTextToSize(
        dataSuratTugas.alamat,
        maxAlamatWidth,
      );
      
      doc.text(alamatLines, valueStartX, yPosition);
      yPosition += alamatLines.length * 5;

      yPosition += 15;

      //  PENUTUP SURAT 
      doc.setFontSize(12);
      doc.text(
        "Demikian surat tugas ini dibuat untuk dilaksanakan dengan sebaik-baiknya",
        marginLeft,
        yPosition,
      );
      yPosition += 7;
      doc.text(
        "dan melaporkan hasilnya kepada kepala sekolah.",
        marginLeft,
        yPosition,
      );

      yPosition += 20;

      //  TANDA TANGAN 
      const rightAlignX = pageWidth - marginRight;

      // Tanggal
      doc.text(
        `Singosari, ${dataSuratTugas.tanggalDibuat}`,
        rightAlignX,
        yPosition,
        { align: "right" },
      );
      
      // Jarak antara tanggal dan jabatan 
      yPosition += 25; 
      
      // Jabatan
      doc.text(
        "Kepala SMK Negeri 2 Singosari",
        rightAlignX,
        yPosition,
        { align: "right" },
      );

      // Jarak antara jabatan dan nama
      yPosition += 40; 
      
      // Nama Kepala Sekolah 
      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.text(dataSuratTugas.namaKepsek, rightAlignX, yPosition, {
        align: "right",
      });

      // Pangkat/Golongan
      yPosition += 7;
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text(dataSuratTugas.pangkatGolongan, rightAlignX, yPosition, {
        align: "right",
      });

      // NIP
      yPosition += 7;
      doc.setFontSize(11);
      doc.text(
        `NIP. ${dataSuratTugas.nipKepsek}`,
        rightAlignX,
        yPosition,
        { align: "right" },
      );

      //  SAVE PDF 
      const fileName = `Surat_Tugas_${formData.nomorSurat.replace(/\//g, "_")}.pdf`;
      doc.save(fileName);

      toast.success("PDF berhasil diunduh!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Gagal membuat PDF. Silakan coba lagi.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Filter daftar surat berdasarkan query
  const filteredSurat = suratList.filter(
    (surat) =>
      surat.nomorSurat.toLowerCase().includes(query.toLowerCase()) ||
      surat.keperluan.toLowerCase().includes(query.toLowerCase()) ||
      surat.tempat.toLowerCase().includes(query.toLowerCase()) ||
      surat.guru.toLowerCase().includes(query.toLowerCase()),
  );

  // Render status badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case "Selesai":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            Selesai
          </span>
        );
      case "Pending":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
            Pending
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar active={active} setActive={setActive} />

      <div className="flex flex-col flex-1">
        <Header user={user} />

        <main className="flex-1 p-6 bg-[#641E21] rounded-tl-3xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-white font-bold text-base sm:text-lg">
                  Surat Tugas 
                </h2>
              </div>
            </div>
          </div>

          {/* KONTEN UTAMA - PREVIEW DAN FORM */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* KOLOM KIRI: PREVIEW SURAT */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Preview Surat Tugas
                </h3>
                <span className="text-sm text-gray-500">
                  Format sesuai contoh surat
                </span>
              </div>

              <div className="border border-gray-300 rounded-lg p-6 bg-gray-50 font-serif">
                {/* KOP SURAT */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <img
                      src={logo.preview}
                      alt="Logo Provinsi Jawa Timur"
                      className="w-20 h-24 object-contain"
                    />
                  </div>
                  <div className="flex-1 text-center">
                    <p className="font-bold text-base leading-tight tracking-tight">
                      PEMERINTAH PROVINSI JAWA TIMUR
                    </p>
                    <p className="font-bold text-base leading-tight tracking-tight">
                      DINAS PENDIDIKAN
                    </p>
                    <p className="font-bold text-lg leading-tight tracking-tight mt-1">
                      SMK NEGERI 2 SINGOSARI
                    </p>
                    <div className="mt-2">
                      <p className="text-xs leading-tight">
                        Jalan Perusahaan No. 20, Tunjungtirto, Singosari, Kab. Malang, Jawa Timur, 65153
                      </p>
                      <p className="text-xs leading-tight">
                        Telepon (0341) 4346127
                      </p>
                    </div>
                  </div>
                </div>

                {/* Garis pemisah tipis seperti di gambar */}
                <div className="border-t border-black my-4"></div>

                {/* JUDUL  */}
                <div className="text-center my-6">
                  <p className="font-bold text-lg tracking-wide underline decoration-2">
                    SURAT TUGAS
                  </p>
                  <p className="text-sm mt-2">
                    Nomor: {dataSuratTugas.nomorSurat}
                  </p>
                </div>

                {/* PENUGASAN  */}
                <div className="mb-4 text-sm leading-relaxed">
                  <p>
                    Kepala SMK Negeri 2 Singosari Dinas Pendidikan Kabupaten Malang menugaskan kepada :
                  </p>
                </div>

                {/* TABEL GURU  */}
                <div className="mb-6">
                  <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-center font-bold bg-gray-50">NO</th>
                        <th className="border border-black p-2 text-center font-bold bg-gray-50">NAMA</th>
                        <th className="border border-black p-2 text-center font-bold bg-gray-50">JABATAN</th>
                        <th className="border border-black p-2 text-center font-bold bg-gray-50">DINAS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guruPenugasan.map((guru, index) => (
                        <tr key={guru.id || index} className="hover:bg-gray-50">
                          <td className="border border-black p-2 text-center align-middle">{index + 1}</td>
                          <td className="border border-black p-2 align-middle">{guru.nama || "-"}</td>
                          <td className="border border-black p-2 align-middle">{guru.jabatan || "-"}</td>
                          <td className="border border-black p-2 align-middle">{guru.dinas || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* DETAIL PELAKSANAAN  */}
                <div className="space-y-2 mb-6 text-sm">
                  <p>
                    <span className="font-bold inline-block w-32">Keperluan</span> 
                    <span className="inline-block w-4">:</span>
                    <span className="ml-2">{dataSuratTugas.keperluan}</span>
                  </p>
                  <p>
                    <span className="font-bold inline-block w-32">Hari / Tanggal</span> 
                    <span className="inline-block w-4">:</span>
                    <span className="ml-2">{dataSuratTugas.hariTanggal}</span>
                  </p>
                  <p>
                    <span className="font-bold inline-block w-32">Waktu</span> 
                    <span className="inline-block w-4">:</span>
                    <span className="ml-2">{dataSuratTugas.waktu}</span>
                  </p>
                  <p>
                    <span className="font-bold inline-block w-32">Tempat</span> 
                    <span className="inline-block w-4">:</span>
                    <span className="ml-2">{dataSuratTugas.tempat}</span>
                  </p>
                  <p className="flex">
                    <span className="font-bold inline-block w-32 flex-shrink-0">Alamat</span> 
                    <span className="inline-block w-4 flex-shrink-0">:</span>
                    <span className="ml-2">{dataSuratTugas.alamat}</span>
                  </p>
                </div>

                {/* PENUTUP */}
                <div className="mb-8 text-sm leading-relaxed">
                  <p>
                    Demikian surat tugas ini dibuat untuk dilaksanakan dengan sebaik-baiknya
                  </p>
                  <p>dan melaporkan hasilnya kepada kepala sekolah.</p>
                </div>

                {/* TANDA TANGAN*/}
                <div className="text-right text-sm">
                  {/* Spasi untuk menurunkan tanggal  */}
                  <div className="mb-8"></div> 
                  
                  <p>Singosari, {dataSuratTugas.tanggalDibuat}</p>
                  
                  {/* Jarak antara tanggal dan jabatan */}
                  <div className="h-12"></div>
                  
                  <p>Kepala SMK Negeri 2 Singosari</p>
                  
                  {/* Jarak antara jabatan dan nama */}
                  <div className="h-24"></div> 
                  
                  <p className="font-bold text-base">{dataSuratTugas.namaKepsek}</p>
                  <p className="text-xs mt-1">{dataSuratTugas.pangkatGolongan}</p>
                  <p className="text-xs">NIP. {dataSuratTugas.nipKepsek}</p>
                </div>
              </div>
            </div>

            {/* KOLOM KANAN: FORM EDIT */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Form Input Surat Tugas
              </h3>

              <div className="space-y-6">
                {/* DATA UMUM */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">
                    Data Surat
                  </h4>

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
                        placeholder="Contoh: 800 / 376 / 101.6.9.19 /2025"
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
                        placeholder="Contoh: Penjemputan Siswa Praktik Kerja Lapangan (PKL)"
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
                          placeholder="Contoh: Rabu, 10 Desember 2025"
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
                          placeholder="Contoh: 08.00 – Selesai"
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
                        placeholder="Contoh: JOTUN SINGOSARI"
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
                        rows="3"
                        placeholder="Contoh: Jl. Panglima Sudirman No.148 Kavling E2, Pangetan, Kec. Singosari, Kab. Malang, Jawa Timur 65153"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Dibuat Surat{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="tanggalDibuat"
                        value={formData.tanggalDibuat}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: 03 Desember 2025"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* DATA GURU - HANYA 1 GURU */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-700">
                      Data Guru yang Ditugaskan
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Hanya 1 guru pembimbing yang ditugaskan
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded border border-gray-200">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Pilih Guru Pembimbing{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.guru1?.guruId || ""}
                          onChange={(e) =>
                            handleGuruSelectChange(e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Pilih Guru Pembimbing</option>
                          {loadingGuru ? (
                            <option value="" disabled>
                              Memuat data guru pembimbing...
                            </option>
                          ) : guruList.length === 0 ? (
                            <option value="" disabled>
                              Tidak ada guru pembimbing tersedia
                            </option>
                          ) : (
                            guruList.map((guruItem) => (
                              <option key={guruItem.id} value={guruItem.id}>
                                {guruItem.label}
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
                          <label className="block text-sm text-gray-600 mb-1">
                            Atau Ketik Manual (Format: Nama, Gelar)
                          </label>
                          <input
                            type="text"
                            value={formData.guru1?.nama || ""}
                            onChange={(e) =>
                              handleGuruInputChange("nama", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: Triana Ardiani, S.Pd"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Sesuaikan dengan format gelar yang benar
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Jabatan <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.guru1?.jabatan || ""}
                            onChange={(e) =>
                              handleGuruInputChange("jabatan", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: Guru"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Dinas <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.guru1?.dinas || ""}
                            onChange={(e) =>
                              handleGuruInputChange("dinas", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: SMK Negeri 2 Singosari"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    <span className="text-red-500">*</span> Hanya menampilkan
                    guru dengan status pembimbing. Data diambil dari sistem.
                  </div>
                </div>

                {/* DATA KEPALA SEKOLAH */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">
                    Data Kepala Sekolah
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Kepala Sekolah{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="namaKepsek"
                        value={formData.namaKepsek}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: SUMIAH, S.Pd., M.Si."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format: NAMA, S.Pd., M.Si. (gunakan titik dan koma yang benar)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pangkat/Golongan{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="pangkatGolongan"
                        value={formData.pangkatGolongan}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: Pembina Utama Muda (IV/c)"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NIP Kepala Sekolah{" "}
                        <span className="text-red-500">*</span>
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
                    {generatingPDF ? "Memproses..." : "Download PDF"}
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