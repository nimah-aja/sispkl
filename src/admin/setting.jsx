import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import uploadIcon from "../assets/importimage.svg";
import iconPlus from "../assets/iconplus.svg";
import { Pencil, Save, X } from "lucide-react";
import axios from "axios";

// Import fungsi API dari sekolah.js
import { getSekolah, updateSekolah } from "../utils/services/admin/sekolah";

/* =========================
   CONFIG FIELD
========================= */
const fields = [
  { label: "Akreditasi", name: "akreditasi", type: "text" },
  { label: "Email", name: "email", type: "email" },
  { label: "Jalan", name: "jalan", type: "text" },
  { label: "Jenis Sekolah", name: "jenisSekolah", type: "text" },
  { label: "Kabupaten/Kota", name: "kabupatenKota", type: "text" },
  { label: "Kecamatan", name: "kecamatan", type: "text" },
  { label: "Kelurahan", name: "kelurahan", type: "text" },
  { label: "Kepala Sekolah", name: "kepalaSekolah", type: "text" },
  { label: "Kode Pos", name: "kodePos", type: "text" },
  { label: "Nama Sekolah", name: "namaSekolah", type: "text" },
  { label: "NIP Kepala Sekolah", name: "nipKepalaSekolah", type: "text" },
  { label: "Nomor Telepon", name: "nomorTelepon", type: "tel" },
  { label: "NPSN", name: "npsn", type: "text" },
  { label: "Provinsi", name: "provinsi", type: "text" },
  { label: "Website", name: "website", type: "url" },
];

// URL LOGO DEFAULT
const DEFAULT_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/d/d6/Logo_SMKN_2_Singosari.png";

/* =========================
   FIELD COMPONENT
========================= */
function ProfileField({ label, name, type, value, isEdit, onChange }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-semibold text-gray-800 mb-2">
        {label}:
      </p>

      {isEdit ? (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          placeholder={`Masukkan ${label.toLowerCase()}`}
          className="w-full border-b-2 border-gray-300 py-2 px-1 focus:outline-none focus:border-blue-500 text-gray-700 bg-transparent transition-colors"
        />
      ) : (
        <p className="text-gray-600 py-2 border-b border-transparent min-h-[44px] flex items-center">
          {value || "-"}
        </p>
      )}
    </div>
  );
}

/* =========================
   MAIN COMPONENT
========================= */
export default function Setting() {
  const [active, setActive] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sekolahId, setSekolahId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    akreditasi: "",
    email: "",
    jalan: "",
    jenisSekolah: "",
    kabupatenKota: "",
    kecamatan: "",
    kelurahan: "",
    kepalaSekolah: "",
    kodePos: "",
    namaSekolah: "",
    nipKepalaSekolah: "",
    nomorTelepon: "",
    npsn: "",
    provinsi: "",
    website: "",
  });

  // Simpan data awal untuk reset jika batal
  const [initialFormData, setInitialFormData] = useState({ ...formData });
  const [initialLogoSekolah, setInitialLogoSekolah] = useState(null);
  const [initialMaskot, setInitialMaskot] = useState(null);

  const [logoSekolah, setLogoSekolah] = useState(DEFAULT_LOGO_URL); // Default logo
  const [logoSekolahFile, setLogoSekolahFile] = useState(null);
  const [maskot, setMaskot] = useState(null);
  const [maskotFile, setMaskotFile] = useState(null);
  const [originalLogoFromAPI, setOriginalLogoFromAPI] = useState(""); // Simpan logo asli dari API

  /* =========================
     FETCH DATA SEKOLAH
  ========================= */
  useEffect(() => {
    fetchSekolahData();
  }, []);

  const fetchSekolahData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      
      console.log("Memulai fetch sekolah data...");
      const response = await getSekolah();
      
      console.log("API Response getSekolah:", response);
      
      if (response.success && response.data) {
        const sekolah = response.data;
        console.log("Data sekolah:", sekolah);
        
        setSekolahId(sekolah.id || sekolah.ID);
        
        // Mapping data dari API ke formData
        const mappedData = {
          akreditasi: sekolah.akreditasi || "",
          email: sekolah.email || "",
          jalan: sekolah.jalan || "",
          jenisSekolah: sekolah.jenis_sekolah || "",
          kabupatenKota: sekolah.kabupaten_kota || "",
          kecamatan: sekolah.kecamatan || "",
          kelurahan: sekolah.kelurahan || "",
          kepalaSekolah: sekolah.kepala_sekolah || "",
          kodePos: sekolah.kode_pos || "",
          namaSekolah: sekolah.nama_sekolah || "",
          nipKepalaSekolah: sekolah.nip_kepala_sekolah || "",
          nomorTelepon: sekolah.nomor_telepon || "",
          npsn: sekolah.npsn || "",
          provinsi: sekolah.provinsi || "",
          website: sekolah.website || "",
        };
        
        console.log("Mapped formData:", mappedData);
        
        setFormData(mappedData);

        // Simpan sebagai data awal
        setInitialFormData(mappedData);

        // Set logo jika ada URL dari API
        let logoToDisplay = DEFAULT_LOGO_URL;
        if (sekolah.logo && sekolah.logo !== "") {
          // Jika logo dari API ada dan tidak kosong
          if (sekolah.logo.startsWith('http')) {
            logoToDisplay = sekolah.logo;
          } else if (sekolah.logo.startsWith('data:image')) {
            // Jika logo dalam format base64
            logoToDisplay = sekolah.logo;
          }
          setOriginalLogoFromAPI(sekolah.logo); // Simpan logo asli dari API
        } else if (sekolah.logo_url && sekolah.logo_url !== "") {
          logoToDisplay = sekolah.logo_url;
          setOriginalLogoFromAPI(sekolah.logo_url);
        }
        
        console.log("Logo yang akan ditampilkan:", logoToDisplay);
        console.log("Logo asli dari API:", sekolah.logo || sekolah.logo_url);
        
        setLogoSekolah(logoToDisplay);
        setInitialLogoSekolah(logoToDisplay);
        
        console.log("Fetch data berhasil");
      } else {
        console.error("Invalid response structure:", response);
        setErrorMessage("Format response tidak valid dari server");
      }
    } catch (error) {
      console.error("Error fetching sekolah data:", error);
      let errorMsg = `Gagal memuat data sekolah: ${error.message}`;
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMsg = `Error ${error.response.status}: ${JSON.stringify(error.response.data)}`;
        } else if (error.request) {
          errorMsg = "Tidak ada response dari server. Periksa koneksi internet.";
        }
      }
      
      setErrorMessage(errorMsg);
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     HANDLER
  ========================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (type) => (e) => {
    if (!isEdit) return;
    
    const file = e.target.files[0];
    if (!file) return;

    // Validasi ukuran file (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file maksimal 2MB");
      return;
    }

    // Validasi tipe file
    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "logo") {
        setLogoSekolah(reader.result);
        setLogoSekolahFile(file);
      } else {
        setMaskot(reader.result);
        setMaskotFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  // Fungsi untuk convert File ke base64 (DENGAN PREFIX)
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Kirim SELURUH base64 string dengan prefix
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    
    if (!sekolahId) {
      alert("ID sekolah tidak ditemukan");
      return;
    }

    try {
      setIsSaving(true);
      console.log("=== MEMULAI UPDATE SEKOLAH ===");
      console.log("Sekolah ID:", sekolahId);
      console.log("FormData saat submit:", formData);
      
      // Prepare payload sesuai dengan API
      const payload = {
        akreditasi: formData.akreditasi,
        email: formData.email,
        jalan: formData.jalan,
        jenisSekolah: formData.jenisSekolah,
        kabupatenKota: formData.kabupatenKota,
        kecamatan: formData.kecamatan,
        kelurahan: formData.kelurahan,
        kepalaSekolah: formData.kepalaSekolah,
        kodePos: formData.kodePos,
        namaSekolah: formData.namaSekolah,
        nipKepalaSekolah: formData.nipKepalaSekolah,
        nomorTelepon: formData.nomorTelepon,
        npsn: formData.npsn,
        provinsi: formData.provinsi,
        website: formData.website,
      };

      // Handle logo HANYA jika ada file baru yang diupload
      if (logoSekolahFile) {
        try {
          const base64Logo = await convertImageToBase64(logoSekolahFile);
          payload.logo = base64Logo;
          console.log("Logo akan diupdate dengan file baru, panjang base64:", base64Logo.length);
        } catch (logoError) {
          console.error("Error converting logo to base64:", logoError);
          // Jika error konversi, jangan kirim logo (biarkan tetap logo yang ada)
          delete payload.logo;
        }
      } else {
        // Jika TIDAK ada file baru yang diupload
        console.log("Tidak ada file logo baru, periksa status logo:");
        console.log("logoSekolah:", logoSekolah);
        console.log("originalLogoFromAPI:", originalLogoFromAPI);
        
        // Cek apakah user menghapus logo (klik hapus logo)
        if (logoSekolah === DEFAULT_LOGO_URL) {
          // Jika user memilih untuk menggunakan logo default
          console.log("User memilih logo default, kirim string kosong");
          payload.logo = "";
        } else if (logoSekolah === originalLogoFromAPI) {
          // Jika logo masih sama dengan dari API, JANGAN kirim field logo
          console.log("Logo tidak berubah, tidak akan mengirim field logo");
          delete payload.logo;
        } else if (!logoSekolah || logoSekolah === "") {
          // Jika user menghapus logo
          console.log("User menghapus logo, kirim string kosong");
          payload.logo = "";
        } else {
          // Untuk keamanan, kirim logo yang ada
          payload.logo = logoSekolah;
          console.log("Mengirim logo yang ada di state");
        }
      }

      console.log("Payload yang akan dikirim ke updateSekolah:", {
        ...payload,
        logo: payload.logo ? `[logo data: ${payload.logo.length} chars]` : 'undefined'
      });

      // Panggil API update
      const response = await updateSekolah(sekolahId, payload);
      
      console.log("Update response:", response);
      
      if (response.success) {
        console.log("Data berhasil diupdate:", response);
        
        // Update data awal dengan data baru
        setInitialFormData({ ...formData });
        
        // Update logo asli dari API
        if (response.data && response.data.logo) {
          setOriginalLogoFromAPI(response.data.logo);
        }
        
        // Jika ada file logo baru yang diupload, update state
        if (logoSekolahFile) {
          setInitialLogoSekolah(logoSekolah);
        }
        
        setInitialMaskot(maskot);
        
        // Reset file setelah upload berhasil
        setLogoSekolahFile(null);
        setMaskotFile(null);
        
        setIsEdit(false);
        alert("Profil berhasil diperbarui!");
        
        // Refresh data dari server
        await fetchSekolahData();
      } else {
        throw new Error(response.message || "Gagal memperbarui data");
      }
    } catch (error) {
      console.error("Error updating sekolah:", error);
      
      let errorMsg = `Gagal memperbarui data sekolah: ${error.message}`;
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error("Error response data:", error.response.data);
          console.error("Error response status:", error.response.status);
          
          if (error.response.data) {
            errorMsg = `Error ${error.response.status}: `;
            if (typeof error.response.data === 'object') {
              errorMsg += JSON.stringify(error.response.data);
            } else {
              errorMsg += error.response.data;
            }
          }
        } else if (error.request) {
          console.error("No response received:", error.request);
          errorMsg = "Tidak ada response dari server. Periksa koneksi internet atau endpoint API.";
        }
      }
      
      setErrorMessage(errorMsg);
      alert(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = () => {
    // Simpan data saat ini sebagai data awal untuk mode edit
    setInitialFormData({ ...formData });
    setInitialLogoSekolah(logoSekolah);
    setInitialMaskot(maskot);
    
    // Reset file upload saat masuk mode edit
    setLogoSekolahFile(null);
    setMaskotFile(null);
    setErrorMessage("");
    
    // Masuk ke mode edit
    setIsEdit(true);
  };

  const handleCancel = () => {
    // Kembalikan ke data sebelum edit
    setFormData({ ...initialFormData });
    setLogoSekolah(initialLogoSekolah || DEFAULT_LOGO_URL);
    setMaskot(initialMaskot);
    
    // Reset file upload
    setLogoSekolahFile(null);
    setMaskotFile(null);
    setErrorMessage("");
    
    // Keluar dari mode edit
    setIsEdit(false);
  };

  // Fungsi untuk menghapus logo (tombol hapus)
  const handleRemoveLogo = () => {
    if (!isEdit) return;
    
    setLogoSekolah(DEFAULT_LOGO_URL);
    setLogoSekolahFile(null);
    console.log("Logo direset ke default");
  };

  // Fungsi untuk menghapus maskot
  const handleRemoveMaskot = () => {
    if (!isEdit) return;
    
    setMaskot(null);
    setMaskotFile(null);
  };

  if (isLoading && !isEdit) {
    return (
      <div className="bg-white min-h-screen w-full">
        <Header />
        <div className="flex flex-col md:flex-row">
          <div className="md:block hidden">
            <Sidebar active={active} setActive={setActive} />
          </div>
          <main className="flex-1 p-4 sm:p-6 md:p-10 rounded-none md:rounded-l-3xl shadow-inner bg-[#F6F7FC] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat data sekolah...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen w-full">
      <Header/>
      <div className="flex flex-col md:flex-row">
        <div className="md:block hidden">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 rounded-none md:rounded-l-3xl shadow-inner bg-[#F6F7FC]">
          <div className="max-w-5xl mx-auto bg-white rounded-[30px] p-6 md:p-8 shadow-sm">
            <h2 className="text-3xl font-bold mb-6 md:mb-8">Profil Sekolah</h2>
            
            {errorMessage && !isEdit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                <strong>Error:</strong> {errorMessage}
              </div>
            )}

            {/* FORM hanya untuk mode edit */}
            {isEdit ? (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-12 gap-6 md:gap-10">
                  {/* ===== LEFT IMAGE SECTION ===== */}
                  <div className="col-span-12 md:col-span-4 space-y-6 md:space-y-8">
                    {/* Logo Sekolah */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-sm font-medium">Logo Sekolah</p>
                        {logoSekolah !== DEFAULT_LOGO_URL && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="!text-xs !text-red-600 !bg-transparent hover:text-red-800"
                          >
                            Hapus Logo
                          </button>
                        )}
                      </div>
                      <div className="border-2 border-dashed rounded-lg p-6 md:p-8 bg-gray-50 text-center cursor-pointer hover:bg-gray-100 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="logo-upload"
                          onChange={handleImageUpload("logo")}
                        />
                        
                        <label htmlFor="logo-upload" className="block cursor-pointer">
                          {logoSekolah ? (
                            <div className="relative inline-block">
                              <img 
                                src={logoSekolah} 
                                alt="Logo Sekolah" 
                                className="w-24 h-24 md:w-28 md:h-28 object-contain mx-auto" 
                              />
                              <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 shadow-md">
                                <img src={iconPlus} alt="Ubah" className="w-6 h-6 md:w-8 md:h-8" />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <img src={uploadIcon} alt="Upload" className="w-16 md:w-20 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">
                                Klik untuk mengupload logo
                              </p>
                            </div>
                          )}
                        </label>
                        <p className="text-xs text-gray-500 mt-2">Format: JPG, PNG, SVG (Max 2MB)</p>
                        {logoSekolahFile && (
                          <p className="text-xs text-green-600 mt-1">
                            File baru dipilih: {logoSekolahFile.name}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Kosongkan untuk menggunakan logo default
                        </p>
                      </div>
                    </div>

                    {/* Maskot */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-sm font-medium">Maskot</p>
                        {maskot && (
                          <button
                            type="button"
                            onClick={handleRemoveMaskot}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Hapus Maskot
                          </button>
                        )}
                      </div>
                      <div className="border-2 border-dashed rounded-lg p-6 md:p-8 bg-gray-50 text-center cursor-pointer hover:bg-gray-100 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="maskot-upload"
                          onChange={handleImageUpload("maskot")}
                        />
                        
                        <label htmlFor="maskot-upload" className="block cursor-pointer">
                          {maskot ? (
                            <div className="relative inline-block">
                              <img 
                                src={maskot} 
                                alt="Maskot" 
                                className="w-24 h-24 md:w-28 md:h-28 object-contain mx-auto" 
                              />
                              <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 shadow-md">
                                <img src={iconPlus} alt="Ubah" className="w-6 h-6 md:w-8 md:h-8" />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <img src={uploadIcon} alt="Upload" className="w-16 md:w-20 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">
                                Klik untuk mengupload maskot
                              </p>
                            </div>
                          )}
                        </label>
                        <p className="text-xs text-gray-500 mt-2">Format: JPG, PNG, SVG (Max 2MB)</p>
                        {maskotFile && (
                          <p className="text-xs text-green-600 mt-1">
                            File baru dipilih: {maskotFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ===== RIGHT FORM SECTION ===== */}
                  <div className="col-span-12 md:col-span-8">
                    {errorMessage && isEdit && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                        <strong>Error:</strong> {errorMessage}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 md:gap-x-8 gap-y-4 md:gap-y-6">
                      {fields.map((field) => (
                        <ProfileField
                          key={field.name}
                          label={field.label}
                          name={field.name}
                          type={field.type}
                          value={formData[field.name]}
                          isEdit={isEdit}
                          onChange={handleChange}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* ===== ACTION BUTTONS (EDIT MODE) ===== */}
                <div className="mt-8 md:mt-12 flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 md:px-8 py-3
                              !border-2 !border-orange-900
                              !bg-transparent !text-orange-900
                              hover:bg-gray-900
                              rounded-full transition-colors
                              shadow-sm hover:shadow-md
                              flex items-center gap-2
                              disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-orange-900"></div>
                        <span className="whitespace-nowrap">Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save size={18} className="shrink-0" />
                        <span className="whitespace-nowrap">Simpan Perubahan</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-6 md:px-8 py-3 !bg-orange-900 !text-white hover:bg-gray-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Batalkan
                  </button>
                </div>
              </form>
            ) : (
              /* VIEW MODE (Hanya tampil, tidak bisa edit) */
              <div>
                <div className="grid grid-cols-12 gap-6 md:gap-10">
                  {/* ===== LEFT IMAGE SECTION ===== */}
                  <div className="col-span-12 md:col-span-4 space-y-6 md:space-y-8">
                    {/* Logo Sekolah */}
                    <div>
                      <p className="text-sm font-medium mb-3">Logo Sekolah</p>
                      <div className="border-2 border-dashed rounded-lg p-6 md:p-8 bg-gray-50 text-center">
                        <img 
                          src={logoSekolah || DEFAULT_LOGO_URL} 
                          alt="Logo Sekolah" 
                          className="w-24 h-24 md:w-28 md:h-28 object-contain mx-auto" 
                        />
                        {logoSekolah === DEFAULT_LOGO_URL && (
                          <p className="text-xs text-gray-400 mt-2">
                            (Logo Default)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Maskot */}
                    <div>
                      <p className="text-sm font-medium mb-3">Maskot</p>
                      <div className="border-2 border-dashed rounded-lg p-6 md:p-8 bg-gray-50 text-center">
                        {maskot ? (
                          <img 
                            src={maskot} 
                            alt="Maskot" 
                            className="w-24 h-24 md:w-28 md:h-28 object-contain mx-auto" 
                          />
                        ) : (
                          <div>
                            <img src={uploadIcon} alt="Upload" className="w-16 md:w-20 mx-auto mb-2 opacity-50" />
                            <p className="text-sm text-gray-400">
                              Belum ada maskot
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ===== RIGHT FORM SECTION ===== */}
                  <div className="col-span-12 md:col-span-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 md:gap-x-8 gap-y-4 md:gap-y-6">
                      {fields.map((field) => (
                        <ProfileField
                          key={field.name}
                          label={field.label}
                          name={field.name}
                          type={field.type}
                          value={formData[field.name]}
                          isEdit={false}
                          onChange={() => {}}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* ===== EDIT BUTTON (VIEW MODE) ===== */}
                <div className="mt-8 md:mt-12 flex justify-center">
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className="px-6 md:px-8 py-3 !border-2 !border-gray-800 !bg-transparent hover:bg-gray-50 rounded-full transition-colors flex items-center justify-center gap-2"
                  >
                    <Pencil size={18} />
                    <span>Edit Profil</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}