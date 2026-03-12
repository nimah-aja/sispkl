import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApprovedPKL } from "../utils/services/koordinator/pengajuan"; // Ganti import
import { Edit, Printer, Users, X, Search as SearchIcon } from "lucide-react";
import {
  fetchGuruById,
  getGuru as getAllGuru,
} from "../utils/services/admin/get_guru";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoSmk from "../assets/LOGOPROV.png";

// components
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import Search from "./components/Search";
import EditPengajuan from "./components/editPengajuan";

export default function DataPengajuan() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSurat, setSelectedSurat] = useState(null);
  // State untuk menyimpan semua siswa dalam satu industri (untuk mode kelompok)
  const [selectedGroupSiswa, setSelectedGroupSiswa] = useState([]);
  const [active, setActive] = useState("pengajuanPKL");
  const [query, setQuery] = useState("");
  const [pengajuanList, setPengajuanList] = useState([]);
  const [filteredPengajuanList, setFilteredPengajuanList] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [guruDetail, setGuruDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchInfo, setSearchInfo] = useState("");

  const namaGuru = localStorage.getItem("nama_guru") || "Guru SMK";
  const user = { name: namaGuru, role: "Koordinator" };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pklRes, guruRes] = await Promise.all([getApprovedPKL(), getAllGuru()]); // Ganti dengan getApprovedPKL
        setGuruList(guruRes || []);
        
        // Langsung ambil data dari response, tanpa filter status karena sudah Approved dari endpoint
        const approvedList = (pklRes?.data || []).map((item) => ({
          id: item.application_id, // Sesuaikan dengan response
          name: item.siswa_username,
          class: item.kelas_nama,
          nisn: item.siswa_nisn,
          industri: item.industri_nama,
          jurusan: item.jurusan_nama,
          tanggal_mulai: item.tanggal_mulai,
          tanggal_selesai: item.tanggal_selesai,
          processed_by: item.processed_by, // Jika ada di response
          description: `PKL di ${item.industri_nama} telah disetujui`,
          nama_perusahaan: item.industri_nama,
          alamat_perusahaan: item.industri_alamat || "Jl. Contoh No. 123",
        }));
        
        setPengajuanList(approvedList);
        setFilteredPengajuanList(approvedList);
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
      } catch (err) { setGuruDetail(null); }
    };
    getGuruDetail();
  }, [selectedSurat]);

  useEffect(() => {
    if (!query.trim()) {
      setFilteredPengajuanList(pengajuanList);
      setSearchInfo("");
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    
    const filtered = pengajuanList.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(searchTerm);
      const industriMatch = item.industri?.toLowerCase().includes(searchTerm) || 
                           item.nama_perusahaan?.toLowerCase().includes(searchTerm);
      const classMatch = item.class?.toLowerCase().includes(searchTerm);
      const jurusanMatch = item.jurusan?.toLowerCase().includes(searchTerm);
      const nisnMatch = item.nisn?.includes(searchTerm);
      
      return nameMatch || industriMatch || classMatch || jurusanMatch || nisnMatch;
    });

    setFilteredPengajuanList(filtered);
    
    const categories = [];
    if (filtered.some(item => item.name.toLowerCase().includes(searchTerm))) categories.push("Nama Siswa");
    if (filtered.some(item => item.industri?.toLowerCase().includes(searchTerm) || item.nama_perusahaan?.toLowerCase().includes(searchTerm))) categories.push("Industri");
    if (filtered.some(item => item.class?.toLowerCase().includes(searchTerm))) categories.push("Kelas");
    if (filtered.some(item => item.jurusan?.toLowerCase().includes(searchTerm))) categories.push("Jurusan");
    if (filtered.some(item => item.nisn?.includes(searchTerm))) categories.push("NISN");
    
    if (categories.length > 0) {
      setSearchInfo(`Ditemukan ${filtered.length} hasil berdasarkan: ${categories.join(', ')}`);
    } else {
      setSearchInfo("");
    }
  }, [query, pengajuanList]);

  // Group data by perusahaan dengan deduplikasi siswa per NISN
  const groupedByPerusahaan = filteredPengajuanList.reduce((acc, item) => {
    if (!acc[item.nama_perusahaan]) {
      acc[item.nama_perusahaan] = {
        nama_perusahaan: item.nama_perusahaan,
        alamat: item.alamat_perusahaan,
        siswa: []
      };
    }
    
    // Cek apakah siswa dengan NISN yang sama sudah ada di perusahaan ini
    const isSiswaExists = acc[item.nama_perusahaan].siswa.some(
      existingSiswa => existingSiswa.nisn === item.nisn
    );
    
    // Hanya tambahkan jika NISN belum ada di perusahaan ini
    if (!isSiswaExists) {
      acc[item.nama_perusahaan].siswa.push(item);
    }
    
    return acc;
  }, {});

  const perusahaanList = Object.values(groupedByPerusahaan);

  const handleEditClick = (item, semuaSiswaInIndustri) => {
    // Set data siswa yang dipilih (bisa satu atau semua dalam industri)
    setSelectedSurat(item);
    // Simpan semua siswa dalam industri yang sama untuk mode kelompok
    setSelectedGroupSiswa(semuaSiswaInIndustri);
    setShowEditModal(true);
  };

  // Fungsi untuk memformat tanggal dari ISO ke format Indonesia
  const formatTanggalIndonesia = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      const day = date.getDate().toString().padStart(2, '0');
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (err) {
      return isoString;
    }
  };

  // ======================================================
  // FUNGSI REUSABLE KOP SURAT
  // ======================================================
  const drawKopSurat = (doc, margin) => {
    if (logoSmk) {
      const imgProps = doc.getImageProperties(logoSmk);
      const imgWidth = 30; 
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      doc.addImage(logoSmk, "PNG", margin + 12, 11, imgWidth, imgHeight);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("PEMERINTAH PROVINSI JAWA TIMUR", 105, 15, { align: "center" });
    doc.text("DINAS PENDIDIKAN", 105, 20, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("SMK NEGERI 2 SINGOSARI", 105, 26, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Jalan Perusahaan No. 20, Tunjungtirto, Singosari, Kab. Malang, Jawa Timur, 65153", 105, 31, { align: "center" });
    doc.text("Telepon (0341) 4345127", 105, 35, { align: "center" });

    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setLineWidth(0.8);
    doc.line(margin, 38, pageWidth - margin, 38);
    doc.setLineWidth(0.2);
    doc.line(margin, 39.5, pageWidth - margin, 39.5);
  };

  const generateSuratPermohonanOnly = (doc, data, margin) => {
    drawKopSurat(doc, margin);
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(data.tempat_tanggal || `Singosari, .................... 2025`, pageWidth - margin, 47, { align: "right" });

    let y = 54;
    doc.text(`Nomor      : ${data.nomor_surat || "400.3 /       / 101.6.9.19 / 2025"}`, margin, y);
    doc.text(`Lampiran   : -`, margin, y + 5);
    doc.setFont("helvetica", "bold");
    doc.text(`Perihal      : Permohonan Praktik Kerja Lapangan (PKL)`, margin, y + 10);

    y += 20;
    doc.setFont("helvetica", "normal");
    doc.text("Kepada Yth,", margin, y);
    doc.setFont("helvetica", "bold");
    doc.text(`Pimpinan ${data.nama_perusahaan}`, margin, y + 5);
    doc.setFont("helvetica", "normal");
    doc.text("Di Tempat", margin, y + 10);

    y += 22;
    
    // Format tanggal mulai dan selesai
    const tglMulai = data.tanggal_mulai ? formatTanggalIndonesia(data.tanggal_mulai) : "..............";
    const tglSelesai = data.tanggal_selesai ? formatTanggalIndonesia(data.tanggal_selesai) : "..............";
    
    const textIsi = `Dengan ini kami sampaikan bahwa kegiatan Praktik Kerja Lapangan (PKL) siswa-siswi SMK Negeri 2 Singosari akan dilaksanakan sekitar tanggal ${tglMulai} s.d ${tglSelesai}. Sehubungan dengan hal tersebut, kami mohon agar siswa-siswi kami dapat diterima di Instansi/Industri yang Bapak/Ibu pimpin. Adapun siswa-siswi yang akan kami ajukan untuk melaksanakan Praktik Kerja Lapangan (PKL) di Instansi/Industri yang Bapak/Ibu pimpin adalah sebanyak ${data.students.length} orang, sebagai berikut:`;
    
    const splitText = doc.splitTextToSize(textIsi, 180);
    doc.text(splitText, margin, y);
    
    const lineHeight = doc.internal.getLineHeight() * 0.3527; 
    const textHeight = splitText.length * lineHeight;

    autoTable(doc, {
      startY: y + textHeight + 5,
      head: [["NO", "NAMA", "KELAS", "JURUSAN"]],
      body: data.students.map((s, i) => [
        i + 1, 
        s.nama, 
        s.kelas, // LANGSUNG ambil dari data, tanpa default
        s.jurusan // LANGSUNG ambil dari data, tanpa default
      ]),
      theme: "grid",
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, fontStyle: 'bold', font: "helvetica" },
      styles: { fontSize: 9, cellPadding: 2, font: "helvetica" }
    });

    y = doc.lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "normal");
    doc.text("Kepala SMK Negeri 2 Singosari,", 140, y);
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.text(data.nama_kepala_sekolah || "Sumijah, S.Pd., M.Si.", 140, y);
    doc.setFont("helvetica", "normal");
    doc.text(data.jabatan_kepsek || data.tingkatan_kepsek || "Pembina Utama Muda (IV/c)", 140, y+5);
    doc.text(`NIP. ${data.nip_kepala_sekolah || "19700210 199802 2 009"}`, 140, y + 9);
  };

  const generateLembarPersetujuanOnly = (doc, data, margin) => {
    drawKopSurat(doc, margin);
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("LEMBAR PERSETUJUAN", pageWidth / 2, 48, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(75, 49, 135, 49);

    const siswaList = data.students.map((s, i) => `${i + 1}. ${s.nama}`).join("\n");
    
    // Format tanggal mulai dan selesai untuk catatan
    const tglMulai = data.tanggal_mulai ? formatTanggalIndonesia(data.tanggal_mulai) : "...........................";
    const tglSelesai = data.tanggal_selesai ? formatTanggalIndonesia(data.tanggal_selesai) : "...........................";
    
    const tableBody = [[
      "1",
      `Permohonan pelaksanaan Pembelajaran Praktik Industri (PJBL) untuk ${data.students.length} orang siswa, atas nama:\n${siswaList}`,
      `Nama:\n...........................................................\n\nTanggal:\n...........................................................\n\nParaf:\n\n\nCatatan:\n1. Mulai PKL pada tanggal:\n${tglMulai} s/d\n${tglSelesai}\n2. Diterima sebanyak ......... Siswa.`,
      `Telah disetujui Siswa Siswi SMK NEGERI 2 SINGOSARI untuk melaksanakan PKL di ${data.nama_perusahaan}.`,
    ]];

    autoTable(doc, {
      startY: 55,
      head: [["NO", "Perihal", "Disetujui Oleh Pihak DU/DI", "Keterangan"]],
      body: tableBody,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.4, font: "helvetica" },
      headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: "bold", halign: "center", lineWidth: 0.4, font: "helvetica" },
      columnStyles: { 0: { cellWidth: 12, halign: "center" }, 1: { cellWidth: 55 }, 2: { cellWidth: 65 }, 3: { cellWidth: 50 } },
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(11);
    doc.text(data.tempat_tanggal || `Singosari, .................... 2025`, pageWidth - margin, finalY, { align: "right" });
    doc.text("Bapak / Ibu Pimpinan", pageWidth - margin, finalY + 7, { align: "right" });
    doc.text("( ................................................................ )", pageWidth - margin, finalY + 35, { align: "right" });
  };

  const generateDokumenLengkapPDF = (data) => {
    if (!data) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 15;
    generateSuratPermohonanOnly(doc, data, margin);
    doc.addPage();
    generateLembarPersetujuanOnly(doc, data, margin);
    window.open(URL.createObjectURL(doc.output("blob")), "_blank");
  };

  const handleExportFromEdit = (payload) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 15;
    if (payload.jenis_surat === "surat1") {
      generateSuratPermohonanOnly(doc, payload, margin);
    } else if (payload.jenis_surat === "surat2") {
      generateLembarPersetujuanOnly(doc, payload, margin);
    } else {
      generateSuratPermohonanOnly(doc, payload, margin);
      doc.addPage();
      generateLembarPersetujuanOnly(doc, payload, margin);
    }
    window.open(URL.createObjectURL(doc.output("blob")), "_blank");
  };

  const handleSaveEdit = (updatedData) => {
    setPengajuanList((prev) => prev.map((item) => item.id === updatedData.id ? { ...item, ...updatedData } : item));
    setShowEditModal(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      <Sidebar active={active} setActive={setActive} />
      <div className="flex flex-col flex-1">
        <Header user={user} />
        <main className="flex-1 p-8 bg-[#641E21] rounded-tl-3xl">
          <h2 className="text-white font-bold text-2xl mb-4">Surat Persetujuan PKL</h2>

          <div className="mb-2">
            <Search 
              query={query} 
              setQuery={setQuery} 
              placeholder="Cari berdasarkan nama siswa, industri, kelas, jurusan, atau NISN..." 
            />
          </div>
          
          {searchInfo && (
            <div className="mb-4 text-white/80 text-sm italic flex items-center gap-1">
              <SearchIcon size={14} />
              <span>{searchInfo}</span>
            </div>
          )}

          <div className="space-y-6">
            {perusahaanList.map((perusahaan, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-[#641E21]">{perusahaan.nama_perusahaan}</h3>
                      <p className="text-sm text-gray-500 mt-1 flex items-center">
                        <Users size={16} className="mr-1" />
                        {perusahaan.siswa.length} Siswa
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleEditClick(perusahaan.siswa[0], perusahaan.siswa)}
                        className="!bg-red-800 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-900 transition text-sm"
                      >
                        <Edit size={16} /> Ubah Surat
                      </button>
                      
                      <button 
                        onClick={() => {
                          // Ambil tanggal dari siswa pertama
                          const tanggalMulai = perusahaan.siswa[0]?.tanggal_mulai;
                          const tanggalSelesai = perusahaan.siswa[0]?.tanggal_selesai;
                          
                          // AMBIL LANGSUNG data kelas dan jurusan dari siswa
                          const payload = {
                            nama_perusahaan: perusahaan.nama_perusahaan,
                            students: perusahaan.siswa.map(s => ({
                              nama: s.name.toUpperCase(),
                              kelas: s.class, // Ambil langsung
                              jurusan: s.jurusan // Ambil langsung
                            })),
                            tempat_tanggal: "Singosari, .................... 2025",
                            nomor_surat: "400.3 /       / 101.6.9.19 / 2025",
                            nama_kepala_sekolah: "Sumijah, S.Pd., M.Si.",
                            jabatan_kepsek: "Pembina Utama Muda (IV/c)",
                            nip_kepala_sekolah: "19700210 199802 2 009",
                            tanggal_mulai: tanggalMulai,
                            tanggal_selesai: tanggalSelesai
                          };
                          generateDokumenLengkapPDF(payload);
                        }}
                        className="!bg-[#EC933A] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#d17a2a] transition text-sm"
                      >
                        <Printer size={16} /> Cetak Surat
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-center py-3 text-base font-semibold text-gray-600 w-[8%]">No</th>
                        <th className="text-left py-3 text-base font-semibold text-gray-600 w-[25%]">Nama Siswa</th>
                        <th className="text-center py-3 text-base font-semibold text-gray-600 w-[20%]">NISN</th>
                        <th className="text-center py-3 text-base font-semibold text-gray-600 w-[20%]">Kelas</th>
                        <th className="text-left py-3 text-base font-semibold text-gray-600 w-[27%]">Jurusan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perusahaan.siswa.map((siswa, index) => (
                        <tr key={siswa.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <td className="text-center py-3 text-base truncate">{index + 1}</td>
                          <td className="py-3 text-base font-medium truncate">{siswa.name}</td>
                          <td className="text-center py-3 text-base font-mono truncate">{siswa.nisn}</td>
                          <td className="text-center py-3 text-base truncate">{siswa.class}</td>
                          <td className="py-3 text-base truncate">{siswa.jurusan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Tampilkan tanggal PKL jika ada */}
                  {/* {perusahaan.siswa[0]?.tanggal_mulai && (
                    <div className="mt-4 text-sm text-gray-600 border-t pt-3">
                      <p><span className="font-medium">Periode PKL:</span> {formatTanggalIndonesia(perusahaan.siswa[0].tanggal_mulai)} - {formatTanggalIndonesia(perusahaan.siswa[0].tanggal_selesai)}</p>
                    </div>
                  )} */}
                </div>
              </div>
            ))}

            {perusahaanList.length === 0 && !loading && (
              <div className="bg-white rounded-2xl p-10 text-center">
                <p className="text-gray-500">
                  {query ? "Tidak ada data yang sesuai dengan pencarian" : "Belum ada data persetujuan PKL"}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {showEditModal && selectedSurat && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEditModal(false)}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-[#641E21]">Edit Surat Pengajuan</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700 transition">
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <EditPengajuan
                selectedSurat={selectedSurat}
                guruDetail={guruDetail}
                allSiswa={selectedGroupSiswa}
                onSave={handleSaveEdit}
                onClose={() => setShowEditModal(false)}
                onExportPDF={handleExportFromEdit}
              />    
            </div>
          </div>
        </div>
      )}
    </div>
  );
}