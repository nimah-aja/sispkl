import React, { useState, useEffect } from "react";
import { X, Users, User, Search } from "lucide-react";
import logoSmk from "../../assets/logo.png"

export default function EditPengajuan({
  selectedSurat,
  guruDetail,
  allSiswa,
  onSave,
  onClose,
  onExportPDF,
  onGenerateSuratTugas
}) {
  const [editMode, setEditMode] = useState("individu");
  const [editableSurat, setEditableSurat] = useState(null);
  const [selectedSiswaForGroup, setSelectedSiswaForGroup] = useState([]);
  const [tempatTanggal, setTempatTanggal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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
      };
      
      setEditableSurat(initialData);
      
      // Set default tempat tanggal
      setTempatTanggal(`Malang, ${formatTanggalSurat()}`);
      
      // Saat pertama kali buka, otomatis pilih siswa yang sedang diedit
      setSelectedSiswaForGroup([selectedSurat]);
      
      console.log("✅ Data awal di-set:", initialData);
    }
  }, [selectedSurat, guruDetail]);

  // Debug log untuk perubahan
  useEffect(() => {
    console.log("🔄 editableSurat diperbarui:", editableSurat);
  }, [editableSurat]);

  useEffect(() => {
    console.log("🔄 tempatTanggal diperbarui:", tempatTanggal);
  }, [tempatTanggal]);

  // Filter siswa berdasarkan search query
  const filteredSiswa = allSiswa.filter(siswa => {
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
      const [year, month, day] = isoString.split('-');
      return `${day}-${month}-${year}`;
    } catch (err) {
      return isoString;
    }
  };

  const formatTanggalSurat = () => {
    const now = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return now.toLocaleDateString('id-ID', options);
  };

  const parseTanggal = (formattedDate) => {
    if (!formattedDate) return "";
    try {
      const [day, month, year] = formattedDate.split('-');
      return `${year}-${month}-${day}`;
    } catch (err) {
      return formattedDate;
    }
  };

  const handleCheckboxChange = (siswa) => {
    setSelectedSiswaForGroup(prev => {
      const exists = prev.find(s => s.id === siswa.id);
      if (exists) {
        return prev.filter(s => s.id !== siswa.id);
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

  const handleSave = () => {
    if (!editableSurat) return;

    const updatedSurat = { ...editableSurat };
    if (updatedSurat.periode) {
      const [start, end] = updatedSurat.periode.split(" - ");
      updatedSurat.tanggal_mulai = parseTanggal(start.trim());
      updatedSurat.tanggal_selesai = parseTanggal(end?.trim() || start.trim());
    }

    if (editMode === "kelompok" && selectedSiswaForGroup.length > 0) {
      updatedSurat.selectedSiswaForGroup = selectedSiswaForGroup;
    }

    onSave(updatedSurat);
  };

  const handleExport = () => {
    console.log("=== DEBUG: handleExport dipanggil ===");
    console.log("Edit mode:", editMode);
    console.log("Selected siswa count:", selectedSiswaForGroup.length);
    
    // **VALIDASI**: Pastikan ada data yang diedit
    if (!editableSurat) {
      alert("❌ Data tidak ditemukan!");
      return;
    }

    // **PASTIKAN**: Ambil data TERBARU dari state
    const currentData = { ...editableSurat };
    
    console.log("📋 Data TERBARU dari form:");
    console.log("1. Nama Perusahaan:", currentData.nama_perusahaan);
    console.log("2. Industri:", currentData.industri);
    console.log("3. Nama Siswa:", currentData.name);
    console.log("4. Kelas:", currentData.class);
    console.log("5. NISN:", currentData.nisn);
    console.log("6. Jurusan:", currentData.jurusan);
    console.log("7. Periode:", currentData.periode);
    console.log("8. Tempat Tanggal (state):", tempatTanggal);
    console.log("9. Data asli (selectedSurat):", selectedSurat);

    // Tentukan siswa yang akan diexport
    let siswaUntukExport = [];
    
    if (editMode === "kelompok") {
      if (selectedSiswaForGroup.length === 0) {
        alert("⚠️ Silakan pilih minimal 1 siswa untuk mode kelompok!");
        return;
      }
      
      // Untuk kelompok: gunakan data TERBARU untuk semua siswa yang dipilih
      siswaUntukExport = selectedSiswaForGroup.map(siswa => {
        // Jika ini siswa yang sedang diedit, gunakan data TERBARU dari form
        if (siswa.id === currentData.id) {
          return {
            ...siswa,
            // Override dengan data TERBARU dari form
            name: currentData.name || siswa.name,
            class: currentData.class || siswa.class,
            nisn: currentData.nisn || siswa.nisn,
            jurusan: currentData.jurusan || siswa.jurusan,
            nama_perusahaan: currentData.nama_perusahaan || currentData.industri || siswa.nama_perusahaan,
            industri: currentData.nama_perusahaan || currentData.industri || siswa.industri
          };
        }
        // Untuk siswa lain, tetap data asli tapi perusahaan menggunakan data TERBARU
        return {
          ...siswa,
          nama_perusahaan: currentData.nama_perusahaan || currentData.industri || siswa.nama_perusahaan,
          industri: currentData.nama_perusahaan || currentData.industri || siswa.industri
        };
      });
      
      console.log(`✅ Mode kelompok: ${siswaUntukExport.length} siswa terpilih`);
    } else {
      // Mode individu: gunakan SEMUA data TERBARU dari form
      siswaUntukExport = [{
        id: currentData.id,
        name: currentData.name || "SISWA",
        class: currentData.class || "",
        nisn: currentData.nisn || "",
        jurusan: currentData.jurusan || "",
        nama_perusahaan: currentData.nama_perusahaan || currentData.industri || "JTV MALANG",
        industri: currentData.nama_perusahaan || currentData.industri || "JTV MALANG",
        tanggal_mulai: currentData.tanggal_mulai,
        tanggal_selesai: currentData.tanggal_selesai,
        periode: currentData.periode
      }];
      console.log(`✅ Mode individu: 1 siswa (${currentData.name})`);
    }

    // **PASTIKAN**: Format students dengan data TERBARU
    const students = siswaUntukExport.map(siswa => ({
      nama: (siswa.name || "NAMA SISWA").toUpperCase(),
      nisn: siswa.nisn || "",
      kelas: siswa.class || "",
      jurusan: siswa.jurusan || "",
    }));

    // **PASTIKAN**: Payload menggunakan data TERBARU dari form
    const payload = {
      nama_perusahaan: currentData.nama_perusahaan || currentData.industri || "JTV MALANG",
      school_info: {
        nama_sekolah: "SMK NEGERI 2 SINGOSARI",
        alamat_jalan: "Jalan Perusahaan No. 20",
        kab_kota: "Kab. Malang",
        provinsi: "Jawa Timur",
        kode_pos: "65153",
        telepon: "(0341) 458823",
        logo_url: "https://upload.wikimedia.org/wikipedia/commons/d/d6/Logo_SMKN_2_Singosari.png"
      },
      students: students,
      tempat_tanggal: tempatTanggal || `Malang, ${formatTanggalSurat()}`,
      periode_pkl: currentData.periode || "",
      tanggal_mulai: currentData.tanggal_mulai,
      tanggal_selesai: currentData.tanggal_selesai,
      nama_kaprog: currentData.nama_kaprog || guruDetail?.nama || "",
      nip_kaprog: currentData.nip_kaprog || guruDetail?.nip || ""
    };

    console.log("✅ PAYLOAD AKHIR YANG AKAN DIKIRIM KE BE:");
    console.log("=========================================");
    console.log("Nama perusahaan:", payload.nama_perusahaan);
    console.log("Tempat Tanggal:", payload.tempat_tanggal);
    console.log("Periode PKL:", payload.periode_pkl);
    console.log("Jumlah students:", payload.students.length);
    console.log("Daftar students:");
    payload.students.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.nama} | ${s.kelas} | ${s.jurusan}`);
    });
    console.log("Data perusahaan asli (selectedSurat):", selectedSurat?.nama_perusahaan);
    console.log("Data perusahaan diedit:", currentData.nama_perusahaan);
    console.log("=========================================");

    // Validasi final
    if (payload.nama_perusahaan === selectedSurat?.nama_perusahaan) {
      console.warn("⚠️ PERINGATAN: Nama perusahaan masih sama dengan data asli!");
      console.warn("   Data asli:", selectedSurat?.nama_perusahaan);
      console.warn("   Data diedit:", currentData.nama_perusahaan);
    } else {
      console.log("✅ Nama perusahaan BERHASIL diubah!");
    }

    if (onExportPDF) {
      // **KIRIM DATA TERBARU** ke parent component
      onExportPDF(payload, editMode === "kelompok", siswaUntukExport);
    } else {
      alert("❌ Fungsi export tidak tersedia!");
    }
  };

  const handleGenerateSuratTugas = () => {
    if (!editableSurat) {
      console.error("❌ Editable surat tidak ada!");
      return;
    }

    if (onGenerateSuratTugas) {
      onGenerateSuratTugas(editableSurat);
    } else {
      alert("❌ Fungsi generate Surat Tugas tidak tersedia!");
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

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative top-10 bg-white w-full max-w-7xl !h-[650px] mx-auto rounded-2xl shadow-2xl animate-slide-in-right overflow-y-auto flex">
        
        {/* KOLOM KIRI - PREVIEW */}
        <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto bg-gray-50">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#641E21]">
              Preview Lembar Persetujuan
            </h3>
            <p className="text-gray-600 text-sm">
              {editMode === "kelompok" 
                ? `Mode Kelompok: ${selectedSiswaForGroup.length} siswa` 
                : "Mode Individu"}
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm text-[12px] leading-relaxed">
            <div className="mr-4">
                <img 
                  src={logoSmk} 
                  alt="Logo SMK Negeri 2 Singosari" 
                  className="w-20 h-20 object-contain"
                />
              </div>
            <div className="text-center border-b-2 border-black pb-4 mb-6 -mt-18">
              <p className="font-bold text-lg uppercase">PEMERINTAH PROVINSI JAWA TIMUR</p>
              <p className="font-bold text-lg uppercase">DINAS PENDIDIKAN</p>
              <p className="font-bold text-lg uppercase">SMK NEGERI 2 SINGOSARI</p>
              <p className="text-sm">
                Jalan Perusahaan No. 20, Kab. Malang, Jawa Timur, 65153<br />
                Telepon (0341) 458823
              </p>
            </div>

            <div className="border border-black my-4 -mt-7"></div>

            <div className="text-center my-6">
              <p className="font-bold text-lg underline">LEMBAR PERSETUJUAN</p>
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
                  <p>Permohonan pelaksanaan Pembelajaran Praktik Industri (PJBL)</p>
                  <p className="mt-1">
                    untuk {editMode === "kelompok" && selectedSiswaForGroup.length > 0 
                      ? `${selectedSiswaForGroup.length} orang siswa` 
                      : "1 orang siswa"}, atas nama:
                  </p>
                  
                  {editMode === "kelompok" && selectedSiswaForGroup.length > 0 ? (
                    <div className="ml-4">
                      {selectedSiswaForGroup.map((siswa, index) => (
                        <p key={siswa.id}>
                          {index + 1}. {siswa.name.toUpperCase()}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="ml-4">1. {editableSurat.name.toUpperCase()}</p>
                  )}
                </div>
                
                <div className="w-1/3 border-r border-black p-2">
                  <p>Nama :</p>
                  <p>............................................................</p>
                  <p>Tanggal : </p>
                  <p>............................................................</p>
                  <p className="mt-2">Paraf : </p>
                  
                  <p className="mt-7">Catatan : </p>
                  <p className="">1. Mulai PKL pada tanggal : ................................................... s/d</p>
                  <p>...........................................................</p>
                  <p>2. Diterima Sebanyak ……… siswa.</p>
                </div>
                
                <div className="w-1/3 p-2">
                  <p>Telah disetujui Siswa Siswi SMK NEGERI 2 SINGOSARI</p>
                  <p>untuk melaksanakan PKL di {editableSurat.nama_perusahaan || editableSurat.industri || "JTV MALANG"}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-end">
              <p className="mr-7">{tempatTanggal || `Malang, ${formatTanggalSurat()}`}</p>
              <p className="mt-2 mr-10">Bapak / Ibu Pimpinan</p>
              <div className="mt-16">
                <p>( ................................................................ )</p>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN - FORM EDIT */}
        <div className="w-1/2 p-6 overflow-y-auto">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-[#641E21]">
              Edit Data Lembar Persetujuan PKL
            </h3>
            <p className="text-gray-600 mt-2">Edit data untuk lembar persetujuan siswa atau kelompok</p>
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
                  <p className="text-sm">Edit untuk 1 siswa</p>
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
                  <p className="text-sm">Edit untuk beberapa siswa</p>
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
                  value={editableSurat.nama_perusahaan || editableSurat.industri || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log("✏️ Mengubah nama perusahaan menjadi:", value);
                    setEditableSurat({
                      ...editableSurat,
                      nama_perusahaan: value,
                      industri: value
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contoh: JTV MALANG"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Data asli: {selectedSurat?.nama_perusahaan || selectedSurat?.industri}
                </p>
              </div>

              

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tempat dan Tanggal Surat *
                </label>
                <input
                  type="text"
                  value={tempatTanggal}
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log("✏️ Mengubah tempat tanggal menjadi:", value);
                    setTempatTanggal(value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contoh: Malang, 12 Januari 2026"
                />
              </div>

              {editMode === "individu" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Siswa *
                    </label>
                    <input
                      type="text"
                      value={editableSurat.name || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        console.log("✏️ Mengubah nama siswa menjadi:", value);
                        setEditableSurat({
                          ...editableSurat,
                          name: value
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Data asli: {selectedSurat?.name}
                    </p>
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
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-green-800">
                        {selectedSiswaForGroup.length} siswa terpilih
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        Semua siswa ini akan dicetak dalam 1 PDF dengan data yang diedit
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="max-h-80 overflow-y-auto border rounded-lg">
                  <div className="sticky top-0 bg-gray-50 p-3 border-b">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Daftar Siswa ({filteredSiswa.length})
                      </span>
                    </div>
                  </div>
                  
                  {filteredSiswa.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Tidak ada data siswa</p>
                  ) : (
                    <div className="divide-y">
                      {filteredSiswa.map((siswa) => (
                        <div key={siswa.id} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selectedSiswaForGroup.some(s => s.id === siswa.id)}
                            onChange={() => handleCheckboxChange(siswa)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {siswa.name}
                              {siswa.id === selectedSurat?.id && (
                                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                  Sedang diedit
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-semibold text-blue-800 mb-2">Status Ekspor:</h5>
              <div className="text-sm text-blue-700">
                <p>• Mode: <span className="font-bold">{editMode === "kelompok" ? "KELOMPOK" : "INDIVIDU"}</span></p>
                <p>• Jumlah siswa: <span className="font-bold">
                  {editMode === "kelompok" 
                    ? `${selectedSiswaForGroup.length} siswa` 
                    : "1 siswa"}
                </span></p>
                <p>• Perusahaan: <span className="font-bold">{editableSurat.nama_perusahaan || editableSurat.industri || "JTV MALANG"}</span></p>
                <p>• Tempat Tanggal: <span className="font-bold">{tempatTanggal || `Malang, ${formatTanggalSurat()}`}</span></p>
              </div>
            </div>

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
                  : "Cetak Lembar Persetujuan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}