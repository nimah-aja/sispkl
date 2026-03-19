import React, { useState, useEffect } from 'react';
import { Save, Download, Upload, X, Search } from 'lucide-react';
import toast from "react-hot-toast";
import { useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import logoSmk from "../assets/LOGOPROV.png";

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";

// Import utils untuk generate PDF
import { generateAndDownloadFormPenilaian } from "../utils/lettersApi";
// Import utils untuk get guru
import { getGuru, fetchGuruById } from "../utils/services/admin/get_guru";
// Import utils untuk get industri
import { getIndustri, getIndustriById } from "../utils/services/admin/get_industri";

// Set locale ke Indonesia
dayjs.locale('id');

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

export default function Penilaian() {
  const location = useLocation();
  const [active, setActive] = useState("penilaian");
  const [guruList, setGuruList] = useState([]);
  const [industriList, setIndustriList] = useState([]);
  const [selectedIndustriId, setSelectedIndustriId] = useState(null);
  const [loadingGuru, setLoadingGuru] = useState(false);
  const [loadingIndustri, setLoadingIndustri] = useState(false);
  const [showIndustriSearch, setShowIndustriSearch] = useState(false);
  const [industriSearchQuery, setIndustriSearchQuery] = useState("");
  
  // Ambil data guru dari localStorage
  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Pembimbing",
    kode_guru: localStorage.getItem("kode_guru") // Ambil kode_guru dari localStorage
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

  const [logo, setLogo] = useState({
    file: null,
    preview: localStorage.getItem('penilaian_logo_preview') || logoSmk,
    type: 'default'
  });

  const [showLogoModal, setShowLogoModal] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const [siswa, setSiswa] = useState({
    nama: "",
    nisn: "",
    kelas: "",
    konsentrasi_keahlian: "",
    tempat_pkl: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
    tanggal_mulai_preview: "",
    tanggal_selesai_preview: "",
    nama_instruktur: "",
    jabatan_instruktur: "",
    nip_instruktur: "",
    jenis_nomor_instruktur: "", // TAMBAHKAN
    nama_pembimbing: "",
    jabatan_pembimbing: "",
    nip_pembimbing: ""
  });

  // Tujuan pembelajaran default untuk 4 aspek (jika data dari API kurang)
  const defaultTujuanPembelajaran = [
    "Menerapkan Soft skills yang dibutuhkan dalam dunia kerja (tempat PKL).",
    "Menerapkan norma, POS, dan K3LH yang ada pada dunia kerja (tempat PKL).",
    "Menerapkan kompetensi teknis yang sudah dipelajari di sekolah dan/atau baru dipelajari pada dunia kerja (tempat PKL).",
    "Memahami alur bisnis dunia kerja tempat PKL dan wawasan wirausaha."
  ];

  // State untuk tujuan pembelajaran (gabungan dari API + default)
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState(defaultTujuanPembelajaran);
  
  // State untuk nilai - SKOR dan DESKRIPSI (kosong default)
  const [nilai, setNilai] = useState({
    skor_1: "",
    desc_1: "",
    skor_2: "",
    desc_2: "",
    skor_3: "",
    desc_3: "",
    skor_4: "",
    desc_4: ""
  });

  const [kehadiran, setKehadiran] = useState({
    sakit: "",
    izin: "",
    alpa: ""
  });

  // State terpisah untuk tempat dan tanggal
  const [tempat, setTempat] = useState("Singosari");
  const [tanggalPenilaian, setTanggalPenilaian] = useState(dayjs().format('YYYY-MM-DD'));

  // Format tanggal untuk preview
  const formatTanggalIndonesia = (tanggal) => {
    if (!tanggal) return "";
    return dayjs(tanggal).format('DD MMMM YYYY');
  };

  // Fungsi untuk mengambil data guru
  const fetchGuruData = async () => {
    setLoadingGuru(true);
    try {
      const data = await getGuru();
      setGuruList(data);
      console.log("Data guru berhasil dimuat:", data);
      
      // Cari guru berdasarkan kode_guru dari localStorage
      if (user.kode_guru) {
        const guruDitemukan = data.find(g => g.kode_guru === user.kode_guru);
        if (guruDitemukan) {
          console.log("Guru ditemukan berdasarkan kode_guru:", guruDitemukan);
          // Update data pembimbing dengan NIP yang ditemukan
          setSiswa(prev => ({
            ...prev,
            nama_pembimbing: prev.nama_pembimbing || guruDitemukan.nama || user.name,
            nip_pembimbing: guruDitemukan.nip || prev.nip_pembimbing || ""
          }));
        } else {
          console.log("Guru dengan kode_guru", user.kode_guru, "tidak ditemukan");
        }
      }
    } catch (error) {
      console.error("Gagal mengambil data guru:", error);
    } finally {
      setLoadingGuru(false);
    }
  };

  // FUNGSI BARU: Fetch semua data industri
  const fetchIndustriData = async () => {
    setLoadingIndustri(true);
    try {
      const data = await getIndustri();
      setIndustriList(data);
      console.log("Data industri berhasil dimuat:", data);
    } catch (error) {
      console.error("Gagal mengambil data industri:", error);
      toast.error("Gagal memuat data industri");
    } finally {
      setLoadingIndustri(false);
    }
  };

  // FUNGSI BARU: Cari industri berdasarkan nama
  const cariIndustriBerdasarkanNama = (namaIndustri) => {
    if (!namaIndustri || industriList.length === 0) return null;
    
    // Cari industri dengan nama yang match (case insensitive)
    const industriDitemukan = industriList.find(industri => 
      industri.nama.toLowerCase() === namaIndustri.toLowerCase()
    );
    
    return industriDitemukan;
  };

  // FUNGSI BARU: Handle ketika tempat PKL berubah
  const handleTempatPKLChange = (e) => {
    const namaIndustri = e.target.value;
    setSiswa(prev => ({ ...prev, tempat_pkl: namaIndustri }));
    
    // Cari data instruktur berdasarkan nama industri
    if (namaIndustri.trim() !== "") {
      const industriData = cariIndustriBerdasarkanNama(namaIndustri);
      
      if (industriData) {
        setSelectedIndustriId(industriData.id);
        
        // Ambil jenis nomor dari localStorage
        const jenisNomorInstruktur = getJenisNomorFromLocal(industriData.id, 'jenis_nomor_pembimbing') || "NP";
        
        console.log("Data industri ditemukan:", industriData);
        console.log("Jenis nomor instruktur dari localStorage:", jenisNomorInstruktur);
        
        // Update data instruktur dengan data dari industri
        setSiswa(prev => ({
          ...prev,
          nama_instruktur: industriData.pic || prev.nama_instruktur,
          jabatan_instruktur: industriData.jabatan_pembimbing || "Instruktur Dunia Kerja",
          nip_instruktur: industriData.nip_pembimbing || prev.nip_instruktur,
          jenis_nomor_instruktur: jenisNomorInstruktur
        }));
        toast.success(`Data instruktur dari ${industriData.nama} berhasil dimuat`);
      }
    }
  };

  // FUNGSI BARU: Pilih industri dari dropdown pencarian
  const pilihIndustri = (industri) => {
    setSelectedIndustriId(industri.id);
    
    // Ambil jenis nomor dari localStorage
    const jenisNomorInstruktur = getJenisNomorFromLocal(industri.id, 'jenis_nomor_pembimbing') || "NP";
    
    setSiswa(prev => ({
      ...prev,
      tempat_pkl: industri.nama,
      nama_instruktur: industri.pic || prev.nama_instruktur,
      jabatan_instruktur: industri.jabatan_pembimbing || "Instruktur Dunia Kerja",
      nip_instruktur: industri.nip_pembimbing || prev.nip_instruktur,
      jenis_nomor_instruktur: jenisNomorInstruktur
    }));
    setShowIndustriSearch(false);
    setIndustriSearchQuery("");
    toast.success(`Data instruktur dari ${industri.nama} berhasil dimuat`);
  };

  // Filter industri berdasarkan query pencarian
  const filteredIndustri = industriList.filter(industri =>
    industri.nama.toLowerCase().includes(industriSearchQuery.toLowerCase())
  );

  // Fungsi untuk mendapatkan data guru berdasarkan kode_guru
  const getGuruByKode = (kodeGuru) => {
    if (!kodeGuru || guruList.length === 0) return null;
    return guruList.find(g => g.kode_guru === kodeGuru);
  };

  // AMBIL DATA GURU DAN INDUSTRI SAAT KOMPONEN DIMUAT
  useEffect(() => {
    fetchGuruData();
    fetchIndustriData();
  }, []);

  // Effect untuk mengisi data instruktur otomatis jika tempat_pkl sudah ada
  useEffect(() => {
    if (siswa.tempat_pkl && industriList.length > 0) {
      const industriData = cariIndustriBerdasarkanNama(siswa.tempat_pkl);
      if (industriData && !siswa.nama_instruktur) {
        setSelectedIndustriId(industriData.id);
        
        // Ambil jenis nomor dari localStorage
        const jenisNomorInstruktur = getJenisNomorFromLocal(industriData.id, 'jenis_nomor_pembimbing') || "NP";
        
        setSiswa(prev => ({
          ...prev,
          nama_instruktur: industriData.pic || prev.nama_instruktur,
          jabatan_instruktur: industriData.jabatan_pembimbing || "Instruktur Dunia Kerja",
          nip_instruktur: industriData.nip_pembimbing || prev.nip_instruktur,
          jenis_nomor_instruktur: jenisNomorInstruktur
        }));
      }
    }
  }, [industriList, siswa.tempat_pkl]);

  // Load data dari localStorage saat halaman dimuat
  useEffect(() => {
    const savedData = localStorage.getItem('penilaian_data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log("Memuat data dari localStorage:", parsedData);
        
        // Cari data guru pembimbing berdasarkan kode_guru
        const guruPembimbing = getGuruByKode(user.kode_guru);
        
        if (parsedData.siswa) {
          setSiswa({
            nama: parsedData.siswa.nama || "",
            nisn: parsedData.siswa.nisn || "",
            kelas: parsedData.siswa.kelas || "",
            konsentrasi_keahlian: parsedData.siswa.konsentrasi_keahlian || "",
            tempat_pkl: parsedData.siswa.industri || parsedData.siswa.tempat_pkl || "",
            tanggal_mulai: parsedData.siswa.tanggal_mulai_input || parsedData.siswa.tanggal_mulai || "",
            tanggal_selesai: parsedData.siswa.tanggal_selesai_input || parsedData.siswa.tanggal_selesai || "",
            tanggal_mulai_preview: parsedData.siswa.tanggal_mulai_preview || "",
            tanggal_selesai_preview: parsedData.siswa.tanggal_selesai_preview || "",
            nama_instruktur: parsedData.siswa.nama_instruktur || "",
            jabatan_instruktur: parsedData.siswa.jabatan_instruktur || "",
            nip_instruktur: parsedData.siswa.nip_instruktur || "",
            jenis_nomor_instruktur: parsedData.siswa.jenis_nomor_instruktur || "NP", // TAMBAHKAN
            // Prioritaskan data dari guru yang ditemukan berdasarkan kode_guru
            nama_pembimbing: guruPembimbing?.nama || parsedData.siswa.nama_pembimbing || user.name || "",
            jabatan_pembimbing: parsedData.siswa.jabatan_pembimbing || "Guru Mapel PKL",
            nip_pembimbing: guruPembimbing?.nip || parsedData.siswa.nip_pembimbing || ""
          });
        }
        
        // Ambil tujuan pembelajaran dari form_items (dari API)
        if (parsedData.form_items && parsedData.form_items.length > 0) {
          // Ambil tujuan pembelajaran dari API
          const apiTujuan = parsedData.form_items.map(item => item.tujuan_pembelajaran);
          
          // Gabungkan dengan default hingga 4 aspek
          const gabunganTujuan = [...apiTujuan];
          for (let i = gabunganTujuan.length; i < 4; i++) {
            gabunganTujuan.push(defaultTujuanPembelajaran[i]);
          }
          
          setTujuanPembelajaran(gabunganTujuan);
          console.log("Tujuan pembelajaran dari API + default:", gabunganTujuan);
        }
        
        // Set nilai dari data yang dimuat (jika ada) - deskripsi tetap bisa diisi manual
        if (parsedData.nilai) {
          setNilai({
            skor_1: parsedData.nilai.skor_1 || "",
            desc_1: parsedData.nilai.desc_1 || "",
            skor_2: parsedData.nilai.skor_2 || "",
            desc_2: parsedData.nilai.desc_2 || "",
            skor_3: parsedData.nilai.skor_3 || "",
            desc_3: parsedData.nilai.desc_3 || "",
            skor_4: parsedData.nilai.skor_4 || "",
            desc_4: parsedData.nilai.desc_4 || ""
          });
        }
        
        // Set kehadiran dari data yang dimuat - PRIORITAS dari parsedData
        setKehadiran({
          sakit: parsedData.sakit !== undefined ? parsedData.sakit.toString() : "",
          izin: parsedData.izin !== undefined ? parsedData.izin.toString() : "",
          alpa: parsedData.alpa !== undefined ? parsedData.alpa.toString() : ""
        });
        
        // Set tempat dan tanggal dari data yang dimuat
        if (parsedData.tempat_tanggal) {
          const parts = parsedData.tempat_tanggal.split(', ');
          if (parts.length > 0) setTempat(parts[0]);
        }
        
        toast.success("Data penilaian berhasil dimuat");
        
      } catch (error) {
        console.error("Gagal parse data dari localStorage:", error);
      }
    }
    
    // Coba ambil data summary izin dari localStorage berdasarkan application_id
    const applicationId = new URLSearchParams(location.search).get('application_id');
    if (applicationId) {
      const izinSummary = localStorage.getItem(`izin_summary_${applicationId}`);
      if (izinSummary) {
        try {
          const parsedIzin = JSON.parse(izinSummary);
          console.log("Data summary izin ditemukan:", parsedIzin);
          setKehadiran(prev => ({
            ...prev,
            sakit: parsedIzin.sakit?.toString() || "0",
            izin: parsedIzin.izin?.toString() || "0",
            alpa: parsedIzin.alpa?.toString() || "0"
          }));
          toast.success("Data kehadiran berhasil dimuat");
        } catch (error) {
          console.error("Gagal parse data izin summary:", error);
        }
      }
    }
  }, [location.search]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        toast.error('File harus berupa gambar (JPG, PNG, GIF)');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const logoDataUrl = reader.result;
        setLogo({
          file: file,
          preview: logoDataUrl,
          type: 'custom'
        });

        localStorage.setItem('penilaian_logo_preview', logoDataUrl);
        localStorage.setItem('penilaian_logo_type', 'custom');

        toast.success('Logo berhasil diupload');
        setShowLogoModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    setLogo({
      file: null,
      preview: logoSmk,
      type: 'default'
    });

    localStorage.removeItem('penilaian_logo_preview');
    localStorage.removeItem('penilaian_logo_type');

    toast.success('Logo direset ke default');
  };

  const handleSiswaChange = (e) => {
    const { name, value } = e.target;
    setSiswa(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkorChange = (aspek, value) => {
    setNilai(prev => ({
      ...prev,
      [`skor_${aspek}`]: value
    }));
  };

  const handleDescChange = (aspek, value) => {
    setNilai(prev => ({
      ...prev,
      [`desc_${aspek}`]: value
    }));
  };

  const handleKehadiranChange = (e) => {
    const { name, value } = e.target;
    setKehadiran(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTempatChange = (e) => {
    setTempat(e.target.value);
  };

  const handleTanggalPenilaianChange = (e) => {
    setTanggalPenilaian(e.target.value);
  };

  const handleSaveData = () => {
    if (!siswa.nama.trim()) {
      toast.error("Nama peserta didik harus diisi");
      return;
    }

    const tempatTanggal = `${tempat}, ${formatTanggalIndonesia(tanggalPenilaian)}`;

    // Cari data guru pembimbing berdasarkan kode_guru
    const guruPembimbing = getGuruByKode(user.kode_guru);

    const payload = {
      school_info: schoolInfo,
      siswa: {
        nama: siswa.nama,
        nisn: siswa.nisn || "",
        kelas: siswa.kelas || "",
        konsentrasi_keahlian: siswa.konsentrasi_keahlian || "",
        tempat_pkl: siswa.tempat_pkl || "",
        tanggal_mulai: siswa.tanggal_mulai_preview || formatTanggalIndonesia(siswa.tanggal_mulai),
        tanggal_selesai: siswa.tanggal_selesai_preview || formatTanggalIndonesia(siswa.tanggal_selesai),
        nama_instruktur: siswa.nama_instruktur || "",
        jabatan_instruktur: siswa.jabatan_instruktur || "",
        nip_instruktur: siswa.nip_instruktur || "",
        jenis_nomor_instruktur: siswa.jenis_nomor_instruktur || "NP", // TAMBAHKAN
        nama_pembimbing: guruPembimbing?.nama || siswa.nama_pembimbing || user.name || "",
        jabatan_pembimbing: siswa.jabatan_pembimbing || "Guru Mapel PKL",
        nip_pembimbing: guruPembimbing?.nip || siswa.nip_pembimbing || ""
      },
      tujuan_pembelajaran: tujuanPembelajaran,
      nilai: {
        skor_1: nilai.skor_1 ? parseInt(nilai.skor_1) : 0,
        desc_1: nilai.desc_1 || "",
        skor_2: nilai.skor_2 ? parseInt(nilai.skor_2) : 0,
        desc_2: nilai.desc_2 || "",
        skor_3: nilai.skor_3 ? parseInt(nilai.skor_3) : 0,
        desc_3: nilai.desc_3 || "",
        skor_4: nilai.skor_4 ? parseInt(nilai.skor_4) : 0,
        desc_4: nilai.desc_4 || ""
      },
      jenis_nomor: siswa.jenis_nomor_instruktur || "NP", // JENIS NOMOR UNTUK INSTRUKTUR
      sakit: kehadiran.sakit ? parseInt(kehadiran.sakit) : 0,
      izin: kehadiran.izin ? parseInt(kehadiran.izin) : 0,
      alpa: kehadiran.alpa ? parseInt(kehadiran.alpa) : 0,
      tempat_tanggal: tempatTanggal
    };

    console.log("Payload yang akan dikirim:", payload);
    
    // Simpan ke localStorage
    localStorage.setItem('penilaian_data', JSON.stringify(payload));
    
    toast.success("Data penilaian berhasil disimpan!");
  };

  const handleGeneratePDF = async () => {
    if (!siswa.nama.trim()) {
      toast.error("Nama peserta didik harus diisi");
      return;
    }

    setGeneratingPDF(true);

    try {
      const tempatTanggal = `${tempat}, ${formatTanggalIndonesia(tanggalPenilaian)}`;

      // Cari data guru pembimbing berdasarkan kode_guru
      const guruPembimbing = getGuruByKode(user.kode_guru);

      const payload = {
        school_info: schoolInfo,
        siswa: {
          nama: siswa.nama,
          nisn: siswa.nisn || "",
          kelas: siswa.kelas || "",
          konsentrasi_keahlian: siswa.konsentrasi_keahlian || "",
          tempat_pkl: siswa.tempat_pkl || "",
          tanggal_mulai: siswa.tanggal_mulai_preview || formatTanggalIndonesia(siswa.tanggal_mulai),
          tanggal_selesai: siswa.tanggal_selesai_preview || formatTanggalIndonesia(siswa.tanggal_selesai),
          nama_instruktur: siswa.nama_instruktur || "",
          jabatan_instruktur: siswa.jabatan_instruktur || "",
          nip_instruktur: siswa.nip_instruktur || "",
          jenis_nomor_instruktur: siswa.jenis_nomor_instruktur || "NP", // TAMBAHKAN
          nama_pembimbing: guruPembimbing?.nama || siswa.nama_pembimbing || user.name || "",
          jabatan_pembimbing: siswa.jabatan_pembimbing || "Guru Mapel PKL",
          nip_pembimbing: guruPembimbing?.nip || siswa.nip_pembimbing || ""
        },
        tujuan_pembelajaran: tujuanPembelajaran,
        nilai: {
          skor_1: nilai.skor_1 ? parseInt(nilai.skor_1) : 0,
          desc_1: nilai.desc_1 || "",
          skor_2: nilai.skor_2 ? parseInt(nilai.skor_2) : 0,
          desc_2: nilai.desc_2 || "",
          skor_3: nilai.skor_3 ? parseInt(nilai.skor_3) : 0,
          desc_3: nilai.desc_3 || "",
          skor_4: nilai.skor_4 ? parseInt(nilai.skor_4) : 0,
          desc_4: nilai.desc_4 || ""
        },
        jenis_nomor: siswa.jenis_nomor_instruktur || "NP", // JENIS NOMOR UNTUK INSTRUKTUR
        sakit: kehadiran.sakit ? parseInt(kehadiran.sakit) : 0,
        izin: kehadiran.izin ? parseInt(kehadiran.izin) : 0,
        alpa: kehadiran.alpa ? parseInt(kehadiran.alpa) : 0,
        tempat_tanggal: tempatTanggal
      };

      console.log("Mengirim payload ke API:", payload);

      const filename = await generateAndDownloadFormPenilaian(payload);
      
      console.log("PDF berhasil di-generate:", filename);
      toast.success("PDF berhasil diunduh!");

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(error?.message || "Gagal membuat PDF. Silakan coba lagi.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Hitung total skor - hanya jika ada nilai
  const hitungTotalSkor = () => {
    const skors = [];
    for (let i = 1; i <= 4; i++) {
      const skor = nilai[`skor_${i}`];
      if (skor && skor.toString().trim() !== '') {
        skors.push(parseInt(skor));
      }
    }
    return skors;
  };

  const skors = hitungTotalSkor();
  const totalSkor = skors.length > 0 ? skors.reduce((sum, skor) => sum + skor, 0) : "";
  const rataRata = skors.length > 0 ? (skors.reduce((sum, skor) => sum + skor, 0) / 4).toFixed(2) : "";

  // Render tabel nilai dengan tujuan pembelajaran dinamis
  const renderTabelNilai = () => {
    return (
      <tbody>
        {[1, 2, 3, 4].map((aspek) => (
          <tr key={aspek}>
            <td className="border border-black p-2 align-top">
              {aspek}. {tujuanPembelajaran[aspek - 1]}
            </td>
            <td className="border border-black p-2 text-center align-top">
              {nilai[`skor_${aspek}`] || ""}
            </td>
            <td className="border border-black p-2 align-top">
              {nilai[`desc_${aspek}`] || "-"}
            </td>
          </tr>
        ))}
      </tbody>
    );
  };

  // Render form input nilai dengan tujuan pembelajaran dinamis
  const renderFormNilai = () => {
    return [1, 2, 3, 4].map((aspek) => (
      <div key={aspek} className="border-b border-gray-200 pb-4 last:border-0">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Aspek Penilaian {aspek}: {tujuanPembelajaran[aspek - 1]}
        </p>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Skor {aspek} (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={nilai[`skor_${aspek}`] || ""}
              onChange={(e) => handleSkorChange(aspek, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Skor ${aspek}`}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Deskripsi {aspek}
            </label>
            <textarea
              value={nilai[`desc_${aspek}`] || ""}
              onChange={(e) => handleDescChange(aspek, e.target.value)}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Tulis deskripsi untuk aspek ${aspek}...`}
            />
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="bg-white min-h-screen">
      <Header user={user} />

      <div className="flex">
        <Sidebar active={active} setActive={setActive} />

        <main className="flex-1 p-6 bg-[#641E21] rounded-l-3xl">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-white font-bold text-base sm:text-lg">
                  Daftar Nilai Peserta Didik
                </h2>
              </div>
            </div>
          </div>

          {showLogoModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowLogoModal(false)} />
              <div className="relative bg-white rounded-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Logo Sekolah</h3>
                  <button onClick={() => setShowLogoModal(false)} className="!bg-transparent text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>

                <div className="text-center mb-6">
                  <div className="inline-block p-4 border-2 border-dashed border-gray-300 rounded-lg mb-4">
                    <img
                      src={logo.preview}
                      alt="Preview Logo"
                      className="w-40 h-40 object-contain mx-auto"
                    />
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    Logo saat ini: <span className="font-medium">{logo.type === 'default' ? 'Logo Default' : 'Logo Custom'}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Format: JPG, PNG (Maksimal 2MB)
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="w-full py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition">
                      Upload Logo Baru
                    </div>
                  </label>

                  {logo.type === 'custom' && (
                    <button
                      onClick={handleResetLogo}
                      className="w-full py-3 !bg-gray-200 !text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      Reset ke Logo Default
                    </button>
                  )}
                </div>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowLogoModal(false)}
                    className="px-4 py-2 !bg-transparent !text-gray-600 hover:text-gray-800"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kolom Kiri - Preview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 max-h-[800px] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Pratinjau Daftar Nilai Peserta Didik</h3>
              </div>

              <div className="space-y-6">
                {/* Halaman 1 - Daftar Nilai */}
                <div className="p-6 border border-gray-300 bg-white shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={logo.preview}
                      alt="Logo SMK"
                      className="w-50 -ml-15"
                      onError={(e) => {
                        e.target.src = logoSmk;
                      }}
                    />
                    <div className="text-center flex-1 mr-25">
                      <p className="font-bold text-sm">PEMERINTAH PROVINSI {schoolInfo.provinsi.toUpperCase()}</p>
                      <p className="font-bold text-sm">DINAS PENDIDIKAN</p>
                      <p className="font-bold text-sm">{schoolInfo.nama_sekolah}</p>
                      <p className="text-xs mt-1">
                        {schoolInfo.alamat_jalan}, {schoolInfo.kelurahan}, {schoolInfo.kecamatan}, {schoolInfo.kab_kota}, {schoolInfo.provinsi} {schoolInfo.kode_pos}
                      </p>
                      <p className="text-xs">Telepon {schoolInfo.telepon}</p>
                    </div>
                  </div>

                  <div className="border-t-2 border-black my-3"></div>
                  <div className="border-t border-black -mt-2 mb-6"></div>

                  <div className="text-center mb-6">
                    <p className="font-bold text-base">DAFTAR NILAI PESERTA DIDIK</p>
                    <p className="font-bold text-sm">MATA PELAJARAN PKL</p>
                    <p className="font-bold text-sm">{schoolInfo.nama_sekolah}</p>
                    <p className="font-bold text-sm">TAHUN AJARAN 2025/2026</p>
                  </div>

                  <div className="mb-6 text-sm space-y-1">
                    <p><span className="font-bold inline-block w-44">Nama Peserta Didik</span>: {siswa.nama || "-"}</p>
                    <p><span className="font-bold inline-block w-44">NISN</span>: {siswa.nisn || "-"}</p>
                    <p><span className="font-bold inline-block w-44">Kelas</span>: {siswa.kelas || "-"}</p>
                    <p><span className="font-bold inline-block w-44">Konsentrasi Keahlian</span>: {siswa.konsentrasi_keahlian || "-"}</p>
                    <p><span className="font-bold inline-block w-44">Tempat PKL</span>: {siswa.tempat_pkl || "-"}</p>
                    <p><span className="font-bold inline-block w-44">Tanggal PKL</span>: Mulai: {siswa.tanggal_mulai_preview || formatTanggalIndonesia(siswa.tanggal_mulai) || "-"} <span className="ml-8">Selesai: {siswa.tanggal_selesai_preview || formatTanggalIndonesia(siswa.tanggal_selesai) || "-"}</span></p>
                    <p><span className="font-bold inline-block w-44">Nama Instruktur</span>: {siswa.nama_instruktur || "-"}</p>
                    <p><span className="font-bold inline-block w-44">Nama Pembimbing</span>: {siswa.nama_pembimbing || "-"}</p>
                  </div>

                  {/* Tabel Nilai dengan tujuan pembelajaran dinamis */}
                  <table className="w-full border-collapse border border-black mb-4 text-xs">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border border-black p-2 text-center font-bold" style={{ width: '40%' }}>TUJUAN PEMBELAJARAN</th>
                        <th className="border border-black p-2 text-center font-bold" style={{ width: '15%' }}>SKOR</th>
                        <th className="border border-black p-2 text-center font-bold" style={{ width: '45%' }}>DESKRIPSI</th>
                      </tr>
                    </thead>
                    {renderTabelNilai()}
                    <tbody>
                      {/* Baris Total Skor */}
                      <tr>
                        <td className="border border-black p-2 font-bold">Total Skor</td>
                        <td className="border border-black p-2 text-center font-bold">
                          {totalSkor}
                        </td>
                        <td className="border border-black p-2 align-top"></td>
                      </tr>
                      
                      {/* Baris Nilai Akhir */}
                      <tr>
                        <td className="border border-black p-2 font-bold">Nilai Akhir (Rata-rata Skor)</td>
                        <td className="border border-black p-2 text-center font-bold">
                          {rataRata}
                        </td>
                        <td className="border border-black p-2 align-top"></td>
                      </tr>
                      
                      {/* Baris Catatan - bisa diubah sesuai kebutuhan */}
                      <tr>
                        <td className="border border-black p-2 italic text-gray-600" colSpan="3">
                          Catatan: Peserta didik telah memiliki soft skill dan hard skill yang dibutuhkan oleh dunia kerja.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Halaman 2 - Kehadiran dan Tanda Tangan */}
                <div className="p-6 border border-gray-300 bg-white shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={logo.preview}
                      alt="Logo SMK"
                      className="w-50 -ml-15"
                      onError={(e) => {
                        e.target.src = logoSmk;
                      }}
                    />
                    <div className="text-center flex-1 mr-25">
                      <p className="font-bold text-sm">PEMERINTAH PROVINSI {schoolInfo.provinsi.toUpperCase()}</p>
                      <p className="font-bold text-sm">DINAS PENDIDIKAN</p>
                      <p className="font-bold text-sm">{schoolInfo.nama_sekolah}</p>
                      <p className="text-xs mt-1">
                        {schoolInfo.alamat_jalan}, {schoolInfo.kelurahan}, {schoolInfo.kecamatan}, {schoolInfo.kab_kota}, {schoolInfo.provinsi} {schoolInfo.kode_pos}
                      </p>
                      <p className="text-xs">Telepon {schoolInfo.telepon}</p>
                    </div>
                  </div>

                  <div className="border-t-2 border-black my-2"></div>
                  <div className="border-t border-black -mt-1 mb-6"></div>

                  <div className="mb-8">
                    <table className="border-collapse border border-black text-xs">
                      <thead>
                        <tr>
                          <th colSpan="3" className="border border-black p-2 text-center font-bold bg-gray-100">KEHADIRAN</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black p-2 w-32">Sakit</td>
                          <td className="border border-black p-2 w-6 text-center">:</td>
                          <td className="border border-black p-2 w-16 text-center">{kehadiran.sakit || "0"} Hari</td>
                        </tr>
                        <tr>
                          <td className="border border-black p-2">Izin</td>
                          <td className="border border-black p-2 text-center">:</td>
                          <td className="border border-black p-2 text-center">{kehadiran.izin || "0"} Hari</td>
                        </tr>
                        <tr>
                          <td className="border border-black p-2">Tanpa Keterangan</td>
                          <td className="border border-black p-2 text-center">:</td>
                          <td className="border border-black p-2 text-center">{kehadiran.alpa || "0"} Hari</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-start mt-12">
                    <div className="text-left mt-7">
                        <p className="font-bold text-sm mb-16">
                          {siswa.jabatan_pembimbing || "Guru Mapel PKL,"}
                        </p>

                        <p className="border-b font-bold text-sm inline-block min-w-[100px]">
                          {siswa.nama_pembimbing}
                        </p>

                        <p className="text-xs mt-1">
                          {siswa.nip_pembimbing ? `NIP. ${siswa.nip_pembimbing}` : "NIP. -"}
                        </p>
                      </div>

                    <div className="text-left">
                      <p className="text-sm mb-1">
                        {tempat}, {formatTanggalIndonesia(tanggalPenilaian)}
                      </p>

                      <p className="font-bold text-sm mb-14">
                        {siswa.jabatan_instruktur || "Instruktur Dunia Kerja"}
                      </p>

                      <p className="border-b font-bold text-sm inline-block min-w-[150px]">
                        {siswa.nama_instruktur}
                      </p>

                      <p className="text-xs mt-1">
                        {siswa.nip_instruktur ? `${siswa.jenis_nomor_instruktur || "NIP"}. ${siswa.nip_instruktur}` : "NIP. -"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom Kanan - Form Edit */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 max-h-[800px] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ubah Surat Daftar Nilai Peserta Didik</h3>

              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Data Siswa</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Peserta Didik
                      </label>
                      <input
                        type="text"
                        name="nama"
                        value={siswa.nama}
                        onChange={handleSiswaChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: CHANDA ZULIA LESTARI"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          NISN
                        </label>
                        <input
                          type="text"
                          name="nisn"
                          value={siswa.nisn}
                          onChange={handleSiswaChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Contoh: 0012345678"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kelas
                        </label>
                        <input
                          type="text"
                          name="kelas"
                          value={siswa.kelas}
                          onChange={handleSiswaChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Contoh: XII DKV 1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Konsentrasi Keahlian
                      </label>
                      <input
                        type="text"
                        name="konsentrasi_keahlian"
                        value={siswa.konsentrasi_keahlian}
                        onChange={handleSiswaChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: Desain Komunikasi Visual"
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tempat PKL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="tempat_pkl"
                          value={siswa.tempat_pkl}
                          onChange={handleTempatPKLChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Ketik nama industri..."
                        />
                        <button
                          type="button"
                          onClick={() => setShowIndustriSearch(!showIndustriSearch)}
                          className="px-3 py-2 !bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                          title="Cari industri"
                        >
                          <Search size={20} className="text-gray-600" />
                        </button>
                      </div>
                      
                      {/* Dropdown pencarian industri */}
                      {showIndustriSearch && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          <div className="p-2 border-b">
                            <input
                              type="text"
                              value={industriSearchQuery}
                              onChange={(e) => setIndustriSearchQuery(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Cari nama industri..."
                              autoFocus
                            />
                          </div>
                          {loadingIndustri ? (
                            <div className="p-4 text-center text-gray-500">Memuat data...</div>
                          ) : filteredIndustri.length > 0 ? (
                            filteredIndustri.map((industri) => (
                              <div
                                key={industri.id}
                                onClick={() => pilihIndustri(industri)}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                              >
                                <p className="font-medium">{industri.nama}</p>
                                <p className="text-xs text-gray-500">
                                  PIC: {industri.pic || "-"} | Jabatan: {industri.jabatan_pembimbing || "-"}
                                </p>
                                {industri.nip_pembimbing && (
                                  <p className="text-xs text-gray-500">NIP: {industri.nip_pembimbing}</p>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-gray-500">
                              {industriSearchQuery ? "Industri tidak ditemukan" : "Ketik untuk mencari industri"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tanggal Mulai
                        </label>
                        <input
                          type="date"
                          name="tanggal_mulai"
                          value={siswa.tanggal_mulai}
                          onChange={handleSiswaChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tanggal Selesai
                        </label>
                        <input
                          type="date"
                          name="tanggal_selesai"
                          value={siswa.tanggal_selesai}
                          onChange={handleSiswaChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Data Instruktur */}
                    <div className="border-t border-gray-200 pt-4 mt-2">
                      <h5 className="font-medium text-gray-700 mb-3">Data Instruktur Dunia Kerja</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Instruktur
                          </label>
                          <input
                            type="text"
                            name="nama_instruktur"
                            value={siswa.nama_instruktur}
                            onChange={handleSiswaChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Akan terisi otomatis dari data industri"
                          />
                          
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jabatan Instruktur
                          </label>
                          <input
                            type="text"
                            name="jabatan_instruktur"
                            value={siswa.jabatan_instruktur}
                            onChange={handleSiswaChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: Industrial Engineer"
                          />
                          
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {siswa.jenis_nomor_instruktur} Instruktur (jika ada)
                          </label>
                          <input
                            type="text"
                            name="nip_instruktur"
                            value={siswa.nip_instruktur}
                            onChange={handleSiswaChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: 19850101 201001 2 005 atau -"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jenis Nomor Instruktur
                          </label>
                          <input
                            type="text"
                            name="jenis_nomor_instruktur"
                            value={siswa.jenis_nomor_instruktur}
                            onChange={handleSiswaChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: NIP, NIK, NIDN, dll"
                          />
                          
                        </div>
                      </div>
                    </div>

                    {/* Data Guru Mapel (Pembimbing) */}
                    <div className="border-t border-gray-200 pt-4 mt-2">
                      <h5 className="font-medium text-gray-700 mb-3">Data Guru Mapel PKL</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Guru Mapel
                          </label>
                          <input
                            type="text"
                            name="nama_pembimbing"
                            value={siswa.nama_pembimbing}
                            onChange={handleSiswaChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: Aldian S.Pd."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jabatan Pembimbing
                          </label>
                          <input
                            type="text"
                            name="jabatan_pembimbing"
                            value={siswa.jabatan_pembimbing}
                            onChange={handleSiswaChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: Guru Mapel PKL"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            NIP Pembimbing
                          </label>
                          <input
                            type="text"
                            name="nip_pembimbing"
                            value={siswa.nip_pembimbing}
                            onChange={handleSiswaChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: 19850101 201001 2 005"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Data Nilai</h4>
                  <div className="space-y-4">
                    {renderFormNilai()}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Kehadiran</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sakit (Hari)
                      </label>
                      <input
                        type="number"
                        name="sakit"
                        value={kehadiran.sakit}
                        onChange={handleKehadiranChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Izin (Hari)
                      </label>
                      <input
                        type="number"
                        name="izin"
                        value={kehadiran.izin}
                        onChange={handleKehadiranChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alpa (Hari)
                      </label>
                      <input
                        type="number"
                        name="alpa"
                        value={kehadiran.alpa}
                        onChange={handleKehadiranChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Tempat dan Tanggal Penilaian</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tempat
                      </label>
                      <input
                        type="text"
                        value={tempat}
                        onChange={handleTempatChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: Singosari"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal
                      </label>
                      <input
                        type="date"
                        value={tanggalPenilaian}
                        onChange={handleTanggalPenilaianChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={handleSaveData}
                    className="flex items-center gap-2 px-6 py-3 !bg-[#641E21] text-white rounded-lg hover:bg-[#4a1618] font-semibold"
                  >
                    <Save size={18} />
                    Simpan Data
                  </button>
                  <button
                    onClick={handleGeneratePDF}
                    disabled={generatingPDF}
                    className="flex items-center gap-2 px-6 py-3 !bg-[#641E21] text-white rounded-lg hover:bg-[#4a1618] font-semibold disabled:opacity-50"
                  >
                    <Download size={18} />
                    {generatingPDF ? 'Memproses...' : 'Download PDF'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}