import React, { useState, useEffect } from "react";
import { X, Users, User, Search } from "lucide-react";
import logoSmk from "../../assets/LOGOPROV.png";

export default function EditPengajuan({
  selectedSurat,
  guruDetail,
  allSiswa,
  onSave,
  onClose,
  onExportPDF,
  onGenerateSuratTugas,
}) {
  const [editMode, setEditMode] = useState("individu");
  const [editableSurat, setEditableSurat] = useState(null);
  const [selectedSiswaForGroup, setSelectedSiswaForGroup] = useState([]);
  const [tempatTanggal, setTempatTanggal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Default active tab ke "surat1"
  const [activeTab, setActiveTab] = useState("surat1");

  // Inisialisasi data
  useEffect(() => {
    if (selectedSurat) {
      const initialData = {
        ...selectedSurat,
        nama_perusahaan:
          selectedSurat.nama_perusahaan ||
          selectedSurat.industri ||
          "JTV MALANG",
        periode:
          selectedSurat.tanggal_mulai && selectedSurat.tanggal_selesai
            ? `${formatTanggal(selectedSurat.tanggal_mulai)} - ${formatTanggal(selectedSurat.tanggal_selesai)}`
            : "",
        nama_kaprog: guruDetail?.nama || "",
        nip_kaprog: guruDetail?.nip || "",
        
        // DATA TAMBAHAN SURAT 1 (Default Value)
        nomor_surat: selectedSurat.nomor_surat || "400.3 /       / 101.6.9.19 / 2025",
        nama_kepala_sekolah: selectedSurat.nama_kepala_sekolah || "Sumijah, S.Pd., M.Si.",
        nip_kepala_sekolah: selectedSurat.nip_kepala_sekolah || "19700210 199802 2 009",
        tanggal_mulai: selectedSurat.tanggal_mulai || "",
        tanggal_selesai: selectedSurat.tanggal_selesai || ""
      };

      setEditableSurat(initialData);

      // Set default tempat tanggal
      setTempatTanggal(`Singosari, .................................... 2025`);

      // Saat pertama kali buka, otomatis pilih siswa yang sedang diedit
      setSelectedSiswaForGroup([selectedSurat]);
    }
  }, [selectedSurat, guruDetail]);

  // Filter siswa berdasarkan search query
  const filteredSiswa = allSiswa.filter((siswa) => {
    if (searchQuery.trim() === "") return true;
    const query = searchQuery.toLowerCase();
    return (
      siswa.name.toLowerCase().includes(query) ||
      siswa.class.toLowerCase().includes(query) ||
      (siswa.nisn && siswa.nisn.toLowerCase().includes(query))
    );
  });

  const formatTanggal = (isoString) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      const day = date.getDate();
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

  const handleCheckboxChange = (siswa) => {
    setSelectedSiswaForGroup((prev) => {
      const exists = prev.find((s) => s.id === siswa.id);
      if (exists) {
        return prev.filter((s) => s.id !== siswa.id);
      } else {
        return [...prev, siswa];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedSiswaForGroup([...allSiswa]);
  };

  const handleDeselectAll = () => {
    if (editMode === "individu" && selectedSurat) {
      setSelectedSiswaForGroup([selectedSurat]);
    } else {
      setSelectedSiswaForGroup([]);
    }
  };

  const handleExport = () => {
    if (!editableSurat) {
      alert("Data tidak ditemukan!");
      return;
    }

    const currentData = { ...editableSurat };
    let siswaUntukExport = [];

    if (editMode === "kelompok") {
      if (selectedSiswaForGroup.length === 0) {
        alert("Silakan pilih minimal 1 siswa untuk mode kelompok!");
        return;
      }
      siswaUntukExport = selectedSiswaForGroup.map((siswa) => {
        if (siswa.id === currentData.id) {
          return {
            ...siswa,
            name: currentData.name || siswa.name,
            class: currentData.class || siswa.class,
            nisn: currentData.nisn || siswa.nisn,
            jurusan: currentData.jurusan || siswa.jurusan,
            nama_perusahaan: currentData.nama_perusahaan || currentData.industri || siswa.nama_perusahaan,
          };
        }
        return {
           ...siswa,
           nama_perusahaan: currentData.nama_perusahaan || currentData.industri || siswa.nama_perusahaan
        };
      });
    } else {
      siswaUntukExport = [{
          ...currentData,
          nama_perusahaan: currentData.nama_perusahaan || currentData.industri || "JTV MALANG"
      }];
    }

    const students = siswaUntukExport.map((siswa) => ({
      nama: (siswa.name || "NAMA SISWA").toUpperCase(),
      nisn: siswa.nisn || "",
      kelas: siswa.class || "",
      jurusan: siswa.jurusan || "",
    }));

    const payload = {
      ...currentData, // Sertakan semua data editan (nomor surat, kepsek, nip, dll)
      nama_perusahaan: currentData.nama_perusahaan || currentData.industri || "JTV MALANG",
      school_info: {
        nama_sekolah: "SMK NEGERI 2 SINGOSARI",
        alamat_jalan: "Jalan Perusahaan No. 20",
        kab_kota: "Kab. Malang",
        provinsi: "Jawa Timur",
        kode_pos: "65153",
        telepon: "(0341) 458823",
        logo_url: "https://upload.wikimedia.org/wikipedia/commons/d/d6/Logo_SMKN_2_Singosari.png",
      },
      students: students,
      tempat_tanggal: tempatTanggal,
      periode_pkl: currentData.periode || "",
      jenis_surat: activeTab 
    };

    if (onExportPDF) {
      onExportPDF(payload, editMode === "kelompok", siswaUntukExport);
    } else {
      alert("Fungsi export tidak tersedia!");
    }
  };

  if (!editableSurat) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl p-8">
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }

  // Helper untuk mendapatkan list siswa yang akan ditampilkan di surat
  const displayStudents = editMode === "kelompok" && selectedSiswaForGroup.length > 0
    ? selectedSiswaForGroup
    : [{ ...editableSurat, id: editableSurat.id || 999 }];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative top-10 bg-white w-full max-w-7xl !h-[650px] mx-auto rounded-2xl shadow-2xl animate-slide-in-right overflow-y-auto flex">
        {/* KOLOM KIRI - PREVIEW */}
        <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto bg-gray-50 flex flex-col">
          
          {/* HEADER */}
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h3 className="text-xl font-bold text-[#641E21]">
                {activeTab === "surat1" ? "Pratinjau Surat Permohonan" : "Pratinjau Lembar Persetujuan"}
              </h3>
              <p className="text-gray-600 text-sm">
                {editMode === "kelompok"
                  ? `Mode Kelompok: ${selectedSiswaForGroup.length} siswa`
                  : "Mode Individu"}
              </p>
            </div>

            {/* BUTTON GROUP */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("surat1")}
                className={`px-4 py-1.5 rounded-lg font-bold text-sm transition-all duration-200 border-2 ${
                  activeTab === "surat1"
                    ? "!bg-[#EC933A] !text-white !border-[#EC933A]"
                    : "!bg-white !text-black !border-[#EC933A] hover:!bg-[#EC933A] hover:!text-white"
                }`}
              >
                Surat 1
              </button>
              <button
                onClick={() => setActiveTab("surat2")}
                className={`px-4 py-1.5 rounded-lg font-bold text-sm transition-all duration-200 border-2 ${
                  activeTab === "surat2"
                    ? "!bg-[#EC933A] !text-white !border-[#EC933A]"
                    : "!bg-white !text-black !border-[#EC933A] hover:!bg-[#EC933A] hover:!text-white"
                }`}
              >
                Surat 2
              </button>
            </div>
          </div>

          {/* ================================================================================= */}
          {/* === KONTEN SURAT 1: SURAT PERMOHONAN PKL === */}
          {/* ================================================================================= */}
          {activeTab === "surat1" && (
            <div className="bg-white p-10 rounded-lg shadow-sm text-[12px] leading-relaxed text-black">
               {/* KOP SURAT */}
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

              {/* TANGGAL SURAT */}
              <div className="text-right mt-2 mb-4">
                  <p>{tempatTanggal}</p>
              </div>

              {/* META DATA SURAT */}
              <div className="mb-6 w-full">
                  <table className="border-none w-auto">
                      <tbody>
                          <tr>
                              <td className="align-top pr-2">Nomor</td>
                              <td className="align-top pr-2">:</td>
                              <td className="align-top">{editableSurat.nomor_surat}</td>
                          </tr>
                          <tr>
                              <td className="align-top pr-2">Lampiran</td>
                              <td className="align-top pr-2">:</td>
                              <td className="align-top">-</td>
                          </tr>
                          <tr>
                              <td className="align-top pr-2">Perihal</td>
                              <td className="align-top pr-2">:</td>
                              <td className="align-top font-bold underline">Permohonan Praktik Kerja Lapangan (PKL)</td>
                          </tr>
                      </tbody>
                  </table>
              </div>

              {/* TUJUAN SURAT */}
              <div className="mb-6">
                  <p>Kepada Yth,</p>
                  <p className="font-bold">Pimpinan {editableSurat.nama_perusahaan || ".........................."}</p>
                  <p>Di Tempat</p>
              </div>

              {/* ISI SURAT */}
              <p className="text-justify mb-4 indent-8">
                  Dengan ini kami sampaikan bahwa kegiatan Praktik Kerja Lapangan (PKL) siswa-siswi SMK Negeri 2 Singosari akan dilaksanakan sekitar tanggal 
                  <span className="font-semibold mx-1">
                    {editableSurat.tanggal_mulai ? formatTanggal(editableSurat.tanggal_mulai) : ".............."}
                  </span> 
                  s.d 
                  <span className="font-semibold mx-1">
                    {editableSurat.tanggal_selesai ? formatTanggal(editableSurat.tanggal_selesai) : ".............."}
                  </span>.
                  Sehubungan dengan hal tersebut, kami mohon agar siswa-siswi kami dapat diterima di Instansi/Industri yang Bapak/Ibu pimpin. Adapun siswa-siswi yang akan kami ajukan untuk melaksanakan Praktik Kerja Lapangan (PKL) di Instansi/Industri yang Bapak/Ibu pimpin adalah sebanyak {displayStudents.length} orang, sebagai berikut:
              </p>

              {/* TABEL SISWA */}
              <div className="mb-6 mx-4">
                  <table className="w-full border-collapse border border-black">
                      <thead>
                          <tr className="bg-gray-100 text-center">
                              <th className="border border-black px-2 py-1 w-10">NO</th>
                              <th className="border border-black px-2 py-1">NAMA</th>
                              <th className="border border-black px-2 py-1 w-20">KELAS</th>
                              <th className="border border-black px-2 py-1 w-32">JURUSAN</th>
                          </tr>
                      </thead>
                      <tbody>
                          {displayStudents.map((siswa, index) => (
                              <tr key={index}>
                                  <td className="border border-black px-2 py-1 text-center">{index + 1}.</td>
                                  <td className="border border-black px-2 py-1 uppercase">{siswa.name || editableSurat.name}</td>
                                  <td className="border border-black px-2 py-1 text-center">{siswa.class || editableSurat.class}</td>
                                  <td className="border border-black px-2 py-1 text-center">{siswa.jurusan || editableSurat.jurusan}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>

              {/* PENUTUP */}
              <p className="text-justify mb-8 indent-8">
                  Demikian surat permohonan ini kami ajukan. Atas perhatian dan kerjasama yang baik, kami sampaikan terima kasih.
              </p>

              {/* TANDA TANGAN */}
              <div className="flex justify-end mt-4">
                  <div className="text-left w-64">
                      <p>Kepala SMK Negeri 2 Singosari,</p>
                      <br />
                      <br />
                      <br />
                      <br />
                      <p className="font-bold underline">{editableSurat.nama_kepala_sekolah}</p>
                      <p>Pembina Utama Muda (IV/c)</p>
                      <p>NIP. {editableSurat.nip_kepala_sekolah}</p>
                  </div>
              </div>

            </div>
          )}

          {/* ================================================================================= */}
          {/* === KONTEN SURAT 2: LEMBAR PERSETUJUAN === */}
          {/* ================================================================================= */}
          {activeTab === "surat2" && (
            <div className="bg-white p-8 rounded-lg shadow-sm text-[12px] leading-relaxed">
              {/* KOP SURAT */}
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

              <div className="text-center my-4">
                <p className="font-bold text-md underline">LEMBAR PERSETUJUAN</p>
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
                    <p>Permohonan pelaksanaan Praktik Kerja Lapangan (PKL)</p>
                    <p className="mt-1">untuk {displayStudents.length} orang siswa, atas nama:</p>
                    <div className="ml-4 mt-1">
                      {displayStudents.map((siswa, index) => (
                        <p key={index}>{index + 1}. {siswa.name ? siswa.name.toUpperCase() : editableSurat.name ? editableSurat.name.toUpperCase() : ""}</p>
                      ))}
                    </div>
                  </div>

                  <div className="w-1/3 border-r border-black p-2">
                    <p>Nama : ............................................................</p>
                    <p>Tanggal : ............................................................</p>
                    <p className="mt-2">Paraf : </p>
                    <p className="mt-7">Catatan : </p>
                    <p>1. Mulai PKL pada tanggal : ................................................... s/d ...........................................................</p>
                    <p>2. Diterima Sebanyak ……… siswa.</p>
                  </div>

                  <div className="w-1/3 p-2">
                    <p>Telah disetujui Siswa Siswi SMK NEGERI 2 SINGOSARI</p>
                    <p>untuk melaksanakan PKL di {editableSurat.nama_perusahaan || editableSurat.industri || "JTV MALANG"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-end">
                <p className="mr-7 font-medium">{tempatTanggal || `Malang, .................................... 2026`}</p>
                <p className="mt-1 mr-10">Bapak / Ibu Pimpinan</p>
                <div className="mt-12">
                  <p>( ................................................................ )</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* KOLOM KANAN - FORM EDIT */}
        <div className="w-1/2 p-6 overflow-y-auto">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-[#641E21]">
              Ubah Data {activeTab === "surat1" ? "Surat Permohonan" : "Lembar Persetujuan"}
            </h3>
            <p className="text-gray-600 mt-2">
              Ubah data untuk surat siswa atau kelompok
            </p>
          </div>

          <div className="mb-8">
            <p className="text-lg font-semibold mb-4">Pilih Mode Edit:</p>
            <div className="flex gap-4">
              <button
                onClick={() => setEditMode("individu")}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg border-2 transition ${
                  editMode === "individu"
                    ? "!bg-red-50 border-red-500 text-red-700"
                    : "!bg-gray-50 border-gray-300 text-gray-700 hover:border-blue-300"
                }`}
              >
                <User size={20} />
                <div className="text-left">
                  <p className="font-semibold">Individu</p>
                  <p className="text-sm">Ubah untuk 1 siswa</p>
                </div>
              </button>

              <button
                onClick={() => setEditMode("kelompok")}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg border-2 transition ${
                  editMode === "kelompok"
                    ? "!bg-red-50 border-red-500 text-red-700"
                    : "!bg-gray-50 border-gray-300 text-gray-700 hover:border-blue-300"
                }`}
              >
                <Users size={20} />
                <div className="text-left">
                  <p className="font-semibold">Kelompok</p>
                  <p className="text-sm">Ubah untuk beberapa siswa</p>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-[#641E21] border-b pb-2">
                Data Industri/DU/DI
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Industri *
                </label>
                <input
                  type="text"
                  value={
                    editableSurat.nama_perusahaan ||
                    editableSurat.industri ||
                    ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditableSurat({
                      ...editableSurat,
                      nama_perusahaan: value,
                      industri: value,
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contoh: JTV MALANG"
                />
              </div>

              {/* INPUT TAMBAHAN KHUSUS SURAT 1 */}
              {activeTab === "surat1" && (
                <>
                  <h4 className="font-bold text-lg text-[#641E21] border-b pb-2 pt-4">
                    Detail Surat Permohonan
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nomor Surat
                    </label>
                    <input
                      type="text"
                      value={editableSurat.nomor_surat || ""}
                      onChange={(e) =>
                        setEditableSurat({ ...editableSurat, nomor_surat: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Pembuatan Surat (Singosari, ...)
                    </label>
                    <input
                      type="text"
                      value={tempatTanggal}
                      onChange={(e) => setTempatTanggal(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Mulai PKL
                      </label>
                      <input
                        type="date"
                        value={editableSurat.tanggal_mulai || ""}
                        onChange={(e) =>
                          setEditableSurat({ ...editableSurat, tanggal_mulai: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Selesai PKL
                      </label>
                      <input
                        type="date"
                        value={editableSurat.tanggal_selesai || ""}
                        onChange={(e) =>
                          setEditableSurat({ ...editableSurat, tanggal_selesai: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <h4 className="font-bold text-lg text-[#641E21] border-b pb-2 pt-4">
                    Tanda Tangan Kepala Sekolah
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Kepala Sekolah & Gelar
                    </label>
                    <input
                      type="text"
                      value={editableSurat.nama_kepala_sekolah || ""}
                      onChange={(e) =>
                        setEditableSurat({ ...editableSurat, nama_kepala_sekolah: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NIP Kepala Sekolah
                    </label>
                    <input
                      type="text"
                      value={editableSurat.nip_kepala_sekolah || ""}
                      onChange={(e) =>
                        setEditableSurat({ ...editableSurat, nip_kepala_sekolah: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* INPUT BIASA UNTUK SURAT 2 */}
              {activeTab === "surat2" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempat dan Tanggal Surat
                  </label>
                  <input
                    type="text"
                    value={tempatTanggal}
                    onChange={(e) => setTempatTanggal(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: Malang, .................................... 2026"
                  />
                </div>
              )}


              {editMode === "individu" && (
                <>
                  <div className="pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Siswa *
                    </label>
                    <input
                      type="text"
                      value={editableSurat.name || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditableSurat({
                          ...editableSurat,
                          name: value,
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            {editMode === "kelompok" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-lg text-[#641E21]">
                    Pilih Siswa untuk Kelompok
                    <span className="ml-2 text-sm font-normal text-blue-600">
                      ({selectedSiswaForGroup.length} terpilih)
                    </span>
                  </h4>

                  <div className="flex gap-2 items-center">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Cari siswa..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1 border border-gray-300 rounded text-sm w-40"
                      />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={handleSelectAll}
                        className="px-3 py-1 text-sm !bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Pilih Semua
                      </button>
                      <button
                        onClick={handleDeselectAll}
                        className="px-3 py-1 text-sm !bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Hapus Semua
                      </button>
                    </div>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto border rounded-lg">
                  {filteredSiswa.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Tidak ada data siswa
                    </p>
                  ) : (
                    <div className="divide-y">
                      {filteredSiswa.map((siswa) => (
                        <div
                          key={siswa.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSiswaForGroup.some(
                              (s) => s.id === siswa.id
                            )}
                            onChange={() => handleCheckboxChange(siswa)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {siswa.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                onClick={onClose}
                className="px-6 py-3 !border !bg-transparent !border-red-500 !text-red-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Batal
              </button>

              <button
                onClick={handleExport}
                className="px-6 py-3 !bg-[#EC933A] text-white rounded-lg hover:bg-orange-500 transition font-medium"
              >
                {editMode === "kelompok"
                  ? `Cetak (${selectedSiswaForGroup.length} siswa)`
                  : "Cetak Dokumen"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}