import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileSpreadsheet, FileText, Star, Printer, CheckCircle, Building2, Users, ChevronDown, ChevronUp, FileDown, GraduationCap, Edit } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { useNavigate, useLocation } from 'react-router-dom';

import { getReviewPenilaian, getDetailReviewPenilaian } from "../utils/services/koordinator/penilaian";
import { getApprovedPKL } from "../utils/services/koordinator/pengajuan";
import { getIndustri } from "../utils/services/admin/get_industri";
import { generateAndDownloadSertifikat } from "../utils/lettersApi";
import { getSummaryIzinSiswa } from "../utils/services/pembimbing/izin"; // Import service izin

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

  const [dataPenilaian, setDataPenilaian] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [industriList, setIndustriList] = useState([]);
  const [groupedByIndustri, setGroupedByIndustri] = useState({});
  const [groupedByKelas, setGroupedByKelas] = useState({});
  const [totalData, setTotalData] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailPenilaian, setDetailPenilaian] = useState(null);
  const [rawDetailData, setRawDetailData] = useState(null);
  
  // State untuk menyimpan data izin siswa
  const [izinDataMap, setIzinDataMap] = useState({});
  
  const [mode, setMode] = useState("list"); // list | detail
  const [viewMode, setViewMode] = useState("list"); // list | industri | kelas
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
      return "Baik";
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
      // Group by Industri
      const industriGroups = {};
      dataPenilaian.forEach(item => {
        const industri = item.industri_nama || "Industri Lainnya";
        if (!industriGroups[industri]) {
          industriGroups[industri] = [];
        }
        industriGroups[industri].push(item);
      });
      setGroupedByIndustri(industriGroups);

      // Group by Kelas
      const kelasGroups = {};
      dataPenilaian.forEach(item => {
        const kelas = item.kelas_nama || "Kelas Lainnya";
        if (!kelasGroups[kelas]) {
          kelasGroups[kelas] = [];
        }
        kelasGroups[kelas].push(item);
      });
      setGroupedByKelas(kelasGroups);
      
      // Initialize expanded state for all groups
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
          return { siswa_id: siswaId, data: { sakit: 0, izin: 0 } };
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

  // Fungsi untuk mendapatkan data PIC (pimpinan) dari industri berdasarkan nama industri
  const getPICByIndustriName = (industriNama) => {
    if (!industriNama || industriList.length === 0) return "";
    
    // Cari industri yang namanya match (case insensitive)
    const industri = industriList.find(item => 
      item.nama.toLowerCase() === industriNama.toLowerCase() ||
      item.nama.toLowerCase().includes(industriNama.toLowerCase()) ||
      industriNama.toLowerCase().includes(item.nama.toLowerCase())
    );
    
    return industri?.pic || "";
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
    return izinDataMap[siswaId] || { sakit: 0, izin: 0 };
  };

  // Fungsi untuk generate sertifikat single (LANGSUNG DOWNLOAD, TIDAK NAVIGASI)
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
      
      // Dapatkan nama PIC (pimpinan) dari industri
      const namaPimpinan = getPICByIndustriName(item.industri_nama);
      
      // Dapatkan kode jurusan
      const jurusanValue = jurusanKeKode[item.jurusan_nama] || "rpl";
      
      // Ambil nilai dari items
      const nilai1 = parseFloat(detailData.items?.[0]?.skor) || 0;
      const nilai2 = parseFloat(detailData.items?.[1]?.skor) || 0;
      const nilai3 = parseFloat(detailData.items?.[2]?.skor) || 0;
      const nilai4 = parseFloat(detailData.items?.[3]?.skor) || 0;
      
      // Hitung hasil penilaian
      const hasilPenilaian = hitungHasilPenilaian(nilai1, nilai2, nilai3, nilai4);
      
      // Format tanggal
      const tanggalMulaiFormatted = formatTanggalIndonesia(tanggalMulai);
      const tanggalSelesaiFormatted = formatTanggalIndonesia(tanggalSelesai);
      const tanggalTerbit = formatTanggalIndonesia(new Date().toISOString().split('T')[0]);
      
      // Format payload sesuai dengan struktur yang diharapkan lettersApi
      const payload = {
        nomor_sertifikat: `420/1013/101.6.9.19/${new Date().getFullYear()}`,
        siswa: {
          nama: item.siswa_username,
          nisn: item.siswa_nisn
        },
        nama_industri: item.industri_nama || "Industri",
        tanggal_mulai: tanggalMulaiFormatted,
        tanggal_selesai: tanggalSelesaiFormatted,
        hasil_pkl: hasilPenilaian,
        tanggal_terbit: tanggalTerbit,
        nama_pimpinan: namaPimpinan,
        nilai: {
          aspek_1: nilai1,
          desc_1: detailData.form_items?.[0]?.tujuan_pembelajaran || "MENERAPKAN SOFT SKILL YANG DIBUTUHKAN DI DUNIA KERJA (TEMPAT PKL).",
          aspek_2: nilai2,
          desc_2: detailData.form_items?.[1]?.tujuan_pembelajaran || "MENERAPKAN NORMA, PROSEDUR OPERASIONAL STANDAR (POS), SERTA KESEHATAN, KESELAMATAN KERJA, DAN LINGKUNGAN HIDUP (K3LH) YANG ADA DI DUNIA KERJA (TEMPAT PKL).",
          aspek_3: nilai3,
          desc_3: detailData.form_items?.[2]?.tujuan_pembelajaran || "MENERAPKAN KOMPETENSI TEKNIS YANG SUDAH DIPELAJARI DI SEKOLAH DAN/ATAU BARU DIPELAJARI DI DUNIA KERJA (TEMPAT PKL).",
          aspek_4: nilai4,
          desc_4: detailData.form_items?.[3]?.tujuan_pembelajaran || "MEMAHAMI ALUR BISNIS DUNIA KERJA TEMPAT PKL DAN WAWASAN WIRAUSAHA."
        }
      };

      console.log("Payload untuk sertifikat single:", payload);
      
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

  // Fungsi untuk navigasi ke halaman ubah sertifikat
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
      
      // Dapatkan nama PIC (pimpinan) dari industri
      const namaPimpinan = getPICByIndustriName(item.industri_nama);
      
      // Dapatkan kode jurusan
      const jurusanValue = jurusanKeKode[item.jurusan_nama] || "rpl";
      
      // Ambil nilai dari items
      const nilai1 = parseFloat(detailData.items?.[0]?.skor) || 0;
      const nilai2 = parseFloat(detailData.items?.[1]?.skor) || 0;
      const nilai3 = parseFloat(detailData.items?.[2]?.skor) || 0;
      const nilai4 = parseFloat(detailData.items?.[3]?.skor) || 0;
      
      // Hitung hasil penilaian
      const hasilPenilaian = hitungHasilPenilaian(nilai1, nilai2, nilai3, nilai4);
      
      // Format tanggal terbit (hari ini)
      const tanggalTerbit = new Date().toISOString().split('T')[0];
      
      // Format tanggal untuk ditampilkan di form
      const tanggalMulaiFormatted = tanggalMulai;
      const tanggalSelesaiFormatted = tanggalSelesai;
      
      // Buat objek data sertifikat lengkap
      const sertifikatData = {
        application_id: item.application_id,
        siswa: {
          nama: item.siswa_username,
          nisn: item.siswa_nisn,
          jurusan: item.jurusan_nama,
          kelas: item.kelas_nama
        },
        industri: {
          nama: item.industri_nama,
          pic: namaPimpinan
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
          mulai: tanggalMulaiFormatted,
          selesai: tanggalSelesaiFormatted,
          terbit: tanggalTerbit
        },
        hasil: hasilPenilaian,
        jurusan_kode: jurusanValue
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

  // Fungsi untuk bulk generate sertifikat
  const handleBulkGenerateSertifikat = async (items) => {
    if (items.length === 0) {
      toast.error("Pilih minimal satu siswa");
      return;
    }

    try {
      setLoadingCetak(true);
      toast.loading(`Menyiapkan ${items.length} sertifikat...`, { id: 'bulkGenerate' });

      // Proses setiap item secara berurutan agar tidak overload
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        try {
          // Update toast progress
          toast.loading(`Memproses ${i+1} dari ${items.length} sertifikat...`, { id: 'bulkGenerate' });
          
          // Ambil detail penilaian
          const detailData = await getDetailReviewPenilaian(item.application_id);
          
          // Dapatkan tanggal mulai dan selesai dari siswaList
          const { tanggalMulai, tanggalSelesai } = getTanggalDariSiswa(item.application_id);
          
          // Dapatkan nama PIC (pimpinan) dari industri
          const namaPimpinan = getPICByIndustriName(item.industri_nama);
          
          // Dapatkan kode jurusan
          const jurusanValue = jurusanKeKode[item.jurusan_nama] || "rpl";
          
          // Ambil nilai dari items
          const nilai1 = parseFloat(detailData.items?.[0]?.skor) || 0;
          const nilai2 = parseFloat(detailData.items?.[1]?.skor) || 0;
          const nilai3 = parseFloat(detailData.items?.[2]?.skor) || 0;
          const nilai4 = parseFloat(detailData.items?.[3]?.skor) || 0;
          
          // Hitung hasil penilaian
          const hasilPenilaian = hitungHasilPenilaian(nilai1, nilai2, nilai3, nilai4);
          
          // Format tanggal
          const tanggalMulaiFormatted = formatTanggalIndonesia(tanggalMulai);
          const tanggalSelesaiFormatted = formatTanggalIndonesia(tanggalSelesai);
          const tanggalTerbit = formatTanggalIndonesia(new Date().toISOString().split('T')[0]);
          
          // Format payload
          const payload = {
            nomor_sertifikat: `420/1013/101.6.9.19/${new Date().getFullYear()}`,
            siswa: {
              nama: item.siswa_username,
              nisn: item.siswa_nisn
            },
            nama_industri: item.industri_nama || "Industri",
            tanggal_mulai: tanggalMulaiFormatted,
            tanggal_selesai: tanggalSelesaiFormatted,
            hasil_pkl: hasilPenilaian,
            tanggal_terbit: tanggalTerbit,
            nama_pimpinan: namaPimpinan,
            nilai: {
              aspek_1: nilai1,
              desc_1: detailData.form_items?.[0]?.tujuan_pembelajaran || "MENERAPKAN SOFT SKILL YANG DIBUTUHKAN DI DUNIA KERJA (TEMPAT PKL).",
              aspek_2: nilai2,
              desc_2: detailData.form_items?.[1]?.tujuan_pembelajaran || "MENERAPKAN NORMA, PROSEDUR OPERASIONAL STANDAR (POS), SERTA KESEHATAN, KESELAMATAN KERJA, DAN LINGKUNGAN HIDUP (K3LH) YANG ADA DI DUNIA KERJA (TEMPAT PKL).",
              aspek_3: nilai3,
              desc_3: detailData.form_items?.[2]?.tujuan_pembelajaran || "MENERAPKAN KOMPETENSI TEKNIS YANG SUDAH DIPELAJARI DI SEKOLAH DAN/ATAU BARU DIPELAJARI DI DUNIA KERJA (TEMPAT PKL).",
              aspek_4: nilai4,
              desc_4: detailData.form_items?.[3]?.tujuan_pembelajaran || "MEMAHAMI ALUR BISNIS DUNIA KERJA TEMPAT PKL DAN WAWASAN WIRAUSAHA."
            }
          };

          // Generate dan download langsung
          await generateAndDownloadSertifikat(jurusanValue, payload);
          
          successCount++;
          
          // Beri jeda kecil antara download agar browser tidak kewalahan
          if (i < items.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
        } catch (error) {
          console.error(`Gagal generate sertifikat untuk ${item.siswa_username}:`, error);
          failCount++;
        }
      }
      
      // Tampilkan hasil akhir
      if (failCount === 0) {
        toast.success(`Berhasil mengenerate ${successCount} sertifikat!`, { id: 'bulkGenerate' });
      } else {
        toast.success(`${successCount} berhasil, ${failCount} gagal`, { id: 'bulkGenerate' });
      }
      
      // Reset pilihan setelah selesai
      setSelectedItems({});
      setOpenBulkExport(false);
      
    } catch (error) {
      console.error("Gagal bulk generate sertifikat:", error);
      toast.error("Gagal memproses bulk generate", { id: 'bulkGenerate' });
    } finally {
      setLoadingCetak(false);
    }
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
      
      // Reset selected items when data changes
      setSelectedItems({});
      
      // Ambil data izin untuk semua siswa langsung dari response
      const siswaIds = students.map(item => item.siswa_id).filter(id => id !== null && id !== undefined);
      
      if (siswaIds.length > 0) {
        console.log("Mengambil data izin untuk siswa IDs:", siswaIds);
        await fetchAllIzinData(siswaIds);
      }
      
    } catch (error) {
      console.error("Gagal fetch review penilaian:", error);
      toast.error("Gagal memuat data penilaian");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data siswa approved dan data industri saat komponen dimuat
  useEffect(() => {
    fetchSiswaApproved();
    fetchIndustri();
  }, []);

  useEffect(() => {
    fetchReviewPenilaian();
  }, [currentPage]);

  // Debounce search
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

  // Fields untuk komponen Detail
  const getDetailFields = () => {
    if (!detailPenilaian) return [];
    
    return Object.keys(detailPenilaian).map(key => ({
      name: key,
      label: key,
      type: key.includes("Deskripsi") || key.includes("Tujuan") || key.includes("Catatan") ? "textarea" : "text",
      half: key.includes("Catatan") || key.includes("Form") || key.includes("Industri") || key.includes("Tujuan"),
    }));
  };

  // Fungsi untuk mendapatkan data ekspor dengan kolom izin
  const exportData = async (items) => {
    // Kumpulkan semua siswa_id langsung dari items
    const siswaIds = items
      .map(item => item.siswa_id)
      .filter(id => id !== null && id !== undefined);
    
    // Ambil data izin jika belum ada di izinDataMap
    const missingSiswaIds = siswaIds.filter(id => !izinDataMap[id]);
    if (missingSiswaIds.length > 0) {
      console.log("Mengambil data izin untuk siswa yang belum ada:", missingSiswaIds);
      await fetchAllIzinData(missingSiswaIds);
    }
    
    // Buat data untuk diekspor
    const exportItems = items.map((item, index) => {
      const izinData = getIzinDataBySiswaId(item.siswa_id);
      
      // Hitung alpa (misalnya 0 karena tidak ada data alpa dari API)
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

      // Definisikan kolom untuk PDF
      const headers = Object.keys(data[0]);
      
      autoTable(doc, {
        startY: 20,
        head: [headers],
        body: data.map((item) => Object.values(item)),
        styles: { fontSize: 7 }, // Ukuran font lebih kecil karena ada kolom baru
        headStyles: { fillColor: [100, 30, 33] },
        columnStyles: {
          0: { cellWidth: 10 }, // No
          1: { cellWidth: 30 }, // Nama Siswa
          2: { cellWidth: 20 }, // NISN
          3: { cellWidth: 15 }, // Kelas
          4: { cellWidth: 20 }, // Jurusan
          5: { cellWidth: 30 }, // Industri
          6: { cellWidth: 10 }, // Sakit
          7: { cellWidth: 10 }, // Izin
          8: { cellWidth: 10 }, // Alpa
          9: { cellWidth: 15 }, // Total Skor
          10: { cellWidth: 15 }, // Rata-rata
          11: { cellWidth: 20 }, // Tanggal Finalisasi
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
              {/* Group Header */}
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

              {/* Students List */}
              {isExpanded && (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map(item => {
                      const izinData = getIzinDataBySiswaId(item.siswa_id);
                      
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
                              {!isKelas && (
                                <span className="text-xs text-gray-500 truncate max-w-[100px]">
                                  {item.kelas_nama}
                                </span>
                              )}
                              {/* Tampilkan data izin */}
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

  // Mode Detail menggunakan komponen Detail yang sudah ada
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
              {/* Tab View Mode */}
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

              {/* Bulk Actions */}
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
                /* List View */
                <>
                  <div className="mt-6 space-y-3">
                    {dataPenilaian.map(item => {
                      const izinData = getIzinDataBySiswaId(item.siswa_id);
                      
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
                                    Rata-rata: {item.rata_rata}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle size={14} className="text-green-500" />
                                  <span className="text-xs text-gray-500">
                                    {formatTanggalPendek(item.finalized_at)}
                                  </span>
                                </div>
                                {/* Tampilkan data izin */}
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
                /* Group by Industry View */
                renderGroupedView(groupedByIndustri, 'industri')
              ) : (
                /* Group by Class View */
                renderGroupedView(groupedByKelas, 'kelas')
              )}
            </>
          )}
        </main>
      </div>

      {/* Loading Modal untuk Detail */}
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