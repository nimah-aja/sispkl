import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";

// import assets
import addSidebar from "../../assets/addSidebar.svg";
import cancelImg from "../../assets/cancel.svg";
import confirmSave from "../../assets/cancel.svg";

// import components
import DeleteConfirmationModal from "../../koordinator/components/Cancel";
import SaveConfirmationModal from "../../koordinator/components/Save";

export default function PenilaianForm({
  title,
  selectedItem,
  nilaiForm,
  onNilaiFormChange,
  onSubmit,
  onCancel,
  image,
  getPredikat,
  getDeskripsiByNilai,
  backgroundStyle = { backgroundColor: "#E1D6C4" },
  containerClassName = "w-full md:w-[1300px] max-h-screen bg-white",
  containerStyle = {},
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Fungsi untuk mendapatkan status berdasarkan nilai
  const getStatus = (nilai) => {
    if (!nilai && nilai !== 0) return "";
    const skor = parseInt(nilai);
    if (skor < 75) return "Kurang";
    if (skor >= 75 && skor <= 85) return "Baik";
    if (skor >= 86 && skor <= 100) return "Sangat Baik";
    return "";
  };

  const handleCancelClick = () => {
    setIsModalOpen(true);
  };

  return (
    <div
      className="flex h-screen w-screen justify-center items-center p-4"
      style={backgroundStyle}
    >
      <div
        className={`flex flex-col rounded-2xl shadow-lg overflow-hidden ${containerClassName}`}
        style={containerStyle}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b flex-shrink-0">
          <div
            onClick={handleCancelClick}
            className="p-2 rounded-full bg-[#EC933A] hover:bg-orange-600 text-white cursor-pointer"
          >
            <ArrowLeft size={20} />
          </div>
          <h1 className="!text-2xl font-bold">{title}</h1>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Side - Image */}
          <div className="hidden md:flex w-1/2 items-center justify-center border-r p-4">
            <img
              src={image || addSidebar}
              alt="addSidebar"
              className="max-w-xs w-full h-auto object-contain"
            />
          </div>

          {/* Right Side - Form */}
          <div className="flex w-full md:w-1/2 p-15 overflow-hidden">
            <form
              id="penilaianForm"
              onSubmit={(e) => {
                e.preventDefault();
                setIsSaveModalOpen(true);
              }}
              className="w-full max-w-lg grid grid-cols-1 p-1 gap-4 overflow-y-auto"
              style={{ maxHeight: "100%" }}
            >
              {/* Informasi Siswa (Read-only) */}
              <div className="col-span-1 bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    Nama Siswa
                  </label>
                  <input
                    type="text"
                    value={selectedItem?.nama || ""}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    NISN
                  </label>
                  <input
                    type="text"
                    value={selectedItem?.nisn || ""}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    Industri
                  </label>
                  <input
                    type="text"
                    value={selectedItem?.industri || ""}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              </div>

              {/* Aspek Penilaian 1 */}
              <div className="col-span-1 border rounded-lg p-4">
                <h3 className="font-bold mb-3">Aspek Penilaian 1</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Nilai (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={nilaiForm.skor_1}
                      onChange={(e) => onNilaiFormChange("skor_1", e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#641E21] focus:border-transparent"
                      placeholder="Masukkan nilai"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        Predikat
                      </label>
                      <input
                        type="text"
                        value={
                          nilaiForm.skor_1
                            ? getPredikat
                              ? getPredikat(nilaiForm.skor_1)
                              : ""
                            : ""
                        }
                        disabled
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                        placeholder="Otomatis"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <input
                        type="text"
                        value={nilaiForm.skor_1 ? getStatus(nilaiForm.skor_1) : ""}
                        disabled
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                        placeholder="Otomatis"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Deskripsi
                    </label>
                    <textarea
                      rows="3"
                      value={
                        nilaiForm.skor_1 && getDeskripsiByNilai
                          ? getDeskripsiByNilai(nilaiForm.skor_1, 1)
                          : ""
                      }
                      disabled
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                      placeholder="Deskripsi akan terisi otomatis"
                    />
                  </div>
                </div>
              </div>

              {/* Aspek Penilaian 2 */}
              <div className="col-span-1 border rounded-lg p-4">
                <h3 className="font-bold mb-3">Aspek Penilaian 2</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Nilai (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={nilaiForm.skor_2}
                      onChange={(e) => onNilaiFormChange("skor_2", e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#641E21] focus:border-transparent"
                      placeholder="Masukkan nilai"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        Predikat
                      </label>
                      <input
                        type="text"
                        value={
                          nilaiForm.skor_2
                            ? getPredikat
                              ? getPredikat(nilaiForm.skor_2)
                              : ""
                            : ""
                        }
                        disabled
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                        placeholder="Otomatis"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <input
                        type="text"
                        value={nilaiForm.skor_2 ? getStatus(nilaiForm.skor_2) : ""}
                        disabled
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                        placeholder="Otomatis"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Deskripsi
                    </label>
                    <textarea
                      rows="3"
                      value={
                        nilaiForm.skor_2 && getDeskripsiByNilai
                          ? getDeskripsiByNilai(nilaiForm.skor_2, 2)
                          : ""
                      }
                      disabled
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                      placeholder="Deskripsi akan terisi otomatis"
                    />
                  </div>
                </div>
              </div>

              {/* Aspek Penilaian 3 */}
              <div className="col-span-1 border rounded-lg p-4">
                <h3 className="font-bold mb-3">Aspek Penilaian 3</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Nilai (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={nilaiForm.skor_3}
                      onChange={(e) => onNilaiFormChange("skor_3", e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#641E21] focus:border-transparent"
                      placeholder="Masukkan nilai"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        Predikat
                      </label>
                      <input
                        type="text"
                        value={
                          nilaiForm.skor_3
                            ? getPredikat
                              ? getPredikat(nilaiForm.skor_3)
                              : ""
                            : ""
                        }
                        disabled
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                        placeholder="Otomatis"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <input
                        type="text"
                        value={nilaiForm.skor_3 ? getStatus(nilaiForm.skor_3) : ""}
                        disabled
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                        placeholder="Otomatis"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Deskripsi
                    </label>
                    <textarea
                      rows="3"
                      value={
                        nilaiForm.skor_3 && getDeskripsiByNilai
                          ? getDeskripsiByNilai(nilaiForm.skor_3, 3)
                          : ""
                      }
                      disabled
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                      placeholder="Deskripsi akan terisi otomatis"
                    />
                  </div>
                </div>
              </div>

              {/* Aspek Penilaian 4 */}
              <div className="col-span-1 border rounded-lg p-4">
                <h3 className="font-bold mb-3">Aspek Penilaian 4</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Nilai (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={nilaiForm.skor_4}
                      onChange={(e) => onNilaiFormChange("skor_4", e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#641E21] focus:border-transparent"
                      placeholder="Masukkan nilai"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        Predikat
                      </label>
                      <input
                        type="text"
                        value={
                          nilaiForm.skor_4
                            ? getPredikat
                              ? getPredikat(nilaiForm.skor_4)
                              : ""
                            : ""
                        }
                        disabled
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                        placeholder="Otomatis"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <input
                        type="text"
                        value={nilaiForm.skor_4 ? getStatus(nilaiForm.skor_4) : ""}
                        disabled
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                        placeholder="Otomatis"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Deskripsi
                    </label>
                    <textarea
                      rows="3"
                      value={
                        nilaiForm.skor_4 && getDeskripsiByNilai
                          ? getDeskripsiByNilai(nilaiForm.skor_4, 4)
                          : ""
                      }
                      disabled
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                      placeholder="Deskripsi akan terisi otomatis"
                    />
                  </div>
                </div>
              </div>

              {/* Catatan Akhir */}
              <div className="col-span-1 border rounded-lg p-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Catatan Akhir
                </label>
                <textarea
                  rows="4"
                  value={nilaiForm.catatan_akhir}
                  onChange={(e) => onNilaiFormChange("catatan_akhir", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#641E21] focus:border-transparent"
                  placeholder="Masukkan catatan akhir penilaian..."
                />
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-4 flex-shrink-0">
          <button
            type="button"
            onClick={handleCancelClick}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => setIsSaveModalOpen(true)}
            className="px-6 py-2 bg-[#EC933A] text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            {selectedItem?.hasItems ? "Update Penilaian" : "Simpan Penilaian"}
          </button>
        </div>

        {/* Modal Konfirmasi Kembali */}
        <DeleteConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onDelete={() => {
            setIsModalOpen(false);
            if (onCancel) onCancel();
          }}
          imageSrc={cancelImg}
          title="Apakah Anda yakin ingin kembali?"
          subtitle="Data yang sudah diisi akan terhapus."
        />

        {/* Modal Konfirmasi Simpan */}
        <SaveConfirmationModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onConfirm={() => {
            setIsSaveModalOpen(false);
            if (onSubmit) onSubmit();
          }}
          imageSrc={confirmSave}
          title="Apakah Anda yakin ingin menyimpan penilaian ini?"
          subtitle="Pastikan semua nilai sudah benar sebelum disimpan."
        />
      </div>
    </div>
  );
}