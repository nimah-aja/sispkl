import React, { useState, useEffect } from "react";
import {
  Save,
  Download,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { id } from "date-fns/locale";
import { format } from "date-fns";

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";

// Import utils guru
import { getGuru } from "../utils/services/admin/get_guru";

// Import lettersApi utilities
import { generateAndDownloadSuratTugas } from "../utils/lettersApi";

export default function SuratPengantaranPage() {
  const [active, setActive] = useState("suratPengantaran");
  const [guruList, setGuruList] = useState([]);
  const [loadingGuru, setLoadingGuru] = useState(false);
  
  // State untuk date picker (tanggal pelaksanaan)
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 11, 3));
  
  // State untuk tanggal surat dibuat
  const [tanggalDibuatDate, setTanggalDibuatDate] = useState(new Date(2025, 11, 3));
  
  // State untuk tempat surat dibuat
  const [tempatSurat, setTempatSurat] = useState("Singosari");
  
  // State untuk waktu (jam)
  const [selectedStartTime, setSelectedStartTime] = useState("08:00");
  const [selectedEndTime, setSelectedEndTime] = useState("selesai");

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Koordinator",
  };

  // State untuk logo - GUNAKAN LINK URL
  const [logo] = useState({
    preview: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpw9WUZEt_KLkOKZNKN_3Qq_Ygpp6EB5Rv0Q&s"
  });

  // State untuk data surat tugas
  const [dataSuratTugas, setDataSuratTugas] = useState({
    nomorSurat: "800 / 376 / 101.6.9.19 /2025",
    keperluan: "Penjemputan Siswa Praktik Kerja Lapangan (PKL)",
    hariTanggal: "Rabu, 10 Desember 2025",
    waktu: "08.00 – Selesai",
    tempat: "JOTUN SINGOSARI",
    alamat: "Jl. Panglima Sudirman No.148 Kavling E2, Pangetan, Kec. Singosari, Kab. Malang, Jawa Timur 65153",
    tanggalDibuat: "03 Desember 2025",
    tempatSurat: "Singosari",
    namaKepsek: "SUMIJAH, S.Pd., M.Si.",
    pangkatGolongan: "Pembina Utama Muda (IV/c)",
    nipKepsek: "19700210 199802 2009",
  });

  // State untuk guru yang ditugaskan (NIP dihapus)
  const [guruPenugasan, setGuruPenugasan] = useState([
    {
      id: 1,
      nama: "Triana Ardiani, S.Pd",
      jabatan: "Guru",
      dinas: "SMK Negeri 2 Singosari",
      guruId: "",
    },
  ]);

  // State untuk form input (NIP guru dihapus)
  const [formData, setFormData] = useState({
    nomorSurat: "800 / 376 / 101.6.9.19 /2025",
    keperluan: "Penjemputan Siswa Praktik Kerja Lapangan (PKL)",
    tempat: "JOTUN SINGOSARI",
    alamat: "Jl. Panglima Sudirman No.148 Kavling E2, Pangetan, Kec. Singosari, Kab. Malang, Jawa Timur 65153",
    namaKepsek: "SUMIJAH, S.Pd., M.Si.",
    pangkatGolongan: "Pembina Utama Muda (IV/c)",
    nipKepsek: "19700210 199802 2009",
    guru1: {
      guruId: "",
      nama: "Triana Ardiani, S.Pd",
      jabatan: "Guru",
      dinas: "SMK Negeri 2 Singosari",
    },
  });

  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Fetch data guru
  useEffect(() => {
    fetchGuruList();
  }, []);

  // Update data surat tugas ketika selectedDate (tanggal pelaksanaan) berubah
  useEffect(() => {
    // Format tanggal untuk tampilan (dengan hari)
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const dayName = days[selectedDate.getDay()];
    const formattedDate = format(selectedDate, "dd MMMM yyyy", { locale: id });
    const hariTanggal = `${dayName}, ${formattedDate}`;
    
    setDataSuratTugas(prev => ({
      ...prev,
      hariTanggal: hariTanggal
    }));
  }, [selectedDate]);

  // Update data surat tugas ketika tanggalDibuatDate berubah
  useEffect(() => {
    const tanggalDibuat = format(tanggalDibuatDate, "dd MMMM yyyy", { locale: id });
    setDataSuratTugas(prev => ({
      ...prev,
      tanggalDibuat: tanggalDibuat
    }));
  }, [tanggalDibuatDate]);

  // Update data surat tugas ketika tempatSurat berubah
  useEffect(() => {
    setDataSuratTugas(prev => ({
      ...prev,
      tempatSurat: tempatSurat
    }));
  }, [tempatSurat]);

  // Update data surat tugas ketika waktu berubah
  useEffect(() => {
    let waktuString = "";
    if (selectedEndTime === "selesai") {
      waktuString = `${selectedStartTime.replace(':', '.')} – Selesai`;
    } else {
      waktuString = `${selectedStartTime.replace(':', '.')} – ${selectedEndTime.replace(':', '.')}`;
    }
    
    setDataSuratTugas(prev => ({
      ...prev,
      waktu: waktuString
    }));
  }, [selectedStartTime, selectedEndTime]);

  // Fungsi untuk fetch data guru
  const fetchGuruList = async () => {
    try {
      setLoadingGuru(true);
      const guruData = await getGuru();
      const pembimbingGuru = guruData.filter(
        (guru) => guru.is_pembimbing === true,
      );

      const formattedGuru = pembimbingGuru
        .map((guru) => {
          const nama = guru.nama || "-";
          let gelar = "";
          if (guru.gelar) {
            gelar = guru.gelar.includes(",") ? guru.gelar : `, ${guru.gelar}`;
          }

          let jabatan = "Guru";
          if (guru.jabatan) {
            if (guru.jabatan.toLowerCase().includes("kepala")) {
              jabatan = "Kepala Sekolah";
            } else if (guru.jabatan.toLowerCase().includes("wakil")) {
              jabatan = "Wakil Kepala Sekolah";
            }
          }

          return {
            id: guru.id,
            value: guru.id,
            label: `${nama}${gelar}`,
            nama: `${nama}${gelar}`,
            gelar: guru.gelar || "",
            jabatan: jabatan,
            is_pembimbing: guru.is_pembimbing || false,
          };
        })
        .sort((a, b) => a.nama.localeCompare(b.nama));

      setGuruList(formattedGuru);

      if (formattedGuru.length > 0) {
        const firstGuru = formattedGuru[0];
        setFormData((prev) => ({
          ...prev,
          guru1: {
            guruId: firstGuru.id,
            nama: firstGuru.nama,
            jabatan: firstGuru.jabatan,
            dinas: "SMK Negeri 2 Singosari",
          },
        }));

        setGuruPenugasan((prev) => {
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            id: firstGuru.id,
            nama: firstGuru.nama,
            jabatan: firstGuru.jabatan,
            dinas: "SMK Negeri 2 Singosari",
            guruId: firstGuru.id,
          };
          return updated;
        });
      }
    } catch (error) {
      console.error("Error fetching guru list:", error);
      toast.error("Gagal memuat data guru");
      setGuruList([
        {
          id: 1,
          value: 1,
          label: "Triana Ardiani, S.Pd",
          nama: "Triana Ardiani, S.Pd",
          gelar: "S.Pd",
          jabatan: "Guru",
          is_pembimbing: true,
        },
        {
          id: 2,
          value: 2,
          label: "Budi Santoso, S.Pd., M.Pd.",
          nama: "Budi Santoso, S.Pd., M.Pd.",
          gelar: "S.Pd., M.Pd.",
          jabatan: "Guru",
          is_pembimbing: true,
        },
      ]);
    } finally {
      setLoadingGuru(false);
    }
  };

  // Handle perubahan input form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Update juga dataSuratTugas untuk field yang sama
    setDataSuratTugas((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle perubahan input guru
  const handleGuruSelectChange = (guruId) => {
    const selectedGuru = guruList.find((g) => g.id === parseInt(guruId));
    if (selectedGuru) {
      setFormData((prev) => ({
        ...prev,
        guru1: {
          guruId: selectedGuru.id,
          nama: selectedGuru.nama,
          jabatan: selectedGuru.jabatan,
          dinas: "SMK Negeri 2 Singosari",
        },
      }));

      setGuruPenugasan((prev) => {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          id: selectedGuru.id,
          nama: selectedGuru.nama,
          jabatan: selectedGuru.jabatan,
          dinas: "SMK Negeri 2 Singosari",
          guruId: selectedGuru.id,
        };
        return updated;
      });
    }
  };

  const handleGuruInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      guru1: {
        ...prev.guru1,
        [field]: value,
      },
    }));

    setGuruPenugasan((prev) => {
      const updated = [...prev];
      updated[0] = {
        ...updated[0],
        [field]: value,
      };
      return updated;
    });
  };

  const handleSaveSuratTugas = () => {
    toast.success("Surat tugas berhasil disimpan!");
  };

  // FUNGSI PDF DENGAN PERBAIKAN - SEMUA MENGGUNAKAN INPUT DINAS
  const handlePrintPDF = async () => {
    setGeneratingPDF(true);

    try {
      const tanggalSuratFormatted = format(tanggalDibuatDate, "dd MMMM yyyy");
      
      // Ambil nama sekolah dari input Dinas
      const namaSekolahDinas = formData.guru1?.dinas || guruPenugasan[0]?.dinas || "SMK Negeri 2 Singosari";
      
      // Format nama sekolah untuk school_info (uppercase)
      const namaSekolahUpper = namaSekolahDinas.toUpperCase();

      const schoolInfo = {
        nama_sekolah: namaSekolahUpper,
        alamat_jalan: "Jalan Perusahaan No. 20",
        kelurahan: "Tunjungtirto",
        kecamatan: "Singosari",
        kab_kota: "Kab. Malang",
        provinsi: "Jawa Timur",
        kode_pos: "65153",
        telepon: "(0341) 4345127",
        email: "smkn2singosari@yahoo.co.id",
        website: "www.smkn2singosari.sch.id",
        logo_url: logo.preview
      };

      const penandatangan = {
        nama: formData.namaKepsek,
        jabatan: `Kepala ${namaSekolahDinas}`,
        nip: formData.nipKepsek,
        pangkat: formData.pangkatGolongan,
        instansi: namaSekolahDinas
      };

      // NIP guru dihapus dari assignees
      const assignees = guruPenugasan.map(guru => ({
        nama: guru.nama,
        jabatan: guru.jabatan,
        instansi: guru.dinas || namaSekolahDinas
      }));

      const details = [
        {
          label: "Keperluan",
          separator: ":",
          value: formData.keperluan
        },
        {
          label: "Hari / Tanggal",
          separator: ":",
          value: dataSuratTugas.hariTanggal
        },
        {
          label: "Waktu",
          separator: ":",
          value: dataSuratTugas.waktu
        },
        {
          label: "Tempat",
          separator: ":",
          value: formData.tempat
        },
        {
          label: "Alamat",
          separator: ":",
          value: formData.alamat
        }
      ];

      // Buat teks pembuka dinamis
      const teksPembuka = `Kepala ${namaSekolahDinas} Dinas Pendidikan Kabupaten Malang menugaskan kepada :`;

      const payload = {
        nomor_surat: formData.nomorSurat.replace(/\s+/g, ' ').trim(),
        tanggal_surat: tanggalSuratFormatted,
        tempat_surat: tempatSurat,
        perihal: "SURAT TUGAS",
        pembuka: teksPembuka,
        school_info: schoolInfo,
        penandatangan: penandatangan,
        assignees: assignees,
        details: details,
        penutup: "Demikian surat tugas ini dibuat untuk dilaksanakan dengan sebaik-baiknya dan melaporkan hasilnya kepada kepala sekolah."
      };

      console.log("Sending payload:", JSON.stringify(payload, null, 2));

      const filename = await generateAndDownloadSuratTugas(payload);
      toast.success(`Surat tugas berhasil diunduh! (${filename})`);

    } catch (error) {
      console.error("Error generating PDF:", error);
      
      if (error.response) {
        console.error("Error response data:", error.response.data);
        const errorMessage = error.response.data.detail 
          ? JSON.stringify(error.response.data.detail) 
          : (error.response.data.message || 'Server error');
        toast.error(`Gagal membuat surat: ${errorMessage}`);
      } else if (error.request) {
        toast.error("Tidak ada respons dari server. Periksa koneksi Anda.");
      } else {
        toast.error(`Gagal membuat PDF: ${error.message}`);
      }
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Generate opsi waktu (jam)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar active={active} setActive={setActive} />

      <div className="flex flex-col flex-1">
        <Header user={user} />

        <main className="flex-1 p-6 bg-[#641E21] rounded-tl-3xl">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-white font-bold text-lg">Surat Tugas</h2>
          </div>

          {/* KONTEN UTAMA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* KOLOM KIRI: PREVIEW SURAT */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Pratinjau Surat Tugas
                </h3>
                <span className="text-sm text-gray-500">
                  Format sesuai contoh surat
                </span>
              </div>

              {/* PREVIEW SURAT DENGAN PEMBUKA DINAMIS */}
              <div className="border border-gray-300 rounded-lg p-6 bg-gray-5" style={{ fontFamily: "Arial, sans-serif" }}>
                {/* KOP SURAT DENGAN LOGO DARI URL */}
                <div className="flex items-center justify-center relative pb-1 min-h-[100px]">
                  <img
                    src={logo.preview}
                    alt="Logo Provinsi"
                    className="object-contain absolute left-4 top-1"
                    style={{ width: "15mm", height: "auto" }}
                  />
                  <div className="text-center">
                    <p className="text-[14px] leading-tight uppercase">PEMERINTAH PROVINSI JAWA TIMUR</p>
                    <p className="font-bold text-[16px] leading-tight uppercase">DINAS PENDIDIKAN</p>
                    <p className="font-bold text-[20px] leading-tight uppercase tracking-wide">
                      {formData.guru1?.dinas?.toUpperCase() || "SMK NEGERI 2 SINGOSARI"}
                    </p>
                    <p className="text-[11px] leading-tight">Jalan Perusahaan No. 20, Tunjungtirto, Singosari, Kab. Malang, Jawa Timur, 65153</p>
                    <p className="text-[11px] leading-tight">Telepon (0341) 4345127</p>
                  </div>
                </div>
                <div className="border-t-[2px] border-black w-full mt-1"></div>
                <div className="border-t-[2px] border-black w-full mt-[1px] mb-4"></div>

                {/* JUDUL SURAT */}
                <div className="text-center my-8">
                  <p className="font-bold text-lg tracking-wide underline decoration-2 mb-2">
                    SURAT TUGAS
                  </p>
                  <p className="text-sm">
                    Nomor: {dataSuratTugas.nomorSurat}
                  </p>
                </div>

                {/* PENUGASAN DENGAN NAMA SEKOLAH DINAMIS */}
                <div className="mb-6 text-sm leading-relaxed">
                  <p>
                    Kepala {formData.guru1?.dinas || "SMK Negeri 2 Singosari"} Dinas Pendidikan Kabupaten Malang menugaskan kepada :
                  </p>
                </div>

                {/* TABEL GURU */}
                <div className="mb-8">
                  <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-center font-bold bg-gray-200">NO</th>
                        <th className="border border-black p-2 text-center font-bold bg-gray-200">NAMA</th>
                        <th className="border border-black p-2 text-center font-bold bg-gray-200">JABATAN</th>
                        <th className="border border-black p-2 text-center font-bold bg-gray-200">DINAS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guruPenugasan.map((guru, index) => (
                        <tr key={guru.id || index}>
                          <td className="border border-black p-2 text-center align-middle">{index + 1}</td>
                          <td className="border border-black p-2 align-middle">{guru.nama || "-"}</td>
                          <td className="border border-black p-2 align-middle">{guru.jabatan || "-"}</td>
                          <td className="border border-black p-2 align-middle">{guru.dinas || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* DETAIL PELAKSANAAN */}
                <div className="space-y-2 mb-8 text-sm">
                  <p><span className="font-bold inline-block w-32">Keperluan</span> <span className="inline-block w-4">:</span> <span className="ml-2">{dataSuratTugas.keperluan}</span></p>
                  <p><span className="font-bold inline-block w-32">Hari / Tanggal</span> <span className="inline-block w-4">:</span> <span className="ml-2">{dataSuratTugas.hariTanggal}</span></p>
                  <p><span className="font-bold inline-block w-32">Waktu</span> <span className="inline-block w-4">:</span> <span className="ml-2">{dataSuratTugas.waktu}</span></p>
                  <p><span className="font-bold inline-block w-32">Tempat</span> <span className="inline-block w-4">:</span> <span className="ml-2">{dataSuratTugas.tempat}</span></p>
                  <p className="flex"><span className="font-bold inline-block w-32 flex-shrink-0">Alamat</span> <span className="inline-block w-4 flex-shrink-0 ml-1">:</span> <span className="ml-2 flex-1">{dataSuratTugas.alamat}</span></p>
                </div>

                {/* PENUTUP */}
                <div className="mb-10 text-sm leading-relaxed">
                  <p>Demikian surat tugas ini dibuat untuk dilaksanakan dengan sebaik-baiknya</p>
                  <p>dan melaporkan hasilnya kepada kepala sekolah.</p>
                </div>

                {/* TANDA TANGAN - Menggunakan tempatSurat dari state */}
                <div className="text-right text-sm">
                  <p className="mb-2 mr-6">{dataSuratTugas.tempatSurat}, {dataSuratTugas.tanggalDibuat}</p>
                  <p className="font-bold mb-20">Kepala {formData.guru1?.dinas || "SMK Negeri 2 Singosari"}</p>
                  <p className="font-bold text-base mb-1 underline mr-10">{dataSuratTugas.namaKepsek}</p>
                  <p className="text-xs mb-1 mr-14">{dataSuratTugas.pangkatGolongan}</p>
                  <p className="text-xs mr-14">NIP. {dataSuratTugas.nipKepsek}</p>
                </div>
              </div>
            </div>

            {/* KOLOM KANAN: FORM EDIT */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Formulir Masukan Surat Tugas
              </h3>

              <div className="space-y-6">
                {/* DATA UMUM */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Data Surat</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nomor Surat <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nomorSurat"
                        value={formData.nomorSurat}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: 800 / 376 / 101.6.9.19 /2025"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Keperluan <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="keperluan"
                        value={formData.keperluan}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="2"
                        placeholder="Contoh: Penjemputan Siswa Praktik Kerja Lapangan (PKL)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Pelaksanaan <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <DatePicker
                          selected={selectedDate}
                          onChange={(date) => setSelectedDate(date)}
                          dateFormat="dd MMMM yyyy"
                          locale={id}
                          className="w-152 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholderText="Pilih tanggal pelaksanaan"
                        />
                        <Calendar className="absolute right-3 top-2.5 text-gray-400" size={18} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {dataSuratTugas.hariTanggal}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Waktu Pelaksanaan <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <select
                            value={selectedStartTime}
                            onChange={(e) => setSelectedStartTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                          >
                            {generateTimeOptions().map(time => (
                              <option key={`start-${time}`} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                          <Clock className="absolute right-3 top-2.5 text-gray-400" size={18} />
                        </div>
                        <span className="text-gray-500">–</span>
                        <div className="relative flex-1">
                          <select
                            value={selectedEndTime}
                            onChange={(e) => setSelectedEndTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                          >
                            <option value="selesai">Selesai</option>
                            {generateTimeOptions().map(time => (
                              <option key={`end-${time}`} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                          <Clock className="absolute right-3 top-2.5 text-gray-400" size={18} />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {dataSuratTugas.waktu}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tempat <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="tempat"
                        value={formData.tempat}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: JOTUN SINGOSARI"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alamat <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="alamat"
                        value={formData.alamat}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Contoh: Jl. Panglima Sudirman No.148 Kavling E2, Pangetan, Kec. Singosari, Kab. Malang, Jawa Timur 65153"
                      />
                    </div>

                    {/* Tempat dan Tanggal Pembuatan Surat dalam satu baris */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tempat Pembuatan <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={tempatSurat}
                            onChange={(e) => setTempatSurat(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: Singosari"
                          />
                          <MapPin className="absolute right-3 top-2.5 text-gray-400" size={18} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tanggal Pembuatan <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <DatePicker
                            selected={tanggalDibuatDate}
                            onChange={(date) => setTanggalDibuatDate(date)}
                            dateFormat="dd MMMM yyyy"
                            locale={id}
                            className="w-74 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholderText="Pilih tanggal"
                          />
                          <Calendar className="absolute right-3 top-2.5 text-gray-400" size={18} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DATA GURU */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Data Guru yang Ditugaskan</h4>
                  <div className="p-3 bg-white rounded border border-gray-200">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Pilih Guru Pembimbing <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.guru1?.guruId || ""}
                          onChange={(e) => handleGuruSelectChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Pilih Guru Pembimbing</option>
                          {guruList.map((guruItem) => (
                            <option key={guruItem.id} value={guruItem.id}>
                              {guruItem.nama}
                            </option>
                          ))}
                        </select>

                        <div className="mt-2">
                          <label className="block text-sm text-gray-600 mb-1">
                            Atau Ketik Manual
                          </label>
                          <input
                            type="text"
                            value={formData.guru1?.nama || ""}
                            onChange={(e) => handleGuruInputChange("nama", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: Triana Ardiani, S.Pd"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Jabatan <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.guru1?.jabatan || ""}
                            onChange={(e) => handleGuruInputChange("jabatan", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: Guru"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Dinas <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.guru1?.dinas || "SMK Negeri 2 Singosari"}
                            onChange={(e) => handleGuruInputChange("dinas", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contoh: SMK Negeri 2 Singosari"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DATA KEPALA SEKOLAH */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Data Kepala Sekolah</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Kepala Sekolah <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="namaKepsek"
                        value={formData.namaKepsek}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: SUMIJAH, S.Pd., M.Si."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pangkat/Golongan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="pangkatGolongan"
                        value={formData.pangkatGolongan}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: Pembina Utama Muda (IV/c)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NIP Kepala Sekolah <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nipKepsek"
                        value={formData.nipKepsek}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: 19700210 199802 2009"
                      />
                    </div>
                  </div>
                </div>

                {/* TOMBOL AKSI */}
                <div className="flex justify-end gap-3 pt-4">
                  {/* <button
                    onClick={handleSaveSuratTugas}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    <Save size={18} />
                    Simpan Surat
                  </button> */}
                  <button
                    onClick={handlePrintPDF}
                    disabled={generatingPDF}
                    className="flex items-center gap-2 px-6 py-3 !bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
                  >
                    <Download size={18} />
                    {generatingPDF ? "Memproses..." : "Unduh PDF"}
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