import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import { getPKLApplications } from "../utils/services/kapro/pengajuanPKL";
import logo from "../assets/logo.png";
import { X, Edit } from "lucide-react";
import { fetchGuruById, getGuru as getAllGuru } from "../utils/services/admin/get_guru";

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
    if (!isoString) return "-";
    try {
      const [year, month, day] = isoString.split('-');
      return `${day}-${month}-${year}`;
    } catch (err) {
      return isoString;
    }
  };

  const getInitials = (name) => {
    if (!name) return "";
    const words = name.trim().split(" ");
    return words.length === 1
      ? words[0][0].toUpperCase()
      : (words[0][0] + words[1][0]).toUpperCase();
  };

  const fetchGuruForPDF = async (processedById) => {
    if (!processedById) return { nama: "-", nip: "-" };
    
    try {
      const data = await fetchGuruById(processedById);
      return data || { nama: "-", nip: "-" };
    } catch (err) {
      console.error("Error fetching guru for PDF:", err);
      return { nama: "-", nip: "-" };
    }
  };

  const handleEditClick = (item) => {
    setSelectedSurat(item);
    setShowEditModal(true);
    setShowPreview(false);
  };

  const handleSaveEdit = (updatedData) => {
    // Update pengajuanList dengan data yang sudah diedit
    setPengajuanList(prev => 
      prev.map(item => 
        item.id === updatedData.id ? updatedData : item
      )
    );
    
    // Update selectedSurat jika sedang dipreview
    if (selectedSurat?.id === updatedData.id) {
      setSelectedSurat(updatedData);
    }
    
    setShowEditModal(false);
    alert("Perubahan berhasil disimpan!");
  };

  const handleExportPDF = async (surat, isGroupMode = false, selectedStudents = []) => {
  if (!surat) return;
  
  const guruForPdf = surat.processed_by 
    ? await fetchGuruForPDF(surat.processed_by)
    : { nama: "-", nip: "-" };

  const periode = surat.tanggal_mulai && surat.tanggal_selesai
    ? `${formatTanggal(surat.tanggal_mulai)} - ${formatTanggal(surat.tanggal_selesai)}`
    : "-";

  const doc = new jsPDF("p", "mm", "a4");
  const left = 20;
  const right = 190;
  let y = 20;
  
  // ===== LOGO & KOP =====
  doc.addImage(logo, "PNG", left, 18, 15, 15);
  y = 37;
  doc.line(left, y, 190, y);
  
  // ===== JUDUL SEKOLAH =====
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("SMK NEGERI 2 SINGOSARI", 105, 26, { align: "center" });
  
  y = 30;
  doc.setFontSize(10);
  doc.setFont("times", "normal");
  doc.text(
    "Jl. Perusahaan No.20 Tunjungtirto – Singosari",
    105,
    y,
    { align: "center" }
  );
  y += 4;
  doc.text(
    "Kabupaten Malang, Jawa Timur",
    105,
    y,
    { align: "center" }
  );

  y = 50;

  // ===== TANGGAL =====
  doc.text(
    `Singosari, ${new Date().toLocaleDateString("id-ID")}`,
    right,
    y,
    { align: "right" }
  );

  y += 0;

  // ===== TUJUAN =====
  doc.text("Kepada Yth.", left, y);
  y += 5;
  doc.setFont("times", "bold");
  doc.text(surat.industri || "Pimpinan Industri", left, y);
  doc.setFont("times", "normal");
  y += 5;
  doc.text("Di Tempat", left, y);

  y += 15;

  // ===== JUDUL SURAT =====
  doc.setFont("times", "bold");
  doc.text(
    "SURAT PERMOHONAN PRAKTIK KERJA LAPANGAN",
    105,
    y,
    { align: "center" }
  );
  y += 5;

  doc.setFontSize(10);
  doc.setFont("times", "normal");
  doc.text("Nomor: 001/SMK-N2/PKL/I/2026", 105, y, {
    align: "center",
  });

  y += 15;

  // ===== ISI SURAT =====
  doc.setFontSize(11);
  doc.text("Dengan hormat,", left, y);
  y += 10;

  doc.text(
    "Sehubungan dengan program Praktik Kerja Lapangan (PKL), bersama ini kami mengajukan permohonan untuk siswa berikut:",
    left,
    y,
    { maxWidth: 170 }
  );

  y += 15;

  // ===== DATA SISWA =====
  const startX = left;
  const col1Width = 30;
  const col2Start = startX + col1Width + 5;
  
  // Periksa apakah ini mode kelompok dan ada data siswa kelompok
  if (isGroupMode && selectedStudents && selectedStudents.length > 0) {
    // Mode kelompok
    doc.text("Daftar Siswa:", startX, y);
    y += 7;
    
    // Cetak daftar siswa
    selectedStudents.forEach((siswa, index) => {
      doc.text(`${index + 1}. ${siswa.name} - ${siswa.class} - NISN: ${siswa.nisn}`, startX + 5, y);
      y += 7;
    });
    
    y += 3;
    doc.text("Jurusan:", startX, y);
    doc.text(":", startX + col1Width, y);
    doc.text(surat.jurusan || "-", col2Start, y);
    y += 7;
    
    doc.text("Periode:", startX, y);
    doc.text(":", startX + col1Width, y);
    doc.text(periode, col2Start, y);
    y += 7;
  } else {
    // Mode individu (default)
    doc.text("Nama", startX, y);
    doc.text(":", startX + col1Width, y);
    doc.text(surat.name || "-", col2Start, y);
    y += 7;
    
    doc.text("Kelas", startX, y);
    doc.text(":", startX + col1Width, y);
    doc.text(surat.class || "-", col2Start, y);
    y += 7;
    
    doc.text("Jurusan", startX, y);
    doc.text(":", startX + col1Width, y);
    doc.text(surat.jurusan || "-", col2Start, y);
    y += 7;
    
    doc.text("NISN", startX, y);
    doc.text(":", startX + col1Width, y);
    doc.text(surat.nisn || "-", col2Start, y);
    y += 7;
    
    doc.text("Periode", startX, y);
    doc.text(":", startX + col1Width, y);
    doc.text(periode, col2Start, y);
    y += 7;
  }

  y += 8;

  // ===== PARAGRAF PENUTUP =====
  doc.text(
    "Demikian surat permohonan ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.",
    left,
    y,
    { maxWidth: 170 }
  );

  y += 40;

  // ===== TTD =====
  const ttdX = 130;
  doc.text("Kepala Program Keahlian,", ttdX, y);
  y += 25;
  doc.setFont("times", "bold");
  doc.text(guruForPdf?.nama || "-", ttdX, y);
  y += 5;
  doc.setFontSize(10);
  doc.setFont("times", "normal");
  doc.text(`NIP. ${guruForPdf?.nip || "-"}`, ttdX, y);

  // Nama file berdasarkan mode
  const fileName = isGroupMode && selectedStudents.length > 0
    ? `Surat_PKL_Kelompok_${selectedStudents.length}_siswa`
    : `Surat_PKL_${surat.name?.replace(/\s+/g, '_') || 'Individu'}`;
  
  doc.save(`${fileName}.pdf`);
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
          <h2 className="text-white font-bold mb-4">Data Pengajuan PKL</h2>

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
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(item);
                      }}
                      className="!bg-red-800 text-white px-4 py-1 rounded-md hover:bg-blue-600 transition flex items-center gap-2"
                    >
                      Edit Surat
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await handleExportPDF(item, false, []); // false untuk mode individu
                      }}
                      className="!bg-[#EC933A] text-white px-4 py-1 rounded-md hover:bg-orange-500 transition"
                    >
                      Cetak Surat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ================= MODAL EDIT ================= */}
      {showEditModal && selectedSurat && (
        <EditPengajuan
          selectedSurat={selectedSurat}
          guruDetail={guruDetail}
          allSiswa={pengajuanList}
          onSave={handleSaveEdit}
          onClose={() => setShowEditModal(false)}
          onExportPDF={handleExportPDF} // function yang sudah diperbaiki
        />
      )}

      {/* ================= SIDE PANEL PREVIEW SAJA ================= */}
      {showPreview && selectedSurat && !showEditModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* OVERLAY */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowPreview(false);
              setGuruDetail(null);
              setPdfGuruDetail(null);
            }}
          />

          {/* CLOSE BUTTON */}
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

          {/* SIDE PANEL */}
          <div className="relative bg-white h-full w-full max-w-3xl rounded-2xl shadow-2xl animate-slide-in-right overflow-y-auto">
            {/* ================= SURAT ================= */}
            <div className="p-12 text-black text-[12px] leading-relaxed">
              {/* KOP */}
              <div className="flex items-center border-b-2 border-black pb-4 mb-6">
                <img
                  src={logo}
                  alt="Logo Sekolah"
                  className="w-16 h-16 object-contain mr-4"
                />
                <div className="flex-1 text-center">
                  <h2 className="text-lg font-bold uppercase">
                    SMK NEGERI 2 SINGOSARI
                  </h2>
                  <p className="text-[10px]">
                    Jl. Perusahaan No.20 Tunjungtirto – Singosari<br />
                    Kabupaten Malang, Jawa Timur
                  </p>
                </div>
              </div>

              {/* TANGGAL */}
              <div className="text-right mb-6">
                Singosari, {new Date().toLocaleDateString("id-ID")}
              </div>

              {/* TUJUAN */}
              <p className="-mt-10">
                Kepada Yth.<br />
                <b>{selectedSurat.industri || "Pimpinan Industri"}</b><br />
                Di Tempat
              </p>

              {/* JUDUL */}
              <div className="text-center my-6">
                <p className="font-bold underline">
                  SURAT PERMOHONAN PRAKTIK KERJA LAPANGAN
                </p>
                <p className="text-[11px]">
                  Nomor: 001/SMK-N2/PKL/I/2026
                </p>
              </div>

              {/* ISI */}
              <p>Dengan hormat,</p>

              <p className="text-justify">
                Sehubungan dengan program Praktik Kerja Lapangan (PKL),
                bersama ini kami mengajukan permohonan untuk siswa berikut:
              </p>

              <table className="my-4">
                <tbody>
                  <tr>
                    <td className="w-32">Nama</td>
                    <td>: {selectedSurat.name}</td>
                  </tr>
                  <tr>
                    <td>Kelas</td>
                    <td>: {selectedSurat.class}</td>
                  </tr>
                  <tr>
                    <td>Jurusan</td>
                    <td>: {selectedSurat.jurusan}</td>
                  </tr>
                  <tr>
                    <td>NISN</td>
                    <td>: {selectedSurat.nisn}</td>
                  </tr>
                  <tr>
                    <td>Periode</td>
                    <td>
                      : {selectedSurat.tanggal_mulai && selectedSurat.tanggal_selesai
                          ? `${formatTanggal(selectedSurat.tanggal_mulai)} - ${formatTanggal(selectedSurat.tanggal_selesai)}`
                          : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>

              <p className="text-justify">
                Demikian surat permohonan ini kami sampaikan.
                Atas perhatian dan kerja sama Bapak/Ibu,
                kami ucapkan terima kasih.
              </p>

              {/* TTD */}
              <div className="mt-16 w-64 ml-auto text-left">
                <p>Kepala Program Keahlian,</p>
                <div className="h-16" />
                {guruDetail ? (
                  <>
                    <p className="font-bold">{guruDetail.nama || "-"}</p>
                    <p className="text-[11px]">NIP. {guruDetail.nip || "-"}</p>
                  </>
                ) : (
                  <p className="text-gray-500">Memuat data guru...</p>
                )}
              </div>

              {/* BUTTONS */}
              <div className="mt-12 flex justify-start gap-4">
                <button
                  onClick={() => handleEditClick(selectedSurat)}
                  className="!bg-red-800 text-white px-6 py-3 rounded-lg !text-md font-semibold hover:bg-blue-600 transition flex items-center gap-2"
                >
                  Edit Surat
                </button>
                <button
                  onClick={async () => {
                    await handleExportPDF(selectedSurat, false, []); // false untuk mode individu
                  }}
                  className="!bg-[#EC933A] text-white px-6 py-3 rounded-lg !text-md font-semibold hover:bg-orange-500 transition"
                >
                  Cetak Surat
                </button>
              </div>
            </div>
          </div>        
        </div>
      )}
    </div>
  );
}