import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileSpreadsheet, FileText, Star, Printer, CheckCircle, Building2, Users, ChevronDown, ChevronUp, FileDown, GraduationCap, Edit, Award, Hash } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { useNavigate, useLocation } from 'react-router-dom';

import { getReviewPenilaian, getDetailReviewPenilaian } from "../utils/services/koordinator/penilaian";
import { getApprovedPKL } from "../utils/services/koordinator/pengajuan";
import { getIndustri, getIndustriById } from "../utils/services/admin/get_industri";
import { generateAndDownloadSertifikat } from "../utils/lettersApi";
import { getSummaryIzinSiswa } from "../utils/services/pembimbing/izin";
import { getFormsPenilaian } from "../utils/services/koordinator/form";

import Detail from "./components/Detail";
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Pagination from "./components/Pagination";

// Set locale ke Indonesia
dayjs.locale('id');

export default function ReviewPenilaianPKL() {
  const navigate = useNavigate();
  const location = useLocation();
  const exportRef = useRef(null);

  const [openExport, setOpenExport] = useState(false);
  const [openBulkExport, setOpenBulkExport] = useState(false);
  const [active, setActive] = useState("sertifikat");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingCetak, setLoadingCetak] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [loadingIzinData, setLoadingIzinData] = useState(false);
  const [tempat, setTempat] = useState("Singosari");

  // State untuk menyimpan data form penilaian dan nomor sertifikat dari localStorage
  const [formsList, setFormsList] = useState([]);
  const [nomorSertifikatMap, setNomorSertifikatMap] = useState({});

  const [dataPenilaian, setDataPenilaian] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [industriList, setIndustriList] = useState([]);
  const [industriDetailMap, setIndustriDetailMap] = useState({});
  const [groupedByIndustri, setGroupedByIndustri] = useState({});
  const [groupedByKelas, setGroupedByKelas] = useState({});
  const [totalData, setTotalData] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailPenilaian, setDetailPenilaian] = useState(null);
  const [rawDetailData, setRawDetailData] = useState(null);
  
  // State untuk menyimpan data izin siswa
  const [izinDataMap, setIzinDataMap] = useState({});
  
  const [mode, setMode] = useState("list");
  const [viewMode, setViewMode] = useState("list");
  const [detailMode, setDetailMode] = useState("view");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [selectAll, setSelectAll] = useState(false);

  const itemsPerPage = 10;

  const user = {
    name: localStorage.getItem("nama_guru") || "Koordinator PKL",
    role: "Koordinator",
  };

  const schoolInfo = {
    alamat_jalan: "Jalan Perusahaan No. 20",
    email: "smkn2singosari@yahoo.co.id",
    kab_kota: "Kab. Malang",
    kecamatan: "Singosari",
    kelurahan: "Tunjungtirto",
    kode_pos: "65153",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/7/74/Coat_of_arms_of_East_Java.svg",
    nama_sekolah: "SMK NEGERI 2 SINGOSARI",
    provinsi: "Jawa Timur",
    telepon: "(0341) 4345127",
    website: "www.smkn2singosari.sch.id"
  };

  // Fungsi untuk mendapatkan nomor sertifikat dari localStorage berdasarkan form ID
  const getNomorSertifikatByFormId = (formId) => {
    try {
      if (!formId) return null;
      
      const existingData = localStorage.getItem('nomorSertifikatForms');
      if (!existingData) return null;
      
      const nomorSertifikatData = JSON.parse(existingData);
      return nomorSertifikatData[formId]?.nomorSertifikat || null;
    } catch (error) {
      console.error('Gagal membaca nomor sertifikat dari localStorage:', error);
      return null;
    }
  };

  // FUNGSI BARU: Untuk mendapatkan jenis nomor dari localStorage berdasarkan industri ID
  const getJenisNomorFromLocal = (industriId, jenis) => {
    try {
      if (!industriId) return null;
      
      const key = `jenis_nomor_industri_${industriId}`;
      const existingData = localStorage.getItem(key);
      if (!existingData) return null;
      
      const data = JSON.parse(existingData);
      return data[jenis] || null;
    } catch (error) {
      console.error('Gagal membaca jenis nomor dari localStorage:', error);
      return null;
    }
  };

  // Fungsi untuk memuat semua data form penilaian
  const fetchForms = async () => {
    try {
      const response = await getFormsPenilaian();
      const formsData = response.data || [];
      setFormsList(formsData);
      
      // Buat mapping form ID ke nomor sertifikat dari localStorage
      const map = {};
      formsData.forEach(form => {
        const nomor = getNomorSertifikatByFormId(form.id);
        if (nomor) {
          map[form.id] = nomor;
        }
      });
      setNomorSertifikatMap(map);
      
      console.log("Form data loaded:", formsData);
      console.log("Nomor sertifikat map:", map);
    } catch (error) {
      console.error("Gagal fetch forms:", error);
    }
  };

  // Mapping jurusan ke kode untuk API
  const jurusanKeKode = {
    "Rekayasa Perangkat Lunak": "rpl",
    "Teknik Komputer dan Jaringan": "tkj",
    "Desain Komunikasi Visual": "dkv",
    "Audio Video": "av",
    "Mekatronika": "mt",
    "Elektronika Industri": "ei",
    "Animasi": "an",
    "Broadcasting": "bc"
  };

  // Mapping kode jurusan ke nama konsentrasi keahlian
  const getKonsentrasiKeahlian = (kelas) => {
    if (!kelas) return "";
    
    const kodeJurusan = kelas.split(" ")[1];
    
    const mapping = {
      "RPL": "Rekayasa Perangkat Lunak",
      "TKJ": "Teknik Komputer dan Jaringan",
      "AV": "Audio Video",
      "AN": "Animasi",
      "BC": "Broadcasting",
      "DKV": "Desain Komunikasi Visual",
      "EI": "Elektronika Industri",
      "MT": "Mekatronika",
    };
    
    return mapping[kodeJurusan] || "";
  };

  // Fungsi untuk memformat tanggal ke format Indonesia (DD Bulan YYYY)
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

  // Fungsi untuk memformat tanggal ke format pendek (DD/MM/YYYY)
  const formatTanggalPendek = (tanggal) => {
    if (!tanggal) return "";
    return dayjs(tanggal).format('DD/MM/YYYY');
  };

  // Fungsi untuk menghitung hasil penilaian berdasarkan rata-rata nilai
  const hitungHasilPenilaian = (nilai1, nilai2, nilai3, nilai4) => {
    const n1 = parseFloat(nilai1) || 0;
    const n2 = parseFloat(nilai2) || 0;
    const n3 = parseFloat(nilai3) || 0;
    const n4 = parseFloat(nilai4) || 0;
    
    const average = (n1 + n2 + n3 + n4) / 4;
    
    if (average >= 86 && average <= 100) {
      return "Sangat Baik";
    } else if (average >= 75 && average <= 85) {
      return "Baik";
    } else if (average > 0 && average < 75) {
      return "Kurang";
    } else {
      return "Belum Dinilai";
    }
  };

  // Fungsi untuk mendapatkan predikat berdasarkan rata-rata
  const getPredikat = (rataRata) => {
    if (!rataRata || rataRata === "-" || rataRata === 0) return "Belum Dinilai";
    
    const avg = parseFloat(rataRata);
    
    if (avg >= 86 && avg <= 100) {
      return "Sangat Baik";
    } else if (avg >= 75 && avg <= 85) {
      return "Baik";
    } else if (avg < 75 && avg > 0) {
      return "Kurang";
    } else {
      return "Belum Dinilai";
    }
  };

  // Fungsi untuk mendapatkan warna badge berdasarkan predikat
  const getPredikatColor = (predikat) => {
    switch(predikat) {
      case "Sangat Baik":
        return "bg-green-100 text-green-800 border-green-200";
      case "Baik":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Kurang":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getModeFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('mode') || 'list';
  };

  const getSelectedIdFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('id');
  };

  useEffect(() => {
    const urlMode = getModeFromUrl();
    setMode(urlMode);
  }, [location.search]);

  useEffect(() => {
    const selectedId = getSelectedIdFromUrl();
    if (selectedId && dataPenilaian.length > 0) {
      const item = dataPenilaian.find(i => i.application_id === parseInt(selectedId));
      if (item) {
        handleCardClick(item);
      } else {
        handleModeChange('list');
      }
    }
  }, [dataPenilaian, location.search]);

  // Group data by industry and class
  useEffect(() => {
    if (dataPenilaian.length > 0) {
      const industriGroups = {};
      dataPenilaian.forEach(item => {
        const industri = item.industri_nama || "Industri Lainnya";
        if (!industriGroups[industri]) {
          industriGroups[industri] = [];
        }
        industriGroups[industri].push(item);
      });
      setGroupedByIndustri(industriGroups);

      const kelasGroups = {};
      dataPenilaian.forEach(item => {
        const kelas = item.kelas_nama || "Kelas Lainnya";
        if (!kelasGroups[kelas]) {
          kelasGroups[kelas] = [];
        }
        kelasGroups[kelas].push(item);
      });
      setGroupedByKelas(kelasGroups);
      
      const initialExpanded = {};
      Object.keys(industriGroups).forEach(key => {
        initialExpanded[key] = true;
      });
      Object.keys(kelasGroups).forEach(key => {
        initialExpanded[`kelas_${key}`] = true;
      });
      setExpandedGroups(initialExpanded);
    }
  }, [dataPenilaian]);

  // Fungsi untuk mengambil data izin semua siswa
  const fetchAllIzinData = async (siswaIds) => {
    if (!siswaIds || siswaIds.length === 0) return;
    
    setLoadingIzinData(true);
    try {
      const uniqueIds = [...new Set(siswaIds)];
      const izinPromises = uniqueIds.map(async (siswaId) => {
        try {
          const response = await getSummaryIzinSiswa(siswaId);
          console.log(`Data izin untuk siswa ${siswaId}:`, response);
          return { siswa_id: siswaId, data: response };
        } catch (error) {
          console.error(`Gagal mengambil data izin untuk siswa ID ${siswaId}:`, error);
          return { siswa_id: siswaId, data: { sakit: 0, izin: 0, alpa: 0 } };
        }
      });
      
      const results = await Promise.all(izinPromises);
      const newIzinMap = {};
      results.forEach(result => {
        newIzinMap[result.siswa_id] = result.data;
      });
      
      setIzinDataMap(prevMap => ({ ...prevMap, ...newIzinMap }));
    } catch (error) {
      console.error("Error fetching all izin data:", error);
    } finally {
      setLoadingIzinData(false);
    }
  };

  // Fungsi untuk mengambil detail semua industri berdasarkan nama
  const fetchAllIndustriDetails = async (industriNames) => {
    if (!industriNames || industriNames.length === 0) return;
    
    try {
      const uniqueNames = [...new Set(industriNames)];
      const industriPromises = uniqueNames.map(async (industriNama) => {
        const industri = industriList.find(item => 
          item.nama.toLowerCase() === industriNama.toLowerCase() ||
          item.nama.toLowerCase().includes(industriNama.toLowerCase()) ||
          industriNama.toLowerCase().includes(item.nama.toLowerCase())
        );
        
        if (industri) {
          try {
            const detail = await getIndustriById(industri.id);
            console.log(`Detail industri untuk ${industriNama}:`, detail);
            return { nama: industriNama, data: detail };
          } catch (error) {
            console.error(`Gagal mengambil detail industri untuk ${industriNama}:`, error);
            return { nama: industriNama, data: industri };
          }
        }
        return { nama: industriNama, data: null };
      });
      
      const results = await Promise.all(industriPromises);
      const newIndustriMap = {};
      results.forEach(result => {
        if (result.data) {
          newIndustriMap[result.nama] = result.data;
        }
      });
      
      setIndustriDetailMap(prevMap => ({ ...prevMap, ...newIndustriMap }));
    } catch (error) {
      console.error("Error fetching all industri details:", error);
    }
  };

  const handleModeChange = (newMode, item = null) => {
    const params = new URLSearchParams(location.search);
    params.set('mode', newMode);
    
    if (item) {
      params.set('id', item.application_id);
      setSelectedItem(item);
    } else {
      params.delete('id');
      setSelectedItem(null);
      setDetailPenilaian(null);
      setRawDetailData(null);
    }
    
    if (newMode !== 'detail') {
      setDetailMode('view');
    }
    
    navigate(`${location.pathname}?${params.toString()}`);
  };

  const handleCardClick = async (item) => {
    try {
      setLoadingDetail(true);
      
      const response = await getDetailReviewPenilaian(item.application_id);
      console.log("Detail penilaian:", response);
      
      setRawDetailData(response);
      
      const detailData = {
        "Nama Siswa": item.siswa_username || "-",
        "NISN": item.siswa_nisn || "-",
        "Kelas": item.kelas_nama || "-",
        "Konsentrasi Keahlian": getKonsentrasiKeahlian(item.kelas_nama) || "-",
        "Jurusan": item.jurusan_nama || "-",
        "Industri": item.industri_nama || "-",
        
        "Aspek 1 - Nilai": response.items?.[0]?.skor || "-",
        "Aspek 1 - Deskripsi": response.items?.[0]?.deskripsi || "-",
        "Aspek 1 - Tujuan Pembelajaran": response.form_items?.[0]?.tujuan_pembelajaran || "-",
        
        "Aspek 2 - Nilai": response.items?.[1]?.skor || "-",
        "Aspek 2 - Deskripsi": response.items?.[1]?.deskripsi || "-",
        "Aspek 2 - Tujuan Pembelajaran": response.form_items?.[1]?.tujuan_pembelajaran || "-",
        
        "Aspek 3 - Nilai": response.items?.[2]?.skor || "-",
        "Aspek 3 - Deskripsi": response.items?.[2]?.deskripsi || "-",
        "Aspek 3 - Tujuan Pembelajaran": response.form_items?.[2]?.tujuan_pembelajaran || "-",
        
        "Aspek 4 - Nilai": response.items?.[3]?.skor || "-",
        "Aspek 4 - Deskripsi": response.items?.[3]?.deskripsi || "-",
        "Aspek 4 - Tujuan Pembelajaran": response.form_items?.[3]?.tujuan_pembelajaran || "-",
        
        "Total Skor": response.total_skor || "-",
        "Rata-rata": response.rata_rata || "-",
        "Predikat": getPredikat(response.rata_rata),
        "Catatan Akhir": response.catatan_akhir || "-",
        "Tanggal Finalisasi": formatTanggalIndonesia(response.finalized_at) || "-",
        "Form Penilaian": response.form_nama || "-",
        "Status": response.status === "final" ? "Sudah Difinalisasi" : response.status || "-",
      };
      
      setDetailPenilaian(detailData);
      handleModeChange("detail", item);
      
    } catch (error) {
      console.error("Gagal mengambil detail penilaian:", error);
      toast.error("Gagal memuat detail penilaian");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Fungsi untuk mendapatkan data siswa approved PKL (tanggal mulai dan selesai)
  const fetchSiswaApproved = async () => {
    try {
      const response = await getApprovedPKL();
      console.log("Data siswa approved:", response);
      
      if (response && response.data) {
        setSiswaList(response.data);
      }
    } catch (error) {
      console.error("Error fetching siswa approved:", error);
    }
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

  // Fungsi untuk mendapatkan detail industri berdasarkan nama
  const getDetailIndustriByNama = (industriNama) => {
    if (!industriNama || industriList.length === 0) return null;
    
    // Cari industri di industriList berdasarkan nama (case insensitive)
    const industri = industriList.find(item => 
      item.nama.toLowerCase() === industriNama.toLowerCase() ||
      item.nama.toLowerCase().includes(industriNama.toLowerCase()) ||
      industriNama.toLowerCase().includes(item.nama.toLowerCase())
    );
    
    return industri || null;
  };

  // Fungsi untuk generate sertifikat single - MODIFIKASI UTAMA
  const handleCetakSertifikat = async (item) => {
    try {
      setLoadingCetak(true);
      setProcessingId(item.application_id);
      
      toast.loading(`Menyiapkan sertifikat untuk ${item.siswa_username}...`, { id: 'singleCetak' });
      
      // Ambil detail penilaian
      let detailData = rawDetailData;
      if (!detailData || detailData.application_id !== item.application_id) {
        detailData = await getDetailReviewPenilaian(item.application_id);
      }
      
      // Dapatkan tanggal mulai dan selesai dari siswaList
      const { tanggalMulai, tanggalSelesai } = getTanggalDariSiswa(item.application_id);
      
      // Dapatkan detail industri berdasarkan nama
      const industriDetail = getDetailIndustriByNama(item.industri_nama);
      
      // Log untuk debugging
      console.log("Industri Detail untuk", item.industri_nama, ":", industriDetail);
      
      // Ambil nilai dari items
      const nilai1 = parseFloat(detailData.items?.[0]?.skor) || 0;
      const nilai2 = parseFloat(detailData.items?.[1]?.skor) || 0;
      const nilai3 = parseFloat(detailData.items?.[2]?.skor) || 0;
      const nilai4 = parseFloat(detailData.items?.[3]?.skor) || 0;
      
      // Hitung hasil penilaian berdasarkan rata-rata nilai
      const average = (nilai1 + nilai2 + nilai3 + nilai4) / 4;
      let hasilPkl = "Belum Dinilai";
      if (average >= 86 && average <= 100) {
        hasilPkl = "Sangat Baik";
      } else if (average >= 75 && average <= 85) {
        hasilPkl = "Baik";
      } else if (average > 0 && average < 75) {
        hasilPkl = "Kurang";
      }
      
      // Format tanggal
      const tanggalMulaiFormatted = formatTanggalIndonesia(tanggalMulai);
      const tanggalSelesaiFormatted = formatTanggalIndonesia(tanggalSelesai);
      const tanggalTerbitFormatted = formatTanggalIndonesia(new Date().toISOString().split('T')[0]);
      
      // Dapatkan nomor sertifikat berdasarkan form ID yang digunakan
      const formId = detailData.form_id;
      let nomorSertifikat = getNomorSertifikatByFormId(formId);
      
      // Jika tidak ditemukan, gunakan default atau tampilkan warning
      if (!nomorSertifikat) {
        nomorSertifikat = "420/1013/101.6.9.19/2026"; // Default fallback
        console.warn(`Nomor sertifikat tidak ditemukan untuk form ID: ${formId}, menggunakan default`);
        toast.warning(`Nomor sertifikat untuk form "${detailData.form_nama}" belum diatur. Gunakan default.`, { id: 'singleCetak' });
      }
      
      // Dapatkan jenis nomor dari localStorage berdasarkan industri ID
      const industriId = item.industri_id || industriDetail?.id;
      let jenisNomorPimpinan = getJenisNomorFromLocal(industriId, 'jenis_nomor_pimpinan');
      let jenisNomorPembimbing = getJenisNomorFromLocal(industriId, 'jenis_nomor_pembimbing');
      
      // Jika tidak ditemukan, gunakan default "NP"
      if (!jenisNomorPimpinan) {
        jenisNomorPimpinan = "NP";
        console.log(`Jenis nomor pimpinan tidak ditemukan untuk industri ID: ${industriId}, menggunakan default "NP"`);
      }
      
      if (!jenisNomorPembimbing) {
        jenisNomorPembimbing = "NP";
        console.log(`Jenis nomor pembimbing tidak ditemukan untuk industri ID: ${industriId}, menggunakan default "NP"`);
      }
      
      console.log(`Menggunakan nomor sertifikat untuk form ID ${formId}:`, nomorSertifikat);
      console.log(`Menggunakan jenis nomor pimpinan:`, jenisNomorPimpinan);
      console.log(`Menggunakan jenis nomor pembimbing:`, jenisNomorPembimbing);
      
      // Format payload SESUAI DENGAN STRUKTUR YANG DIHARAPKAN
      const payload = {
        nomor_sertifikat: nomorSertifikat,
        siswa: {
          nama: item.siswa_username,
          nisn: item.siswa_nisn
        },
        nama_industri: item.industri_nama || "Industri",
        tanggal_mulai: tanggalMulaiFormatted,
        tanggal_selesai: tanggalSelesaiFormatted,
        hasil_pkl: hasilPkl,
        tanggal_terbit: tanggalTerbitFormatted,
        nilai: {
          aspek_1: nilai1,
          desc_1: detailData.form_items?.[0]?.tujuan_pembelajaran || "MENERAPKAN SOFT SKILL YANG DIBUTUHKAN DI DUNIA KERJA (TEMPAT PKL).",
          aspek_2: nilai2,
          desc_2: detailData.form_items?.[1]?.tujuan_pembelajaran || "MENERAPKAN NORMA, PROSEDUR OPERASIONAL STANDAR (POS), SERTA KESEHATAN, KESELAMATAN KERJA, DAN LINGKUNGAN HIDUP (K3LH) YANG ADA DI DUNIA KERJA (TEMPAT PKL).",
          aspek_3: nilai3,
          desc_3: detailData.form_items?.[2]?.tujuan_pembelajaran || "MENERAPKAN KOMPETENSI TEKNIS YANG SUDAH DIPELAJARI DI SEKOLAH DAN/ATAU BARU DIPELAJARI DI DUNIA KERJA (TEMPAT PKL).",
          aspek_4: nilai4,
          desc_4: detailData.form_items?.[3]?.tujuan_pembelajaran || "MEMAHAMI ALUR BISNIS DUNIA KERJA TEMPAT PKL DAN WAWASAN WIRAUSAHA."
        },
        // Data pimpinan dari industri dengan jenis nomor
        nama_pimpinan: industriDetail?.nama_pimpinan || "",
        jenis_nomor_pimpinan: jenisNomorPimpinan,
        nip_pimpinan: industriDetail?.nip_pimpinan || "",
        jabatan_pimpinan: industriDetail?.jabatan_pimpinan || "",
        // Data pembimbing dari industri dengan jenis nomor
        nama_pembimbing: industriDetail?.pic || "",
        jenis_nomor_pembimbing: jenisNomorPembimbing,
        nip_pembimbing: industriDetail?.nip_pembimbing || "",
        jabatan_pembimbing: industriDetail?.jabatan_pembimbing || ""
      };

      console.log("Payload untuk sertifikat single:", payload);
      
      // Dapatkan kode jurusan (tetap diperlukan untuk penamaan file)
      const jurusanValue = jurusanKeKode[item.jurusan_nama] || "rpl";
      
      // Generate dan download langsung
      const filename = await generateAndDownloadSertifikat(jurusanValue, payload);
      
      toast.success(`Sertifikat ${item.siswa_username} berhasil didownload!`, { id: 'singleCetak' });
      console.log("Sertifikat berhasil didownload:", filename);
      
    } catch (error) {
      console.error("Gagal generate sertifikat:", error);
      toast.error(`Gagal generate sertifikat: ${error.message || "Terjadi kesalahan"}`, { id: 'singleCetak' });
    } finally {
      setLoadingCetak(false);
      setProcessingId(null);
    }
  };

  // Fungsi untuk bulk generate sertifikat - MODIFIKASI UTAMA
  const handleBulkGenerateSertifikat = async (items) => {
    if (items.length === 0) {
      toast.error("Pilih minimal satu siswa");
      return;
    }

    try {
      setLoadingCetak(true);
      toast.loading(`Menyiapkan ${items.length} sertifikat...`, { id: 'bulkGenerate' });

      let successCount = 0;
      let failCount = 0;
      let missingNomorCount = 0;
      let missingJenisNomorCount = 0;
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        try {
          toast.loading(`Memproses ${i+1} dari ${items.length} sertifikat...`, { id: 'bulkGenerate' });
          
          const detailData = await getDetailReviewPenilaian(item.application_id);
          
          const { tanggalMulai, tanggalSelesai } = getTanggalDariSiswa(item.application_id);
          
          const industriDetail = getDetailIndustriByNama(item.industri_nama);
          
          console.log("Industri Detail untuk", item.industri_nama, ":", industriDetail);
          
          const nilai1 = parseFloat(detailData.items?.[0]?.skor) || 0;
          const nilai2 = parseFloat(detailData.items?.[1]?.skor) || 0;
          const nilai3 = parseFloat(detailData.items?.[2]?.skor) || 0;
          const nilai4 = parseFloat(detailData.items?.[3]?.skor) || 0;
          
          const average = (nilai1 + nilai2 + nilai3 + nilai4) / 4;
          let hasilPkl = "Belum Dinilai";
          if (average >= 86 && average <= 100) {
            hasilPkl = "Sangat Baik";
          } else if (average >= 75 && average <= 85) {
            hasilPkl = "Baik";
          } else if (average > 0 && average < 75) {
            hasilPkl = "Kurang";
          }
          
          const tanggalMulaiFormatted = formatTanggalIndonesia(tanggalMulai);
          const tanggalSelesaiFormatted = formatTanggalIndonesia(tanggalSelesai);
          const tanggalTerbitFormatted = formatTanggalIndonesia(new Date().toISOString().split('T')[0]);
          
          // Dapatkan nomor sertifikat berdasarkan form ID yang digunakan
          const formId = detailData.form_id;
          let nomorSertifikat = getNomorSertifikatByFormId(formId);
          
          // Jika tidak ditemukan, gunakan default
          if (!nomorSertifikat) {
            nomorSertifikat = "420/1013/101.6.9.19/2026"; // Default fallback
            missingNomorCount++;
          }
          
          // Dapatkan jenis nomor dari localStorage berdasarkan industri ID
          const industriId = item.industri_id || industriDetail?.id;
          let jenisNomorPimpinan = getJenisNomorFromLocal(industriId, 'jenis_nomor_pimpinan');
          let jenisNomorPembimbing = getJenisNomorFromLocal(industriId, 'jenis_nomor_pembimbing');
          
          // Jika tidak ditemukan, gunakan default "NP"
          if (!jenisNomorPimpinan) {
            jenisNomorPimpinan = "NP";
            missingJenisNomorCount++;
          }
          
          if (!jenisNomorPembimbing) {
            jenisNomorPembimbing = "NP";
            missingJenisNomorCount++;
          }
          
          const payload = {
            nomor_sertifikat: nomorSertifikat,
            siswa: {
              nama: item.siswa_username,
              nisn: item.siswa_nisn
            },
            nama_industri: item.industri_nama || "Industri",
            tanggal_mulai: tanggalMulaiFormatted,
            tanggal_selesai: tanggalSelesaiFormatted,
            hasil_pkl: hasilPkl,
            tanggal_terbit: tanggalTerbitFormatted,
            nilai: {
              aspek_1: nilai1,
              desc_1: detailData.form_items?.[0]?.tujuan_pembelajaran || "MENERAPKAN SOFT SKILL YANG DIBUTUHKAN DI DUNIA KERJA (TEMPAT PKL).",
              aspek_2: nilai2,
              desc_2: detailData.form_items?.[1]?.tujuan_pembelajaran || "MENERAPKAN NORMA, PROSEDUR OPERASIONAL STANDAR (POS), SERTA KESEHATAN, KESELAMATAN KERJA, DAN LINGKUNGAN HIDUP (K3LH) YANG ADA DI DUNIA KERJA (TEMPAT PKL).",
              aspek_3: nilai3,
              desc_3: detailData.form_items?.[2]?.tujuan_pembelajaran || "MENERAPKAN KOMPETENSI TEKNIS YANG SUDAH DIPELAJARI DI SEKOLAH DAN/ATAU BARU DIPELAJARI DI DUNIA KERJA (TEMPAT PKL).",
              aspek_4: nilai4,
              desc_4: detailData.form_items?.[3]?.tujuan_pembelajaran || "MEMAHAMI ALUR BISNIS DUNIA KERJA TEMPAT PKL DAN WAWASAN WIRAUSAHA."
            },
            // Data pimpinan dari industri dengan jenis nomor
            nama_pimpinan: industriDetail?.nama_pimpinan || "",
            jenis_nomor_pimpinan: jenisNomorPimpinan,
            nip_pimpinan: industriDetail?.nip_pimpinan || "",
            jabatan_pimpinan: industriDetail?.jabatan_pimpinan || "",
            // Data pembimbing dari industri dengan jenis nomor
            nama_pembimbing: industriDetail?.pic || "",
            jenis_nomor_pembimbing: jenisNomorPembimbing,
            nip_pembimbing: industriDetail?.nip_pembimbing || "",
            jabatan_pembimbing: industriDetail?.jabatan_pembimbing || ""
          };

          console.log(`Payload untuk sertifikat ${item.siswa_username}:`, payload);
          
          const jurusanValue = jurusanKeKode[item.jurusan_nama] || "rpl";
          
          await generateAndDownloadSertifikat(jurusanValue, payload);
          
          successCount++;
          
          if (i < items.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
        } catch (error) {
          console.error(`Gagal generate sertifikat untuk ${item.siswa_username}:`, error);
          failCount++;
        }
      }
      
      let message = `${successCount} berhasil, ${failCount} gagal`;
      if (missingNomorCount > 0) {
        message += `, ${missingNomorCount} menggunakan nomor default (form tanpa nomor)`;
      }
      if (missingJenisNomorCount > 0) {
        message += `, ${missingJenisNomorCount} menggunakan jenis nomor default "NP"`;
      }
      
      if (failCount === 0) {
        toast.success(message, { id: 'bulkGenerate' });
      } else {
        toast.warning(message, { id: 'bulkGenerate' });
      }
      
      setSelectedItems({});
      setOpenBulkExport(false);
      
    } catch (error) {
      console.error("Gagal bulk generate sertifikat:", error);
      toast.error("Gagal memproses bulk generate", { id: 'bulkGenerate' });
    } finally {
      setLoadingCetak(false);
    }
  };

  // Fungsi untuk navigasi ke halaman ubah sertifikat - MODIFIKASI UTAMA
  const handleUbahSertifikat = async (item) => {
    try {
      setLoadingCetak(true);
      setProcessingId(item.application_id);
      
      toast.loading(`Menyiapkan data sertifikat untuk ${item.siswa_username}...`, { id: 'ubahSertifikat' });
      
      // Ambil detail penilaian
      let detailData = rawDetailData;
      if (!detailData || detailData.application_id !== item.application_id) {
        detailData = await getDetailReviewPenilaian(item.application_id);
      }
      
      // Dapatkan tanggal mulai dan selesai dari siswaList
      const { tanggalMulai, tanggalSelesai } = getTanggalDariSiswa(item.application_id);
      
      // Dapatkan detail industri berdasarkan nama
      const industriDetail = getDetailIndustriByNama(item.industri_nama);
      
      console.log("Industri Detail untuk", item.industri_nama, ":", industriDetail);
      
      // Ambil nilai dari items
      const nilai1 = parseFloat(detailData.items?.[0]?.skor) || 0;
      const nilai2 = parseFloat(detailData.items?.[1]?.skor) || 0;
      const nilai3 = parseFloat(detailData.items?.[2]?.skor) || 0;
      const nilai4 = parseFloat(detailData.items?.[3]?.skor) || 0;
      
      // Ambil deskripsi dari items (untuk ditampilkan di form)
      const deskripsi1 = detailData.items?.[0]?.deskripsi || detailData.form_items?.[0]?.tujuan_pembelajaran || "";
      const deskripsi2 = detailData.items?.[1]?.deskripsi || detailData.form_items?.[1]?.tujuan_pembelajaran || "";
      const deskripsi3 = detailData.items?.[2]?.deskripsi || detailData.form_items?.[2]?.tujuan_pembelajaran || "";
      const deskripsi4 = detailData.items?.[3]?.deskripsi || detailData.form_items?.[3]?.tujuan_pembelajaran || "";
      
      // Ambil aspek (tujuan pembelajaran)
      const aspek1 = detailData.form_items?.[0]?.tujuan_pembelajaran || "MENERAPKAN SOFT SKILL YANG DIBUTUHKAN DI DUNIA KERJA (TEMPAT PKL).";
      const aspek2 = detailData.form_items?.[1]?.tujuan_pembelajaran || "MENERAPKAN NORMA, PROSEDUR OPERASIONAL STANDAR (POS), SERTA KESEHATAN, KESELAMATAN KERJA, DAN LINGKUNGAN HIDUP (K3LH) YANG ADA DI DUNIA KERJA (TEMPAT PKL).";
      const aspek3 = detailData.form_items?.[2]?.tujuan_pembelajaran || "MENERAPKAN KOMPETENSI TEKNIS YANG SUDAH DIPELAJARI DI SEKOLAH DAN/ATAU BARU DIPELAJARI DI DUNIA KERJA (TEMPAT PKL).";
      const aspek4 = detailData.form_items?.[3]?.tujuan_pembelajaran || "MEMAHAMI ALUR BISNIS DUNIA KERJA TEMPAT PKL DAN WAWASAN WIRAUSAHA.";
      
      // Hitung rata-rata untuk hasil penilaian
      const average = (nilai1 + nilai2 + nilai3 + nilai4) / 4;
      let hasilPkl = "Belum Dinilai";
      if (average >= 86 && average <= 100) {
        hasilPkl = "Sangat Baik";
      } else if (average >= 75 && average <= 85) {
        hasilPkl = "Baik";
      } else if (average > 0 && average < 75) {
        hasilPkl = "Kurang";
      }
      
      const tanggalTerbit = new Date().toISOString().split('T')[0];
      
      const jurusanValue = jurusanKeKode[item.jurusan_nama] || "rpl";
      
      // Dapatkan nomor sertifikat berdasarkan form ID yang digunakan
      const formId = detailData.form_id;
      let nomorSertifikat = getNomorSertifikatByFormId(formId);
      
      // Jika tidak ditemukan, gunakan default
      if (!nomorSertifikat) {
        nomorSertifikat = "420/1013/101.6.9.19/2026"; // Default fallback
        toast.warning(`Nomor sertifikat untuk form "${detailData.form_nama}" belum diatur. Gunakan default.`, { id: 'ubahSertifikat' });
      }
      
      // Dapatkan jenis nomor dari localStorage berdasarkan industri ID
      const industriId = item.industri_id || industriDetail?.id;
      let jenisNomorPimpinan = getJenisNomorFromLocal(industriId, 'jenis_nomor_pimpinan');
      let jenisNomorPembimbing = getJenisNomorFromLocal(industriId, 'jenis_nomor_pembimbing');
      
      // Jika tidak ditemukan, gunakan default "NP"
      if (!jenisNomorPimpinan) {
        jenisNomorPimpinan = "NP";
      }
      
      if (!jenisNomorPembimbing) {
        jenisNomorPembimbing = "NP";
      }
      
      const sertifikatData = {
        application_id: item.application_id,
        form_id: formId, // Simpan form ID untuk referensi
        nomor_sertifikat: nomorSertifikat,
        siswa: {
          nama: item.siswa_username,
          nisn: item.siswa_nisn,
          jurusan: item.jurusan_nama,
          kelas: item.kelas_nama
        },
        industri: {
          nama: item.industri_nama,
          pic: industriDetail?.pic || "",
          nama_pimpinan: industriDetail?.nama_pimpinan || "",
          jabatan_pimpinan: industriDetail?.jabatan_pimpinan || "",
          nip_pimpinan: industriDetail?.nip_pimpinan || "",
          jabatan_pembimbing: industriDetail?.jabatan_pembimbing || "",
          nip_pembimbing: industriDetail?.nip_pembimbing || ""
        },
        penilaian: {
          items: detailData.items,
          form_items: detailData.form_items,
          total_skor: detailData.total_skor,
          rata_rata: detailData.rata_rata,
          catatan_akhir: detailData.catatan_akhir,
          finalized_at: detailData.finalized_at,
          form_nama: detailData.form_nama
        },
        tanggal: {
          mulai: tanggalMulai,
          selesai: tanggalSelesai,
          terbit: tanggalTerbit
        },
        // DATA NILAI, ASPEK, DAN DESKRIPSI
        nilai: {
          nilai1: nilai1,
          nilai2: nilai2,
          nilai3: nilai3,
          nilai4: nilai4,
          aspek1: aspek1,
          aspek2: aspek2,
          aspek3: aspek3,
          aspek4: aspek4,
          deskripsi1: deskripsi1,
          deskripsi2: deskripsi2,
          deskripsi3: deskripsi3,
          deskripsi4: deskripsi4
        },
        hasil: hasilPkl,
        jurusan_kode: jurusanValue,
        
        // Data pimpinan dan pembimbing dengan jenis nomor
        nama_pimpinan: industriDetail?.nama_pimpinan || "",
        jenis_nomor_pimpinan: jenisNomorPimpinan,
        nip_pimpinan: industriDetail?.nip_pimpinan || "",
        jabatan_pimpinan: industriDetail?.jabatan_pimpinan || "",
        nama_pembimbing: industriDetail?.pic || "",
        jenis_nomor_pembimbing: jenisNomorPembimbing,
        nip_pembimbing: industriDetail?.nip_pembimbing || "",
        jabatan_pembimbing: industriDetail?.jabatan_pembimbing || ""
      };
      
      // Simpan ke localStorage
      localStorage.setItem('sertifikat_data_lengkap', JSON.stringify(sertifikatData));
      localStorage.setItem('sertifikat_application_id', item.application_id);
      
      toast.success(`Data sertifikat ${item.siswa_username} siap diubah!`, { id: 'ubahSertifikat' });
      
      // Navigasi ke halaman ubah sertifikat dengan parameter application_id
      navigate(`/guru/koordinator/sertifikat?application_id=${item.application_id}`);
      
    } catch (error) {
      console.error("Gagal menyiapkan data sertifikat:", error);
      toast.error(`Gagal menyiapkan data sertifikat: ${error.message || "Terjadi kesalahan"}`, { id: 'ubahSertifikat' });
      setLoadingCetak(false);
      setProcessingId(null);
    }
  };

  // Fungsi untuk mendapatkan tanggal dari siswaList berdasarkan application_id
  const getTanggalDariSiswa = (applicationId) => {
    const siswa = siswaList.find(s => s.application_id === parseInt(applicationId));
    return {
      tanggalMulai: siswa?.tanggal_mulai || "",
      tanggalSelesai: siswa?.tanggal_selesai || ""
    };
  };

  // Fungsi untuk mendapatkan data izin siswa berdasarkan siswa_id
  const getIzinDataBySiswaId = (siswaId) => {
    return izinDataMap[siswaId] || { sakit: 0, izin: 0, alpa: 0 };
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectAllInGroup = (groupName, items) => {
    const allSelected = items.every(item => selectedItems[item.application_id]);
    const newSelected = { ...selectedItems };
    
    items.forEach(item => {
      if (allSelected) {
        delete newSelected[item.application_id];
      } else {
        newSelected[item.application_id] = true;
      }
    });
    
    setSelectedItems(newSelected);
  };

  const getSelectedCount = () => {
    return Object.keys(selectedItems).length;
  };

  const toggleGroup = (groupName, isKelas = false) => {
    const key = isKelas ? `kelas_${groupName}` : groupName;
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.split(" ");
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const getColorFromName = (name) => {
    if (!name) return "bg-gray-500";
    
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", 
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
      "bg-orange-500", "bg-cyan-500", "bg-emerald-500", "bg-violet-500"
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash |= 0;
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const fetchReviewPenilaian = async () => {
    setLoading(true);
    try {
      const response = await getReviewPenilaian({
        page: currentPage,
        limit: itemsPerPage,
        search: search || undefined,
      });
      
      console.log("Review penilaian response:", response);
      
      const students = response?.data || [];
      setDataPenilaian(students);
      setTotalData(response?.total || students.length);
      
      setSelectedItems({});
      
      const siswaIds = students.map(item => item.siswa_id).filter(id => id !== null && id !== undefined);
      
      if (siswaIds.length > 0) {
        console.log("Mengambil data izin untuk siswa IDs:", siswaIds);
        await fetchAllIzinData(siswaIds);
      }
      
      const industriNames = students.map(item => item.industri_nama).filter(nama => nama !== null && nama !== undefined);
      
      if (industriNames.length > 0 && industriList.length > 0) {
        console.log("Mengambil detail industri untuk:", industriNames);
        await fetchAllIndustriDetails(industriNames);
      }
      
    } catch (error) {
      console.error("Gagal fetch review penilaian:", error);
      toast.error("Gagal memuat data penilaian");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiswaApproved();
    fetchIndustri();
    fetchForms(); // Panggil fungsi untuk mengambil data form
  }, []);

  useEffect(() => {
    fetchReviewPenilaian();
  }, [currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchReviewPenilaian();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const getDetailFields = () => {
    if (!detailPenilaian) return [];
    
    return Object.keys(detailPenilaian).map(key => ({
      name: key,
      label: key,
      type: key.includes("Deskripsi") || key.includes("Tujuan") || key.includes("Catatan") ? "textarea" : "text",
      half: key.includes("Catatan") || key.includes("Form") || key.includes("Industri") || key.includes("Tujuan") || key.includes("Predikat"),
    }));
  };

  const exportData = async (items) => {
    const siswaIds = items
      .map(item => item.siswa_id)
      .filter(id => id !== null && id !== undefined);
    
    const missingSiswaIds = siswaIds.filter(id => !izinDataMap[id]);
    if (missingSiswaIds.length > 0) {
      console.log("Mengambil data izin untuk siswa yang belum ada:", missingSiswaIds);
      await fetchAllIzinData(missingSiswaIds);
    }
    
    const exportItems = items.map((item, index) => {
      const izinData = getIzinDataBySiswaId(item.siswa_id);
      const predikat = getPredikat(item.rata_rata);
      const alpa = 0;
      
      return {
        No: index + 1,
        "Nama Siswa": item.siswa_username || "-",
        "NISN": item.siswa_nisn || "-",
        "Kelas": item.kelas_nama || "-",
        "Jurusan": item.jurusan_nama || "-",
        "Industri": item.industri_nama || "-",
        "Sakit": izinData.sakit || 0,
        "Izin": izinData.izin || 0,
        "Alpa": alpa,
        "Total Skor": item.total_skor || "-",
        "Rata-rata": item.rata_rata || "-",
        "Predikat": predikat,
        "Tanggal Finalisasi": formatTanggalPendek(item.finalized_at) || "-",
      };
    });
    
    return exportItems;
  };

  const handleExportExcel = async (items, filename = "review_penilaian_pkl") => {
    if (!items.length) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    
    toast.loading("Menyiapkan data untuk export Excel...", { id: 'exportExcel' });
    
    try {
      const data = await exportData(items);
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Review Penilaian PKL");
      XLSX.writeFile(wb, `${filename}.xlsx`);
      toast.success("Excel berhasil diekspor", { id: 'exportExcel' });
    } catch (error) {
      console.error("Gagal export Excel:", error);
      toast.error("Gagal mengekspor Excel", { id: 'exportExcel' });
    }
  };

  const handleExportPDF = async (items, filename = "review_penilaian_pkl") => {
    if (!items.length) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    
    toast.loading("Menyiapkan data untuk export PDF...", { id: 'exportPDF' });
    
    try {
      const data = await exportData(items);
      
      const doc = new jsPDF({
        orientation: 'landscape'
      });
      
      doc.text("Review Penilaian PKL", 14, 15);

      const headers = Object.keys(data[0]);
      
      autoTable(doc, {
        startY: 20,
        head: [headers],
        body: data.map((item) => Object.values(item)),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [100, 30, 33] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20 },
          3: { cellWidth: 15 },
          4: { cellWidth: 20 },
          5: { cellWidth: 30 },
          6: { cellWidth: 10 },
          7: { cellWidth: 10 },
          8: { cellWidth: 10 },
          9: { cellWidth: 15 },
          10: { cellWidth: 15 },
          11: { cellWidth: 20 },
          12: { cellWidth: 20 },
        }
      });

      doc.save(`${filename}.pdf`);
      toast.success("PDF berhasil diekspor", { id: 'exportPDF' });
    } catch (error) {
      console.error("Gagal export PDF:", error);
      toast.error("Gagal mengekspor PDF", { id: 'exportPDF' });
    }
  };

  const handleBulkExport = async (format) => {
    const selectedIds = Object.keys(selectedItems);
    if (selectedIds.length === 0) {
      toast.error("Pilih minimal satu data untuk diekspor");
      return;
    }
    
    const selectedData = dataPenilaian.filter(item => selectedIds.includes(item.application_id.toString()));
    
    if (format === 'excel') {
      await handleExportExcel(selectedData, `review_penilaian_terpilih_${dayjs().format('YYYYMMDD_HHmmss')}`);
    } else {
      await handleExportPDF(selectedData, `review_penilaian_terpilih_${dayjs().format('YYYYMMDD_HHmmss')}`);
    }
    
    setOpenBulkExport(false);
  };

  const renderGroupedView = (groupData, groupType) => {
    const isKelas = groupType === 'kelas';
    
    return (
      <div className="mt-6 space-y-4">
        {Object.entries(groupData).map(([groupName, items]) => {
          const isExpanded = expandedGroups[isKelas ? `kelas_${groupName}` : groupName];
          const allSelected = items.every(item => selectedItems[item.application_id]);
          
          return (
            <div key={groupName} className="bg-white rounded-xl overflow-hidden">
              <div 
                className="bg-gray-50 p-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-100"
                onClick={() => toggleGroup(groupName, isKelas)}
              >
                <div className="flex items-center gap-3">
                  {isKelas ? (
                    <GraduationCap size={20} className="text-[#641E21]" />
                  ) : (
                    <Building2 size={20} className="text-[#641E21]" />
                  )}
                  <h3 className="font-bold text-[#641E21]">{groupName}</h3>
                  <span className="text-sm bg-[#641E21]/10 text-[#641E21] px-2 py-0.5 rounded-full">
                    {items.length} siswa
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAllInGroup(groupName, items);
                    }}
                    className="text-sm !bg-transparent !text-[#641E21] hover:underline"
                  >
                    {allSelected ? "Batalkan" : "Pilih Semua"}
                  </button>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map(item => {
                      const izinData = getIzinDataBySiswaId(item.siswa_id);
                      const predikat = getPredikat(item.rata_rata);
                      const predikatColor = getPredikatColor(predikat);
                      
                      return (
                        <div 
                          key={item.application_id}
                          className="flex items-start gap-3 p-3 border rounded-lg hover:shadow-sm transition-all relative group"
                        >
                          <input
                            type="checkbox"
                            checked={!!selectedItems[item.application_id]}
                            onChange={() => handleSelectItem(item.application_id)}
                            className="mt-1 w-4 h-4 rounded border-gray-300 text-[#641E21] focus:ring-[#641E21] flex-shrink-0"
                          />
                          
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => handleCardClick(item)}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full ${getColorFromName(item.siswa_username)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                                {getInitials(item.siswa_username)}
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-medium text-sm truncate">{item.siswa_username}</h5>
                                <p className="text-xs text-gray-500 truncate">NISN: {item.siswa_nisn}</p>
                              </div>
                            </div>
                            
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                <span className="text-xs font-medium">{item.total_skor}</span>
                              </div>
                              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                {item.rata_rata}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded border ${predikatColor} flex items-center gap-0.5`}>
                                <Award size={10} />
                                {predikat}
                              </span>
                              {!isKelas && (
                                <span className="text-xs text-gray-500 truncate max-w-[100px]">
                                  {item.kelas_nama}
                                </span>
                              )}
                              <div className="flex items-center gap-1 text-xs">
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                                  S: {izinData.sakit}
                                </span>
                                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                                  I: {izinData.izin}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCetakSertifikat(item);
                              }}
                              disabled={loadingCetak && processingId === item.application_id}
                              className="opacity-0 group-hover:opacity-100 transition-opacity !bg-orange-500 text-white p-2 rounded-lg hover:!bg-orange-600 disabled:opacity-50 flex-shrink-0"
                              title="Cetak Sertifikat"
                            >
                              <Printer size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUbahSertifikat(item);
                              }}
                              disabled={loadingCetak && processingId === item.application_id}
                              className="opacity-0 group-hover:opacity-100 transition-opacity !bg-blue-500 text-white p-2 rounded-lg hover:!bg-blue-600 disabled:opacity-50 flex-shrink-0"
                              title="Ubah Sertifikat"
                            >
                              <Edit size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (mode === "detail" && selectedItem && detailPenilaian) {
    return (
      <Detail
        title="Detail Ulasan Penilaian PKL"
        fields={getDetailFields()}
        initialData={detailPenilaian}
        onClose={() => handleModeChange("list")}
        mode="view"
      />
    );
  }

  const selectedCount = getSelectedCount();

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar active={active} setActive={setActive} />
    
      <div className="flex flex-col flex-1">
        <Header user={user} />
    
        <main className="flex-1 p-6 bg-[#641E21] rounded-tl-3xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">
              Ulasan Penilaian PKL
            </h2>
            
            <div className="flex items-center gap-2">
              <div className="flex bg-white/10 rounded-lg p-1 mr-2">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === "list" 
                      ? "!bg-white !text-[#641E21]" 
                      : "!text-white !bg-transparent hover:bg-white/20"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setViewMode("industri")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    viewMode === "industri" 
                      ? "!bg-white !text-[#641E21]" 
                      : "!text-white !bg-transparent hover:bg-white/20"
                  }`}
                >
                  <Building2 size={16} />
                  Industri
                </button>
                <button
                  onClick={() => setViewMode("kelas")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    viewMode === "kelas" 
                      ? "!bg-white !text-[#641E21]" 
                      : "!text-white !bg-transparent hover:bg-white/20"
                  }`}
                >
                  <GraduationCap size={16} />
                  Kelas
                </button>
              </div>

              {selectedCount > 0 && (
                <div className="relative mr-2">
                  <button
                    onClick={() => setOpenBulkExport(!openBulkExport)}
                    className="!bg-orange-500 flex items-center gap-2 px-4 py-2 text-white hover:!bg-orange-600 rounded-lg"
                  >
                    <FileDown size={18} />
                    <span>Aksi ({selectedCount})</span>
                  </button>

                  {openBulkExport && (
                    <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-md p-2 z-50 min-w-[200px]">
                      <button
                        onClick={() => handleBulkExport('excel')}
                        className="!bg-transparent flex items-center gap-2 px-3 py-2 hover:!bg-gray-100 text-sm w-full rounded"
                      >
                        <FileSpreadsheet size={16} className="text-green-600" />
                        Export Excel Terpilih
                      </button>
                      <button
                        onClick={() => handleBulkExport('pdf')}
                        className="!bg-transparent flex items-center gap-2 px-3 py-2 hover:!bg-gray-100 text-sm w-full rounded"
                      >
                        <FileText size={16} className="text-red-600" />
                        Export PDF Terpilih
                      </button>
                      <button
                        onClick={() => handleBulkGenerateSertifikat(dataPenilaian.filter(item => selectedItems[item.application_id]))}
                        disabled={loadingCetak}
                        className="!bg-transparent flex items-center gap-2 px-3 py-2 hover:!bg-gray-100 text-sm w-full rounded disabled:opacity-50"
                      >
                        <Printer size={16} className="text-orange-600" />
                        {loadingCetak ? 'Memproses...' : `Cetak Sertifikat (${selectedCount})`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="relative" ref={exportRef}>
                <button
                  onClick={() => setOpenExport(!openExport)}
                  className="!bg-transparent flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 rounded-full"
                  title="Ekspor Semua Data"
                >
                  <Download size={18} />
                </button>

                {openExport && (
                  <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-md p-2 z-50 min-w-[120px]">
                    <button
                      onClick={async () => {
                        await handleExportExcel(dataPenilaian);
                        setOpenExport(false);
                      }}
                      className="!bg-transparent flex items-center gap-2 px-3 py-2 hover:!bg-gray-100 text-sm w-full rounded"
                    >
                      <FileSpreadsheet size={16} className="text-green-600" />
                      Excel (Semua)
                    </button>
                    <button
                      onClick={async () => {
                        await handleExportPDF(dataPenilaian);
                        setOpenExport(false);
                      }}
                      className="!bg-transparent flex items-center gap-2 px-3 py-2 hover:!bg-gray-100 text-sm w-full rounded"
                    >
                      <FileText size={16} className="text-red-600" />
                      PDF (Semua)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <SearchBar
            query={search}
            setQuery={setSearch}
            placeholder="Cari nama siswa / nisn / kelas / industri..."
          />

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
              <p className="text-white mt-2">Memuat data...</p>
            </div>
          ) : dataPenilaian.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center mt-6">
              <p className="text-gray-500">Tidak ada data penilaian yang sudah difinalisasi</p>
            </div>
          ) : (
            <>
              {viewMode === "list" ? (
                <>
                  <div className="mt-6 space-y-3">
                    {dataPenilaian.map(item => {
                      const izinData = getIzinDataBySiswaId(item.siswa_id);
                      const predikat = getPredikat(item.rata_rata);
                      const predikatColor = getPredikatColor(predikat);
                      
                      return (
                        <div 
                          key={item.application_id}
                          className="bg-white rounded-xl p-4 hover:shadow-md transition-all border-l-4 border-green-500 relative"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={!!selectedItems[item.application_id]}
                              onChange={() => handleSelectItem(item.application_id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded border-gray-300 text-[#641E21] focus:ring-[#641E21]"
                            />
                          </div>
                          
                          <div 
                            className="flex items-start gap-4 pl-8 cursor-pointer"
                            onClick={() => handleCardClick(item)}
                          >
                            <div className={`w-12 h-12 rounded-full ${getColorFromName(item.siswa_username)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                              {getInitials(item.siswa_username)}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-sm">{item.siswa_username}</h3>
                                <span className="text-xs text-gray-500">
                                  - {item.kelas_nama}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                                  NISN: {item.siswa_nisn}
                                </span>
                                <p className="text-sm text-gray-600 truncate flex items-center gap-1">
                                  <Building2 size={14} className="text-gray-400" />
                                  {item.industri_nama}
                                </p>
                              </div>

                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1">
                                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                  <span className="text-sm font-semibold text-gray-700">
                                    Total: {item.total_skor}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    Rata: {item.rata_rata}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full border ${predikatColor} flex items-center gap-1`}>
                                    <Award size={12} />
                                    {predikat}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle size={14} className="text-green-500" />
                                  <span className="text-xs text-gray-500">
                                    {formatTanggalPendek(item.finalized_at)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                                    S: {izinData.sakit}
                                  </span>
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                                    I: {izinData.izin}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div 
                              className="self-center flex gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => handleUbahSertifikat(item)}
                                disabled={loadingCetak && processingId === item.application_id}
                                className="px-4 py-2 text-sm rounded !bg-blue-500 text-white hover:!bg-blue-600 flex items-center gap-1 disabled:opacity-50"
                                title="Ubah Sertifikat"
                              >
                                <Edit size={16} />
                                <span className="hidden md:inline">
                                  {loadingCetak && processingId === item.application_id ? "Memuat..." : "Ubah"}
                                </span>
                              </button>
                              <button
                                onClick={() => handleCetakSertifikat(item)}
                                disabled={loadingCetak && processingId === item.application_id}
                                className="px-4 py-2 text-sm rounded !bg-orange-500 text-white hover:!bg-orange-600 flex items-center gap-1 disabled:opacity-50"
                                title="Cetak Sertifikat"
                              >
                                <Printer size={16} />
                                <span className="hidden md:inline">
                                  {loadingCetak && processingId === item.application_id ? "Memuat..." : "Cetak"}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalData > itemsPerPage && (
                    <div className="mt-6 text-white flex justify-between items-center">
                      <span>
                        Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalData)} dari {totalData} data
                      </span>
                      <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(totalData / itemsPerPage)}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  )}
                </>
              ) : viewMode === "industri" ? (
                renderGroupedView(groupedByIndustri, 'industri')
              ) : (
                renderGroupedView(groupedByKelas, 'kelas')
              )}
            </>
          )}
        </main>
      </div>

      {loadingDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#641E21] border-t-transparent mb-4"></div>
            <p className="text-gray-600">Memuat detail penilaian...</p>
          </div>
        </div>
      )}
    </div>
  );
}