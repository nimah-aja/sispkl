import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import uploadIcon from "../assets/importimage.svg";
import iconPlus from "../assets/iconplus.svg";
import inorasiellipse9 from "../assets/inorasiellipse9.png";
import { Pencil, Save, X } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

// Import utils
import { getSekolah, updateSekolah } from "../utils/services/admin/sekolah";

const fields = [
  { label: "Akreditasi", name: "akreditasi", type: "text" },
  { label: "Email", name: "email", type: "email" },
  { label: "Jalan", name: "jalan", type: "text" },
  { label: "Jenis Sekolah", name: "jenis_sekolah", type: "text" },
  { label: "Kabupaten/Kota", name: "kabupaten_kota", type: "text" },
  { label: "Kecamatan", name: "kecamatan", type: "text" },
  { label: "Kelurahan", name: "kelurahan", type: "text" },
  { label: "Kepala Sekolah", name: "kepala_sekolah", type: "text" },
  { label: "Kode Pos", name: "kode_pos", type: "text" },
  { label: "Nama Sekolah", name: "nama_sekolah", type: "text" },
  { label: "NIP Kepala Sekolah", name: "nip_kepala_sekolah", type: "text" },
  { label: "Nomor Telepon", name: "nomor_telepon", type: "tel" },
  { label: "NPSN", name: "npsn", type: "text" },
  { label: "Provinsi", name: "provinsi", type: "text" },
  { label: "Website", name: "website", type: "url" },
];

// URL LOGO DEFAULT
const DEFAULT_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/d/d6/Logo_SMKN_2_Singosari.png";

// DEFAULT MASKOT (dari file lokal)
const DEFAULT_MASKOT_URL = inorasiellipse9;

// UKURAN MAKSIMAL GAMBAR (dalam piksel)
const MAX_LOGO_WIDTH = 300;
const MAX_LOGO_HEIGHT = 300;
const MAX_MASKOT_WIDTH = 800;
const MAX_MASKOT_HEIGHT = 800;

function ProfileField({ label, name, type, value, isEdit, onChange, error }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-semibold text-gray-800 mb-2">
        {label}:
      </p>

      {isEdit ? (
        <div>
          <input
            type={type}
            name={name}
            value={value || ""}
            onChange={onChange}
            placeholder={`Masukkan ${label.toLowerCase()}`}
            className={`w-full border-b-2 py-2 px-1 focus:outline-none focus:border-blue-500 text-gray-700 bg-transparent transition-colors ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      ) : (
        <p className="text-gray-600 py-2 border-b border-transparent min-h-[44px] flex items-center">
          {value || "-"}
        </p>
      )}
    </div>
  );
}

// Fungsi untuk mendapatkan dimensi gambar
const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// main
export default function Setting() {
  const [active, setActive] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sekolahId, setSekolahId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    akreditasi: "",
    email: "",
    jalan: "",
    jenis_sekolah: "",
    kabupaten_kota: "",
    kecamatan: "",
    kelurahan: "",
    kepala_sekolah: "",
    kode_pos: "",
    nama_sekolah: "",
    nip_kepala_sekolah: "",
    nomor_telepon: "",
    npsn: "",
    provinsi: "",
    website: "",
  });

  // Simpan data awal untuk reset jika batal
  const [initialFormData, setInitialFormData] = useState({ ...formData });
  const [initialLogoSekolah, setInitialLogoSekolah] = useState(null);
  const [initialMaskot, setInitialMaskot] = useState(null);

  const [logoSekolah, setLogoSekolah] = useState(DEFAULT_LOGO_URL);
  const [logoSekolahFile, setLogoSekolahFile] = useState(null);
  const [logoDimensions, setLogoDimensions] = useState(null);
  
  const [maskot, setMaskot] = useState(DEFAULT_MASKOT_URL);
  const [maskotFile, setMaskotFile] = useState(null);
  const [maskotDimensions, setMaskotDimensions] = useState(null);
  
  const [originalLogoFromAPI, setOriginalLogoFromAPI] = useState(""); 
  const [originalMaskotFromAPI, setOriginalMaskotFromAPI] = useState("");

  // fetch sekolah
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
        
        // Mapping data dari API ke formData - SESUAI DENGAN STRUKTUR JSON
        const mappedData = {
          akreditasi: sekolah.akreditasi || "",
          email: sekolah.email || "",
          jalan: sekolah.jalan || "",
          jenis_sekolah: sekolah.jenis_sekolah || "",
          kabupaten_kota: sekolah.kabupaten_kota || "",
          kecamatan: sekolah.kecamatan || "",
          kelurahan: sekolah.kelurahan || "",
          kepala_sekolah: sekolah.kepala_sekolah || "",
          kode_pos: sekolah.kode_pos || "",
          nama_sekolah: sekolah.nama_sekolah || "",
          nip_kepala_sekolah: sekolah.nip_kepala_sekolah || "",
          nomor_telepon: sekolah.nomor_telepon || "",
          npsn: sekolah.npsn || "",
          provinsi: sekolah.provinsi || "",
          website: sekolah.website || "",
        };
        
        console.log("Mapped formData:", mappedData);
        
        setFormData(mappedData);

        // Simpan sebagai data awal
        setInitialFormData(mappedData);

        // Set logo jika ada dari API
        let logoToDisplay = DEFAULT_LOGO_URL;
        if (sekolah.logo && sekolah.logo !== "") {
          if (sekolah.logo.startsWith('http')) {
            logoToDisplay = sekolah.logo;
          } else if (sekolah.logo.startsWith('data:image')) {
            logoToDisplay = sekolah.logo;
          }
          setOriginalLogoFromAPI(sekolah.logo); 
        }
        
        console.log("Logo yang akan ditampilkan:", logoToDisplay);
        setLogoSekolah(logoToDisplay);
        setInitialLogoSekolah(logoToDisplay);
        
        // Set maskot dari API - MENGGUNAKAN url_logo_maskot SESUAI JSON
        // LANGSUNG MENGGANTIKAN DEFAULT DENGAN DATA DARI API
        if (sekolah.url_logo_maskot && sekolah.url_logo_maskot !== "") {
          console.log("Maskot dari API:", sekolah.url_logo_maskot.substring(0, 50) + "...");
          setMaskot(sekolah.url_logo_maskot);
          setInitialMaskot(sekolah.url_logo_maskot);
          setOriginalMaskotFromAPI(sekolah.url_logo_maskot);
        } else {
          // Jika tidak ada maskot dari API, gunakan default
          console.log("Tidak ada maskot dari API, menggunakan default");
          setMaskot(DEFAULT_MASKOT_URL);
          setInitialMaskot(DEFAULT_MASKOT_URL);
          setOriginalMaskotFromAPI("");
        }
        
        console.log("Fetch data berhasil");
        toast.success("Data sekolah berhasil dimuat");
      } else {
        console.error("Invalid response structure:", response);
        setErrorMessage("Format response tidak valid dari server");
        toast.error("Format response tidak valid dari server");
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
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validasi khusus untuk akreditasi (hanya huruf)
    if (name === "akreditasi") {
      const isValid = /^[A-Za-z\s]*$/.test(value);
      if (!isValid && value !== "") {
        setFieldErrors(prev => ({
          ...prev,
          akreditasi: "Akreditasi hanya boleh berisi huruf"
        }));
        toast.error("Akreditasi hanya boleh berisi huruf");
        return; // Jangan update state jika tidak valid
      } else {
        setFieldErrors(prev => ({
          ...prev,
          akreditasi: ""
        }));
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateImageDimensions = (type, width, height) => {
    if (type === "logo") {
      if (width > MAX_LOGO_WIDTH || height > MAX_LOGO_HEIGHT) {
        return {
          valid: false,
          message: `Ukuran logo terlalu besar. Maksimal ${MAX_LOGO_WIDTH}x${MAX_LOGO_HEIGHT} piksel. Ukuran logo Anda: ${width}x${height} piksel`
        };
      }
    } else if (type === "maskot") {
      if (width > MAX_MASKOT_WIDTH || height > MAX_MASKOT_HEIGHT) {
        return {
          valid: false,
          message: `Ukuran maskot terlalu besar. Maksimal ${MAX_MASKOT_WIDTH}x${MAX_MASKOT_HEIGHT} piksel. Ukuran maskot Anda: ${width}x${height} piksel`
        };
      }
    }
    return { valid: true };
  };

  const handleImageUpload = (type) => async (e) => {
    if (!isEdit) return;
    
    const file = e.target.files[0];
    if (!file) return;

    // Validasi ukuran file (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }

    // Validasi tipe file
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }

    try {
      // Dapatkan dimensi gambar
      const dimensions = await getImageDimensions(file);
      
      // Validasi dimensi gambar sesuai tipe
      const dimensionValidation = validateImageDimensions(type, dimensions.width, dimensions.height);
      if (!dimensionValidation.valid) {
        toast.error(dimensionValidation.message);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "logo") {
          setLogoSekolah(reader.result);
          setLogoSekolahFile(file);
          setLogoDimensions(dimensions);
          toast.success("Logo berhasil dipilih");
        } else {
          setMaskot(reader.result);
          setMaskotFile(file);
          setMaskotDimensions(dimensions);
          toast.success("Maskot berhasil dipilih");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error reading image dimensions:", error);
      toast.error("Gagal membaca dimensi gambar");
    }
  };

  // Fungsi untuk convert File ke base64 (DENGAN PREFIX)
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const validateForm = () => {
    const errors = {};
    
    // Validasi akreditasi
    if (formData.akreditasi && !/^[A-Za-z\s]+$/.test(formData.akreditasi)) {
      errors.akreditasi = "Akreditasi hanya boleh berisi huruf";
      toast.error("Akreditasi hanya boleh berisi huruf");
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    
    if (!validateForm()) {
      return;
    }
    
    if (!sekolahId) {
      toast.error("ID sekolah tidak ditemukan");
      return;
    }

    try {
      setIsSaving(true);
      console.log("=== MEMULAI UPDATE SEKOLAH ===");
      
      // Prepare payload SESUAI DENGAN STRUKTUR JSON
      const payload = {
        akreditasi: formData.akreditasi,
        email: formData.email,
        jalan: formData.jalan,
        jenis_sekolah: formData.jenis_sekolah,
        kabupaten_kota: formData.kabupaten_kota,
        kecamatan: formData.kecamatan,
        kelurahan: formData.kelurahan,
        kepala_sekolah: formData.kepala_sekolah,
        kode_pos: formData.kode_pos,
        nama_sekolah: formData.nama_sekolah,
        nip_kepala_sekolah: formData.nip_kepala_sekolah,
        nomor_telepon: formData.nomor_telepon,
        npsn: formData.npsn,
        provinsi: formData.provinsi,
        website: formData.website,
      };

      // Handle logo
      if (logoSekolahFile) {
        const base64Logo = await convertImageToBase64(logoSekolahFile);
        payload.logo = base64Logo;
        console.log("Logo akan diupdate dengan file baru");
      } else if (logoSekolah === DEFAULT_LOGO_URL) {
        payload.logo = "";
      } else if (logoSekolah !== originalLogoFromAPI) {
        payload.logo = logoSekolah;
      }

      // Handle maskot - MENGGUNAKAN url_logo_maskot SESUAI JSON
      if (maskotFile) {
        const base64Maskot = await convertImageToBase64(maskotFile);
        payload.url_logo_maskot = base64Maskot;
        console.log("Maskot akan diupdate dengan file baru");
      } else if (maskot === DEFAULT_MASKOT_URL) {
        payload.url_logo_maskot = "";
      } else if (maskot !== originalMaskotFromAPI) {
        payload.url_logo_maskot = maskot;
      }

      console.log("Payload yang akan dikirim:", payload);

      const response = await updateSekolah(sekolahId, payload);
      
      if (response.success) {
        console.log("Data berhasil diupdate:", response);
        
        setInitialFormData({ ...formData });
        
        if (response.data && response.data.logo) {
          setOriginalLogoFromAPI(response.data.logo);
        }
        if (response.data && response.data.url_logo_maskot) {
          setOriginalMaskotFromAPI(response.data.url_logo_maskot);
        }
        
        if (logoSekolahFile) {
          setInitialLogoSekolah(logoSekolah);
        }
        
        setInitialMaskot(maskot);
        
        setLogoSekolahFile(null);
        setMaskotFile(null);
        setLogoDimensions(null);
        setMaskotDimensions(null);
        
        setIsEdit(false);
        
        await fetchSekolahData();
        
        toast.success("Data sekolah berhasil diperbarui!");
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
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = () => {
    setInitialFormData({ ...formData });
    setInitialLogoSekolah(logoSekolah);
    setInitialMaskot(maskot);
    
    setLogoSekolahFile(null);
    setMaskotFile(null);
    setLogoDimensions(null);
    setMaskotDimensions(null);
    setFieldErrors({});
    setErrorMessage("");
    
    setIsEdit(true);
    toast.success("Mode edit diaktifkan");
  };

  const handleCancel = () => {
    setFormData({ ...initialFormData });
    setLogoSekolah(initialLogoSekolah || DEFAULT_LOGO_URL);
    setMaskot(initialMaskot || DEFAULT_MASKOT_URL);
    
    setLogoSekolahFile(null);
    setMaskotFile(null);
    setLogoDimensions(null);
    setMaskotDimensions(null);
    setFieldErrors({});
    setErrorMessage("");
    
    setIsEdit(false);
    toast.success("Perubahan dibatalkan");
  };

  const handleRemoveLogo = () => {
    if (!isEdit) return;
    
    setLogoSekolah(DEFAULT_LOGO_URL);
    setLogoSekolahFile(null);
    setLogoDimensions(null);
    toast.success("Logo direset ke default");
    console.log("Logo direset ke default");
  };

  const handleRemoveMaskot = () => {
    if (!isEdit) return;
    
    setMaskot(DEFAULT_MASKOT_URL);
    setMaskotFile(null);
    setMaskotDimensions(null);
    toast.success("Maskot direset ke default");
    console.log("Maskot direset ke default");
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
              <p className="text-center text-gray-600 font-semibold">Memuat data...</p>
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

            {isEdit ? (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-12 gap-6 md:gap-10">
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
                        <p className="text-xs text-gray-500 mt-2">
                          Format: JPG, PNG, SVG (Max 2MB, {MAX_LOGO_WIDTH}x{MAX_LOGO_HEIGHT} piksel)
                        </p>
                        {logoSekolahFile && logoDimensions && (
                          <div className="text-xs mt-1">
                            <p className="text-green-600">
                              File baru: {logoSekolahFile.name}
                            </p>
                            <p className="text-blue-600">
                              Ukuran: {logoDimensions.width} x {logoDimensions.height} piksel
                            </p>
                          </div>
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
                        {maskot !== DEFAULT_MASKOT_URL && (
                          <button
                            type="button"
                            onClick={handleRemoveMaskot}
                            className="!bg-transparent !text-xs text-red-600 hover:text-red-800"
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
                        <p className="text-xs text-gray-500 mt-2">
                          Format: JPG, PNG, SVG (Max 2MB, {MAX_MASKOT_WIDTH}x{MAX_MASKOT_HEIGHT} piksel)
                        </p>
                        {maskotFile && maskotDimensions && (
                          <div className="text-xs mt-1">
                            <p className="text-green-600">
                              File baru: {maskotFile.name}
                            </p>
                            <p className="text-blue-600">
                              Ukuran: {maskotDimensions.width} x {maskotDimensions.height} piksel
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

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
                          error={fieldErrors[field.name]}
                        />
                      ))}
                    </div>
                  </div>
                </div>

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
              <div>
                <div className="grid grid-cols-12 gap-6 md:gap-10">
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
                        <img 
                          src={maskot || DEFAULT_MASKOT_URL} 
                          alt="Maskot" 
                          className="w-24 h-24 md:w-28 md:h-28 object-contain mx-auto" 
                        />
                        {maskot === DEFAULT_MASKOT_URL && (
                          <p className="text-xs text-gray-400 mt-2">
                            (Maskot Default)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

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

                <div className="mt-8 md:mt-12 flex justify-center">
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className="px-6 md:px-8 py-3 !border-2 !border-gray-800 !bg-transparent hover:bg-gray-50 rounded-full transition-colors flex items-center justify-center gap-2"
                  >
                    <Pencil size={18} />
                    <span>Ubah Profil</span>
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