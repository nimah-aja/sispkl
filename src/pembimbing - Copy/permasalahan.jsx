import React, { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from 'dayjs';
import { useNavigate, useLocation } from 'react-router-dom';

import { getGuruSiswa } from "../utils/services/pembimbing/guru";
import { createStudentIssue, getMyStudentIssues, updateStudentIssue } from "../utils/services/pembimbing/permasalahan";

import Add from "./components/Add";
import Detail from "./components/Detail";
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Pagination from "./components/Pagination";

import editGrafik from "../assets/editGrafik.svg";

export default function DataPermasalahanSiswa() {
  const navigate = useNavigate();
  const location = useLocation();
  const exportRef = useRef(null);

  const [openExport, setOpenExport] = useState(false);
  const [active, setActive] = useState("permasalahan");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [dataPermasalahan, setDataPermasalahan] = useState([]);
  const [mode, setMode] = useState("list"); // list | add | edit | detail | process | resolve
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailMode, setDetailMode] = useState("view");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState(null); // Untuk loading state button

  const [siswaOptions, setSiswaOptions] = useState([]);
  // Map berdasarkan siswa_id untuk mendapatkan data industri
  const [siswaMapById, setSiswaMapById] = useState(new Map()); // Untuk mapping siswa_id -> data industri

  const itemsPerPage = 10;

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Pembimbing",
  };

  // Opsi kategori yang sudah ditentukan
  const kategoriOptions = [
    { label: "Kedisiplinan", value: "kedisiplinan" },
    { label: "Absensi", value: "absensi" },
    { label: "Performa", value: "performa" },
    { label: "Lainnya", value: "lainnya" },
  ];

  // Fungsi untuk mendapatkan mode dari URL
  const getModeFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('mode') || 'list';
  };

  // Fungsi untuk mendapatkan selected ID dari URL
  const getSelectedIdFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('id');
  };

  // Effect untuk sinkronisasi mode dari URL
  useEffect(() => {
    const urlMode = getModeFromUrl();
    setMode(urlMode);
  }, [location.search]);

  // Effect untuk mencari selectedItem berdasarkan ID dari URL
  useEffect(() => {
    const selectedId = getSelectedIdFromUrl();
    if (selectedId && dataPermasalahan.length > 0) {
      const item = dataPermasalahan.find(i => i.id === parseInt(selectedId));
      if (item) {
        setSelectedItem(item);
      } else {
        // Jika item tidak ditemukan, redirect ke list
        handleModeChange('list');
      }
    }
  }, [dataPermasalahan, location.search]);

  // Fungsi untuk mengubah mode dan update URL
  const handleModeChange = (newMode, item = null) => {
    const params = new URLSearchParams(location.search);
    params.set('mode', newMode);
    
    if (item) {
      params.set('id', item.id);
      setSelectedItem(item);
    } else {
      params.delete('id');
      setSelectedItem(null);
    }
    
    // Reset detail mode jika pindah ke mode lain
    if (newMode !== 'detail') {
      setDetailMode('view');
    }
    
    navigate(`${location.pathname}?${params.toString()}`);
  };

  // Fungsi untuk format tanggal dengan jam
  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(/\//g, '-');
  };

  // Fungsi untuk mendapatkan label tanggal (Hari Ini, Kemarin, atau format DD MMM YYYY)
  const getDateLabel = (date) => {
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    if (dateStr === today) return "Hari Ini";
    if (dateStr === yesterday) return "Kemarin";
    return dayjs(date).format('DD MMM YYYY');
  };

  // Fungsi untuk mendapatkan inisial dari nama
  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.split(" ");
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  // Fungsi untuk mendapatkan warna berdasarkan nama (konsisten)
  const getColorFromName = (name) => {
    if (!name) return "bg-gray-500";
    
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", 
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
      "bg-orange-500", "bg-cyan-500", "bg-emerald-500", "bg-violet-500"
    ];
    
    // Hitung hash sederhana dari nama untuk mendapatkan indeks warna yang konsisten
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  /* =====================
     FETCH DATA PERMASALAHAN DARI API
  ===================== */
  const fetchPermasalahan = async () => {
    setLoading(true);
    try {
      const response = await getMyStudentIssues();
      console.log("Permasalahan response:", response);
      
      // Ambil items dari response
      const issues = response?.items || [];
      
      // Mapping data dari API ke format yang digunakan komponen
      const mappedIssues = issues.map((item) => {
        // Dapatkan data industri dari map berdasarkan siswa_id
        const siswaData = siswaMapById.get(item.siswa?.id);
        
        return {
          id: item.id,
          judul: item.judul,
          deskripsi: item.deskripsi,
          kategori: item.kategori,
          siswa_id: item.siswa?.id,
          siswa_nama: item.siswa?.nama || "-",
          siswa_nisn: item.siswa?.nisn || "-",
          pembimbing_id: item.pembimbing?.id,
          pembimbing_nama: item.pembimbing?.nama || "-",
          status: item.status || "opened",
          tindak_lanjut: item.tindak_lanjut || "-",
          created_at: item.created_at,
          resolved_at: item.resolved_at,
          // Format untuk tampilan
          nama: item.siswa?.nama || item.judul,
          masalah: item.deskripsi,
          tanggal: formatDateTime(item.created_at), // Dengan jam
          tanggal_disetujui: formatDateTime(item.resolved_at), // Dengan jam
          // Untuk grouping by date
          dateKey: dayjs(item.created_at).format('YYYY-MM-DD'),
          timeLabel: dayjs(item.created_at).format('HH:mm'),
          // Ambil industri dari siswaMapById
          industri: siswaData?.industri_nama || "Industri tidak ditemukan",
        };
      });
      
      setDataPermasalahan(mappedIssues);
    } catch (error) {
      console.error("Gagal fetch permasalahan:", error);
      toast.error("Gagal memuat data permasalahan");
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     LOAD SISWA DARI getGuruSiswa
  ===================== */
  useEffect(() => {
    const fetchSiswa = async () => {
      try {
        const response = await getGuruSiswa();
        console.log("Guru Siswa response:", response);
        
        // Response memiliki struktur { data: [...], total: number }
        const siswaData = response.data || [];
        
        // Map untuk opsi dropdown (berdasarkan nama)
        const siswaOptionsTemp = [];
        // Map berdasarkan ID siswa untuk mendapatkan data industri
        const siswaMapByIdTemp = new Map();
        
        siswaData.forEach(item => {
          // Cegah duplikasi berdasarkan nama untuk dropdown
          if (!siswaMapByIdTemp.has(item.siswa_id)) {
            siswaOptionsTemp.push({
              label: `${item.siswa_nama}`,
              value: item.siswa_nama, // Value berupa NAMA untuk dropdown
            });
          }
          
          // Simpan mapping berdasarkan siswa_id (untuk mengambil data industri)
          // Gunakan siswa_id sebagai key
          siswaMapByIdTemp.set(item.siswa_id, {
            id: item.siswa_id,
            industri_id: item.industri_id,
            industri_nama: item.industri_nama,
            username: item.siswa_username,
            nama: item.siswa_nama,
            tanggal_mulai: item.tanggal_mulai,
            tanggal_selesai: item.tanggal_selesai,
            status: item.status,
          });
        });

        setSiswaOptions(siswaOptionsTemp);
        setSiswaMapById(siswaMapByIdTemp);

        // Update data permasalahan dengan industri dari mapping berdasarkan siswa_id
        setDataPermasalahan(prev => {
          return prev.map(item => {
            // Cari data siswa berdasarkan siswa_id
            const siswaData = siswaMapByIdTemp.get(item.siswa_id);
            
            return {
              ...item,
              industri: siswaData?.industri_nama || "Industri tidak ditemukan"
            };
          });
        });

      } catch (e) {
        console.error("Gagal fetch guru siswa:", e);
        toast.error("Gagal memuat data siswa");
      }
    };

    fetchSiswa(); // Fetch siswa dari getGuruSiswa
  }, []);

  // Fetch permasalahan setelah siswaMapById tersedia
  useEffect(() => {
    if (siswaMapById.size > 0) {
      fetchPermasalahan();
    }
  }, [siswaMapById]);

  /* =====================
     FILTER & PAGINATION
  ===================== */
  const filteredData = dataPermasalahan.filter((i) => {
    const q = search.toLowerCase();
    return (
      (i.nama?.toLowerCase() || "").includes(q) ||
      (i.judul?.toLowerCase() || "").includes(q) ||
      (i.industri?.toLowerCase() || "").includes(q) ||
      (i.kategori?.toLowerCase() || "").includes(q)
    );
  });

  // Urutkan berdasarkan created_at descending (terbaru di atas)
  const sortedData = [...filteredData].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* =====================
     FUNGSI UNTUK RENDER GROUP BERDASARKAN STATUS
  ===================== */
  const renderGroupByStatus = (title, statuses, showButton = true) => {
    // Filter data berdasarkan status
    const submissions = paginatedData.filter(item => statuses.includes(item.status));
    
    if (submissions.length === 0) return null;

    // Group by date
    const groupedByDate = {};
    submissions.forEach(item => {
      const dateKey = dayjs(item.created_at).format('YYYY-MM-DD');
      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
      groupedByDate[dateKey].push(item);
    });

    // Sort dates descending
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
      dayjs(b).unix() - dayjs(a).unix()
    );

    return (
      <div className="mb-8">
        <div className="mb-3">
          <h3 className="text-white font-bold text-lg border-b border-white/20 pb-2">
            {title}
          </h3>
        </div>
        
        {sortedDates.map(dateKey => {
          const dateItems = groupedByDate[dateKey];
          const dateLabel = getDateLabel(dateKey);

          return (
            <div key={dateKey} className="mb-4">
              {/* DATE LABEL */}
              <div className="text-white font-semibold mb-2">
                {dateLabel}
              </div>
              
              {/* ITEMS FOR THIS DATE */}
              {dateItems.map(item => (
                <div 
                  key={item.id}
                  className="bg-white rounded-xl p-4 hover:shadow-md transition-all cursor-pointer mb-2"
                  onClick={() => handleModeChange("detail", item)}
                >
                  <div className="flex items-start gap-4">
                    {/* Lingkaran dengan inisial - Paling Kiri */}
                    <div className={`w-12 h-12 rounded-full ${getColorFromName(item.nama)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                      {getInitials(item.nama)}
                    </div>

                    {/* Bagian Tengah - Informasi */}
                    <div className="flex-1">
                      {/* Baris atas: Nama Siswa - Industri */}
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm">{item.nama}</h3>
                        <span className="text-xs text-gray-500">
                          - {item.industri}
                        </span>
                      </div>
                      
                      {/* Baris tengah: Kategori + Judul */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                          {getKategoriLabel(item.kategori)}
                        </span>
                        <p className="text-sm font-medium text-gray-700">
                          {item.judul}
                        </p>
                      </div>
                    </div>

                    {/* Bagian Kanan - Conditional berdasarkan status */}
                    <div
                      className="self-start"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.status === "resolved" ? (
                        // Status Selesai -> Badge Selesai
                        <span className={`px-4 py-2 text-sm rounded-full ${getStatusColor(item.status)}`}>
                          Selesai
                        </span>
                      ) : item.status === "in_progress" ? (
                        // Status Dalam Proses -> Button Selesaikan (jika showButton true)
                        showButton ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleModeChange("resolve", item);
                            }}
                            className="px-4 py-2 text-sm rounded !bg-green-600 text-white hover:bg-green-700"
                            disabled={processingId === item.id}
                          >
                            {processingId === item.id ? "Memproses..." : "Selesaikan"}
                          </button>
                        ) : (
                          <span className={`px-4 py-2 text-sm rounded-full ${getStatusColor(item.status)}`}>
                            Dalam Proses
                          </span>
                        )
                      ) : (
                        // Status opened (Proses) -> Button Proses (jika showButton true)
                        showButton ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleModeChange("process", item);
                            }}
                            className="px-4 py-2 text-sm rounded !bg-blue-500 text-white hover:bg-blue-600"
                            disabled={processingId === item.id}
                          >
                            {processingId === item.id ? "Memproses..." : "Proses"}
                          </button>
                        ) : (
                          <span className={`px-4 py-2 text-sm rounded-full bg-gray-100 text-gray-600`}>
                            Proses
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  /* =====================
     ACTIONS
  ===================== */
  const handleDelete = async (item) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) {
      return;
    }
    
    // TODO: Implement delete API jika tersedia
    setDataPermasalahan(prev => prev.filter(i => i.id !== item.id));
    toast.success("Data berhasil dihapus");
    handleModeChange("list");
  };

  const handleAddSubmit = async (formData) => {
    try {
      const raw = Object.fromEntries(formData);
      
      // Validasi
      if (!raw.nama) {
        toast.error("Pilih siswa terlebih dahulu");
        return;
      }

      if (!raw.judul) {
        toast.error("Judul harus diisi");
        return;
      }

      if (!raw.masalah) {
        toast.error("Deskripsi masalah harus diisi");
        return;
      }

      if (!raw.kategori) {
        toast.error("Pilih kategori");
        return;
      }
      
      // Cari siswa_id berdasarkan nama dari siswaMapById
      let siswaId = null;
      for (const [id, data] of siswaMapById.entries()) {
        if (data.nama === raw.nama) {
          siswaId = id;
          break;
        }
      }
      
      if (!siswaId) {
        toast.error("Data siswa tidak ditemukan");
        return;
      }
      
      // Payload sesuai API
      const payload = {
        deskripsi: raw.masalah,
        judul: raw.judul,
        kategori: raw.kategori,
        siswa_id: siswaId,
      };
      
      console.log("Creating issue with payload:", payload);
      
      // Panggil API
      const response = await createStudentIssue(payload);
      console.log("Create issue response:", response);
      
      // Refresh data
      await fetchPermasalahan();
      
      toast.success("Permasalahan berhasil dilaporkan");
      handleModeChange("list");
    } catch (error) {
      console.error("Gagal menambah permasalahan:", error);
      toast.error(error?.message || "Gagal menambah permasalahan");
    }
  };

  const handleEditSubmit = async (formData) => {
    try {
      const raw = Object.fromEntries(formData);
      
      // Validasi
      if (!raw.deskripsi) {
        toast.error("Deskripsi harus diisi");
        return;
      }

      if (!raw.status) {
        toast.error("Status harus dipilih");
        return;
      }

      if (!raw.tindak_lanjut) {
        toast.error("Tindak lanjut harus diisi");
        return;
      }
      
      // Payload sesuai API
      const payload = {
        deskripsi: raw.deskripsi,
        status: raw.status,
        tindak_lanjut: raw.tindak_lanjut,
      };
      
      console.log("Updating issue with payload:", payload);
      
      // Panggil API update
      const response = await updateStudentIssue(selectedItem.id, payload);
      console.log("Update issue response:", response);
      
      // Refresh data
      await fetchPermasalahan();
      
      toast.success("Data berhasil diupdate");
      handleModeChange("list");
    } catch (error) {
      console.error("Gagal update permasalahan:", error);
      toast.error(error?.message || "Gagal mengupdate data");
    }
  };

  // Fungsi untuk handle proses (status menjadi in_progress)
  const handleProcessSubmit = async (formData) => {
    try {
      const raw = Object.fromEntries(formData);
      
      // Validasi
      if (!raw.deskripsi) {
        toast.error("Deskripsi harus diisi");
        return;
      }

      if (!raw.tindak_lanjut) {
        toast.error("Tindak lanjut harus diisi");
        return;
      }
      
      // Payload untuk status in_progress
      const payload = {
        deskripsi: raw.deskripsi,
        status: "in_progress",
        tindak_lanjut: raw.tindak_lanjut,
      };
      
      console.log("Processing issue with payload:", payload);
      
      setProcessingId(selectedItem.id);
      
      // Panggil API update
      const response = await updateStudentIssue(selectedItem.id, payload);
      console.log("Process issue response:", response);
      
      // Refresh data
      await fetchPermasalahan();
      
      toast.success("Permasalahan sedang diproses");
      handleModeChange("list");
    } catch (error) {
      console.error("Gagal proses permasalahan:", error);
      toast.error(error?.message || "Gagal memproses permasalahan");
    } finally {
      setProcessingId(null);
    }
  };

  // Fungsi untuk handle penyelesaian (status menjadi resolved)
  const handleResolveSubmit = async (formData) => {
    try {
      const raw = Object.fromEntries(formData);
      
      // Validasi
      if (!raw.deskripsi) {
        toast.error("Deskripsi harus diisi");
        return;
      }

      if (!raw.tindak_lanjut) {
        toast.error("Tindak lanjut harus diisi");
        return;
      }
      
      // Payload untuk status resolved
      const payload = {
        deskripsi: raw.deskripsi,
        status: "resolved",
        tindak_lanjut: raw.tindak_lanjut,
      };
      
      console.log("Resolving issue with payload:", payload);
      
      setProcessingId(selectedItem.id);
      
      // Panggil API update
      const response = await updateStudentIssue(selectedItem.id, payload);
      console.log("Resolve issue response:", response);
      
      // Refresh data
      await fetchPermasalahan();
      
      toast.success("Permasalahan telah diselesaikan");
      handleModeChange("list");
    } catch (error) {
      console.error("Gagal menyelesaikan permasalahan:", error);
      toast.error(error?.message || "Gagal menyelesaikan permasalahan");
    } finally {
      setProcessingId(null);
    }
  };

  /* =====================
     EXPORT FUNCTIONS
  ===================== */
  const exportData = sortedData.map((item, index) => ({
    No: index + 1,
    "Nama Siswa": item.nama || "-",
    "NISN": item.siswa_nisn || "-",
    "Industri": item.industri || "-",
    "Permasalahan": item.judul || "-",
    "Kategori": item.kategori || "-",
    "Deskripsi": item.masalah || "-",
    "Status": item.status || "-",
    "Tanggal Lapor": item.tanggal || "-",
    "Tanggal Selesai": item.tanggal_disetujui || "-",
    "Tindak Lanjut": item.tindak_lanjut || "-",
  }));

  const handleExportExcel = () => {
    if (!exportData.length) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Permasalahan Siswa");
    XLSX.writeFile(wb, "data_permasalahan_siswa.xlsx");
    toast.success("Excel berhasil diekspor");
  };

  const handleExportPDF = () => {
    if (!exportData.length) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    
    const doc = new jsPDF({
      orientation: 'landscape'
    });
    
    doc.text("Data Permasalahan Siswa", 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map((item) => Object.values(item)),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [100, 30, 33] },
    });

    doc.save("data_permasalahan_siswa.pdf");
    toast.success("PDF berhasil diekspor");
  };

  // Fungsi untuk mendapatkan label kategori yang lebih bagus
  const getKategoriLabel = (kategoriValue) => {
    const kategori = kategoriOptions.find(k => k.value === kategoriValue);
    return kategori ? kategori.label : kategoriValue;
  };

  // Fungsi untuk format status
  const getStatusLabel = (status) => {
    if (status === "resolved") return "Selesai";
    if (status === "opened") return "Proses";
    if (status === "in_progress") return "Dalam Proses";
    return status;
  };

  // Fungsi untuk warna status (hanya untuk badge)
  const getStatusColor = (status) => {
    if (status === "resolved") return "bg-green-100 text-green-700 border border-green-300";
    if (status === "in_progress") return "bg-yellow-100 text-yellow-700 border border-yellow-300";
    return "";
  };

  /* =====================
     ADD MODE - TAMBAH PERMASALAHAN BARU
  ===================== */
  if (mode === "add") {
    return (
      <Add
        title="Tambah Permasalahan Siswa"
        image={editGrafik}
        fields={[
          {
            label: "Nama Siswa",
            name: "nama",
            type: "select",
            options: siswaOptions,
            width: "full",
            required: true,
          },
          {
            label: "Permasalahan",
            name: "judul",
            type: "text",
            width: "full",
            required: true,
            placeholder: "Masukkan judul permasalahan",
          },
          {
            label: "Kategori",
            name: "kategori",
            type: "select",
            options: kategoriOptions,
            width: "full",
            required: true,
          },
          {
            label: "Deskripsi Masalah",
            name: "masalah",
            type: "textarea",
            rows: 4,
            width: "full",
            required: true,
            placeholder: "Jelaskan permasalahan yang terjadi secara detail...",
          },
        ]}
        onSubmit={handleAddSubmit}
        onCancel={() => handleModeChange("list")}
      />
    );
  }

  /* =====================
     EDIT MODE - EDIT PERMASALAHAN (dengan status)
  ===================== */
  if (mode === "edit" && selectedItem) {
    return (
      <Add
        title="Edit Permasalahan Siswa"
        image={editGrafik}
        initialData={{
          deskripsi: selectedItem.masalah,
          status: selectedItem.status,
          tindak_lanjut: selectedItem.tindak_lanjut,
        }}
        fields={[
          {
            label: "Deskripsi",
            name: "deskripsi",
            type: "textarea",
            rows: 4,
            width: "full",
            required: true,
            placeholder: "Update deskripsi permasalahan...",
          },
          {
            label: "Status",
            name: "status",
            type: "select",
            options: [
              { label: "Proses", value: "opened" },
              { label: "Dalam Proses", value: "in_progress" },
              { label: "Selesai", value: "resolved" },
            ],
            width: "full",
            required: true,
          },
          {
            label: "Tindak Lanjut",
            name: "tindak_lanjut",
            type: "textarea",
            rows: 3,
            width: "full",
            required: true,
            placeholder: "Masukkan tindak lanjut yang sudah dilakukan...",
          },
        ]}
        onSubmit={handleEditSubmit}
        onCancel={() => handleModeChange("list")}
      />
    );
  }

  /* =====================
     PROCESS MODE - PROSES PERMASALAHAN (status in_progress)
  ===================== */
  if (mode === "process" && selectedItem) {
    return (
      <Add
        title="Proses Permasalahan Siswa"
        image={editGrafik}
        initialData={{
          deskripsi: selectedItem.masalah,
          tindak_lanjut: selectedItem.tindak_lanjut,
        }}
        fields={[
          {
            label: "Deskripsi",
            name: "deskripsi",
            type: "textarea",
            rows: 4,
            width: "full",
            required: true,
            placeholder: "Update deskripsi permasalahan...",
          },
          {
            label: "Tindak Lanjut",
            name: "tindak_lanjut",
            type: "textarea",
            rows: 3,
            width: "full",
            required: true,
            placeholder: "Masukkan tindak lanjut yang sudah dilakukan...",
          },
        ]}
        onSubmit={handleProcessSubmit}
        onCancel={() => handleModeChange("list")}
        submitButtonText="Proses"
      />
    );
  }

  /* =====================
     RESOLVE MODE - SELESAIKAN PERMASALAHAN (status resolved)
  ===================== */
  if (mode === "resolve" && selectedItem) {
    return (
      <Add
        title="Selesaikan Permasalahan Siswa"
        image={editGrafik}
        initialData={{
          deskripsi: selectedItem.masalah,
          tindak_lanjut: selectedItem.tindak_lanjut,
        }}
        fields={[
          {
            label: "Deskripsi",
            name: "deskripsi",
            type: "textarea",
            rows: 4,
            width: "full",
            required: true,
            placeholder: "Update deskripsi permasalahan...",
          },
          {
            label: "Tindak Lanjut",
            name: "tindak_lanjut",
            type: "textarea",
            rows: 3,
            width: "full",
            required: true,
            placeholder: "Masukkan tindak lanjut yang sudah dilakukan...",
          },
        ]}
        onSubmit={handleResolveSubmit}
        onCancel={() => handleModeChange("list")}
        submitButtonText="Selesaikan"
      />
    );
  }

  /* =====================
     DETAIL MODE - DETAIL PERMASALAHAN (DENGAN TANGGAL DISELESAIKAN)
  ===================== */
  if (mode === "detail" && selectedItem) {
    return (
      <Detail
        title="Detail Permasalahan Siswa"
        mode={detailMode}
        initialData={{
          "Nama Siswa": selectedItem.nama || "-",
          "NISN": selectedItem.siswa_nisn || "-",
          "Industri": selectedItem.industri || "-",
          "Judul": selectedItem.judul || "-",
          "Kategori": getKategoriLabel(selectedItem.kategori) || "-",
          "Permasalahan": selectedItem.masalah || "-",
          "Status": getStatusLabel(selectedItem.status) || "-",
          "Tanggal Lapor": selectedItem.tanggal || "-",
          "Tanggal Diselesaikan": selectedItem.tanggal_disetujui || "-",
          "Pembimbing": selectedItem.pembimbing_nama || "-",
          "Tindak Lanjut": selectedItem.tindak_lanjut || "-",
        }}
        onClose={() => handleModeChange("list")}
        onChangeMode={setDetailMode}
        onSubmit={handleEditSubmit}
        onDelete={() => handleDelete(selectedItem)}
        fields={[
          { name: "Nama Siswa", label: "Nama Siswa" },
          { name: "NISN", label: "NISN" },
          { name: "Industri", label: "Industri" },
          { name: "Judul", label: "Permasalahan" },
          { name: "Kategori", label: "Kategori" },
          { name: "Permasalahan", label: "Deskripsi" },
          { name: "Status", label: "Status" },
          { name: "Tanggal Lapor", label: "Tanggal Lapor" },
          { name: "Tanggal Diselesaikan", label: "Tanggal Diselesaikan" },
          { name: "Pembimbing", label: "Pembimbing" },
          { name: "Tindak Lanjut", label: "Tindak Lanjut" },
        ]}
      />
    );
  }

  /* =====================
     LIST VIEW - DENGAN PENGELOMPOKAN BERDASARKAN STATUS
  ===================== */
  return (
    <div className="bg-white min-h-screen">
      <Header user={user} />

      <div className="flex">
        <Sidebar active={active} setActive={setActive} />

        <main className="flex-1 p-6 bg-[#641E21] rounded-l-3xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">
              Data Permasalahan Siswa
            </h2>
            
            <div className="relative -left-[1140px]" ref={exportRef}>
              <button
                onClick={() => setOpenExport(!openExport)}
                className="!bg-transparent flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 rounded-full"
              >
                <Download size={18} />
              </button>

              {openExport && (
                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-md p-2 z-50">
                  <button
                    onClick={() => {
                      handleExportExcel();
                      setOpenExport(false);
                    }}
                    className="!bg-transparent flex items-center gap-2 px-3 py-2 hover:!bg-gray-100 text-sm w-full"
                  >
                    <FileSpreadsheet size={16} className="text-green-600" />
                    Excel
                  </button>
                  <button
                    onClick={() => {
                      handleExportPDF();
                      setOpenExport(false);
                    }}
                    className="!bg-transparent flex items-center gap-2 px-3 py-2 hover:!bg-gray-100 text-sm w-full"
                  >
                    <FileText size={16} className="text-red-600" />
                    PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          <SearchBar
            onAddClick={() => handleModeChange("add")}
            query={search}
            setQuery={setSearch}
            placeholder="Cari nama siswa / industri / judul / kategori"
          />

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
              <p className="text-white mt-2">Memuat data...</p>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center mt-6">
              <p className="text-gray-500">Tidak ada data permasalahan</p>
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-3">
                {/* SECTION 1: PERMASALAHAN BELUM DIPROSES (opened) */}
                {renderGroupByStatus('Permasalahan Belum Diproses', ['opened'], true)}

                {/* SECTION 2: PERMASALAHAN SEDANG DIPROSES (in_progress) */}
                {renderGroupByStatus('Permasalahan Sedang Diproses', ['in_progress'], true)}

                {/* SECTION 3: PERMASALAHAN TERSELESAIKAN (resolved) */}
                {renderGroupByStatus('Permasalahan Terselesaikan', ['resolved'], false)}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 text-white flex justify-between items-center">
                  <span>
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}