import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPKLApplications } from "../utils/services/kapro/pengajuanPKL";
import { Edit } from "lucide-react";
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
import SearchBar from "./components/Search";
import EditPengajuan from "./components/editPengajuan";

export default function DataPengajuan() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSurat, setSelectedSurat] = useState(null);
  const [active, setActive] = useState("pengajuanPKL");
  const [query, setQuery] = useState("");
  const [pengajuanList, setPengajuanList] = useState([]);
  const [kelas, setKelas] = useState("");
  const [guruList, setGuruList] = useState([]);
  const [guruDetail, setGuruDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const namaGuru = localStorage.getItem("nama_guru") || "Guru SMK";
  const user = { name: namaGuru, role: "Koordinator" };
  const kelasOptions = Array.from(new Set(pengajuanList.map((item) => item.class)));
  const filters = [{ label: "Kelas", value: kelas, options: kelasOptions, onChange: setKelas }];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pklRes, guruRes] = await Promise.all([getPKLApplications(), getAllGuru()]);
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
            nama_perusahaan: item.industri_nama,
            alamat_perusahaan: item.industri_alamat || "Jl. Contoh No. 123",
          }));
        setPengajuanList(approvedList);
      } catch (err) { console.error("Fetch error:", err); } finally { setLoading(false); }
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

  const getInitials = (name) => {
    if (!name) return "";
    const words = name.trim().split(" ");
    return words.length === 1 ? words[0][0].toUpperCase() : (words[0][0] + words[1][0]).toUpperCase();
  };

  const handleEditClick = (item) => {
    setSelectedSurat(item);
    setShowEditModal(true);
  };

  // ======================================================
  // FUNGSI REUSABLE KOP SURAT
  // ======================================================
  const drawKopSurat = (doc, margin) => {
    if (logoSmk) { doc.addImage(logoSmk, "PNG", margin, 10, 22, 22); }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("PEMERINTAH PROVINSI JAWA TIMUR", 45, 15);
    doc.text("DINAS PENDIDIKAN", 45, 20);
    doc.setFontSize(13);
    doc.text("SMK NEGERI 2 SINGOSARI", 45, 25);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Jalan Perusahaan No. 20, Tunjungtirto, Singosari, Kab. Malang, Jawa Timur, 65153", 45, 29);
    doc.text("Telepon (0341) 4345127", 45, 33);
    doc.setLineWidth(0.5);
    doc.line(margin, 36, 195, 36);
  };

  // ======================================================
  // FUNGSI SURAT 1 SAJA
  // ======================================================
  const generateSuratPermohonanOnly = (doc, data, margin) => {
    drawKopSurat(doc, margin);
    doc.setFontSize(10);
    doc.text(data.tempat_tanggal || `Malang, .................... 2026`, 195, 42, { align: "right" });

    let y = 48;
    doc.text(`Nomor      : ${data.nomor_surat || "400.3 /      / 101.6.9.19 / 2025"}`, margin, y);
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
    const textIsi = `Dengan ini kami sampaikan bahwa kegiatan Praktik Kerja Lapangan (PKL) siswa-siswi SMK Negeri 2 Singosari akan dilaksanakan sekitar tanggal .......................... Adapun siswa-siswi yang kami ajukan adalah sebagai berikut:`;
    doc.text(doc.splitTextToSize(textIsi, 180), margin, y);

    autoTable(doc, {
      startY: y + 12,
      head: [["NO", "NAMA", "KELAS", "JURUSAN"]],
      body: data.students.map((s, i) => [i + 1, s.nama, s.kelas, s.jurusan]),
      theme: "grid",
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2 }
    });

    y = doc.lastAutoTable.finalY + 15;
    doc.text("Kepala SMK Negeri 2 Singosari,", 140, y);
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.text(data.nama_kepala_sekolah || "Sumijah, S.Pd., M.Si.", 140, y);
    doc.setFont("helvetica", "normal");
    doc.text(`NIP. ${data.nip_kepala_sekolah || "19700210 199802 2 009"}`, 140, y + 4);
  };

  // ======================================================
  // FUNGSI SURAT 2 SAJA
  // ======================================================
  const generateLembarPersetujuanOnly = (doc, data, margin) => {
    drawKopSurat(doc, margin);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("LEMBAR PERSETUJUAN", 105, 48, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(75, 49, 135, 49);

    const siswaList = data.students.map((s, i) => `${i + 1}. ${s.nama}`).join("\n");
    const tableBody = [[
      "1",
      `Permohonan pelaksanaan Pembelajaran Praktik Industri (PJBL) untuk ${data.students.length} orang siswa, atas nama:\n${siswaList}`,
      `Nama:\n...........................................................\n\nTanggal:\n...........................................................\n\nParaf:\n\n\nCatatan:\n1. Mulai PKL pada tanggal:\n........................................................ s/d\n...........................................................\n2. Diterima sebanyak ......... Siswa.`,
      `Telah disetujui Siswa Siswi SMK NEGERI 2 SINGOSARI untuk melaksanakan PKL di ${data.nama_perusahaan}.`,
    ]];

    autoTable(doc, {
      startY: 55,
      head: [["NO", "Perihal", "Disetujui Oleh Pihak DU/DI", "Keterangan"]],
      body: tableBody,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.4 },
      headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: "bold", halign: "center", lineWidth: 0.4 },
      columnStyles: { 0: { cellWidth: 12, halign: "center" }, 1: { cellWidth: 55 }, 2: { cellWidth: 65 }, 3: { cellWidth: 50 } },
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(11);
    doc.text(data.tempat_tanggal || `Malang, .................... 2026`, 195, finalY, { align: "right" });
    doc.text("Bapak / Ibu Pimpinan", 195, finalY + 7, { align: "right" });
    doc.text("( ................................................................ )", 195, finalY + 35, { align: "right" });
  };

  // ======================================================
  // FUNGSI GABUNGAN UNTUK TOMBOL UTAMA
  // ======================================================
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

    // Logika Filter: Cetak berdasarkan button mana yang diklik di modal
    if (payload.jenis_surat === "surat1") {
      generateSuratPermohonanOnly(doc, payload, margin);
    } else if (payload.jenis_surat === "surat2") {
      generateLembarPersetujuanOnly(doc, payload, margin);
    } else {
      // Fallback gabungan jika tidak ada flag spesifik
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
        <main className="flex-1 p-6 bg-[#641E21] rounded-tl-3xl">
          <h2 className="text-white font-bold mb-4">Data Persetujuan PKL</h2>
          <SearchBar query={query} setQuery={setQuery} filters={filters} placeholder="Cari siswa..." />
          <div className="mt-6 space-y-4">
            {pengajuanList.filter(i => i.name.toLowerCase().includes(query.toLowerCase())).map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-4 flex justify-between items-center shadow cursor-pointer hover:bg-gray-50 transition">
                <div className="flex items-center">
                  <div className="w-10 h-10 mr-4 rounded-full bg-[#641E21] text-white flex items-center justify-center font-bold">{getInitials(item.name)}</div>
                  <div>
                    <h3 className="font-semibold text-[#641E21]">{item.name} | {item.class}</h3>
                    <p className="text-xs text-gray-500">Industri: {item.nama_perusahaan}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditClick(item)} className="!bg-red-800 text-white px-4 py-1 rounded-md flex items-center gap-2">
                    <Edit size={16} /> Ubah Surat
                  </button>
                  <button 
                    onClick={() => {
                      const payload = {
                        nama_perusahaan: item.nama_perusahaan,
                        students: [{ nama: item.name.toUpperCase(), kelas: item.class, jurusan: item.jurusan }],
                        tempat_tanggal: "Malang, .................... 2026",
                        nomor_surat: "400.3 /      / 101.6.9.19 / 2025",
                        nama_kepala_sekolah: "Sumijah, S.Pd., M.Si.",
                        nip_kepala_sekolah: "19700210 199802 2 009"
                      };
                      generateDokumenLengkapPDF(payload);
                    }} 
                    className="!bg-[#EC933A] text-white px-4 py-1 rounded-md"
                  >
                    Cetak Surat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {showEditModal && selectedSurat && (
        <EditPengajuan
          selectedSurat={selectedSurat}
          guruDetail={guruDetail}
          allSiswa={pengajuanList}
          onSave={handleSaveEdit}
          onClose={() => setShowEditModal(false)}
          onExportPDF={handleExportFromEdit}
        />
      )}
    </div>
  );
}