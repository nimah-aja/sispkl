import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import logo from "../../assets/logo.png";
import { X, Users, User } from "lucide-react";

export default function EditPengajuan({
  selectedSurat,
  guruDetail,
  allSiswa,
  onSave,
  onClose,
  onExportPDF
}) {
  const [editMode, setEditMode] = useState("individu");
  const [editableSurat, setEditableSurat] = useState(null);
  const [selectedSiswaForGroup, setSelectedSiswaForGroup] = useState([]);

  useEffect(() => {
    if (selectedSurat) {
      setEditableSurat({
        ...selectedSurat,
        periode: selectedSurat.tanggal_mulai && selectedSurat.tanggal_selesai
          ? `${formatTanggal(selectedSurat.tanggal_mulai)} - ${formatTanggal(selectedSurat.tanggal_selesai)}`
          : "",
        nama_kaprog: guruDetail?.nama || "",
        nip_kaprog: guruDetail?.nip || "",
      });
      setSelectedSiswaForGroup([selectedSurat]);
    }
  }, [selectedSurat, guruDetail]);

  const formatTanggal = (isoString) => {
    if (!isoString) return "-";
    try {
      const [year, month, day] = isoString.split('-');
      return `${day}-${month}-${year}`;
    } catch (err) {
      return isoString;
    }
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

  const handleSave = () => {
    if (!editableSurat) return;

    // Parse periode menjadi tanggal_mulai dan tanggal_selesai
    const updatedSurat = { ...editableSurat };
    if (updatedSurat.periode) {
      const [start, end] = updatedSurat.periode.split(" - ");
      updatedSurat.tanggal_mulai = parseTanggal(start.trim());
      updatedSurat.tanggal_selesai = parseTanggal(end?.trim() || start.trim());
    }

    // Jika mode kelompok, gabungkan data siswa yang dipilih
    if (editMode === "kelompok" && selectedSiswaForGroup.length > 0) {
      // Untuk kelompok, kita bisa menyimpan data tambahan
      updatedSurat.selectedSiswaForGroup = selectedSiswaForGroup;
    }

    onSave(updatedSurat);
  };

  const handleExport = () => {
    if (editableSurat) {
      // Tambahkan parameter untuk mode kelompok
      onExportPDF(
        editableSurat,
        editMode === "kelompok", // true jika mode kelompok
        editMode === "kelompok" ? selectedSiswaForGroup : [] // kirim data siswa jika kelompok
      );
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
      {/* OVERLAY */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* MODAL DUA KOLOM */}
      <div className="relative top-10 bg-white w-full max-w-7xl !h-[650px]  mx-auto rounded-2xl shadow-2xl animate-slide-in-right overflow-y-auto flex">
        
        {/* KOLOM KIRI - PREVIEW SURAT (50%) */}
        <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto bg-gray-50">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#641E21]">
              Preview Surat
            </h3>
            <p className="text-gray-600 text-sm">Tampilan surat yang akan dicetak</p>
          </div>

          {/* PREVIEW SURAT */}
          <div className="bg-white p-8 rounded-lg shadow-sm">
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
              <b>{editableSurat.industri || "Pimpinan Industri"}</b><br />
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

            {/* DATA SISWA */}
            <div className="my-4">
              {editMode === "kelompok" && selectedSiswaForGroup.length > 0 ? (
                <div>
                  <p className="font-semibold mb-2">Daftar Siswa:</p>
                  {selectedSiswaForGroup.map((siswa, index) => (
                    <p key={siswa.id} className="ml-4">
                      {index + 1}. {siswa.name} - {siswa.class} - NISN: {siswa.nisn}
                    </p>
                  ))}
                  <p className="mt-2"><strong>Jurusan:</strong> {editableSurat.jurusan}</p>
                  <p><strong>Periode:</strong> {editableSurat.periode}</p>
                </div>
              ) : (
                <table className="my-4">
                  <tbody>
                    <tr>
                      <td className="w-32">Nama</td>
                      <td>: {editableSurat.name}</td>
                    </tr>
                    <tr>
                      <td>Kelas</td>
                      <td>: {editableSurat.class}</td>
                    </tr>
                    <tr>
                      <td>Jurusan</td>
                      <td>: {editableSurat.jurusan}</td>
                    </tr>
                    <tr>
                      <td>NISN</td>
                      <td>: {editableSurat.nisn}</td>
                    </tr>
                    <tr>
                      <td>Periode</td>
                      <td>: {editableSurat.periode}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <p className="text-justify">
              Demikian surat permohonan ini kami sampaikan.
              Atas perhatian dan kerja sama Bapak/Ibu,
              kami ucapkan terima kasih.
            </p>

            {/* TTD */}
            <div className="mt-16 w-64 ml-auto text-left">
              <p>Kepala Program Keahlian,</p>
              <div className="h-16" />
              <p className="font-bold">{editableSurat.nama_kaprog || "-"}</p>
              <p className="text-[11px]">NIP. {editableSurat.nip_kaprog || "-"}</p>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN - FORM EDIT (50%) */}
        <div className="w-1/2 p-6 overflow-y-auto">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-[#641E21]">
              Edit Data Surat PKL
            </h3>
            <p className="text-gray-600 mt-2">Edit data surat untuk siswa atau kelompok</p>
          </div>

          {/* MODE SELECTION */}
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
                  <p className="text-sm">Edit surat untuk 1 siswa</p>
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
                  <p className="text-sm">Edit surat untuk beberapa siswa</p>
                </div>
              </button>
            </div>
          </div>

          {/* FORM EDIT */}
          <div className="space-y-6">
            {/* DATA UMUM */}
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-[#641E21] border-b pb-2">
                Data Umum
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Industri
                </label>
                <input
                  type="text"
                  value={editableSurat.industri || ""}
                  onChange={(e) => setEditableSurat({
                    ...editableSurat,
                    industri: e.target.value
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {editMode === "individu" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Siswa
                    </label>
                    <input
                      type="text"
                      value={editableSurat.name || ""}
                      onChange={(e) => setEditableSurat({
                        ...editableSurat,
                        name: e.target.value
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kelas
                    </label>
                    <input
                      type="text"
                      value={editableSurat.class || ""}
                      onChange={(e) => setEditableSurat({
                        ...editableSurat,
                        class: e.target.value
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jurusan
                </label>
                <input
                  type="text"
                  value={editableSurat.jurusan || ""}
                  onChange={(e) => setEditableSurat({
                    ...editableSurat,
                    jurusan: e.target.value
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {editMode === "individu" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NISN
                  </label>
                  <input
                    type="text"
                    value={editableSurat.nisn || ""}
                    onChange={(e) => setEditableSurat({
                      ...editableSurat,
                      nisn: e.target.value
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Periode (DD-MM-YYYY - DD-MM-YYYY)
                </label>
                <input
                  type="text"
                  value={editableSurat.periode || ""}
                  onChange={(e) => setEditableSurat({
                    ...editableSurat,
                    periode: e.target.value
                  })}
                  placeholder="Contoh: 01-01-2026 - 31-01-2026"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* DATA KAPROG */}
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-[#641E21] border-b pb-2">
                Data Kepala Program
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Kaprog
                </label>
                <input
                  type="text"
                  value={editableSurat.nama_kaprog || ""}
                  onChange={(e) => setEditableSurat({
                    ...editableSurat,
                    nama_kaprog: e.target.value
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIP Kaprog
                </label>
                <input
                  type="text"
                  value={editableSurat.nip_kaprog || ""}
                  onChange={(e) => setEditableSurat({
                    ...editableSurat,
                    nip_kaprog: e.target.value
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* PILIH SISWA UNTUK KELOMPOK */}
            {editMode === "kelompok" && (
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-[#641E21] border-b pb-2">
                  Pilih Siswa untuk Kelompok
                </h4>
                
                <div className="max-h-60 overflow-y-auto border rounded-lg p-4">
                  {allSiswa.map((siswa) => (
                    <div key={siswa.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedSiswaForGroup.some(s => s.id === siswa.id)}
                        onChange={() => handleCheckboxChange(siswa)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <div>
                        <p className="font-medium">{siswa.name}</p>
                        <p className="text-sm text-gray-500">
                          {siswa.class} | NISN: {siswa.nisn}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedSiswaForGroup.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-semibold text-blue-700">
                      {selectedSiswaForGroup.length} siswa terpilih
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      Surat akan dibuat untuk {selectedSiswaForGroup.length} siswa
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                onClick={onClose}
                className="px-6 py-2 !border !bg-transparent !border-red-500 !text-red-700 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleExport}
                className="px-6 py-2 !bg-[#EC933A] text-white rounded-lg hover:bg-orange-500 transition"
              >
                Cetak Surat
              </button>
            </div>
          </div>
        </div>
      </div>        
    </div>
  );
}