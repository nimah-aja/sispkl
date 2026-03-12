import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Download, Save, ChevronDown, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";

// Components
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";

// Utils
import { getApprovedPKL } from "../utils/services/koordinator/pengajuan";
import { generateAndDownloadSertifikat } from "../utils/lettersApi";
import { getDetailReviewPenilaian } from "../utils/services/koordinator/penilaian";
import { getIndustri } from "../utils/services/admin/get_industri";

export default function UbahSertifikatPKL() {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState("sertifikat");
  const [jurusan, setJurusan] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoName, setLogoName] = useState("");
  const [siswaList, setSiswaList] = useState([]);
  const [industriList, setIndustriList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // State untuk dropdown siswa
  const [isSiswaDropdownOpen, setIsSiswaDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSiswaLabel, setSelectedSiswaLabel] = useState("");
  const siswaDropdownRef = useRef(null);

  // State untuk menyimpan data aspek dari API
  const [aspekList, setAspekList] = useState([]);

  // State untuk error nilai
  const [nilaiErrors, setNilaiErrors] = useState({
    nilai1: "",
    nilai2: "",
    nilai3: "",
    nilai4: ""
  });

  // State untuk form data
  const [formData, setFormData] = useState({
    // Data Sertifikat PKL
    nomorSertifikat: "420/1013/101.6.9.19/2026",
    siswaId: "",
    namaPeserta: "",
    nisnPeserta: "",
    tanggalMulai: "",
    tanggalSelesai: "",
    tanggalSertifikatDibuat: dayjs().format('YYYY-MM-DD'),
    hasilPenilaian: "Baik",
    namaIndustri: "",
    jurusanNama: "",
    namaPimpinan: "",
    namaPembina: "", // Field untuk Nama Pembina Industri
    
    // Nilai (4 aspek)
    nilai1: "",
    nilai2: "",
    nilai3: "",
    nilai4: "",
    
    // Predikat per nilai (hanya untuk tampilan, tidak dikirim ke BE)
    predikat1: "",
    predikat2: "",
    predikat3: "",
    predikat4: "",
    
    // ASPEK (judul singkat) - full width, ini yang akan dikirim ke BE
    aspek1: "MENERAPKAN SOFT SKILL YANG DIBUTUHKAN DI DUNIA KERJA (TEMPAT PKL).",
    aspek2: "MENERAPKAN NORMA, PROSEDUR OPERASIONAL STANDAR (POS), SERTA KESEHATAN, KESELAMATAN KERJA, DAN LINGKUNGAN HIDUP (K3LH) YANG ADA DI DUNIA KERJA (TEMPAT PKL).",
    aspek3: "MENERAPKAN KOMPETENSI TEKNIS YANG SUDAH DIPELAJARI DI SEKOLAH DAN/ATAU BARU DIPELAJARI DI DUNIA KERJA (TEMPAT PKL).",
    aspek4: "MEMAHAMI ALUR BISNIS DUNIA KERJA TEMPAT PKL DAN WAWASAN WIRAUSAHA.",
    
    // DESKRIPSI (lengkap dari API) - hanya untuk tampilan, tidak dikirim ke BE
    deskripsi1: "",
    deskripsi2: "",
    deskripsi3: "",
    deskripsi4: ""
  });

  const user = { 
    name: localStorage.getItem("nama_guru") || "Loren Schmitt", 
    role: "Koordinator" 
  };

  // Fungsi untuk mendapatkan predikat berdasarkan nilai
  const getPredikat = (nilai) => {
    if (!nilai && nilai !== 0) return "";
    const skor = parseFloat(nilai);
    if (skor < 75) return "Kurang";
    if (skor >= 75 && skor <= 85) return "Baik";
    if (skor >= 86 && skor <= 100) return "Sangat Baik";
    return "";
  };

  // Fungsi untuk mendapatkan data industri
  const fetchIndustri = async () => {
    try {
      const data = await getIndustri();
      console.log("Data industri:", data);
      setIndustriList(data);
    } catch (error) {
      console.error("Error fetching industri:", error);
    }
  };

  // Fungsi untuk mendapatkan data PIC (pimpinan) dari industri berdasarkan nama industri
  const getPICByIndustriName = (industriNama) => {
    if (!industriNama || industriList.length === 0) return "";
    
    const industri = industriList.find(item => 
      item.nama.toLowerCase() === industriNama.toLowerCase() ||
      item.nama.toLowerCase().includes(industriNama.toLowerCase()) ||
      industriNama.toLowerCase().includes(item.nama.toLowerCase())
    );
    
    return industri?.pic || "";
  };

  // Ambil application_id dari URL parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const applicationId = params.get('application_id');
    
    if (applicationId) {
      loadDataFromLocalStorage(applicationId);
    } else {
      setLoadingData(false);
    }
  }, [location.search]);

  // Fetch data industri saat komponen dimuat
  useEffect(() => {
    fetchIndustri();
  }, []);

  // Fungsi untuk memformat tanggal dari YYYY-MM-DD ke format "DD Bulan YYYY"
  const formatTanggalIndonesia = (tanggal) => {
    if (!tanggal) return "";
    
    const bulanIndonesia = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    
    const date = new Date(tanggal);
    const hari = date.getDate();
    const bulan = bulanIndonesia[date.getMonth()];
    const tahun = date.getFullYear();
    
    return `${hari} ${bulan} ${tahun}`;
  };

  // Fungsi untuk memuat data dari localStorage
  const loadDataFromLocalStorage = async (applicationId) => {
    try {
      setLoadingData(true);
      
      // Ambil data dasar dari localStorage
      const savedData = localStorage.getItem('sertifikat_data_lengkap');
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log("Data dari localStorage:", parsedData);
        
        if (parsedData.application_id.toString() === applicationId) {
          
          // Dapatkan nama pimpinan dari data industri jika ada
          let namaPimpinan = parsedData.industri?.pic || "";
          if (!namaPimpinan && parsedData.industri?.nama) {
            namaPimpinan = getPICByIndustriName(parsedData.industri.nama);
          }
          
          // Gunakan nama yang SAMA untuk pembina (sesuai permintaan)
          let namaPembina = namaPimpinan; // Isi dengan nilai yang sama dengan pimpinan
          
          // Ambil data dari parsedData
          const nilai1 = parsedData.penilaian?.items?.[0]?.skor || parsedData.nilai?.nilai1 || "";
          const nilai2 = parsedData.penilaian?.items?.[1]?.skor || parsedData.nilai?.nilai2 || "";
          const nilai3 = parsedData.penilaian?.items?.[2]?.skor || parsedData.nilai?.nilai3 || "";
          const nilai4 = parsedData.penilaian?.items?.[3]?.skor || parsedData.nilai?.nilai4 || "";
          
          // Ambil aspek (judul singkat) - jika ada di parsedData.aspek, gunakan itu, jika tidak gunakan default
          const aspek1 = parsedData.aspek?.aspek1 || formData.aspek1;
          const aspek2 = parsedData.aspek?.aspek2 || formData.aspek2;
          const aspek3 = parsedData.aspek?.aspek3 || formData.aspek3;
          const aspek4 = parsedData.aspek?.aspek4 || formData.aspek4;
          
          // Ambil deskripsi lengkap dari items (hanya untuk tampilan)
          const deskripsi1 = parsedData.penilaian?.items?.[0]?.deskripsi || parsedData.deskripsi?.deskripsi1 || "";
          const deskripsi2 = parsedData.penilaian?.items?.[1]?.deskripsi || parsedData.deskripsi?.deskripsi2 || "";
          const deskripsi3 = parsedData.penilaian?.items?.[2]?.deskripsi || parsedData.deskripsi?.deskripsi3 || "";
          const deskripsi4 = parsedData.penilaian?.items?.[3]?.deskripsi || parsedData.deskripsi?.deskripsi4 || "";
          
          // Hitung predikat (hanya untuk tampilan)
          const predikat1 = getPredikat(nilai1);
          const predikat2 = getPredikat(nilai2);
          const predikat3 = getPredikat(nilai3);
          const predikat4 = getPredikat(nilai4);
          
          // Isi form dengan data dari localStorage
          setFormData(prev => ({
            ...prev,
            siswaId: parsedData.application_id,
            namaPeserta: parsedData.siswa?.nama || "",
            nisnPeserta: parsedData.siswa?.nisn || "",
            namaIndustri: parsedData.industri?.nama || "",
            jurusanNama: parsedData.siswa?.jurusan || "",
            namaPimpinan: namaPimpinan,
            namaPembina: namaPembina, // Isi field pembina dengan nilai yang sama dengan pimpinan
            
            tanggalMulai: parsedData.tanggal?.mulai || parsedData.siswa?.tanggal_mulai || "",
            tanggalSelesai: parsedData.tanggal?.selesai || parsedData.siswa?.tanggal_selesai || "",
            
            // Nilai
            nilai1: nilai1,
            nilai2: nilai2,
            nilai3: nilai3,
            nilai4: nilai4,
            
            // Predikat (hanya untuk tampilan)
            predikat1: predikat1,
            predikat2: predikat2,
            predikat3: predikat3,
            predikat4: predikat4,
            
            // Aspek (judul singkat) - yang akan dikirim ke BE
            aspek1: aspek1,
            aspek2: aspek2,
            aspek3: aspek3,
            aspek4: aspek4,
            
            // Deskripsi lengkap (hanya untuk tampilan)
            deskripsi1: deskripsi1,
            deskripsi2: deskripsi2,
            deskripsi3: deskripsi3,
            deskripsi4: deskripsi4,
            
            // Hasil penilaian dari rata-rata
            hasilPenilaian: parsedData.hasil || calculateHasilPenilaian(nilai1, nilai2, nilai3, nilai4),
          }));

          // Set aspekList untuk keperluan lain jika diperlukan
          setAspekList(parsedData.form_items || []);

          setSelectedSiswaLabel(`${parsedData.siswa?.nama} - ${parsedData.siswa?.nisn}`);
          
          // Set jurusan berdasarkan data siswa
          if (parsedData.siswa?.jurusan) {
            const jurusanMap = {
              "Rekayasa Perangkat Lunak": "rpl",
              "Teknik Komputer dan Jaringan": "tkj",
              "Desain Komunikasi Visual": "dkv",
              "Audio Video": "av",
              "Mekatronika": "mt",
              "Elektronika Industri": "ei",
              "Animasi": "an",
              "Broadcasting": "bc"
            };
            
            const jurusanValue = jurusanMap[parsedData.siswa.jurusan] || parsedData.jurusan_kode || "";
            setJurusan(jurusanValue);
          }

          toast.success("Data sertifikat berhasil dimuat");
        }
      } else {
        // Jika tidak ada di localStorage, coba fetch dari API
        await fetchDetailPenilaian(applicationId);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data sertifikat");
    } finally {
      setLoadingData(false);
    }
  };

  // Fungsi untuk fetch detail penilaian dari API
  const fetchDetailPenilaian = async (applicationId) => {
    try {
      const response = await getDetailReviewPenilaian(applicationId);
      console.log("Detail dari API:", response);
      
      // Cari data siswa di list yang sudah di-fetch
      const siswaData = siswaList.find(s => s.application_id === parseInt(applicationId));
      
      // Dapatkan nama pimpinan dari industri
      const namaPimpinan = getPICByIndustriName(siswaData?.industri_nama || "");
      
      // Gunakan nama yang SAMA untuk pembina
      const namaPembina = namaPimpinan; // Isi dengan nilai yang sama dengan pimpinan
      
      // Ambil nilai dari items
      const nilai1 = response.items?.[0]?.skor || "";
      const nilai2 = response.items?.[1]?.skor || "";
      const nilai3 = response.items?.[2]?.skor || "";
      const nilai4 = response.items?.[3]?.skor || "";
      
      // Hitung predikat (hanya untuk tampilan)
      const predikat1 = getPredikat(nilai1);
      const predikat2 = getPredikat(nilai2);
      const predikat3 = getPredikat(nilai3);
      const predikat4 = getPredikat(nilai4);
      
      // Ambil deskripsi lengkap dari items (hanya untuk tampilan)
      const deskripsi1 = response.items?.[0]?.deskripsi || "";
      const deskripsi2 = response.items?.[1]?.deskripsi || "";
      const deskripsi3 = response.items?.[2]?.deskripsi || "";
      const deskripsi4 = response.items?.[3]?.deskripsi || "";
      
      setFormData(prev => ({
        ...prev,
        siswaId: applicationId,
        namaPeserta: siswaData?.siswa_username || "",
        nisnPeserta: siswaData?.siswa_nisn || "",
        namaIndustri: siswaData?.industri_nama || "",
        jurusanNama: siswaData?.jurusan_nama || "",
        namaPimpinan: namaPimpinan,
        namaPembina: namaPembina, // Isi field pembina dengan nilai yang sama dengan pimpinan
        
        // Ambil tanggal dari siswaData
        tanggalMulai: siswaData?.tanggal_mulai || "",
        tanggalSelesai: siswaData?.tanggal_selesai || "",
        
        // Nilai
        nilai1: nilai1,
        nilai2: nilai2,
        nilai3: nilai3,
        nilai4: nilai4,
        
        // Predikat (hanya untuk tampilan)
        predikat1: predikat1,
        predikat2: predikat2,
        predikat3: predikat3,
        predikat4: predikat4,
        
        // Deskripsi lengkap dari API (hanya untuk tampilan)
        deskripsi1: deskripsi1,
        deskripsi2: deskripsi2,
        deskripsi3: deskripsi3,
        deskripsi4: deskripsi4,
        
        // Hasil penilaian dari rata-rata
        hasilPenilaian: calculateHasilPenilaian(nilai1, nilai2, nilai3, nilai4),
      }));

      setSelectedSiswaLabel(`${siswaData?.siswa_username} - ${siswaData?.siswa_nisn}`);
      
      // Set jurusan berdasarkan data siswa
      if (siswaData?.jurusan_nama) {
        const jurusanMap = {
          "Rekayasa Perangkat Lunak": "rpl",
          "Teknik Komputer dan Jaringan": "tkj",
          "Desain Komunikasi Visual": "dkv",
          "Audio Video": "av",
          "Mekatronika": "mt",
          "Elektronika Industri": "ei",
          "Animasi": "an",
          "Broadcasting": "bc"
        };
        
        const jurusanValue = jurusanMap[siswaData.jurusan_nama] || "";
        setJurusan(jurusanValue);
      }
      
    } catch (error) {
      console.error("Error fetching detail:", error);
      toast.error("Gagal mengambil data penilaian");
    }
  };

  // Fetch data siswa approved PKL
  useEffect(() => {
    const fetchSiswa = async () => {
      try {
        setLoading(true);
        const response = await getApprovedPKL();
        console.log("Data siswa approved:", response);
        
        if (response && response.data) {
          setSiswaList(response.data);
          
          // Setelah dapat data siswa, cek apakah ada application_id di URL
          const params = new URLSearchParams(location.search);
          const applicationId = params.get('application_id');
          
          if (applicationId) {
            // Cari data siswa yang sesuai
            const siswaData = response.data.find(s => s.application_id === parseInt(applicationId));
            
            if (siswaData) {
              // Update form dengan tanggal dari siswaData
              setFormData(prev => ({
                ...prev,
                tanggalMulai: siswaData.tanggal_mulai || prev.tanggalMulai,
                tanggalSelesai: siswaData.tanggal_selesai || prev.tanggalSelesai,
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error fetching siswa:", error);
        toast.error("Gagal mengambil data siswa");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSiswa();
  }, []);

  // Detect klik di luar dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (siswaDropdownRef.current && !siswaDropdownRef.current.contains(event.target)) {
        setIsSiswaDropdownOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fungsi untuk validasi nilai
  const validateNilai = (name, value) => {
    if (value === "") {
      return "";
    }
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      return "Nilai harus berupa angka";
    }
    
    if (numValue < 0) {
      return "Nilai tidak boleh kurang dari 0";
    }
    
    if (numValue > 100) {
      return "Nilai tidak boleh lebih dari 100";
    }
    
    return "";
  };

  // Fungsi untuk menghitung hasil penilaian berdasarkan rata-rata nilai
  const calculateHasilPenilaian = (nilai1, nilai2, nilai3, nilai4) => {
    const n1 = parseFloat(nilai1) || 0;
    const n2 = parseFloat(nilai2) || 0;
    const n3 = parseFloat(nilai3) || 0;
    const n4 = parseFloat(nilai4) || 0;
    
    // Hitung rata-rata
    const average = (n1 + n2 + n3 + n4) / 4;
    
    // Tentukan kategori berdasarkan rata-rata
    if (average >= 86 && average <= 100) {
      return "Sangat Baik";
    } else if (average >= 75 && average <= 85) {
      return "Baik";
    } else if (average > 0 && average < 75) {
      return "Kurang";
    } else {
      return "Baik";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value
      };
      
      // Jika yang diubah adalah namaPimpinan, otomatis update namaPembina juga
      if (name === 'namaPimpinan') {
        newFormData.namaPembina = value; // Update pembina dengan nilai yang sama
      }
      
      // Validasi untuk field nilai
      if (name.startsWith('nilai')) {
        const error = validateNilai(name, value);
        setNilaiErrors(prevErrors => ({
          ...prevErrors,
          [name]: error
        }));
        
        // Jika nilai diubah, update predikat (hanya untuk tampilan)
        if (name === 'nilai1') {
          newFormData.predikat1 = getPredikat(value);
        } else if (name === 'nilai2') {
          newFormData.predikat2 = getPredikat(value);
        } else if (name === 'nilai3') {
          newFormData.predikat3 = getPredikat(value);
        } else if (name === 'nilai4') {
          newFormData.predikat4 = getPredikat(value);
        }
      }
      
      // Jika yang diubah adalah nilai, hitung ulang hasil penilaian
      if (name === 'nilai1' || name === 'nilai2' || name === 'nilai3' || name === 'nilai4') {
        const nilai1 = name === 'nilai1' ? value : prev.nilai1;
        const nilai2 = name === 'nilai2' ? value : prev.nilai2;
        const nilai3 = name === 'nilai3' ? value : prev.nilai3;
        const nilai4 = name === 'nilai4' ? value : prev.nilai4;
        
        const hasil = calculateHasilPenilaian(nilai1, nilai2, nilai3, nilai4);
        newFormData.hasilPenilaian = hasil;
      }
      
      return newFormData;
    });
  };

  const handleSelectSiswa = (siswa) => {
    // Dapatkan nama pimpinan dari data industri
    const namaPimpinan = getPICByIndustriName(siswa.industri_nama || "");
    
    // Gunakan nama yang SAMA untuk pembina (sesuai permintaan)
    const namaPembina = namaPimpinan; // Isi dengan nilai yang sama dengan pimpinan
    
    setFormData(prev => ({
      ...prev,
      siswaId: siswa.application_id,
      namaPeserta: siswa.siswa_username,
      nisnPeserta: siswa.siswa_nisn,
      tanggalMulai: siswa.tanggal_mulai,
      tanggalSelesai: siswa.tanggal_selesai,
      namaIndustri: siswa.industri_nama || "",
      jurusanNama: siswa.jurusan_nama || "",
      namaPimpinan: namaPimpinan,
      namaPembina: namaPembina // Isi dengan nilai yang SAMA dengan pimpinan
    }));

    setSelectedSiswaLabel(`${siswa.siswa_username} - ${siswa.siswa_nisn} (${siswa.kelas_nama})`);
    
    // Set jurusan berdasarkan data siswa untuk dropdown kompetensi keahlian
    if (siswa.jurusan_nama) {
      const jurusanMap = {
        "Rekayasa Perangkat Lunak": "rpl",
        "Teknik Komputer dan Jaringan": "tkj",
        "Desain Komunikasi Visual": "dkv",
        "Audio Video": "av",
        "Mekatronika": "mt",
        "Elektronika Industri": "ei",
        "Animasi": "an",
        "Broadcasting": "bc"
      };
      
      const jurusanValue = jurusanMap[siswa.jurusan_nama] || "";
      setJurusan(jurusanValue);
    }

    setIsSiswaDropdownOpen(false);
    setSearchQuery("");
    
    // Fetch detail penilaian untuk mendapatkan deskripsi lengkap (hanya untuk tampilan)
    if (siswa.application_id) {
      fetchDetailPenilaian(siswa.application_id);
    }
  };

  const handleClearSiswa = () => {
    setFormData(prev => ({
      ...prev,
      siswaId: "",
      namaPeserta: "",
      nisnPeserta: "",
      tanggalMulai: "",
      tanggalSelesai: "",
      namaIndustri: "",
      jurusanNama: "",
      namaPimpinan: "",
      namaPembina: "", // Reset field pembina
      // Reset nilai
      nilai1: "",
      nilai2: "",
      nilai3: "",
      nilai4: "",
      // Reset predikat
      predikat1: "",
      predikat2: "",
      predikat3: "",
      predikat4: "",
      // Reset deskripsi
      deskripsi1: "",
      deskripsi2: "",
      deskripsi3: "",
      deskripsi4: "",
      hasilPenilaian: "Baik"
    }));
    setSelectedSiswaLabel("");
    setJurusan("");
    setAspekList([]);
    
    // Reset error nilai
    setNilaiErrors({
      nilai1: "",
      nilai2: "",
      nilai3: "",
      nilai4: ""
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoName(file.name);
      toast.success("Logo berhasil diupload");
    }
  };

  const handleSave = () => {
    // Validasi semua nilai sebelum menyimpan
    const hasErrors = Object.values(nilaiErrors).some(error => error !== "");
    
    if (hasErrors) {
      toast.error("Mohon perbaiki error pada nilai terlebih dahulu!");
      return;
    }
    
    // Validasi siswa harus dipilih
    if (!formData.siswaId) {
      toast.error("Silakan pilih siswa terlebih dahulu!");
      return;
    }
    
    // Logic untuk menyimpan data
    // Yang disimpan hanya aspek (judul singkat) - deskripsi dan predikat tidak disimpan ke BE
    const dataToSave = {
      ...formData,
      // Hapus deskripsi dan predikat dari data yang akan disimpan ke BE
      deskripsi1: undefined,
      deskripsi2: undefined,
      deskripsi3: undefined,
      deskripsi4: undefined,
      predikat1: undefined,
      predikat2: undefined,
      predikat3: undefined,
      predikat4: undefined
    };
    
    console.log("Data Sertifikat (yang dikirim ke BE):", dataToSave);
    console.log("Jurusan:", jurusan);
    console.log("Logo:", logoFile);
    
    // Simpan ke localStorage sebagai contoh
    localStorage.setItem('sertifikatData', JSON.stringify(dataToSave));
    toast.success("Data sertifikat berhasil disimpan!");
  };

  const handleDownloadPDF = async () => {
    try {
      // Validasi semua nilai sebelum download
      const hasErrors = Object.values(nilaiErrors).some(error => error !== "");
      
      if (hasErrors) {
        toast.error("Mohon perbaiki error pada nilai terlebih dahulu!");
        return;
      }
      
      if (!formData.siswaId) {
        toast.error("Silakan pilih siswa terlebih dahulu!");
        return;
      }

      if (!jurusan) {
        toast.error("Silakan pilih kompetensi keahlian terlebih dahulu!");
        return;
      }

      setDownloading(true);

      // Dapatkan nama pimpinan jika belum ada
      let namaPimpinan = formData.namaPimpinan;
      if (!namaPimpinan && formData.namaIndustri) {
        namaPimpinan = getPICByIndustriName(formData.namaIndustri);
      }

      // Gunakan nama yang SAMA untuk pembina
      let namaPembina = namaPimpinan; // Isi dengan nilai yang sama dengan pimpinan

      // Format payload sesuai dengan struktur yang diharapkan
      const payload = {
        nomor_sertifikat: formData.nomorSertifikat,
        siswa: {
          nama: formData.namaPeserta,
          nisn: formData.nisnPeserta
        },
        nama_industri: formData.namaIndustri,
        tanggal_mulai: formatTanggalIndonesia(formData.tanggalMulai),
        tanggal_selesai: formatTanggalIndonesia(formData.tanggalSelesai),
        hasil_pkl: formData.hasilPenilaian,
        tanggal_terbit: formatTanggalIndonesia(formData.tanggalSertifikatDibuat),
        nama_pimpinan: namaPimpinan,
        nama_pembina: namaPembina, // Nilainya SAMA dengan pimpinan
        nilai: {
          aspek_1: parseFloat(formData.nilai1) || 0,
          aspek_2: parseFloat(formData.nilai2) || 0,
          aspek_3: parseFloat(formData.nilai3) || 0,
          aspek_4: parseFloat(formData.nilai4) || 0,
          aspek_judul_1: formData.aspek1,
          aspek_judul_2: formData.aspek2,
          aspek_judul_3: formData.aspek3,
          aspek_judul_4: formData.aspek4
        }
      };

      console.log("Payload untuk sertifikat:", payload);
      
      // Panggil utils untuk generate dan download sertifikat
      const filename = await generateAndDownloadSertifikat(jurusan, payload);
      
      console.log("Sertifikat berhasil didownload:", filename);
      toast.success("Sertifikat berhasil didownload!");
      
    } catch (error) {
      console.error("Error downloading sertifikat:", error);
      toast.error(`Gagal mendownload sertifikat: ${error.message || "Terjadi kesalahan"}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Filter siswa berdasarkan pencarian
  const filteredSiswa = siswaList.filter(siswa => {
    const query = searchQuery.toLowerCase();
    return (
      siswa.siswa_username.toLowerCase().includes(query) ||
      siswa.siswa_nisn.includes(query) ||
      (siswa.kelas_nama && siswa.kelas_nama.toLowerCase().includes(query)) ||
      (siswa.industri_nama && siswa.industri_nama.toLowerCase().includes(query))
    );
  });

  // Tampilkan loading saat mengambil data
  if (loadingData) {
    return (
      <div className="flex min-h-screen w-full bg-white">
        <Sidebar active={active} setActive={setActive} />
        <div className="flex flex-col flex-1">
          <Header user={user} />
          <main className="flex-1 p-8 bg-[#641E21] rounded-tl-3xl flex items-center justify-center">
            <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#641E21] border-t-transparent mb-4"></div>
              <p className="text-gray-600">Memuat data sertifikat...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-white">
      <Sidebar active={active} setActive={setActive} />
      
      <div className="flex flex-col flex-1">
        <Header user={user} />
        
        <main className="flex-1 p-8 bg-[#641E21] rounded-tl-3xl">
          {/* Header dengan Judul dan Tombol Aksi */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white font-semibold text-2xl">
              Sertifikat PKL
            </h2>
            
            <div className="flex gap-3">
              {/* Tombol Pilih Jurusan */}
              <div className="relative">
                <select
                  value={jurusan}
                  onChange={(e) => setJurusan(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 bg-white text-[#641E21] font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC933A] cursor-pointer"
                  disabled={!formData.siswaId || downloading}
                >
                  <option value="">Pilih Kompetensi Keahlian</option>
                  <option value="rpl">Rekayasa Perangkat Lunak</option>
                  <option value="tkj">Teknik Komputer dan Jaringan</option>
                  <option value="dkv">Desain Komunikasi Visual</option>
                  <option value="av">Audio Video</option>
                  <option value="mt">Mekatronika</option>
                  <option value="ei">Elektronika Industri</option>
                  <option value="an">Animasi</option>
                  <option value="bc">Broadcasting</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#641E21]">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* Container Putih untuk Konten */}
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            
            {/* Judul Ubah Data Sertifikat PKL */}
            <h3 className="text-[#641E21] font-bold text-2xl mb-8">
              Ubah Data Sertifikat PKL
            </h3>
            
            {/* Data Sertifikat PKL - Grid 2 Kolom */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              
              {/* NOMOR SERTIFIKAT - FULL WIDTH (2 Kolom) */}
              <div className="col-span-2 mb-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  NOMOR SERTIFIKAT
                </label>
                <input
                  type="text"
                  name="nomorSertifikat"
                  value={formData.nomorSertifikat}
                  onChange={handleChange}
                  disabled={downloading}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Kolom Kiri - Data Kiri */}
              <div className="space-y-5">
                {/* Dropdown Nama Peserta Didik dengan Pencarian */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    NAMA PESERTA DIDIK DAN NISN
                  </label>
                  <div className="relative" ref={siswaDropdownRef}>
                    {/* Trigger Dropdown */}
                    <div
                      onClick={() => !downloading && setIsSiswaDropdownOpen(!isSiswaDropdownOpen)}
                      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] cursor-pointer flex justify-between items-center ${downloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className={selectedSiswaLabel ? "text-gray-900" : "text-gray-400"}>
                        {selectedSiswaLabel || "-- Pilih Siswa --"}
                      </span>
                      <div className="flex items-center gap-2">
                        {selectedSiswaLabel && !downloading && (
                          <X
                            size={18}
                            className="text-red-500 cursor-pointer hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearSiswa();
                            }}
                          />
                        )}
                        <ChevronDown
                          size={18}
                          className={`text-gray-500 transition-transform duration-200 ${
                            isSiswaDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Dropdown Menu */}
                    {isSiswaDropdownOpen && !downloading && (
                      <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden flex flex-col">
                        {/* Input Pencarian */}
                        <div className="relative border-b">
                          <input
                            type="text"
                            placeholder="Cari nama siswa, NISN, atau kelas..."
                            className="w-full px-4 py-2 pl-10 text-sm focus:outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                          />
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                          {searchQuery && (
                            <X
                              size={16}
                              className="absolute right-3 top-2.5 text-gray-400 cursor-pointer hover:text-gray-600"
                              onClick={() => setSearchQuery("")}
                            />
                          )}
                        </div>

                        {/* Daftar Siswa */}
                        <div className="overflow-y-auto max-h-60">
                          {loading ? (
                            <div className="px-4 py-3 text-center text-gray-500">
                              Memuat data...
                            </div>
                          ) : filteredSiswa.length > 0 ? (
                            filteredSiswa.map((siswa) => (
                              <div
                                key={siswa.application_id}
                                onClick={() => handleSelectSiswa(siswa)}
                                className={`px-4 py-2 cursor-pointer hover:bg-orange-50 border-b last:border-b-0 ${
                                  formData.siswaId === siswa.application_id
                                    ? "bg-orange-100"
                                    : ""
                                }`}
                              >
                                <div className="font-medium">{siswa.siswa_username}</div>
                                <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-1">
                                  <span>NISN: {siswa.siswa_nisn}</span>
                                  <span>Kelas: {siswa.kelas_nama}</span>
                                  <span>Jurusan: {siswa.jurusan_nama}</span>
                                </div>
                                {siswa.industri_nama && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Industri: {siswa.industri_nama}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-center text-gray-500">
                              {searchQuery ? "Tidak ada siswa yang sesuai" : "Tidak ada data siswa"}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tanggal Mulai PKL - Otomatis terisi */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    TANGGAL MULAI PKL
                  </label>
                  <input
                    type="date"
                    name="tanggalMulai"
                    value={formData.tanggalMulai}
                    onChange={handleChange}
                    disabled={downloading}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* NAMA PEMBINA INDUSTRI - Field di kolom kiri */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    NAMA PEMBINA INDUSTRI
                  </label>
                  <input
                    type="text"
                    name="namaPembina"
                    value={formData.namaPembina}
                    onChange={handleChange}
                    disabled={downloading}
                    placeholder="Nama pembina industri"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
            
                </div>

                {/* Hasil Penilaian - Otomatis terisi berdasarkan rata-rata nilai */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    HASIL PENILAIAN
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="hasilPenilaian"
                      value={formData.hasilPenilaian}
                      readOnly
                      disabled={downloading}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none cursor-not-allowed disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500">
                      *Otomatis berdasarkan rata-rata nilai: 86-100 = Sangat Baik, 75-85 = Baik, &lt;75 = Kurang
                    </p>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan - Data Kanan */}
              <div className="space-y-5">
                {/* Nama Industri - Otomatis terisi */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    NAMA INDUSTRI
                  </label>
                  <input
                    type="text"
                    name="namaIndustri"
                    value={formData.namaIndustri}
                    onChange={handleChange}
                    disabled={downloading}
                    placeholder="-"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Tanggal Selesai PKL - Otomatis terisi */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    TANGGAL SELESAI PKL
                  </label>
                  <input
                    type="date"
                    name="tanggalSelesai"
                    value={formData.tanggalSelesai}
                    onChange={handleChange}
                    disabled={downloading}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Tanggal Sertifikat PKL Dibuat - Default hari ini */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    TANGGAL SERTIFIKAT PKL DIBUAT
                  </label>
                  <input
                    type="date"
                    name="tanggalSertifikatDibuat"
                    value={formData.tanggalSertifikatDibuat}
                    onChange={handleChange}
                    disabled={downloading}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Nama Pimpinan Industri */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    NAMA PIMPINAN INDUSTRI
                  </label>
                  <input
                    type="text"
                    name="namaPimpinan"
                    value={formData.namaPimpinan}
                    onChange={handleChange}
                    disabled={downloading}
                    placeholder="Nama pimpinan industri"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Bagian Penilaian - Layout per Aspek */}
            <div className="mt-10">
              <h4 className="text-[#641E21] font-bold text-lg mb-6">
                PENILAIAN PKL
              </h4>
              
              {/* Aspek 1 */}
              <div className="mb-8 p-4 border border-gray-200 rounded-lg">
                {/* ASPEK - Full Width */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    ASPEK 1
                  </label>
                  <textarea
                    name="aspek1"
                    value={formData.aspek1}
                    onChange={handleChange}
                    disabled={downloading}
                    placeholder="Aspek penilaian 1"
                    rows="2"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                
                {/* NILAI dan PREDIKAT - Setengah-setengah */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      NILAI 1 <span className="text-xs font-normal text-gray-500">(0-100)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      name="nilai1"
                      value={formData.nilai1}
                      onChange={handleChange}
                      disabled={downloading}
                      placeholder="0-100"
                      className={`w-full px-4 py-2.5 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        nilaiErrors.nilai1 ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {nilaiErrors.nilai1 && (
                      <p className="text-red-500 text-xs mt-1">{nilaiErrors.nilai1}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      PREDIKAT 1
                    </label>
                    <input
                      type="text"
                      name="predikat1"
                      value={formData.predikat1}
                      readOnly
                      disabled={downloading}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
                
                {/* DESKRIPSI - Full Width (hanya untuk tampilan) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    DESKRIPSI 1
                  </label>
                  <textarea
                    name="deskripsi1"
                    value={formData.deskripsi1}
                    onChange={handleChange}
                    disabled={downloading}
                    placeholder="Deskripsi lengkap aspek 1"
                    rows="3"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Aspek 2 */}
              <div className="mb-8 p-4 border border-gray-200 rounded-lg">
                {/* ASPEK - Full Width */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    ASPEK 2
                  </label>
                  <textarea
                    name="aspek2"
                    value={formData.aspek2}
                    onChange={handleChange}
                    disabled={downloading}
                    placeholder="Aspek penilaian 2"
                    rows="2"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                
                {/* NILAI dan PREDIKAT - Setengah-setengah */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      NILAI 2 <span className="text-xs font-normal text-gray-500">(0-100)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      name="nilai2"
                      value={formData.nilai2}
                      onChange={handleChange}
                      disabled={downloading}
                      placeholder="0-100"
                      className={`w-full px-4 py-2.5 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        nilaiErrors.nilai2 ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {nilaiErrors.nilai2 && (
                      <p className="text-red-500 text-xs mt-1">{nilaiErrors.nilai2}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      PREDIKAT 2
                    </label>
                    <input
                      type="text"
                      name="predikat2"
                      value={formData.predikat2}
                      readOnly
                      disabled={downloading}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
                
                {/* DESKRIPSI - Full Width (hanya untuk tampilan) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    DESKRIPSI 2
                  </label>
                  <textarea
                    name="deskripsi2"
                    value={formData.deskripsi2}
                    onChange={handleChange}
                    disabled={downloading}
                    placeholder="Deskripsi lengkap aspek 2"
                    rows="3"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Aspek 3 */}
              <div className="mb-8 p-4 border border-gray-200 rounded-lg">
                {/* ASPEK - Full Width */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    ASPEK 3
                  </label>
                  <textarea
                    name="aspek3"
                    value={formData.aspek3}
                    onChange={handleChange}
                    disabled={downloading}
                    placeholder="Aspek penilaian 3"
                    rows="2"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                
                {/* NILAI dan PREDIKAT - Setengah-setengah */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      NILAI 3 <span className="text-xs font-normal text-gray-500">(0-100)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      name="nilai3"
                      value={formData.nilai3}
                      onChange={handleChange}
                      disabled={downloading}
                      placeholder="0-100"
                      className={`w-full px-4 py-2.5 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        nilaiErrors.nilai3 ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {nilaiErrors.nilai3 && (
                      <p className="text-red-500 text-xs mt-1">{nilaiErrors.nilai3}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      PREDIKAT 3
                    </label>
                    <input
                      type="text"
                      name="predikat3"
                      value={formData.predikat3}
                      readOnly
                      disabled={downloading}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
                
                {/* DESKRIPSI - Full Width (hanya untuk tampilan) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    DESKRIPSI 3
                  </label>
                  <textarea
                    name="deskripsi3"
                    value={formData.deskripsi3}
                    onChange={handleChange}
                    disabled={downloading}
                    placeholder="Deskripsi lengkap aspek 3"
                    rows="3"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Aspek 4 */}
              <div className="mb-8 p-4 border border-gray-200 rounded-lg">
                {/* ASPEK - Full Width */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    ASPEK 4
                  </label>
                  <textarea
                    name="aspek4"
                    value={formData.aspek4}
                    onChange={handleChange}
                    disabled={downloading}
                    placeholder="Aspek penilaian 4"
                    rows="2"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                
                {/* NILAI dan PREDIKAT - Setengah-setengah */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      NILAI 4 <span className="text-xs font-normal text-gray-500">(0-100)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      name="nilai4"
                      value={formData.nilai4}
                      onChange={handleChange}
                      disabled={downloading}
                      placeholder="0-100"
                      className={`w-full px-4 py-2.5 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        nilaiErrors.nilai4 ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {nilaiErrors.nilai4 && (
                      <p className="text-red-500 text-xs mt-1">{nilaiErrors.nilai4}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      PREDIKAT 4
                    </label>
                    <input
                      type="text"
                      name="predikat4"
                      value={formData.predikat4}
                      readOnly
                      disabled={downloading}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
                
                {/* DESKRIPSI - Full Width (hanya untuk tampilan) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    DESKRIPSI 4
                  </label>
                  <textarea
                    name="deskripsi4"
                    value={formData.deskripsi4}
                    onChange={handleChange}
                    disabled={downloading}
                    placeholder="Deskripsi lengkap aspek 4"
                    rows="3"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EC933A] resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Garis Pemisah */}
            <hr className="my-10 border-t-2 border-gray-200" />

            {/* Tombol Aksi */}
            <div className="flex justify-end gap-4">
              <button
                onClick={handleSave}
                disabled={downloading}
                className="px-6 py-3 rounded-lg !bg-[#1447E6] text-white font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                Simpan Sertifikat
              </button>
              
              <button
                onClick={handleDownloadPDF}
                disabled={!formData.siswaId || downloading}
                className={`px-6 py-3 rounded-lg !bg-[#BC2424] text-white font-medium hover:bg-red-800 transition flex items-center gap-2 ${(!formData.siswaId || downloading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Download size={18} />
                {downloading ? 'Memproses...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}