import React, { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileSpreadsheet, FileText, Star, Printer, CheckCircle, AlertTriangle, X } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { useNavigate, useLocation } from 'react-router-dom';

import { 
  getStudentsByPembimbing, 
  getPenilaianApplicationById,
  setPenilaianToDraft,
  finalizePenilaian 
} from "../utils/services/pembimbing/penilaian";
import { getGuruSiswa } from "../utils/services/pembimbing/guru";

import Add from "./components/Add";
import Detail from "./components/Detail";
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Pagination from "./components/Pagination";
import DeleteConfirmationModal from "./components/Delete";
import SaveConfirmationModal from "./components/Save";

import editGrafik from "../assets/editGrafik.svg";
import deleteImg from "../assets/deleteGrafik.svg";
import saveImg from "../assets/save.svg";

dayjs.locale('id');

export default function DataPenilaianPKL() {
  const navigate = useNavigate();
  const location = useLocation();
  const exportRef = useRef(null);

  const [openExport, setOpenExport] = useState(false);
  const [active, setActive] = useState("penilaian");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCetak, setLoadingCetak] = useState(false);
  const [finalizingId, setFinalizingId] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    item: null,
    type: ""
  });

  const [dataPenilaian, setDataPenilaian] = useState([]);
  const [dataGuruSiswa, setDataGuruSiswa] = useState([]);
  const [mode, setMode] = useState("list");
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailMode, setDetailMode] = useState("view");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const [nilaiForm, setNilaiForm] = useState({
    skor_1: "",
    skor_2: "",
    skor_3: "",
    skor_4: "",
    catatan_akhir: "",
  });

  const itemsPerPage = 10;

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Pembimbing",
  };

  const statusOptions = [
    { label: "Belum Dinilai", value: "belum_dinilai" },
    { label: "Sudah Dinilai", value: "sudah_dinilai" },
  ];

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

  const formatTanggalIndonesia = (tanggal) => {
    if (!tanggal) return "";
    return dayjs(tanggal).format('DD MMMM YYYY');
  };

  const formatTanggalInput = (tanggal) => {
    if (!tanggal) return "";
    return dayjs(tanggal).format('YYYY-MM-DD');
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
        setSelectedItem(item);
        
        // Inisialisasi nilaiForm dari items yang sudah ada
        const initialNilaiForm = {
          catatan_akhir: item.catatan_akhir || "",
        };
        
        // Isi nilai dari items yang sudah ada
        if (item.items && item.items.length > 0) {
          item.items.forEach((nilaiItem, index) => {
            initialNilaiForm[`skor_${index + 1}`] = nilaiItem.skor || "";
          });
        }
        
        setNilaiForm(initialNilaiForm);
      } else {
        handleModeChange('list');
      }
    }
  }, [dataPenilaian, location.search]);

  const handleModeChange = (newMode, item = null) => {
    const params = new URLSearchParams(location.search);
    params.set('mode', newMode);
    
    if (item) {
      params.set('id', item.application_id);
      setSelectedItem(item);
      
      // Inisialisasi nilaiForm dari items yang sudah ada (jika ada)
      const initialNilaiForm = {
        catatan_akhir: item.catatan_akhir || "",
      };
      
      // Isi nilai dari items yang sudah ada
      if (item.items && item.items.length > 0) {
        item.items.forEach((nilaiItem, index) => {
          initialNilaiForm[`skor_${index + 1}`] = nilaiItem.skor || "";
        });
      }
      
      setNilaiForm(initialNilaiForm);
    } else {
      params.delete('id');
      setSelectedItem(null);
      setNilaiForm({
        skor_1: "",
        skor_2: "",
        skor_3: "",
        skor_4: "",
        catatan_akhir: "",
      });
    }
    
    if (newMode !== 'detail') {
      setDetailMode('view');
    }
    
    navigate(`${location.pathname}?${params.toString()}`);
  };

  const fetchGuruSiswa = async () => {
    try {
      const response = await getGuruSiswa();
      setDataGuruSiswa(response.data || []);
    } catch (error) {
      console.error("Gagal fetch guru siswa:", error);
      toast.error("Gagal memuat data PKL siswa");
    }
  };

  useEffect(() => {
    fetchGuruSiswa();
  }, []);

  const handleFinalizeClick = (item) => {
    setConfirmModal({
      isOpen: true,
      title: "Finalisasi Penilaian",
      message: "Yakin ingin memfinalisasi penilaian ini? Data tidak dapat diubah setelah difinalisasi.",
      onConfirm: () => handleFinalize(item),
      item: item,
      type: "finalize"
    });
  };

  const handleFinalize = async (item) => {
    try {
      setFinalizingId(item.application_id);
      await finalizePenilaian(item.application_id);
      toast.success("Penilaian berhasil difinalisasi");
      await fetchPenilaian();
    } catch (error) {
      console.error("Gagal finalisasi penilaian:", error);
      toast.error(error?.response?.data?.message || "Gagal memfinalisasi penilaian");
    } finally {
      setFinalizingId(null);
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      setDataPenilaian(prev => prev.filter(i => i.application_id !== selectedItem.application_id));
      toast.success("Data berhasil dihapus");
      handleModeChange("list");
      setIsDeleteOpen(false);
    } catch (error) {
      console.error("Gagal hapus data:", error);
      toast.error("Gagal menghapus data");
    }
  };

  const handleCetakLembarPenilaian = async (item) => {
    try {
      setLoadingCetak(true);
      setProcessingId(item.application_id);
      
      const response = await getPenilaianApplicationById(item.application_id);
      const dataPkl = dataGuruSiswa.find(d => d.application_id === item.application_id);
      const konsentrasiKeahlian = getKonsentrasiKeahlian(item.kelas);
      
      const penilaianData = {
        application_id: response.application_id,
        form_id: response.form_id,
        form_nama: response.form_nama,
        status: response.status,
        total_skor: response.total_skor,
        rata_rata: response.rata_rata,
        catatan_akhir: response.catatan_akhir,
        finalized_at: response.finalized_at,
        items: response.items || [],
        form_items: response.form_items || [],
        siswa: {
          nama: item.nama,
          nisn: item.nisn,
          kelas: item.kelas,
          konsentrasi_keahlian: konsentrasiKeahlian,
          industri: item.industri,
          pkl_status: item.pkl_status,
          tanggal_mulai_input: dataPkl ? formatTanggalInput(dataPkl.tanggal_mulai) : "",
          tanggal_mulai_preview: dataPkl ? formatTanggalIndonesia(dataPkl.tanggal_mulai) : "",
          tanggal_selesai_input: dataPkl ? formatTanggalInput(dataPkl.tanggal_selesai) : "",
          tanggal_selesai_preview: dataPkl ? formatTanggalIndonesia(dataPkl.tanggal_selesai) : "",
        },
        nilai: {
          skor_1: response.items?.find(i => i.form_item_id === response.form_items?.[0]?.id)?.skor || "",
          skor_2: response.items?.find(i => i.form_item_id === response.form_items?.[1]?.id)?.skor || "",
          skor_3: response.items?.find(i => i.form_item_id === response.form_items?.[2]?.id)?.skor || "",
          skor_4: response.items?.find(i => i.form_item_id === response.form_items?.[3]?.id)?.skor || "",
          desc_1: response.items?.find(i => i.form_item_id === response.form_items?.[0]?.id)?.deskripsi || response.form_items?.[0]?.tujuan_pembelajaran || "",
          desc_2: response.items?.find(i => i.form_item_id === response.form_items?.[1]?.id)?.deskripsi || response.form_items?.[1]?.tujuan_pembelajaran || "",
          desc_3: response.items?.find(i => i.form_item_id === response.form_items?.[2]?.id)?.deskripsi || response.form_items?.[2]?.tujuan_pembelajaran || "",
          desc_4: response.items?.find(i => i.form_item_id === response.form_items?.[3]?.id)?.deskripsi || response.form_items?.[3]?.tujuan_pembelajaran || "",
        }
      };
      
      localStorage.setItem('penilaian_data', JSON.stringify(penilaianData));
      localStorage.setItem('penilaian_application_id', item.application_id);
      
      toast.success("Data penilaian berhasil dimuat");
      navigate(`/guru/pembimbing/lembarPenilaian?application_id=${item.application_id}`);
      
    } catch (error) {
      console.error("Gagal mengambil data penilaian:", error);
      toast.error("Gagal memuat data penilaian. Silakan coba lagi.");
    } finally {
      setLoadingCetak(false);
      setProcessingId(null);
    }
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

  // Fungsi untuk mendapatkan deskripsi berdasarkan nilai dan aspek
  const getDeskripsiByNilai = (nilai, aspek) => {
    if (!nilai && nilai !== 0) return "";
    const skor = parseInt(nilai);
    
    const deskripsiAspek = {
      1: {
        kurang: "Peserta didik mampu menerapkan soft skill yang dimiliki dengan menunjukkan integritas (jujur, disiplin, komitmen, dan tanggung jawab), memiliki etos kerja, menunjukkan kemandirian, menunjukkan kerja sama, dan menunjukkan kepedulian sosial dan lingkungan dengan predikat kurang.",
        baik: "Peserta didik mampu menerapkan soft skill yang dimiliki dengan menunjukkan integritas (jujur, disiplin, komitmen, dan tanggung jawab), memiliki etos kerja, menunjukkan kemandirian, menunjukkan kerja sama, dan menunjukkan kepedulian sosial dan lingkungan dengan predikat baik.",
        sangatBaik: "Peserta didik mampu menerapkan soft skill yang dimiliki dengan menunjukkan integritas (jujur, disiplin, komitmen, dan tanggung jawab), memiliki etos kerja, menunjukkan kemandirian, menunjukkan kerja sama, dan menunjukkan kepedulian sosial dan lingkungan dengan predikat sangat baik."
      },
      2: {
        kurang: "Peserta didik mampu menerapkan norma, Prosedur Operasional Standar (POS), dan Kesehatan, Keselamatan Kerja, dan Lingkungan Hidup (K3LH) yang ditunjukkan dengan menggunakan APD dengan tertib dan benar, serta melaksanakan pekerjaan sesui POS dengan predikat kurang.",
        baik: "Peserta didik mampu menerapkan norma, Prosedur Operasional Standar (POS), dan Kesehatan, Keselamatan Kerja, dan Lingkungan Hidup (K3LH) yang ditunjukkan dengan menggunakan APD dengan tertib dan benar, serta melaksanakan pekerjaan sesui POS dengan predikat baik.",
        sangatBaik: "Peserta didik mampu menerapkan norma, Prosedur Operasional Standar (POS), dan Kesehatan, Keselamatan Kerja, dan Lingkungan Hidup (K3LH) yang ditunjukkan dengan menggunakan APD dengan tertib dan benar, serta melaksanakan pekerjaan sesui POS dengan predikat sangat baik."
      },
      3: {
        kurang: "Peserta didik mampu menerapkan kompetensi teknis yang sudah dipelajari di sekolah dan/atau baru dipelajari di dunia kerja (tempat PKL) dengan predikat kurang.",
        baik: "Peserta didik mampu menerapkan kompetensi teknis yang sudah dipelajari di sekolah dan/atau baru dipelajari di dunia kerja (tempat PKL) dengan predikat baik.",
        sangatBaik: "Peserta didik mampu menerapkan kompetensi teknis yang sudah dipelajari di sekolah dan/atau baru dipelajari di dunia kerja (tempat PKL) dengan predikat sangat baik."
      },
      4: {
        kurang: "Peserta didik mampu memahami alur bisnis dunia kerja tempat PKL dan wawasan wirausaha dengan predikat kurang.",
        baik: "Peserta didik mampu memahami alur bisnis dunia kerja tempat PKL dan wawasan wirausaha dengan predikat baik.",
        sangatBaik: "Peserta didik mampu memahami alur bisnis dunia kerja tempat PKL dan wawasan wirausaha dengan predikat sangat baik."
      }
    };
    
    if (skor < 75) return deskripsiAspek[aspek].kurang;
    if (skor >= 75 && skor <= 85) return deskripsiAspek[aspek].baik;
    if (skor >= 86 && skor <= 100) return deskripsiAspek[aspek].sangatBaik;
    return "";
  };

  const fetchPenilaianDetails = async (students) => {
    const details = {};
    for (const student of students) {
      if (student.application_id) {
        try {
          const response = await getPenilaianApplicationById(student.application_id);
          details[student.application_id] = {
            status: response.status,
            hasItems: response.items && response.items.length > 0,
            data: response,
            finalized_at: response.finalized_at,
            form_items: response.form_items || [],
            form_nama: response.form_nama
          };
        } catch (error) {
          console.error(`Error fetching details for ${student.application_id}:`, error);
          details[student.application_id] = {
            status: 'draft',
            hasItems: false,
            data: null,
            finalized_at: null,
            form_items: [],
            form_nama: ''
          };
        }
      }
    }
    return details;
  };

  const fetchPenilaian = async () => {
    setLoading(true);
    try {
      const response = await getStudentsByPembimbing();
      const students = response?.data || [];
      const details = await fetchPenilaianDetails(students);
      
      const mappedData = students.map((item) => {
        const detail = details[item.application_id] || { 
          status: 'draft', 
          hasItems: false, 
          data: null,
          form_items: [],
          form_nama: ''
        };
        return {
          application_id: item.application_id,
          siswa_id: item.siswa_id,
          nama: item.siswa_username,
          nisn: item.siswa_nisn,
          kelas: item.kelas_nama,
          industri_id: item.industri_id,
          industri: item.industri_nama,
          pkl_status: item.pkl_status,
          penilaian_status: item.penilaian_status,
          draft_status: detail.status,
          hasItems: detail.hasItems,
          finalized_at: detail.finalized_at,
          items: detail.data?.items || [],
          form_items: detail.form_items || [],
          form_nama: detail.form_nama || '',
          catatan_akhir: detail.data?.catatan_akhir,
          statusLabel: detail.status === 'final' ? 'Sudah Difinalisasi' : 
                      (detail.hasItems ? 'Draft' : 'Belum Dinilai'),
          nilai_akhir: detail.data?.total_skor || null,
          catatan: detail.data?.catatan_akhir || "-",
          tanggal_penilaian: detail.finalized_at || null,
        };
      });
      
      setDataPenilaian(mappedData);
    } catch (error) {
      console.error("Gagal fetch penilaian:", error);
      toast.error("Gagal memuat data penilaian");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPenilaian();
  }, []);

  const filteredData = dataPenilaian.filter((i) => {
    const q = search.toLowerCase();
    return (
      (i.nama?.toLowerCase() || "").includes(q) ||
      (i.nisn?.toLowerCase() || "").includes(q) ||
      (i.kelas?.toLowerCase() || "").includes(q) ||
      (i.industri?.toLowerCase() || "").includes(q) ||
      (i.statusLabel?.toLowerCase() || "").includes(q)
    );
  });

  const sortedData = [...filteredData].sort((a, b) => 
    a.nama.localeCompare(b.nama)
  );

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleNilaiSubmit = async (formData) => {
    try {
      const raw = Object.fromEntries(formData);
      
      // Dapatkan form_items dari selectedItem
      const formItems = selectedItem?.form_items || [];
      
      if (formItems.length === 0) {
        toast.error("Tidak ada aspek penilaian yang ditemukan");
        return;
      }
      
      // Validasi semua aspek nilai harus diisi sesuai jumlah form_items
      for (let i = 0; i < formItems.length; i++) {
        const fieldName = `skor_${i + 1}`;
        if (!raw[fieldName]) {
          toast.error(`Nilai aspek ${i + 1} harus diisi`);
          return;
        }
      }

      if (!raw.catatan_akhir) {
        toast.error("Catatan akhir harus diisi");
        return;
      }
      
      // Hitung deskripsi berdasarkan nilai untuk setiap aspek
      const items = formItems.map((item, index) => {
        const skor = parseInt(raw[`skor_${index + 1}`]);
        return {
          form_item_id: item.id,
          skor: skor,
          deskripsi: getDeskripsiByNilai(skor, index + 1)
        };
      });
      
      // Format payload
      const payload = {
        items: items,
        catatan_akhir: raw.catatan_akhir
      };
      
      console.log("Submitting penilaian with payload:", payload);
      
      setProcessingId(selectedItem.application_id);
      
      // Panggil API untuk menyimpan penilaian sebagai draft
      const response = await setPenilaianToDraft(selectedItem.application_id, payload);
      
      console.log("Response from setPenilaianToDraft:", response);
      
      toast.success("Penilaian berhasil disimpan sebagai draft");
      
      await fetchPenilaian();
      
      handleModeChange("list");
    } catch (error) {
      console.error("Gagal menyimpan penilaian:", error);
      toast.error(error?.response?.data?.message || error?.message || "Gagal menyimpan penilaian");
    } finally {
      setProcessingId(null);
    }
  };

  const handleNilaiFormChange = (field, value) => {
    setNilaiForm(prev => ({ ...prev, [field]: value }));
  };

  const renderGroupByStatus = (title, type) => {
    let items = [];
    
    if (type === 'belum') {
      items = paginatedData.filter(item => !item.hasItems && item.draft_status !== 'final');
    } else if (type === 'draft') {
      items = paginatedData.filter(item => item.draft_status === 'draft' && item.hasItems);
    } else if (type === 'final') {
      items = paginatedData.filter(item => item.draft_status === 'final');
    }
    
    if (items.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="mb-3">
          <h3 className="text-white font-bold text-lg border-b border-white/20 pb-2">
            {title}
          </h3>
        </div>
        
        {items.map(item => (
          <div 
            key={item.application_id}
            className="bg-white rounded-xl p-4 hover:shadow-md transition-all cursor-pointer mb-2"
            onClick={() => handleModeChange("detail", item)}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full ${getColorFromName(item.nama)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                {getInitials(item.nama)}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-sm">{item.nama}</h3>
                  <span className="text-xs text-gray-500">- {item.kelas}</span>
                </div>
                
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                    NISN: {item.nisn}
                  </span>
                  <p className="text-sm text-gray-600 truncate">{item.industri}</p>
                </div>

                {item.draft_status === 'final' && item.nilai_akhir && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-gray-700">Nilai: {item.nilai_akhir}</span>
                  </div>
                )}
                
                {item.draft_status === 'draft' && item.hasItems && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Draf</span>
                  </div>
                )}
              </div>

              <div className="self-start flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {item.draft_status === 'final' ? (
                  <span className="px-4 py-2 text-sm rounded-full bg-green-100 text-green-700 border border-green-300 flex items-center gap-1">
                    <CheckCircle size={16} /> Sudah Difinalisasi
                  </span>
                ) : (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCetakLembarPenilaian(item); }}
                      disabled={loadingCetak && processingId === item.application_id}
                      className="px-3 py-2 text-sm rounded !bg-orange-500 text-white hover:bg-orange-600 flex items-center gap-1 disabled:opacity-50"
                      title="Cetak Lembar Penilaian"
                    >
                      <Printer size={16} />
                      <span className="hidden md:inline">
                        {loadingCetak && processingId === item.application_id ? "Memuat..." : "Cetak"}
                      </span>
                    </button>
                    
                    <button
                      onClick={(e) => { e.stopPropagation(); handleModeChange("nilai", item); }}
                      className="px-4 py-2 text-sm rounded !bg-blue-500 text-white hover:bg-blue-600"
                      disabled={processingId === item.application_id || finalizingId === item.application_id}
                    >
                      {item.hasItems ? 'Ubah Nilai' : 'Beri Nilai'}
                    </button>
                    
                    {item.hasItems && item.draft_status !== 'final' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleFinalizeClick(item); }}
                        disabled={finalizingId === item.application_id}
                        className="px-4 py-2 text-sm rounded !bg-green-600 text-white hover:bg-green-700 flex items-center gap-1"
                      >
                        {finalizingId === item.application_id ? "Memfinalisasi..." : "Finalisasi"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleAddSubmit = async (formData) => {
    try {
      const raw = Object.fromEntries(formData);
      
      if (!raw.nama) {
        toast.error("Pilih siswa terlebih dahulu");
        return;
      }

      if (!raw.nilai_akhir) {
        toast.error("Nilai akhir harus diisi");
        return;
      }

      if (!raw.catatan) {
        toast.error("Catatan harus diisi");
        return;
      }
      
      const selectedSiswa = dataPenilaian.find(s => s.nama === raw.nama);
      
      if (!selectedSiswa) {
        toast.error("Data siswa tidak ditemukan");
        return;
      }
      
      const payload = {
        siswa_id: selectedSiswa.siswa_id,
        application_id: selectedSiswa.application_id,
        nilai_akhir: parseInt(raw.nilai_akhir),
        catatan: raw.catatan,
        status: "sudah_dinilai",
      };
      
      setPendingData(payload);
      setIsConfirmSaveOpen(true);
    } catch (error) {
      console.error("Gagal menambah penilaian:", error);
      toast.error(error?.message || "Gagal menambah penilaian");
    }
  };

  const handleEditSubmit = async (formData) => {
    try {
      const raw = Object.fromEntries(formData);
      
      if (!raw.nilai_akhir) {
        toast.error("Nilai akhir harus diisi");
        return;
      }

      if (!raw.catatan) {
        toast.error("Catatan harus diisi");
        return;
      }

      if (!raw.status) {
        toast.error("Status harus dipilih");
        return;
      }
      
      const payload = {
        nilai_akhir: parseInt(raw.nilai_akhir),
        catatan: raw.catatan,
        status: raw.status,
      };
      
      setPendingData(payload);
      setIsConfirmSaveOpen(true);
    } catch (error) {
      console.error("Gagal update penilaian:", error);
      toast.error(error?.message || "Gagal mengupdate data");
    }
  };

  const handleConfirmSave = async () => {
    try {
      if (mode === "add") {
        toast.success("Penilaian berhasil ditambahkan");
      } else if (mode === "edit" && selectedItem) {
        toast.success("Data berhasil diupdate");
      }
      await fetchPenilaian();
      setIsConfirmSaveOpen(false);
      handleModeChange("list");
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      toast.error(error?.message || "Gagal menyimpan data");
    }
  };

  const getPredikat = (nilai) => {
    if (!nilai && nilai !== 0) return "";
    const skor = parseInt(nilai);
    if (skor < 75) return "Kurang";
    if (skor >= 75 && skor <= 85) return "Baik";
    if (skor >= 86 && skor <= 100) return "Sangat Baik";
    return "";
  };

  const exportData = sortedData.map((item, index) => ({
    No: index + 1,
    "Nama Siswa": item.nama || "-",
    "NISN": item.nisn || "-",
    "Kelas": item.kelas || "-",
    "Industri": item.industri || "-",
    "Status PKL": item.pkl_status || "-",
    "Status Penilaian": item.statusLabel || "-",
    "Nilai Akhir": item.nilai_akhir || "-",
    "Catatan": item.catatan || "-",
  }));

  const handleExportExcel = () => {
    if (!exportData.length) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Penilaian PKL");
    XLSX.writeFile(wb, "data_penilaian_pkl.xlsx");
    toast.success("Excel berhasil diekspor");
  };

  const handleExportPDF = () => {
    if (!exportData.length) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text("Data Penilaian PKL", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map((item) => Object.values(item)),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [100, 30, 33] },
    });
    doc.save("data_penilaian_pkl.pdf");
    toast.success("PDF berhasil diekspor");
  };

  if (mode === "add") {
    const siswaBelumDinilai = dataPenilaian
      .filter(item => !item.hasItems && item.draft_status !== 'final')
      .map(item => ({
        label: `${item.nama} - ${item.kelas}`,
        value: item.nama,
      }));

    return (
      <div className="bg-white min-h-screen w-full overflow-hidden">
        <Header user={user} />
        <div className="flex h-[calc(100vh-64px)]">
          <Sidebar active={active} setActive={setActive} />
          <main className="flex-1 bg-[#641E21] overflow-auto">
            <div className="p-6 h-full">
              <Add
                title="Tambah Penilaian PKL"
                image={editGrafik}
                fields={[
                  {
                    label: "Nama Siswa",
                    name: "nama",
                    type: "select",
                    options: siswaBelumDinilai,
                    width: "full",
                    required: true,
                  },
                  {
                    label: "Nilai Akhir (0-100)",
                    name: "nilai_akhir",
                    type: "number",
                    width: "full",
                    required: true,
                    min: 0,
                    max: 100,
                    placeholder: "Masukkan nilai akhir",
                  },
                  {
                    label: "Catatan",
                    name: "catatan",
                    type: "textarea",
                    rows: 4,
                    width: "full",
                    required: true,
                    placeholder: "Masukkan catatan penilaian...",
                  },
                ]}
                onSubmit={handleAddSubmit}
                onCancel={() => handleModeChange("list")}
                backgroundStyle={{ backgroundColor: "#641E21" }}
                containerClassName="w-full max-w-6xl bg-white mx-auto"
              />
            </div>
          </main>
        </div>

        <SaveConfirmationModal
          isOpen={isConfirmSaveOpen}
          title="Konfirmasi Simpan"
          message="Apakah kamu yakin ingin menyimpan data penilaian ini?"
          onClose={() => setIsConfirmSaveOpen(false)}
          onSave={handleConfirmSave}
          imageSrc={saveImg}
        />
      </div>
    );
  }

  if (mode === "edit" && selectedItem) {
    return (
      <div className="bg-white min-h-screen w-full overflow-hidden">
        <Header user={user} />
        <div className="flex h-[calc(100vh-64px)]">
          <Sidebar active={active} setActive={setActive} />
          <main className="flex-1 bg-[#641E21] overflow-auto">
            <div className="p-6 h-full">
              <Add
                title="Edit Penilaian PKL"
                image={editGrafik}
                initialData={{
                  nilai_akhir: selectedItem.nilai_akhir,
                  catatan: selectedItem.catatan,
                  status: selectedItem.penilaian_status,
                }}
                fields={[
                  {
                    label: "Nama Siswa",
                    name: "nama_siswa",
                    type: "text",
                    width: "full",
                    value: selectedItem.nama,
                    disabled: true,
                  },
                  {
                    label: "NISN",
                    name: "nisn",
                    type: "text",
                    width: "full",
                    value: selectedItem.nisn,
                    disabled: true,
                  },
                  {
                    label: "Industri",
                    name: "industri",
                    type: "text",
                    width: "full",
                    value: selectedItem.industri,
                    disabled: true,
                  },
                  {
                    label: "Nilai Akhir (0-100)",
                    name: "nilai_akhir",
                    type: "number",
                    width: "full",
                    required: true,
                    min: 0,
                    max: 100,
                  },
                  {
                    label: "Catatan",
                    name: "catatan",
                    type: "textarea",
                    rows: 4,
                    width: "full",
                    required: true,
                  },
                  {
                    label: "Status",
                    name: "status",
                    type: "select",
                    options: statusOptions,
                    width: "full",
                    required: true,
                  },
                ]}
                onSubmit={handleEditSubmit}
                onCancel={() => handleModeChange("list")}
                backgroundStyle={{ backgroundColor: "#641E21" }}
                containerClassName="w-full max-w-6xl bg-white mx-auto"
              />
            </div>
          </main>
        </div>

        <SaveConfirmationModal
          isOpen={isConfirmSaveOpen}
          title="Konfirmasi Simpan Perubahan"
          message="Apakah kamu yakin ingin menyimpan perubahan data ini?"
          onClose={() => setIsConfirmSaveOpen(false)}
          onSave={handleConfirmSave}
          imageSrc={saveImg}
        />
      </div>
    );
  }

  if (mode === "detail" && selectedItem) {
    const detailData = {
      "Nama Siswa": selectedItem.nama || "-",
      "NISN": selectedItem.nisn || "-",
      "Kelas": selectedItem.kelas || "-",
      "Industri": selectedItem.industri || "-",
      "Status PKL": selectedItem.pkl_status === "approved" ? "Disetujui" : selectedItem.pkl_status || "-",
      "Status Penilaian": selectedItem.statusLabel || "-",
      ...(selectedItem.items?.length > 0 ? {
        "Aspek 1 - Nilai": selectedItem.items[0]?.skor || "-",
        "Aspek 1 - Predikat": selectedItem.items[0]?.skor ? getPredikat(selectedItem.items[0]?.skor) : "-",
        "Aspek 1 - Deskripsi": selectedItem.items[0]?.deskripsi || "-",
        "Aspek 2 - Nilai": selectedItem.items[1]?.skor || "-",
        "Aspek 2 - Predikat": selectedItem.items[1]?.skor ? getPredikat(selectedItem.items[1]?.skor) : "-",
        "Aspek 2 - Deskripsi": selectedItem.items[1]?.deskripsi || "-",
        "Aspek 3 - Nilai": selectedItem.items[2]?.skor || "-",
        "Aspek 3 - Predikat": selectedItem.items[2]?.skor ? getPredikat(selectedItem.items[2]?.skor) : "-",
        "Aspek 3 - Deskripsi": selectedItem.items[2]?.deskripsi || "-",
        "Aspek 4 - Nilai": selectedItem.items[3]?.skor || "-",
        "Aspek 4 - Predikat": selectedItem.items[3]?.skor ? getPredikat(selectedItem.items[3]?.skor) : "-",
        "Aspek 4 - Deskripsi": selectedItem.items[3]?.deskripsi || "-",
        "Catatan Akhir": selectedItem.catatan_akhir || "-",
      } : {
        "Nilai Akhir": selectedItem.nilai_akhir || "-",
        "Catatan": selectedItem.catatan || "-",
      }),
      "Tanggal Penilaian": selectedItem.tanggal_penilaian 
        ? new Date(selectedItem.tanggal_penilaian).toLocaleDateString("id-ID") 
        : "-",
    };

    return (
      <div className="bg-white min-h-screen w-full overflow-hidden">
        <Header user={user} />
        <div className="flex h-[calc(100vh-64px)]">
          <Sidebar active={active} setActive={setActive} />
          <main className="flex-1 bg-[#641E21] overflow-auto">
            <div className="p-6 h-full">
              <Detail
                title="Detail Penilaian PKL"
                mode={detailMode}
                initialData={detailData}
                onClose={() => handleModeChange("list")}
                onChangeMode={setDetailMode}
                onSubmit={handleEditSubmit}
                onDelete={() => handleDeleteClick(selectedItem)}
                fields={Object.keys(detailData).map(key => ({ name: key, label: key }))}
              />
            </div>
          </main>
        </div>

        <DeleteConfirmationModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onDelete={handleDelete}
          imageSrc={deleteImg}
        />
      </div>
    );
  }

  // MODE NILAI
  if (mode === "nilai" && selectedItem) {
    return (
      <Add
        isPenilaianForm={true}
        title={selectedItem.hasItems ? 'Ubah Penilaian PKL Siswa' : 'Beri Penilaian PKL Siswa'}
        selectedItem={selectedItem}
        nilaiForm={nilaiForm}
        onNilaiFormChange={handleNilaiFormChange}
        onSubmit={handleNilaiSubmit}
        onCancel={() => handleModeChange("list")}
        image={editGrafik}
        backgroundStyle={{ backgroundColor: "#641E21" }}
        containerClassName="w-full max-w-6xl bg-white mx-auto"
        containerStyle={{ maxHeight: "600px" }}
      />
    );
  }

  // MAIN LIST VIEW
  return (
    <div className="bg-white min-h-screen">
      <Header user={user} />

      <div className="flex">
        <Sidebar active={active} setActive={setActive} />

        <main className="flex-1 p-4 sm:p-6 md:p-10 bg-[#641E21] rounded-none md:rounded-l-3xl shadow-inner">  
          <div className="">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">Data Penilaian PKL</h2>
              <div className="relative" ref={exportRef}>
                <button
                  onClick={() => setOpenExport(!openExport)}
                  className="!bg-transparent -ml-300 flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 rounded-full"
                >
                  <Download size={18} />
                </button>
                {openExport && (
                  <div className="-left-310 absolute mt-2 !bg-white rounded-lg shadow-md p-2 z-50">
                    <button
                      onClick={() => { handleExportExcel(); setOpenExport(false); }}
                      className="!bg-transparent flex items-center gap-2 px-3 py-2 hover:!bg-gray-100 text-sm w-full whitespace-nowrap"
                    >
                      <FileSpreadsheet size={16} className="text-green-600" /> Excel
                    </button>
                    <button
                      onClick={() => { handleExportPDF(); setOpenExport(false); }}
                      className="!bg-transparent flex items-center gap-2 px-3 py-2 hover:!bg-gray-100 text-sm w-full whitespace-nowrap"
                    >
                      <FileText size={16} className="text-red-600" /> PDF
                    </button>
                  </div>
                )}
              </div>
            </div>

            <SearchBar
              query={search}
              setQuery={setSearch}
              placeholder="Cari nama siswa / nisn / kelas / industri"
              className="mb-4"
            />

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                <p className="text-white mt-2">Memuat data...</p>
              </div>
            ) : paginatedData.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <p className="text-gray-500">Tidak ada data penilaian</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {renderGroupByStatus('Belum Dinilai', 'belum')}
                  {renderGroupByStatus('Draf Penilaian', 'draft')}
                  {renderGroupByStatus('Sudah Difinalisasi', 'final')}
                </div>

                {totalPages > 1 && (
                  <div className="mt-4 flex justify-between items-center text-white">
                    <span>Halaman {currentPage} dari {totalPages}</span>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onDelete={handleDelete}
        imageSrc={deleteImg}
      />

      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${confirmModal.type === 'delete' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                <AlertTriangle className={`w-6 h-6 ${confirmModal.type === 'delete' ? 'text-red-600' : 'text-yellow-600'}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{confirmModal.title}</h3>
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="!bg-transparent ml-auto text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 mb-6">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 text-sm font-medium text-gray-700 !bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                  confirmModal.type === 'delete' 
                  ? '!bg-red-600 !hover:bg-red-700' 
                    : '!bg-green-600 !hover:bg-green-700'
                }`}
              >
                {confirmModal.type === 'delete' ? 'Ya, Hapus' : 'Ya, Finalisasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}