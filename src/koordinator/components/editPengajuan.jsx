import React, { useState, useEffect } from "react";
import { X, Users, User, Search, Calendar } from "lucide-react";
import logoSmk from "../../assets/LOGOPROV.png"; 

export default function EditPengajuan({
  selectedSurat,
  guruDetail,
  allSiswa,
  onSave,
  onClose,
  onExportPDF, 
}) {
  const [editMode, setEditMode] = useState("individu");
  const [editableSurat, setEditableSurat] = useState(null);
  const [selectedSiswaForGroup, setSelectedSiswaForGroup] = useState([]);
  const [tempatTanggal, setTempatTanggal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // STATE: Tab Aktif
  const [activeTab, setActiveTab] = useState("surat1");

  // Inisialisasi data
  useEffect(() => {
    if (selectedSurat) {
      const initialData = {
        ...selectedSurat,
        nama_perusahaan: selectedSurat.nama_perusahaan || selectedSurat.industri || "JTV MALANG",
        periode: selectedSurat.tanggal_mulai && selectedSurat.tanggal_selesai
            ? `${formatTanggal(selectedSurat.tanggal_mulai)} - ${formatTanggal(selectedSurat.tanggal_selesai)}`
            : "",
        nama_kaprog: guruDetail?.nama || "",
        nip_kaprog: guruDetail?.nip || "",
        // Default values
        class: selectedSurat.class || "XI",
        jurusan: selectedSurat.jurusan || "REKAYASA PERANGKAT LUNAK"
      };

      setEditableSurat(initialData);
      setTempatTanggal(`Singosari, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`);
      setSelectedSiswaForGroup([selectedSurat]);
    }
  }, [selectedSurat, guruDetail]);

  // Filter siswa
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
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
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
          return { ...siswa, ...currentData }; 
        }
        return { 
          ...siswa, 
          nama_perusahaan: currentData.nama_perusahaan, 
          industri: currentData.nama_perusahaan 
        };
      });
    } else {
      siswaUntukExport = [{ ...currentData }];
    }

    const students = siswaUntukExport.map((siswa) => ({
      nama: (siswa.name || "NAMA SISWA").toUpperCase(),
      nisn: siswa.nisn || "",
      kelas: siswa.class || "",
      jurusan: siswa.jurusan || "",
    }));

    const payload = {
      nama_perusahaan: currentData.nama_perusahaan || "JTV MALANG",
      school_info: {
        nama_sekolah: "SMK NEGERI 2 SINGOSARI",
        logo_url: "https://upload.wikimedia.org/wikipedia/commons/d/d6/Logo_SMKN_2_Singosari.png",
      },
      students: students,
      tempat_tanggal: tempatTanggal,
      periode_pkl: currentData.periode || "",
      tanggal_mulai: currentData.tanggal_mulai,
      tanggal_selesai: currentData.tanggal_selesai,
      nama_kaprog: currentData.nama_kaprog || guruDetail?.nama || "",
      nip_kaprog: currentData.nip_kaprog || guruDetail?.nip || "",
      tipe_surat: activeTab 
    };

    if (onExportPDF) {
      onExportPDF(payload, editMode === "kelompok", siswaUntukExport, activeTab);
    } else {
      alert("Fungsi export tidak tersedia!");
    }
  };

  const getDisplayStudents = () => {
    if (editMode === "kelompok") {
      return selectedSiswaForGroup.length > 0 ? selectedSiswaForGroup : [];
    }
    return [editableSurat];
  };

  const displayStudents = getDisplayStudents();

  if (!editableSurat) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative top-10 bg-white w-full max-w-7xl !h-[650px] mx-auto rounded-2xl shadow-2xl animate-slide-in-right overflow-y-auto flex">
        
        {/* === KOLOM KIRI (PREVIEW SURAT) === */}
        <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto bg-gray-50">
          <div className="mb-4 flex justify-between items-end">
            <div>
              <h3 className="text-xl font-bold text-[#641E21]">
                Preview {activeTab === 'surat1' ? 'Lembar Persetujuan' : 'Permohonan PJBL'}
              </h3>
              <p className="text-gray-600 text-sm">
                {editMode === "kelompok"
                  ? `Mode Kelompok: ${selectedSiswaForGroup.length} siswa`
                  : "Mode Individu"}
              </p>
            </div>
            
            {/* BUTTON SURAT 1 / SURAT 2 */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setActiveTab("surat1")}
                className={`px-4 py-1.5 rounded-lg font-bold text-sm transition-all border-2 ${
                  activeTab === "surat1"
                    ? "!bg-[#EC933A] !text-white !border-[#EC933A]" 
                    : "!bg-white !text-black !border-[#EC933A] hover:!bg-[#EC933A] hover:!text-white"
                }`}
              >
                Surat 1
              </button>
              <button
                onClick={() => setActiveTab("surat2")}
                className={`px-4 py-1.5 rounded-lg font-bold text-sm transition-all border-2 ${
                  activeTab === "surat2"
                    ? "!bg-[#EC933A] !text-white !border-[#EC933A]" 
                    : "!bg-white !text-black !border-[#EC933A] hover:!bg-[#EC933A] hover:!text-white"
                }`}
              >
                Surat 2
              </button>
            </div>
          </div>

          {/* KERTAS SURAT */}
          <div 
            className="bg-white p-10 rounded-lg shadow-sm text-[12px] leading-relaxed min-h-[800px] text-black"
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
            {/* --- KOP SURAT --- */}
            <div className="flex items-center justify-between border-b-4 border-double border-black pb-2 mb-4">
              <div className="flex-shrink-0"> 
                <img src={logoSmk} alt="Logo" className="w-24 h-24 object-contain" />
              </div>
              <div className="flex-1 text-center px-2"> 
                <p className="font-bold text-[14px]">PEMERINTAH PROVINSI JAWA TIMUR</p>
                <p className="font-bold text-[14px]">DINAS PENDIDIKAN</p>
                <p className="font-bold text-[16px]">SMK NEGERI 2 SINGOSARI</p>
                <p className="text-[11px] font-normal leading-tight">
                  Jalan Perusahaan No. 20, Tunjungtirto, Singosari, Kab. Malang, Jawa Timur, 65153<br />
                  Telepon (0341) 4345127
                </p>
              </div>
            </div>

            {activeTab === "surat1" ? (
              // === SURAT 1: LEMBAR PERSETUJUAN ===
              <>
                <div className="text-center my-6">
                  <p className="font-bold text-[14px] underline uppercase">LEMBAR PERSETUJUAN</p>
                </div>
                <div className="border border-black">
                  <div className="flex border-b border-black">
                    <div className="w-10 border-r border-black p-2 text-center font-bold">NO</div>
                    <div className="flex-1 border-r border-black p-2 font-bold text-center">PERIHAL</div>
                    <div className="w-1/3 border-r border-black p-2 font-bold text-center">DISETUJUI OLEH PIHAK DU/DI</div>
                    <div className="w-1/3 p-2 font-bold text-center">KETERANGAN</div>
                  </div>
                  <div className="flex">
                    <div className="w-10 border-r border-black p-2 text-center">1.</div>
                    <div className="flex-1 border-r border-black p-2">
                      <p>Permohonan pelaksanaan Pembelajaran Praktik Industri (PJBL)</p>
                      <p className="mt-2">untuk {displayStudents.length} orang siswa, atas nama:</p>
                      <div className="ml-4 mt-1">
                        {displayStudents.map((siswa, index) => (
                          <p key={siswa.id} className="font-bold">{index + 1}. {siswa.name.toUpperCase()}</p>
                        ))}
                      </div>
                    </div>
                    <div className="w-1/3 border-r border-black p-2">
                      <p>Nama : ..............................................</p>
                      <p className="mt-1">Tanggal : ...........................................</p>
                      <p className="mt-1">Paraf : </p>
                      <br />
                      <p className="font-bold mt-2">Catatan : </p>
                      <p>1. Mulai PKL pada tanggal :</p>
                      <p className="ml-3">........................... s/d ...........................</p>
                      <p>2. Diterima Sebanyak ……… siswa.</p>
                    </div>
                    <div className="w-1/3 p-2">
                      <p>Telah disetujui Siswa Siswi SMK NEGERI 2 SINGOSARI</p>
                      <p className="mt-1">untuk melaksanakan PKL di:</p>
                      <p className="font-bold mt-1 uppercase">{editableSurat.nama_perusahaan}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 text-right">
                  <p>{tempatTanggal}</p>
                  <p className="mt-1">Bapak / Ibu Pimpinan</p>
                  <br /><br /><br />
                  <p>( ................................................................ )</p>
                </div>
              </>
            ) : (
              // === SURAT 2: PERMOHONAN PJBL ===
              <>
                <div className="flex justify-end mt-2 mb-4"><p>{tempatTanggal}</p></div>
                <div className="flex justify-start text-[12px] leading-relaxed">
                  <table>
                    <tbody>
                      <tr><td className="w-20">Nomor</td><td>: 400.3 / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / 101.6.9.19 / {new Date().getFullYear()}</td></tr>
                      <tr><td>Lampiran</td><td>: -</td></tr>
                      <tr><td>Perihal</td><td className="font-bold underline">: Permohonan PJBL</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 text-[12px]">
                  <p>Kepada Yth,</p>
                  <p>Pimpinan <span className="font-bold uppercase">{editableSurat.nama_perusahaan}</span></p>
                  <p>Di Tempat</p>
                </div>
                <div className="mt-6 text-[12px] text-justify indent-10 leading-relaxed">
                  <p>
                    Dengan ini kami sampaikan bahwa kegiatan Pembelajaran Praktik Industri (PJBL) siswa-siswi SMK Negeri 2 Singosari akan dilaksanakan sekitar tanggal 
                    <span className="font-bold"> {editableSurat.tanggal_mulai ? formatTanggal(editableSurat.tanggal_mulai) : ".........."} </span> 
                    sampai dengan 
                    <span className="font-bold"> {editableSurat.tanggal_selesai ? formatTanggal(editableSurat.tanggal_selesai) : ".........."}</span>. 
                    Sehubungan dengan hal tersebut, kami mohon agar siswa-siswi kami dapat diterima di Instansi/Industri yang Bapak/Ibu pimpin. 
                    Adapun siswa-siswi yang akan kami ajukan untuk melaksanakan Pembelajaran Praktik Industri (PJBL) di Instansi/Industri yang Bapak/Ibu pimpin adalah sebanyak <span className="font-bold">{displayStudents.length} orang</span>, sebagai berikut:
                  </p>
                </div>
                <div className="mt-4">
                  <table className="w-full border-collapse border border-black text-[12px]">
                    <thead className="bg-transparent">
                      <tr>
                        <th className="border border-black px-2 py-1 w-10 text-center bg-gray-200">NO</th>
                        <th className="border border-black px-2 py-1 text-center bg-gray-200">NAMA</th>
                        <th className="border border-black px-2 py-1 w-24 text-center bg-gray-200">KELAS</th>
                        <th className="border border-black px-2 py-1 w-48 text-center bg-gray-200">JURUSAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayStudents.map((siswa, index) => (
                        <tr key={siswa.id}>
                          <td className="border border-black px-2 py-1 text-center">{index + 1}.</td>
                          <td className="border border-black px-2 py-1 uppercase">{siswa.name}</td>
                          <td className="border border-black px-2 py-1 text-center uppercase">{siswa.class || "XI"}</td>
                          <td className="border border-black px-2 py-1 text-center uppercase">{siswa.jurusan || "REKAYASA PERANGKAT LUNAK"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-[12px] text-justify indent-10">
                  <p>Demikian surat permohonan ini kami ajukan. Atas perhatian dan kerjasama yang baik, kami sampaikan terima kasih.</p>
                </div>
                <div className="mt-10 flex justify-end">
                  <div className="text-center w-60">
                    <p>Kepala SMK Negeri 2 Singosari,</p>
                    <br /><br /><br /><br />
                    <p className="font-bold underline">{guruDetail?.nama || "SUMIJAH, S.Pd., M.Si."}</p>
                    <div className="text-left ml-4">
                      <p>Pembina Utama Muda (IV/c)</p>
                      <p>NIP. {guruDetail?.nip || "19700210 199802 2 009"}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* === KOLOM KANAN (FORM EDIT) === */}
        <div className="w-1/2 p-6 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-[#641E21]">Edit Data {activeTab === 'surat1' ? 'Lembar Persetujuan' : 'Surat Permohonan'}</h3>
            <p className="text-gray-600 mt-2">Edit data untuk lembar persetujuan siswa atau kelompok</p>
          </div>

          {/* Mode Selector */}
          <div className="mb-8">
            <p className="font-semibold mb-3">Pilih Mode Edit:</p>
            <div className="flex gap-4">
              {/* TOMBOL INDIVIDU */}
              <button
                onClick={() => setEditMode("individu")}
                className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                  editMode === "individu"
                    ? "!bg-[#FEF2F2] !border-[#FECACA] !text-[#B91C1C]" 
                    : "!bg-[#F3F4F6] !border-transparent !text-gray-900 hover:!bg-gray-200"
                }`}
              >
                <div className={`mt-1 ${editMode === "individu" ? "text-red-600" : "text-gray-900"}`}>
                   <User size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg">Individu</p>
                  <p className={`text-sm ${editMode === "individu" ? "text-red-800" : "text-gray-600"}`}>
                    Edit untuk 1 siswa
                  </p>
                </div>
              </button>
              
              {/* TOMBOL KELOMPOK */}
              <button
                onClick={() => setEditMode("kelompok")}
                className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                  editMode === "kelompok"
                    ? "!bg-[#FEF2F2] !border-[#FECACA] !text-[#B91C1C]" 
                    : "!bg-[#F3F4F6] !border-transparent !text-gray-900 hover:!bg-gray-200"
                }`}
              >
                <div className={`mt-1 ${editMode === "kelompok" ? "text-red-600" : "text-gray-900"}`}>
                   <Users size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg">Kelompok</p>
                  <p className={`text-sm ${editMode === "kelompok" ? "text-red-800" : "text-gray-600"}`}>
                     Edit untuk beberapa siswa
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-6">
             <h4 className="font-bold text-lg text-[#641E21] border-b pb-2">
               {activeTab === 'surat1' ? 'Data Industri/DU/DI' : 'Data Siswa'}
             </h4>
            
            {/* === KONDISI FORM BERDASARKAN TAB SURAT === */}
            
            {/* --- FORM LENGKAP (SURAT 1) --- */}
            {activeTab === 'surat1' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Industri *</label>
                  <input
                    type="text"
                    value={editableSurat.nama_perusahaan}
                    onChange={(e) => setEditableSurat({ ...editableSurat, nama_perusahaan: e.target.value, industri: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#641E21] outline-none"
                    placeholder="Contoh: yubik"
                  />
                  <p className="text-xs text-gray-500 mt-1">Data asli: {selectedSurat?.nama_perusahaan}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tempat dan Tanggal Surat *</label>
                  <input
                    type="text"
                    value={tempatTanggal}
                    onChange={(e) => setTempatTanggal(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#641E21] outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Biarkan titik-titik untuk tanggal, nanti akan ditulis manual setelah dicetak</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={editableSurat.tanggal_mulai || ""}
                      onChange={(e) => setEditableSurat({ ...editableSurat, tanggal_mulai: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#641E21] outline-none"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={editableSurat.tanggal_selesai || ""}
                      onChange={(e) => setEditableSurat({ ...editableSurat, tanggal_selesai: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#641E21] outline-none"
                    />
                  </div>
                </div>

                {editMode === "individu" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Siswa *</label>
                    <input
                      type="text"
                      value={editableSurat.name}
                      onChange={(e) => setEditableSurat({...editableSurat, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#641E21] outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Data asli: {selectedSurat?.name}</p>
                  </div>
                )}
              </>
            )}

            {/* --- FORM SEDERHANA (SURAT 2 - HANYA NAMA, KELAS, JURUSAN) --- */}
            {activeTab === 'surat2' && (
              <>
                {editMode === "individu" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Siswa *</label>
                      <input
                        type="text"
                        value={editableSurat.name}
                        onChange={(e) => setEditableSurat({...editableSurat, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#641E21] outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Data asli: {selectedSurat?.name}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                        <input
                          type="text"
                          value={editableSurat.class}
                          onChange={(e) => setEditableSurat({...editableSurat, class: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#641E21] outline-none"
                          placeholder="Contoh: XI"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jurusan</label>
                        <input
                          type="text"
                          value={editableSurat.jurusan}
                          onChange={(e) => setEditableSurat({...editableSurat, jurusan: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#641E21] outline-none"
                          placeholder="Contoh: REKAYASA PERANGKAT LUNAK"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* --- PILIH SISWA (MODE KELOMPOK) - TAMPIL DI KEDUA SURAT --- */}
            {editMode === "kelompok" && (
              <div className="space-y-3 mt-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Cari & Pilih Siswa ({selectedSiswaForGroup.length})</label>
                  <div className="flex gap-2">
                    <button onClick={handleSelectAll} className="text-xs text-blue-600 hover:underline">Pilih Semua</button>
                    <button onClick={handleDeselectAll} className="text-xs text-red-600 hover:underline">Reset</button>
                  </div>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Ketik nama siswa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#641E21]"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto border rounded-lg bg-white">
                  {filteredSiswa.length === 0 ? (
                    <p className="p-4 text-center text-sm text-gray-500">Tidak ada siswa ditemukan.</p>
                  ) : (
                    filteredSiswa.map((siswa) => (
                      <div key={siswa.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b last:border-0">
                        <input
                          type="checkbox"
                          checked={selectedSiswaForGroup.some((s) => s.id === siswa.id)}
                          onChange={() => handleCheckboxChange(siswa)}
                          className="w-4 h-4 text-[#641E21] rounded"
                        />
                        <div className="text-sm">
                          <p className="font-semibold text-gray-800">{siswa.name}</p>
                          <p className="text-xs text-gray-500">{siswa.class} | {siswa.jurusan}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
            {/* TOMBOL BATAL */}
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg !border-2 !border-[#3B82F6] !text-black !bg-white hover:!bg-blue-50 transition font-bold"
            >
              Batal
            </button>
            
            {/* TOMBOL CETAK */}
            <button
              onClick={handleExport}
              className="px-6 py-3 rounded-lg !bg-[#EC933A] !text-white hover:!bg-orange-600 transition font-bold"
            >
              {activeTab === 'surat1' ? 'Cetak Lembar Persetujuan' : 'Cetak Surat Permohonan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}