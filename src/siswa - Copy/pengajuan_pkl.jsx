import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { X, Plus, ArrowLeft, Calendar, User, Users } from "lucide-react";
import DatePicker from "react-datepicker";
import { id } from "date-fns/locale";
import { format } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";

import { getAvailableIndustri } from "../utils/services/siswa/industri";
import { submitPengajuanPKL } from "../utils/services/siswa/pengajuan_pkl";
import { submitGroupPKL } from "../utils/services/siswa/group"; // IMPORT BARU
import { getSiswa } from "../utils/services/admin/get_siswa";
import { getKelas } from "../utils/services/admin/get_kelas";
import { getMyPklGroups } from "../utils/services/siswa/group";

// import assets
import addSidebar from "../assets/addSidebar.svg";
import arrow from "../assets/arrow.svg";
import cancelImg from "../assets/cancel.svg";
import confirmSave from "../assets/cancel.svg";

// import components
import DeleteConfirmationModal from "./components/Cancel";
import SaveConfirmationModal from "./components/Save";

export default function PengajuanPKL() {
  const navigate = useNavigate();

  const [listIndustri, setListIndustri] = useState([]);
  const [listKelompok, setListKelompok] = useState([]);
  const [allKelas, setAllKelas] = useState([]);
  const [allSiswa, setAllSiswa] = useState([]);
  const [filteredSiswa, setFilteredSiswa] = useState([]);
  const [availableSiswa, setAvailableSiswa] = useState([]);

  const [selectedSiswa, setSelectedSiswa] = useState([]);
  const [selectedIndustri, setSelectedIndustri] = useState("");
  const [selectedKelompok, setSelectedKelompok] = useState("");

  const [kategoriPeserta, setKategoriPeserta] = useState("individu");
  const [catatan, setCatatan] = useState("");
  
  const [tanggalMulai, setTanggalMulai] = useState(null);
  const [tanggalSelesai, setTanggalSelesai] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [userData, setUserData] = useState(null);
  const [userKelasId, setUserKelasId] = useState(null);
  const [userJurusanId, setUserJurusanId] = useState(null);
  const [userKelasNama, setUserKelasNama] = useState("");
  const [kelasIdsInJurusan, setKelasIdsInJurusan] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  
  const [dropdownState, setDropdownState] = useState({});
  const [searchQueries, setSearchQueries] = useState({});
  const [selectedLabels, setSelectedLabels] = useState({});
  
  const [studentDropdownState, setStudentDropdownState] = useState({});
  const [studentSearchQueries, setStudentSearchQueries] = useState({});

  /* ================= GET LOGGED-IN USER'S DATA FROM LOCALSTORAGE ================= */
  useEffect(() => {
    try {
      const userDataStr = localStorage.getItem('user');
      
      if (userDataStr) {
        const parsedUser = JSON.parse(userDataStr);
        console.log("👤 User yang login:", parsedUser);
        setUserData(parsedUser);
        setUserKelasId(parsedUser.kelas_id);
      } else {
        toast.error("Data user tidak ditemukan. Silakan login ulang.");
      }
    } catch (err) {
      console.error("Failed to parse user data:", err);
      toast.error("Gagal memuat data user");
    }
  }, []);

  /* ================= FETCH ALL DATA ================= */
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoadingData(true);

        const industriRes = await getAvailableIndustri();
        const industriData = industriRes?.data || industriRes || [];
        const industriList = Array.isArray(industriData) ? industriData : [];
        
        setListIndustri(
          industriList.map((i) => ({
            label: i.name || i.nama || "Unknown",
            value: i.id?.toString() || "",
          })).filter(i => i.value)
        );

        try {
          const kelompokRes = await getMyPklGroups();
          console.log("📊 Data kelompok:", kelompokRes);
          
          let kelompokData = [];
          if (kelompokRes?.data?.data) {
            kelompokData = kelompokRes.data.data;
          } else if (kelompokRes?.data) {
            kelompokData = kelompokRes.data;
          } else if (Array.isArray(kelompokRes)) {
            kelompokData = kelompokRes;
          }
       
          // Format data kelompok dengan struktur yang benar
          setListKelompok(
            kelompokData.map((k) => {
              // Ambil data leader dari members yang is_leader = true
              const leader = k.members?.find(m => m.is_leader)?.siswa || k.leader;
              
              // Filter members untuk mendapatkan anggota biasa (bukan leader)
              const regularMembers = k.members?.filter(m => !m.is_leader) || [];
              
              // Hitung total anggota (leader + members biasa)
              const totalAnggota = (leader ? 1 : 0) + regularMembers.length;
              
              return {
                label: `Kelompok ${k.id}`,
                value: k.id?.toString() || "",
                anggota_count: totalAnggota,
                anggota_count_display: regularMembers.length, // JUMLAH ANGGOTA (TANPA LEADER)
                leader: leader,
                members: k.members || [],
                regular_members: regularMembers,
                display_info: {
                  nama_leader: leader?.nama || (k.leader?.nama || "Belum ada ketua"),
                  anggota_list: regularMembers.map(m => m.siswa?.nama || m.nama || `Siswa ${m.siswa?.id || m.id}`),
                  total_anggota: totalAnggota,
                  total_anggota_tanpa_leader: regularMembers.length
                }
              };
            })
          );
          
          console.log("✅ Kelompok dengan detail anggota:", kelompokData);
        } catch (err) {
          console.error("Gagal fetch kelompok:", err);
          setListKelompok([]);
        }

        const kelasRes = await getKelas();
        let kelasData = [];
        if (kelasRes?.data?.data) {
          kelasData = kelasRes.data.data;
        } else if (kelasRes?.data) {
          kelasData = kelasRes.data;
        } else if (Array.isArray(kelasRes)) {
          kelasData = kelasRes;
        }
        setAllKelas(kelasData);

        const siswaRes = await getSiswa();
        let siswaData = [];
        if (siswaRes?.data?.data) {
          siswaData = siswaRes.data.data;
        } else if (siswaRes?.data) {
          siswaData = siswaRes.data;
        } else if (Array.isArray(siswaRes)) {
          siswaData = siswaRes;
        }
        console.log("📊 Total siswa dari API:", siswaData.length);
        setAllSiswa(siswaData);

      } catch (err) {
        console.error("Failed to fetch data:", err);
        toast.error("Gagal memuat data");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchAllData();
  }, []);

  /* ================= GET USER'S KELAS DETAIL ================= */
  useEffect(() => {
    if (!userKelasId || !allKelas.length) return;

    const userKelas = allKelas.find(k => k.id === userKelasId);
    
    if (userKelas) {
      setUserJurusanId(userKelas.jurusan_id);
      setUserKelasNama(userKelas.nama || "");
      
      const sameJurusanKelas = allKelas.filter(k => k.jurusan_id === userKelas.jurusan_id);
      const kelasIds = sameJurusanKelas.map(k => k.id);
      console.log("📚 Kelas dengan jurusan sama:", sameJurusanKelas.map(k => k.nama));
      setKelasIdsInJurusan(kelasIds);
    }
  }, [userKelasId, allKelas]);

  /* ===== FILTER SISWA BASED ON KELAS IDS DAN EXCLUDE USER YANG LOGIN ===== */
  useEffect(() => {
    if (!kelasIdsInJurusan.length || !allSiswa.length || !userData) {
      setFilteredSiswa([]);
      setAvailableSiswa([]);
      return;
    }

    console.log("🔍 Memfilter siswa...");
    console.log("👤 User ID yang akan di-exclude:", userData.id);

    const filtered = allSiswa.filter(siswa => 
      kelasIdsInJurusan.includes(siswa.kelas_id)
    );
    
    console.log("📊 Siswa dengan jurusan sama (sebelum exclude):", filtered.length);
    
    const available = filtered.filter(siswa => siswa.id !== userData.id);
    
    console.log("📊 Siswa yang tersedia (setelah exclude):", available.length);

    const kelasMap = {};
    allKelas.forEach(k => {
      kelasMap[k.id] = k.nama;
    });

    const formatted = available.map((s) => ({
      label: `${s.nama_lengkap || s.nama} - ${kelasMap[s.kelas_id] || `Kelas ID: ${s.kelas_id}`}`,
      value: s.id.toString(),
      kelas_id: s.kelas_id,
      kelas_nama: kelasMap[s.kelas_id] || `Kelas ID: ${s.kelas_id}`
    }));

    setFilteredSiswa(filtered);
    setAvailableSiswa(formatted);
    setSelectedSiswa([]);
    
  }, [kelasIdsInJurusan, allSiswa, allKelas, userData]);

  /* ================= HANDLER ================= */
  const handleTambahSiswa = () => {
    const newIndex = selectedSiswa.length;
    setSelectedSiswa([...selectedSiswa, ""]);
    setIsChanged(true);
  };

  const handleHapusSiswa = (idx) => {
    const copy = [...selectedSiswa];
    copy.splice(idx, 1);
    setSelectedSiswa(copy);
    
    const newDropdownState = {...studentDropdownState};
    const newSearchState = {...studentSearchQueries};
    delete newDropdownState[idx];
    delete newSearchState[idx];
    setStudentDropdownState(newDropdownState);
    setStudentSearchQueries(newSearchState);
    
    setIsChanged(true);
  };

  const handleSiswaChange = (idx, value, label) => {
    const copy = [...selectedSiswa];
    copy[idx] = value;
    setSelectedSiswa(copy);
    
    setSelectedLabels((prev) => ({
      ...prev,
      [`siswa_${idx}`]: label
    }));
    
    setStudentDropdownState((prev) => ({
      ...prev,
      [idx]: false
    }));
    
    setIsChanged(true);
  };

  const toggleStudentDropdown = (idx) => {
    setStudentDropdownState((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleStudentSearchChange = (idx, value) => {
    setStudentSearchQueries((prev) => ({
      ...prev,
      [idx]: value
    }));
  };

  const handleKategoriChange = (kategori) => {
    setKategoriPeserta(kategori);
    setSelectedKelompok("");
    setTanggalMulai(null);
    setTanggalSelesai(null);
    setSelectedSiswa([]);
    setIsChanged(true);
  };

  const handleIndustriChange = (value, label) => {
    setSelectedIndustri(value);
    setSelectedLabels((prev) => ({
      ...prev,
      industri: label
    }));
    setIsChanged(true);
  };

  const handleKelompokChange = (value, label) => {
    setSelectedKelompok(value);
    setSelectedLabels((prev) => ({
      ...prev,
      kelompok: label
    }));
    setDropdownState((prev) => ({
      ...prev,
      kelompok: false
    }));
    setIsChanged(true);
  };

  const handleCatatanChange = (e) => {
    setCatatan(e.target.value);
    setIsChanged(true);
  };

  const toggleDropdown = (name) => {
    setDropdownState((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleSearchChange = (name, value) => {
    setSearchQueries((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBuatKelompok = () => {
    navigate("/siswa/kelompok");
  };

  const handleSubmit = async () => {
    if (!selectedIndustri) {
      toast.error("Pilih industri dulu");
      return;
    }

    if (kategoriPeserta === "kelompok") {
      if (!selectedKelompok) {
        toast.error("Pilih kelompok atau buat kelompok baru");
        return;
      }
      
      if (!tanggalMulai || !tanggalSelesai) {
        toast.error("Pilih tanggal mulai dan tanggal selesai");
        return;
      }

      if (tanggalSelesai < tanggalMulai) {
        toast.error("Tanggal selesai tidak boleh sebelum tanggal mulai");
        return;
      }

      // KIRIM KE submitGroupPKL
      const payload = {
        catatan: catatan || "",
        industri_id: parseInt(selectedIndustri),
        tanggal_mulai: format(tanggalMulai, "yyyy-MM-dd"),
        tanggal_selesai: format(tanggalSelesai, "yyyy-MM-dd")
      };

      console.log("📤 Submitting group PKL payload:", payload);
      console.log("📤 Group ID:", selectedKelompok);

      try {
        setIsLoading(true);
        await submitGroupPKL(selectedKelompok, payload);
        toast.success("Pengajuan PKL kelompok berhasil");
        navigate(-1);
      } catch (err) {
        console.error("Submit error:", err);
        toast.error(err?.response?.data?.message || err?.message || "Gagal mengirim pengajuan kelompok");
      } finally {
        setIsLoading(false);
      }
      
    } else {
      // INDIVIDU - menggunakan submitPengajuanPKL yang sudah ada
      const payload = {
        kategori_peserta: kategoriPeserta,
        industri_id: parseInt(selectedIndustri),
        kelompok_id: null,
        tanggal_mulai: null,
        tanggal_selesai: null,
        siswa_ids: [],
        catatan: catatan || "",
      };

      console.log("📤 Submitting individual PKL payload:", payload);

      try {
        setIsLoading(true);
        await submitPengajuanPKL(payload);
        toast.success("Pengajuan PKL individu berhasil");
        navigate(-1);
      } catch (err) {
        console.error("Submit error:", err);
        toast.error(err?.message || "Gagal mengirim pengajuan individu");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ========== PERBAIKAN: LANGSUNG KEMBALI TANPA MODAL ==========
  const handleBackClick = (e) => {
    // Mencegah event bubbling ke parent
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Button back diklik - langsung kembali");
    
    // Langsung kembali ke halaman sebelumnya
    navigate(-1);
  };

  const handleResetClick = () => {
    setKategoriPeserta("individu");
    setSelectedIndustri("");
    setSelectedKelompok("");
    setSelectedSiswa([]);
    setTanggalMulai(null);
    setTanggalSelesai(null);
    setCatatan("");
    setSelectedLabels({});
    setStudentDropdownState({});
    setStudentSearchQueries({});
    setIsChanged(false);
  };

  // Custom DatePicker Input
  const CustomDateInput = ({ value, onClick, onChange, placeholder, clearValue }, ref) => {
    const handleInputChange = (e) => {
      let input = e.target.value.replace(/\D/g, "");
      if (input.length > 8) input = input.slice(0, 8);

      let formatted = input;
      if (input.length > 4) {
        formatted = input.slice(0, 2) + "/" + input.slice(2, 4) + "/" + input.slice(4);
      } else if (input.length > 2) {
        formatted = input.slice(0, 2) + "/" + input.slice(2);
      }
      
      e.target.value = formatted;
      onChange(e);
    };

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder || "dd/MM/yyyy"}
          pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{4}$"
          className="w-full pr-7 pt-3 pb-3 pl-7 border rounded-lg focus:ring-2 focus:outline-none border-gray-300 focus:ring-orange-500"
        />
        {value ? (
          <X
            onClick={(e) => {
              e.preventDefault();
              clearValue();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 cursor-pointer"
          />
        ) : (
          <Calendar
            className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 cursor-pointer"
            onClick={onClick}
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen justify-center items-center bg-[#E1D6C4] p-4">
      <div className="flex flex-col w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-lg overflow-hidden">
        
        {/* Header - PERBAIKAN: LANGSUNG KEMBALI */}
        <div className="flex items-center gap-3 px-6 py-4 border-b flex-shrink-0">
          <div
            onClick={handleBackClick}
            className="p-2 rounded-full bg-[#EC933A] hover:bg-orange-600 text-white cursor-pointer"
          >
            <ArrowLeft size={20} />
          </div>
          <h2 className="text-3xl font-bold">Pengajuan PKL</h2>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Sidebar */}
          <div className="hidden md:flex w-1/2 items-center justify-center border-r p-4">
            <img
              src={addSidebar}
              alt="addSidebar"
              className="max-w-xs w-full h-auto object-contain"
            />
          </div>

          {/* Right Form */}
          <div className="flex w-full md:w-1/2 overflow-hidden">
            <div className="w-full p-8 overflow-y-auto space-y-6">
              
              {/* Kategori Peserta */}
              <div>
                <label className="block mb-3 text-sm font-bold text-gray-700">
                  Kategori Peserta
                </label>
                <div className="flex gap-4">
                  {[
                    { 
                      value: "individu", 
                      title: "Individu", 
                      desc: "Pilih untuk 1 siswa",
                      icon: User
                    },
                    { 
                      value: "kelompok", 
                      title: "Kelompok", 
                      desc: "Pilih untuk kelompok yang sudah dibuat",
                      icon: Users
                    }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.value}
                        onClick={() => handleKategoriChange(item.value)}
                        className={`flex-1 p-4 rounded-xl cursor-pointer transition-all ${
                          kategoriPeserta === item.value
                            ? " bg-[#FDF0EE]"
                            : " bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon 
                            className={`mt-3 w-6 h-6 ${
                              kategoriPeserta === item.value ? "text-[#641E20]" : "text-gray-600"
                            }`} 
                          />
                          <div>
                            <h3 className={`font-semibold ${
                              kategoriPeserta === item.value ? "text-[#641E20]" : "text-gray-700"
                            }`}>
                              {item.title}
                            </h3>
                            <p className={`text-sm mt-1 ${
                              kategoriPeserta === item.value ? "text-[#641E20]" : "text-gray-500"
                            }`}>
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Industri - Dropdown with search */}
              <div className="relative">
                <label className="block mb-1 text-sm font-bold text-gray-700">
                  Nama Industri
                </label>
                <div className="relative w-full">
                  {/* Trigger */}
                  <div
                    onClick={() => toggleDropdown("industri")}
                    className="cursor-pointer border border-[#C9CFCF] rounded-lg px-4 py-4 bg-white text-sm flex justify-between items-center"
                  >
                    {selectedLabels.industri || "Pilih Industri"}
                    <img
                      src={arrow}
                      alt="arrow"
                      className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                        dropdownState.industri ? "rotate-180" : "rotate-0"
                      }`}
                    />
                  </div>

                  {dropdownState.industri && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border-2 border-[#C9CFCF] rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
                      {/* Input Search */}
                      <input
                        type="text"
                        placeholder="Cari Industri..."
                        className="w-full px-3 py-2 border-b text-sm focus:outline-none"
                        value={searchQueries.industri || ""}
                        onChange={(e) => handleSearchChange("industri", e.target.value)}
                      />

                      <ul className="max-h-48 overflow-y-auto">
                        {listIndustri
                          .filter((opt) =>
                            opt.label
                              .toLowerCase()
                              .includes((searchQueries.industri || "").toLowerCase())
                          )
                          .map((opt) => (
                            <li
                              key={opt.value}
                              onClick={() => {
                                handleIndustriChange(opt.value, opt.label);
                                setDropdownState((prev) => ({
                                  ...prev,
                                  industri: false,
                                }));
                                handleSearchChange("industri", "");
                              }}
                              className="px-4 py-2 cursor-pointer hover:bg-orange-50"
                            >
                              {opt.label}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Mode Kelompok */}
              {kategoriPeserta === "kelompok" && (
                <>
                  {/* Dropdown Nama Kelompok dengan informasi detail */}
                  <div className="relative">
                    <label className="block mb-1 text-sm font-bold text-gray-700">
                      Nama Kelompok
                    </label>
                    <div className="relative w-full">
                      <div
                        onClick={() => toggleDropdown("kelompok")}
                        className="cursor-pointer border border-[#C9CFCF] rounded-lg px-4 py-4 bg-white text-sm flex justify-between items-center"
                      >
                        {selectedLabels.kelompok || "Pilih Kelompok"}
                        <img
                          src={arrow}
                          alt="arrow"
                          className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                            dropdownState.kelompok ? "rotate-180" : "rotate-0"
                          }`}
                        />
                      </div>

                      {dropdownState.kelompok && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border-2 border-[#C9CFCF] rounded-lg shadow-lg max-h-80 overflow-y-auto z-20">
                          {/* Input Search */}
                          <input
                            type="text"
                            placeholder="Cari Kelompok..."
                            className="w-full px-3 py-2 border-b text-sm focus:outline-none sticky top-0 bg-white"
                            value={searchQueries.kelompok || ""}
                            onChange={(e) => handleSearchChange("kelompok", e.target.value)}
                          />

                          <ul className="max-h-60 overflow-y-auto">
                            {listKelompok.length > 0 ? (
                              listKelompok
                                .filter((opt) =>
                                  opt.label
                                    .toLowerCase()
                                    .includes((searchQueries.kelompok || "").toLowerCase())
                                )
                                .map((opt) => (
                                  <li
                                    key={opt.value}
                                    onClick={() => {
                                      handleKelompokChange(opt.value, `Kelompok #${opt.value}`);
                                    }}
                                    className="px-4 py-3 cursor-pointer hover:bg-orange-50 border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="flex flex-col gap-2">
                                    
                                      {/* Header Kelompok */}
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-900">
                                          Kelompok #{opt.value}
                                        </span>
                                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                          {opt.regular_members.length} Anggota 
                                        </span>
                                      </div>
                                      
                                      {/* Informasi Ketua Kelompok */}
                                      {opt.leader && (
                                        <div className="text-xs bg-blue-50 p-2 rounded-lg">
                                          <span className="font-medium text-blue-700">Ketua Kelompok:</span>
                                          <div className="mt-1 text-blue-600">
                                            <div>{opt.leader.nama}</div>
                                            <div className="text-blue-400 text-[10px]">NISN: {opt.leader.nisn} | {opt.leader.kelas}</div>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Daftar Anggota (tanpa leader) */}
                                      {opt.regular_members && opt.regular_members.length > 0 && (
                                        <div className="text-xs">
                                          <span className="font-medium text-gray-600">Anggota:</span>
                                          <div className="pl-2 mt-1 space-y-1.5">
                                            {opt.regular_members.slice(0, 3).map((member, idx) => (
                                              <div key={member.siswa?.id || idx} className="flex flex-col border-l-2 border-gray-200 pl-2">
                                                <span className="font-medium text-gray-700">
                                                  {member.siswa?.nama || member.nama}
                                                </span>
                                                <span className="text-gray-400 text-[10px]">
                                                  NISN: {member.siswa?.nisn || member.nisn} | {member.siswa?.kelas || member.kelas}
                                                </span>
                                              </div>
                                            ))}
                                            {opt.regular_members.length > 3 && (
                                              <div className="text-gray-400 italic text-[10px] pl-2">
                                                +{opt.regular_members.length - 3} anggota lainnya
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Status Industri */}
                                      <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                        <span className={`inline-block w-2 h-2 rounded-full ${
                                          opt.industri?.id ? 'bg-green-500' : 'bg-yellow-500'
                                        }`}></span>
                                        {opt.industri?.id ? `Industri: ${opt.industri.nama}` : 'Belum pilih industri'}
                                      </div>
                                    </div>
                                  </li>
                                ))
                            ) : (
                              // Tampilkan pesan jika tidak ada kelompok
                              <li className="px-4 py-6 text-gray-500 text-center">
                                <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>Belum ada kelompok yang tersedia</p>
                                <p className="text-xs mt-1">Buat kelompok baru untuk memulai</p>
                              </li>
                            )}
                            
                            {/* Option untuk membuat kelompok baru - selalu ditampilkan */}
                            <li
                              onClick={handleBuatKelompok}
                              className="px-4 py-3 cursor-pointer hover:bg-orange-50 border-t-2 border-orange-200 bg-orange-50 text-orange-600 font-medium flex items-center gap-2 sticky bottom-0"
                            >
                              <Plus size={18} />
                              <span>Buat Kelompok Baru</span>
        
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {listKelompok.length > 0 && (
                    <div className="mt-1 text-xs text-gray-500 flex items-center gap-1 bg-blue-50 p-2 rounded-lg">
                      <span>Untuk membuat kelompok baru, Anda harus keluar dari kelompok saat ini terlebih dahulu melalui halaman Kelompok Saya</span>
                    </div>
                  )}
                  
                  {/* Tanggal Mulai dan Tanggal Selesai */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-bold text-gray-700">
                        Tanggal Mulai
                      </label>
                      <DatePicker
                        selected={tanggalMulai}
                        onChange={(date) => {
                          setTanggalMulai(date);
                          setIsChanged(true);
                        }}
                        dateFormat="dd/MM/yyyy"
                        locale={id}
                        placeholderText="dd/MM/yyyy"
                        customInput={<CustomDateInput />}
                        minDate={new Date()}
                        className="w-full "
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-bold text-gray-700">
                        Tanggal Selesai
                      </label>
                      <DatePicker
                        selected={tanggalSelesai}
                        onChange={(date) => {
                          setTanggalSelesai(date);
                          setIsChanged(true);
                        }}
                        dateFormat="dd/MM/yyyy"
                        locale={id}
                        placeholderText="dd/MM/yyyy"
                        customInput={<CustomDateInput />}
                        minDate={tanggalMulai || new Date()}
                        className="w-full"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Catatan */}
              <div>
                <label className="block mb-1 text-sm font-bold text-gray-700">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={catatan}
                  onChange={handleCatatanChange}
                  className="w-full p-4 border border-[#C9CFCF] rounded-lg bg-white
                    focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                  placeholder="Tambahkan catatan jika diperlukan..."
                  rows="4"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-4 flex-shrink-0">
          <button
            type="button"
            onClick={handleResetClick}
            className="button-radius"
            style={{
              "--btn-bg": "#3A3D3D",
              "--btn-active": "#5d6464ff",
              "--btn-text": "white",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#5d6464ff"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#3A3D3D"}
          >
            Atur Ulang
          </button>

          <button
            type="button"
            onClick={() => setIsSaveModalOpen(true)}
            disabled={isLoading || isLoadingData}
            className="button-radius"
            style={{
              "--btn-bg": "#EC933A",
              "--btn-active": "#f4d0adff",
              "--btn-text": "white",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#f4d0adff"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#EC933A"}
          >
            {isLoading ? "Mengirim..." : "Simpan"}
          </button>
        </div>

        {/* Modals - Hanya save modal yang masih dipakai */}
        <SaveConfirmationModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onConfirm={() => {
            setIsSaveModalOpen(false);
            handleSubmit();
          }}
          imageSrc={confirmSave}
          title="Apakah Anda yakin ingin menyimpan data ini?"
          subtitle="Pastikan semua data sudah benar sebelum disimpan."
        />
      </div>
    </div>
  );
}