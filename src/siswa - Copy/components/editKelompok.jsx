// src/pages/siswa/components/UbahKelompokModal.jsx
import React, { useState, useEffect } from "react";
import { X, Search, UserPlus, Check } from "lucide-react";
import { getAvailableMembers, updateGroupMembers } from "../../utils/services/siswa/group";

export default function UbahKelompokModal({ isOpen, onClose, onUpdate, groupId, currentMembers }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAnggota, setSelectedAnggota] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter current members untuk mendapatkan anggota yang sudah ada (selain ketua)
  const currentNonLeaderMembers = currentMembers
    .filter(m => !m.is_leader)
    .map(m => m.siswa);

  // Fetch available members when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableMembers();
      // Set selectedAnggota dengan anggota yang sudah ada
      setSelectedAnggota(currentNonLeaderMembers);
    }
  }, [isOpen]);

  const fetchAvailableMembers = async () => {
    setIsFetching(true);
    try {
      const response = await getAvailableMembers();
      setAvailableMembers(response);
    } catch (error) {
      console.error("Gagal mengambil data anggota:", error);
      // Tampilkan pesan error ke user
      alert(error?.message || "Gagal mengambil data anggota. Silakan coba lagi.");
    } finally {
      setIsFetching(false);
    }
  };

  // Filter members based on search term
  useEffect(() => {
    if (searchTerm.length > 0) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        const filtered = availableMembers.filter(
          (siswa) =>
            siswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
            siswa.nisn.includes(searchTerm) ||
            siswa.kelas.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(filtered);
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, availableMembers]);

  const handleSelectAnggota = (siswa) => {
    const isSelected = selectedAnggota.some((a) => a.id === siswa.id);
    
    if (isSelected) {
      setSelectedAnggota(selectedAnggota.filter((a) => a.id !== siswa.id));
    } else {
      setSelectedAnggota([...selectedAnggota, siswa]);
    }
  };

  const handleRemoveAnggota = (id) => {
    setSelectedAnggota(selectedAnggota.filter((a) => a.id !== id));
  };

  const handleSubmit = async () => {
    if (selectedAnggota.length === 0) {
      alert("Pilih minimal 1 anggota untuk kelompok");
      return;
    }

    setIsSubmitting(true);
    try {
      // Ambil hanya nama dari anggota terpilih (SESUAI DENGAN addKelompok.jsx)
      const invitedMembers = selectedAnggota.map(anggota => anggota.nama);
      
      // Buat payload sesuai format yang diminta
      const payload = {
        invited_members: invitedMembers
      };

      console.log("Updating group members with payload:", payload);

      // Panggil API update group
      const response = await updateGroupMembers(groupId, payload);
      
      console.log("Group updated successfully:", response);
      
      // Panggil callback onUpdate dengan data anggota terpilih
      onUpdate(selectedAnggota);
      
      // Reset state dan tutup modal
      setSearchTerm("");
      setSelectedAnggota([]);
      onClose();
    } catch (error) {
      console.error("Gagal mengupdate kelompok:", error);
      
      // Tampilkan pesan error yang lebih spesifik
      const errorMessage = error?.response?.data?.message || error?.message || "Gagal mengupdate kelompok. Silakan coba lagi.";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSearchTerm("");
    setSelectedAnggota([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop dengan background gelap transparan */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal dengan ukuran fixed */}
      <div className="relative bg-white rounded-xl shadow-xl w-[600px] h-[450px] flex flex-col overflow-hidden z-[10000]">
        {/* Header - fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[#641E20]">
              Ubah Kelompok
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Tambahkan atau hapus teman dari kelompok
            </p>
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="relative mb-6">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari nama, NISN, dan kelas"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC933A] focus:border-transparent"
              disabled={isFetching || isSubmitting}
            />
          </div>

          {isFetching ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC933A]"></div>
            </div>
          ) : (
            <>
              {searchTerm && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    Hasil Pencarian
                  </h3>
                  <div className="space-y-2">
                    {isLoading ? (
                      <div className="text-center py-4 text-gray-500">
                        Mencari...
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((siswa) => {
                        const isSelected = selectedAnggota.some(
                          (a) => a.id === siswa.id
                        );
                        return (
                          <div
                            key={siswa.id}
                            onClick={() => !isSubmitting && handleSelectAnggota(siswa)}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                              isSelected
                                ? "border-[#EC933A] bg-orange-50"
                                : "border-gray-200 hover:border-[#EC933A] hover:bg-orange-50/50"
                            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#641E20] flex items-center justify-center text-white font-bold">
                                {siswa.nama.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">
                                  {siswa.nama}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {siswa.nisn} • {siswa.kelas}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <Check size={18} className="text-[#EC933A]" />
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        Tidak ada siswa ditemukan
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedAnggota.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    Anggota terpilih ({selectedAnggota.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedAnggota.map((anggota) => (
                      <div
                        key={anggota.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#641E20] flex items-center justify-center text-white font-bold">
                            {anggota.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {anggota.nama}
                            </p>
                            <p className="text-sm text-gray-500">
                              {anggota.nisn} • {anggota.kelas}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => !isSubmitting && handleRemoveAnggota(anggota.id)}
                          disabled={isSubmitting}
                          className="!bg-transparent p-1 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X size={16} className="text-[#BC2424]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!searchTerm && selectedAnggota.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Tidak ada anggota terpilih</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - fixed */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 !bg-transparent !text-gray-700 font-medium hover:!bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedAnggota.length === 0 || isFetching || isSubmitting}
            className={`px-4 py-2 !bg-[#EC933A] text-white font-medium rounded-lg transition-colors flex items-center gap-2 ${
              selectedAnggota.length === 0 || isFetching || isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[#d67d2a]"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}