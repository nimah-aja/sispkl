import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { X, Plus, ArrowLeft, Eye, EyeOff, Calendar, User, Users } from "lucide-react";
import DatePicker from "react-datepicker";
import { id } from "date-fns/locale";
import { format } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";

import { getAvailableIndustri } from "../utils/services/siswa/industri";
import { submitPengajuanPKL } from "../utils/services/siswa/pengajuan_pkl";
import { getSiswa } from "../utils/services/admin/get_siswa";
import { getKelas } from "../utils/services/admin/get_kelas";

// import assets
import addSidebar from "../assets/addSidebar.svg";
import arrow from "../assets/arrow.svg";
import cancelImg from "../assets/cancel.svg";
import confirmSave from "../assets/cancel.svg";
import silang from "../assets/silang.svg";

// import components
import DeleteConfirmationModal from "./components/Cancel";
import SaveConfirmationModal from "./components/Save";

export default function PengajuanPKL() {
  const navigate = useNavigate();

  const [listIndustri, setListIndustri] = useState([]);
  const [allKelas, setAllKelas] = useState([]);
  const [allSiswa, setAllSiswa] = useState([]);
  const [filteredSiswa, setFilteredSiswa] = useState([]);
  const [availableSiswa, setAvailableSiswa] = useState([]); // Siswa yang bisa dipilih (tanpa user yang login)

  const [selectedSiswa, setSelectedSiswa] = useState([]);
  const [selectedIndustri, setSelectedIndustri] = useState("");

  const [kategoriPeserta, setKategoriPeserta] = useState("individu");
  const [catatan, setCatatan] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // User data from localStorage
  const [userData, setUserData] = useState(null);
  const [userKelasId, setUserKelasId] = useState(null);
  const [userJurusanId, setUserJurusanId] = useState(null);
  const [userKelasNama, setUserKelasNama] = useState("");
  const [kelasIdsInJurusan, setKelasIdsInJurusan] = useState([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  
  // Dropdown states
  const [dropdownState, setDropdownState] = useState({});
  const [searchQueries, setSearchQueries] = useState({});
  const [selectedLabels, setSelectedLabels] = useState({});
  
  // Student dropdown states untuk setiap baris
  const [studentDropdownState, setStudentDropdownState] = useState({});
  const [studentSearchQueries, setStudentSearchQueries] = useState({});

  // Date states
  const [dateValues, setDateValues] = useState({});

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

        // Fetch industri
        const industriRes = await getAvailableIndustri();
        const industriData = industriRes?.data || industriRes || [];
        const industriList = Array.isArray(industriData) ? industriData : [];
        
        setListIndustri(
          industriList.map((i) => ({
            label: i.name || i.nama || "Unknown",
            value: i.id?.toString() || "",
          })).filter(i => i.value)
        );

        // Fetch all kelas
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

        // Fetch all siswa
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

    // Filter siswa berdasarkan kelas_id yang sama jurusan
    const filtered = allSiswa.filter(siswa => 
      kelasIdsInJurusan.includes(siswa.kelas_id)
    );
    
    console.log("📊 Siswa dengan jurusan sama (sebelum exclude):", filtered.length);
    
    // Exclude user yang sedang login
    const available = filtered.filter(siswa => siswa.id !== userData.id);
    
    console.log("📊 Siswa yang tersedia (setelah exclude):", available.length);
    console.log("❌ User yang di-exclude:", filtered.find(s => s.id === userData.id)?.nama_lengkap || "Tidak ditemukan");

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
    
    // Hapus juga state dropdown untuk siswa yang dihapus
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
    
    // Update selected labels
    setSelectedLabels((prev) => ({
      ...prev,
      [`siswa_${idx}`]: label
    }));
    
    // Tutup dropdown setelah memilih
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

  const handleSubmit = async () => {
    if (!selectedIndustri) {
      toast.error("Pilih industri dulu");
      return;
    }

    if (kategoriPeserta === "kelompok" && selectedSiswa.filter(Boolean).length === 0) {
      toast.error("Pilih minimal satu siswa");
      return;
    }

    const payload = {
      kategori_peserta: kategoriPeserta,
      industri_id: parseInt(selectedIndustri),
      siswa_ids: kategoriPeserta === "kelompok" 
        ? selectedSiswa.filter(Boolean).map(Number)
        : [],
      catatan: catatan || "",
    };

    console.log("📤 Submitting payload:", payload);

    try {
      setIsLoading(true);
      await submitPengajuanPKL(payload);
      toast.success("Pengajuan PKL berhasil");
      navigate(-1);
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err?.message || "Gagal mengirim pengajuan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelClick = () => {
    let title = "Apakah Anda yakin untuk kembali?";
    let subtitle = "Data yang sudah diisi akan terhapus.";

    if (!isChanged) {
      title = "Kembali tanpa menambah data?";
      subtitle = "Anda belum mengisi data apapun.";
    } else if (isChanged) {
      title = "Apakah Anda yakin ingin membatalkan penambahan data?";
      subtitle = "Data yang telah diisi akan hilang.";
    }

    setModalText({ title, subtitle });
    setIsModalOpen(true);
  };

  const handleResetClick = () => {
    setKategoriPeserta("individu");
    setSelectedIndustri("");
    setSelectedSiswa([]);
    setCatatan("");
    setSelectedLabels({});
    setStudentDropdownState({});
    setStudentSearchQueries({});
    setIsChanged(false);
  };

  // Date Input component
  const DateInput = React.forwardRef(
    ({ value, onClick, onChange, placeholder, clearValue }, ref) => {
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
            className="min-w-[250px] w-full p-3 border rounded-lg focus:ring-2 focus:outline-none border-gray-300 focus:ring-orange-500"
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
    }
  );

  // Modal text
  const [modalText, setModalText] = useState({
    title: "Apakah Anda yakin untuk kembali?",
    subtitle: "Data yang sudah diisi akan terhapus."
  });

  return (
    <div className="flex h-screen w-screen justify-center items-center bg-[#E1D6C4] p-4">
      <div className="flex flex-col w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b flex-shrink-0">
          <div
            onClick={handleCancelClick}
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
              {/* <div>
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
                        desc: "Pilih untuk beberapa siswa",
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
                </div> */}

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

              {/* Info Kelas User */}
              {/* {userKelasNama && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Kelas Anda:</span> {userKelasNama}
                  </p>
                  {userJurusanId && (
                    <p className="text-xs text-blue-600 mt-1">
                      {kelasIdsInJurusan.length} kelas dengan jurusan sama | {availableSiswa.length} siswa tersedia 
                    </p>
                  )}
                </div>
              )} */}

              {/* Siswa - Only for kelompok mode */}
              {kategoriPeserta === "kelompok" && (
                <div>
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    Pilih Siswa
                    {availableSiswa.length > 0 && (
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        ({availableSiswa.length} siswa tersedia)
                      </span>
                    )}
                  </label>

                  {selectedSiswa.map((val, idx) => (
                    <div key={idx} className="relative mb-2">
                      <div className="flex gap-2">
                        {/* Student Dropdown Trigger */}
                        <div className="flex-1">
                          <div
                            onClick={() => toggleStudentDropdown(idx)}
                            className="cursor-pointer border border-[#C9CFCF] rounded-lg px-4 py-4 bg-white text-sm flex justify-between items-center"
                          >
                            {selectedLabels[`siswa_${idx}`] || "Pilih Siswa"}
                            <img
                              src={arrow}
                              alt="arrow"
                              className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                                studentDropdownState[idx] ? "rotate-180" : "rotate-0"
                              }`}
                            />
                          </div>

                          {studentDropdownState[idx] && (
                            <div className="absolute left-0 right-0 mt-1 bg-white border-2 border-[#C9CFCF] rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
                              {/* Input Search */}
                              <input
                                type="text"
                                placeholder="Cari Siswa..."
                                className="w-full px-3 py-2 border-b text-sm focus:outline-none"
                                value={studentSearchQueries[idx] || ""}
                                onChange={(e) => handleStudentSearchChange(idx, e.target.value)}
                              />

                              <ul className="max-h-48 overflow-y-auto">
                                {availableSiswa
                                  .filter((opt) =>
                                    opt.label
                                      .toLowerCase()
                                      .includes((studentSearchQueries[idx] || "").toLowerCase())
                                  )
                                  .map((opt) => (
                                    <li
                                      key={opt.value}
                                      onClick={() => {
                                        handleSiswaChange(idx, opt.value, opt.label);
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

                        <button 
                          onClick={() => handleHapusSiswa(idx)}
                          className="!bg-transparent p-4 text-red-600 hover:text-red-800 transition-colors flex-shrink-0 border border-[#C9CFCF] rounded-lg"
                          type="button"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleTambahSiswa}
                    className="!bg-[#1447E6] flex items-center gap-2 text-white hover:text-[#831e20] transition-colors mt-2"
                    type="button"
                    disabled={isLoadingData || availableSiswa.length === 0}
                  >
                    <Plus size={20} /> Tambah siswa
                  </button>

                  {!isLoadingData && availableSiswa.length === 0 && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Tidak ada siswa lain yang tersedia untuk jurusan Anda.
                      </p>
                    </div>
                  )}
                </div>
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

        {/* Modals */}
        <DeleteConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onDelete={() => {
            setIsModalOpen(false);
            navigate(-1);
          }}
          imageSrc={cancelImg}
          title={modalText.title}
          subtitle={modalText.subtitle}
        />

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