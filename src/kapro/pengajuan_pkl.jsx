import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from "react-dom";
import { FilePlus, CheckCircle, XCircle, Download, FileSpreadsheet, FileText, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import Detail from "./components/Detail"; 
import SearchBar from "./components/Search";
import toast from "react-hot-toast";
import Pagination from "./components/Pagination";

import { getPKLApplications, approvePKLApplication, rejectPKLApplication } from "../utils/services/kapro/pengajuanPKL";
import { getGuru } from "../utils/services/admin/get_guru";
import { getPembimbingPKL } from "../utils/services/kapro/pembimbing";
import { getGroupReview, approveGroupReview, rejectGroupReview } from "../utils/services/kapro/group";
import { getJurusanKaprodi } from "../utils/services/kapro/jurusan";

const DataPengajuanPKL = () => {
  const [openDetail, setOpenDetail] = useState(false);
  const [detailMode, setDetailMode] = useState("view");
  const [detailData, setDetailData] = useState(null);
  const [active, setActive] = useState("pengajuan_PKL");
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState("Status");
  const [openExport, setOpenExport] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [groupSubmissions, setGroupSubmissions] = useState([]);
  
  // SET untuk menyimpan siswa_id yang ada di kelompok dengan status SUBMITTED/PENDING (yang HARUS disembunyikan)
  const [siswaDalamKelompokPending, setSiswaDalamKelompokPending] = useState(new Set());
  
  // FLAG untuk menandai apakah data kelompok sudah selesai di-fetch
  const [isGroupDataLoaded, setIsGroupDataLoaded] = useState(false);
  
  const exportRef = useRef(null);
  const [guruOptions, setGuruOptions] = useState([]);
  const [pembimbingOptions, setPembimbingOptions] = useState([]);
  const [activeTab, setActiveTab] = useState("individu");
  const [jurusanList, setJurusanList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchJurusan = async () => {
      try {
        const res = await getJurusanKaprodi();
        setJurusanList(res?.data?.data || []);
      } catch (error) {
        console.error("Gagal ambil jurusan:", error);
      }
    };
    fetchJurusan();
  }, []);

  // Ambil jurusan pertama dari jurusanList untuk role
  const userJurusan = jurusanList.length > 0 ? jurusanList[0].nama : "";
  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: jurusanList.length > 0 ? `KA KONLI ${jurusanList[0].kode}` : "KA KONLI",
  }; 

  // Fetch group submissions dan kumpulkan siswa_id
  const fetchGroupSubmissions = async () => {
    try {
      console.log("Starting to fetch group submissions...");
      const res = await getGroupReview();
      console.log("Group review data:", res);
      
      // Jika response null atau undefined, set array kosong
      if (!res) {
        console.log("Group submissions response is null/undefined");
        setGroupSubmissions([]);
        setSiswaDalamKelompokPending(new Set());
        setIsGroupDataLoaded(true);
        return;
      }
      
      // Pastikan res adalah array
      const groupData = Array.isArray(res) ? res : [];
      console.log("Group data (array):", groupData);
      
      // PERBAIKAN: Hanya kumpulkan siswa_id yang ada di kelompok dengan status SUBMITTED/PENDING
      const siswaPendingIds = new Set();
      
      groupData.forEach(group => {
        // Hanya proses kelompok dengan status submitted atau pending
        if (group.status === "submitted" || group.status === "pending") {
          group.members?.forEach(member => {
            if (member.siswa?.id) {
              siswaPendingIds.add(member.siswa.id);
            }
          });
        }
      });
      
      console.log("Siswa dalam kelompok PENDING:", Array.from(siswaPendingIds));
      
      setSiswaDalamKelompokPending(siswaPendingIds);
      
      const mapped = groupData.map((item) => {
        let type = "submit";
        if (item.status === "approved") type = "approved";
        else if (item.status === "rejected") type = "rejected";
        
        const leaderName = item.leader?.nama || 'Unknown';
        
        return {
          id: item.id,
          name: `Kelompok ${leaderName}`,
          description: `Mengajukan PKL Kelompok di ${item.industri?.nama || 'Unknown'}`,
          time: item.submitted_at || item.created_at,
          type,
          hasActions: item.status === "submitted",
          raw: item,
          group_name: `Kelompok ${leaderName}`,
          member_count: item.member_count,
          leader: item.leader,
          members: item.members,
          industri: item.industri
        };
      });

      console.log("Mapped group submissions:", mapped);
      setGroupSubmissions(mapped);
      
      // Tandai bahwa data kelompok sudah selesai di-fetch
      setIsGroupDataLoaded(true);
      
    } catch (err) {
      console.error("Gagal ambil data group review", err);
      toast.error("Gagal memuat data kelompok PKL");
      setGroupSubmissions([]);
      setSiswaDalamKelompokPending(new Set());
      setIsGroupDataLoaded(true);
    }
  };

  // Fetch individu submissions - HANYA dipanggil setelah group data selesai
  const fetchSubmissions = async () => {
    // Pastikan group data sudah loaded sebelum fetch individu
    if (!isGroupDataLoaded) {
      console.log("Menunggu group data selesai sebelum fetch individu...");
      return;
    }
    
    try {
      setIsLoading(true);
      const res = await getPKLApplications();
      console.log("Individual submissions response:", res);
      
      // Response: { data: [...], total: ... }
      const applicationsData = res.data || [];
      console.log("Applications data array:", applicationsData);
      
      // PERBAIKAN: Hanya filter siswa yang ada di kelompok PENDING/SUBMITTED
      // Siswa dengan kelompok APPROVED/REJECTED tetap ditampilkan
      const filteredData = applicationsData.filter(item => {
        const siswaId = item.application?.siswa_id;
        const isInPendingGroup = siswaDalamKelompokPending.has(siswaId);
        
        if (isInPendingGroup) {
          console.log(`Siswa ID ${siswaId} (${item.siswa_username}) ada di kelompok PENDING, tidak ditampilkan di individu`);
        }
        
        return !isInPendingGroup; // Hanya filter yang pending
      });
      
      console.log(`Total individu: ${applicationsData.length}, Setelah filter pending: ${filteredData.length}`);
      
      const mapped = filteredData.map((item) => {
        const status = item.application?.status || "";
        let type = "submit";
        
        // Pastikan case-insensitive
        if (status.toLowerCase() === "approved") type = "approved";
        else if (status.toLowerCase() === "rejected") type = "rejected";
        else type = "submit";

        return {
          id: item.application?.id || item.id,
          name: item.siswa_username || "Unknown",
          description: `${type === "submit" ? "Mengajukan PKL" : type === "approved" ? "Disetujui PKL" : "Ditolak PKL"} di ${item.industri_nama || "Unknown"}`,
          time: item.application?.tanggal_permohonan || item.created_at || new Date().toISOString(),
          type,
          hasActions: type === "submit",
          raw: item,
        };
      });

      console.log("Mapped individual submissions:", mapped);
      setSubmissions(mapped);
    } catch (err) {
      console.error("Gagal ambil data pengajuan PKL", err);
      toast.error("Gagal memuat data pengajuan PKL");
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect utama untuk fetch data secara berurutan
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      
      // Step 1: Reset states
      setSiswaDalamKelompokPending(new Set());
      setIsGroupDataLoaded(false);
      setGroupSubmissions([]);
      setSubmissions([]);
      
      // Step 2: Fetch group submissions dulu
      await fetchGroupSubmissions();
      
      // Step 3: Setelah group data selesai, fetch individu akan dipanggil oleh effect terpisah
    };
    
    fetchAllData();
  }, []);

  // Effect untuk fetch individu ketika group data sudah loaded
  useEffect(() => {
    if (isGroupDataLoaded) {
      console.log("Group data loaded, now fetching individual submissions...");
      fetchSubmissions();
    }
  }, [isGroupDataLoaded]);

  // Effect untuk refetch ketika groupSubmissions berubah (misal setelah approve/reject)
  useEffect(() => {
    if (groupSubmissions.length >= 0 && isGroupDataLoaded) {
      // Rebuild siswaDalamKelompokPending dari groupSubmissions terbaru
      const siswaPendingIds = new Set();
      
      groupSubmissions.forEach(group => {
        // Hanya proses kelompok dengan status submitted/pending
        if (group.status === "submitted" || group.status === "pending") {
          group.members?.forEach(member => {
            if (member.siswa?.id) {
              siswaPendingIds.add(member.siswa.id);
            }
          });
        }
      });
      
      console.log("Updated siswa dalam kelompok PENDING:", Array.from(siswaPendingIds));
      setSiswaDalamKelompokPending(siswaPendingIds);
      
      // Refetch individu dengan data kelompok terbaru
      fetchSubmissions();
    }
  }, [groupSubmissions]);

  const handleOpenDetail = (item) => {
    console.log("Opening detail for item:", item);
    
    if (activeTab === "individu") {
      setDetailData({
        ...item.raw,
        // Tambahkan data tambahan untuk memudahkan akses
        namaPembimbing: getGuruName(item.raw.application?.pembimbing_guru_id),
        namaKaprog: getGuruName(item.raw.application?.processed_by),
      });
    } else {
      // Untuk kelompok
      setDetailData({
        ...item.raw,
        type: 'group',
        group_name: `Kelompok ${item.raw.leader?.nama}`,
        industri: item.raw.industri,
        leader: item.raw.leader,
        members: item.raw.members,
        member_count: item.raw.member_count,
        tanggal_mulai: item.raw.tanggal_mulai,
        tanggal_selesai: item.raw.tanggal_selesai,
        status: item.raw.status,
        pembimbing: item.raw.pembimbing,
        catatan: item.raw.catatan,
        created_at: item.raw.created_at,
        submitted_at: item.raw.submitted_at,
        approved_at: item.raw.approved_at
      });
    }

    setDetailMode("view");
    setOpenDetail(true);
  };

  const getSubmissionIcon = (type) => {
    switch(type) {
      case "submit": return <FilePlus className="w-6 h-6 text-orange-500" />;
      case "approved": return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "rejected": return <XCircle className="w-6 h-6 text-red-600" />;
      default: return <FilePlus className="w-6 h-6 text-gray-400" />;
    }
  };

  // Filter untuk individu
  const sortedSubmissions = [...submissions].sort((a,b) => new Date(b.time) - new Date(a.time));
  
  const filteredSubmissions = sortedSubmissions.filter(sub => {
    const lowerQuery = query.toLowerCase();
    const matchesQuery =
      sub.name.toLowerCase().includes(lowerQuery) ||
      sub.description.toLowerCase().includes(lowerQuery) ||
      String(sub.raw?.kelas_nama || "").toLowerCase().includes(lowerQuery) ||
      dayjs(sub.time).format('YYYY-MM-DD HH:mm').toLowerCase().includes(lowerQuery);

    let matchesStatus = true;
    if (statusFilter !== "Status") {
      if (statusFilter === "Menunggu") matchesStatus = sub.type === "submit";
      if (statusFilter === "Disetujui") matchesStatus = sub.type === "approved";
      if (statusFilter === "Ditolak") matchesStatus = sub.type === "rejected";
    }

    return matchesQuery && matchesStatus;
  });

  // Filter untuk kelompok
  const sortedGroupSubmissions = [...groupSubmissions].sort((a,b) => new Date(b.time) - new Date(a.time));
  
  const filteredGroupSubmissions = sortedGroupSubmissions.filter(sub => {
    const lowerQuery = query.toLowerCase();
    const matchesQuery =
      sub.name.toLowerCase().includes(lowerQuery) ||
      sub.description.toLowerCase().includes(lowerQuery) ||
      (sub.leader?.nama || "").toLowerCase().includes(lowerQuery) ||
      dayjs(sub.time).format('YYYY-MM-DD HH:mm').toLowerCase().includes(lowerQuery);

    let matchesStatus = true;
    if (statusFilter !== "Status") {
      if (statusFilter === "Menunggu") matchesStatus = sub.type === "submit";
      if (statusFilter === "Disetujui") matchesStatus = sub.type === "approved";
      if (statusFilter === "Ditolak") matchesStatus = sub.type === "rejected";
    }

    return matchesQuery && matchesStatus;
  });

  const totalPages = Math.ceil(
    (activeTab === "individu" ? filteredSubmissions.length : filteredGroupSubmissions.length) / itemsPerPage
  );
  
  const paginatedData = activeTab === "individu" 
    ? filteredSubmissions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredGroupSubmissions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportData = (activeTab === "individu" ? filteredSubmissions : filteredGroupSubmissions).map((sub, i) => ({
    No: i + 1,
    Nama: sub.name,
    Deskripsi: sub.description,
    Waktu: dayjs(sub.time).format('DD/MM/YYYY HH:mm'),
    Status: sub.type === "submit" ? "Menunggu" : sub.type === "approved" ? "Disetujui" : "Ditolak",
    Tipe: activeTab === "individu" ? "Individu" : "Kelompok"
  }));

  const handleExportExcel = () => {
    if (exportData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PengajuanPKL");
    XLSX.writeFile(workbook, "DataPengajuanPKL.xlsx");
    setOpenExport(false);
    toast.success("Data berhasil diekspor ke Excel");
  };

  const handleExportPDF = () => {
    if (exportData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const doc = new jsPDF();
    doc.text("Data Pengajuan PKL", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['No','Nama','Deskripsi','Waktu','Status','Tipe']],
      body: exportData.map(r => [r.No, r.Nama, r.Deskripsi, r.Waktu, r.Status, r.Tipe]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [100, 30, 33] },
    });
    doc.save("DataPengajuanPKL.pdf");
    setOpenExport(false);
    toast.success("Data berhasil diekspor ke PDF");
  };

  const handleSubmitDetail = async (mode, payload) => {
    try {
      if (activeTab === "individu") {
        const applicationId = detailData?.application?.id;
        if (!applicationId) return;

        if (mode === "approve") {
          await approvePKLApplication(applicationId, {
            tanggal_mulai: payload.tanggal_mulai,
            tanggal_selesai: payload.tanggal_selesai,
            pembimbing_guru_id: Number(payload.pembimbing_id),
            catatan: payload.catatan || null,
          });

          toast.success("Pengajuan PKL berhasil disetujui");
        }

        if (mode === "reject") {
          await rejectPKLApplication(applicationId, {
            catatan: payload.catatan,
          });

          toast.success("Pengajuan PKL berhasil ditolak");
        }

        // Refresh data setelah submit
        setIsGroupDataLoaded(false);
        await fetchGroupSubmissions();
      } else {
        // Untuk kelompok
        const reviewId = detailData?.id;
        if (!reviewId) return;

        if (mode === "approve") {
          await approveGroupReview(reviewId, Number(payload.pembimbing_id));
          toast.success("Pengajuan kelompok PKL berhasil disetujui");
        }

        if (mode === "reject") {
          await rejectGroupReview(reviewId, payload.catatan);
          toast.success("Pengajuan kelompok PKL berhasil ditolak");
        }

        // Refresh data kelompok
        setIsGroupDataLoaded(false);
        await fetchGroupSubmissions();
      }

      setOpenDetail(false);
      setDetailMode("view");
      setDetailData(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Gagal memproses pengajuan");
    }
  };

  const getDateLabel = (date) => {
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    if (dateStr === today) return "Hari Ini";
    if (dateStr === yesterday) return "Kemarin";
    return dayjs(date).format('DD MMM YYYY');
  };

  const renderSubmissionGroup = (title, type, showActions = false) => {
    const data = activeTab === "individu" ? filteredSubmissions : filteredGroupSubmissions;
    const submissions = data.filter(sub => sub.type === type);
    
    if (submissions.length === 0) return null;

    const groupedByDate = {};
    submissions.forEach(sub => {
      const dateKey = dayjs(sub.time).format('YYYY-MM-DD');
      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
      groupedByDate[dateKey].push(sub);
    });

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
      dayjs(b).unix() - dayjs(a).unix()
    );

    return (
      <div className="mb-8">
        <div className="mb-3">
          <h3 className="text-white font-bold text-lg border-b border-white/20 pb-2">
            {title} ({submissions.length})
          </h3>
        </div>
        
        {sortedDates.map(dateKey => {
          const dateItems = groupedByDate[dateKey];
          const dateLabel = getDateLabel(dateKey);

          return (
            <div key={dateKey} className="mb-4">
              <div className="text-white font-semibold mb-2">
                {dateLabel}
              </div>
              
              {dateItems.map(sub => (
                <div 
                  key={sub.id}
                  className="bg-white rounded-lg p-4 hover:shadow-md transition-all cursor-pointer mb-2"
                  onClick={() => handleOpenDetail(sub)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-full">
                        {activeTab === "kelompok" && sub.type === "submit" ? (
                          <Users className="w-6 h-6 text-orange-500" />
                        ) : (
                          getSubmissionIcon(sub.type)
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                          {activeTab === "kelompok" ? sub.group_name : sub.name}
                          {activeTab === "kelompok" && sub.member_count && (
                            <span className="text-sm font-medium text-gray-500">
                              • {sub.member_count} anggota
                            </span>
                          )}
                          {activeTab === "individu" && sub.raw?.kelas_nama && (
                            <span className="text-sm font-medium text-gray-500">
                              • {sub.raw.kelas_nama}
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 mt-0.5">{sub.description}</p>
                        
                        {/* Tampilkan anggota untuk kelompok */}
                        {activeTab === "kelompok" && sub.members && sub.members.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 font-semibold">Anggota:</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {sub.members.slice(0, 3).map((member, idx) => (
                                <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {member.siswa.nama} {member.is_leader ? '(Ketua)' : ''}
                                </span>
                              ))}
                              {sub.member_count > 3 && (
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  +{sub.member_count - 3} lainnya
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 flex-shrink-0">
                      {dayjs(sub.time).format('HH:mm')}
                    </span>
                  </div>
                  
                  {showActions && sub.hasActions && (
                    <div className="flex gap-2 ml-14">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailData(sub.raw);
                          setDetailMode("approve");
                          setOpenDetail(true);
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                        style={{ backgroundColor: "#EC933A" }}
                      >
                        Terima
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailData(sub.raw);
                          setDetailMode("reject");
                          setOpenDetail(true);
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                        style={{ backgroundColor: "#BC2424" }}
                      >
                        Tolak
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  const renderCombinedGroup = (title, types) => {
    const data = activeTab === "individu" ? filteredSubmissions : filteredGroupSubmissions;
    const submissions = data.filter(sub => types.includes(sub.type));
    
    if (submissions.length === 0) return null;

    const groupedByDate = {};
    submissions.forEach(sub => {
      const dateKey = dayjs(sub.time).format('YYYY-MM-DD');
      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
      groupedByDate[dateKey].push(sub);
    });

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
      dayjs(b).unix() - dayjs(a).unix()
    );

    return (
      <div className="mb-8">
        <div className="mb-3">
          <h3 className="text-white font-bold text-lg border-b border-white/20 pb-2">
            {title} ({submissions.length})
          </h3>
        </div>
        
        {sortedDates.map(dateKey => {
          const dateItems = groupedByDate[dateKey];
          const dateLabel = getDateLabel(dateKey);

          return (
            <div key={dateKey} className="mb-4">
              <div className="text-white font-semibold mb-2">
                {dateLabel}
              </div>
              
              {dateItems.map(sub => (
                <div 
                  key={sub.id}
                  className="bg-white rounded-lg p-4 hover:shadow-md transition-all cursor-pointer mb-2"
                  onClick={() => handleOpenDetail(sub)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-full">
                        {activeTab === "kelompok" ? (
                          <Users className={`w-6 h-6 ${
                            sub.type === "approved" ? "text-green-600" : 
                            sub.type === "rejected" ? "text-red-600" : "text-orange-500"
                          }`} />
                        ) : (
                          getSubmissionIcon(sub.type)
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                          {activeTab === "kelompok" ? sub.group_name : sub.name}
                          {activeTab === "kelompok" && sub.member_count && (
                            <span className="text-sm font-medium text-gray-500">
                              • {sub.member_count} anggota
                            </span>
                          )}
                          {activeTab === "individu" && sub.raw?.kelas_nama && (
                            <span className="text-sm font-medium text-gray-500">
                              • {sub.raw.kelas_nama}
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 mt-0.5">{sub.description}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 flex-shrink-0">
                      {dayjs(sub.time).format('HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    const fetchGuru = async () => {
      try {
        const res = await getGuru();
        const options = res.map((g) => ({
          label: g.nama,
          value: g.id,
        }));
        setGuruOptions(options);
      } catch (err) {
        console.error("Gagal ambil guru", err);
      }
    };

    fetchGuru();
  }, []);

  const getGuruName = (id) => {
    return guruOptions.find((g) => g.value === id)?.label || "-";
  };

  useEffect(() => {
    const fetchPembimbing = async () => {
      try {
        const res = await getPembimbingPKL();
        setPembimbingOptions(res); 
      } catch (err) {
        console.error("Gagal ambil pembimbing", err);
      }
    };

    fetchPembimbing();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, activeTab]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setOpenExport(false);
      }
    };

    if (openExport) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openExport]);

  // Fields untuk approve mode (individu)
  const approveFieldsIndividu = [
    { name: "tanggal_mulai", label: "Tanggal Mulai", type: "date", required: true },
    { name: "tanggal_selesai", label: "Tanggal Selesai", type: "date", required: true },
    {
      name: "pembimbing_id",
      label: "Nama Pembimbing",
      type: "select",
      options: pembimbingOptions, 
      full: true,
      required: true,
    },
    {
      name: "catatan",
      label: "Catatan Kaprog",
      type: "textarea",
      full: true,
    },
  ];

  // Fields untuk reject mode (individu)
  const rejectFieldsIndividu = [
    {
      name: "catatan",
      label: "Catatan Penolakan",
      type: "textarea",
      full: true,
    },
  ];

  // Fields untuk approve mode (kelompok)
  const approveFieldsKelompok = [
    {
      name: "pembimbing_id",
      label: "Nama Pembimbing", 
      type: "select",
      options: pembimbingOptions, 
      full: true,
      required: true,
    },
  ];

  // Fields untuk reject mode (kelompok)
  const rejectFieldsKelompok = [
    {
      name: "catatan",
      label: "Alasan Penolakan",
      type: "textarea",
      full: true,
      required: true,
    },
  ];

  const StatusPKL = {
    Approved: "Disetujui",
    Rejected: "Ditolak",
    Pending: "Diproses",
    approved: "Disetujui",
    rejected: "Ditolak",
    submitted: "Menunggu",
    pending: "Diproses"
  };

  const getFieldsByMode = () => {
    if (activeTab === "individu") {
      const baseViewFields = [
        { name: "nama_industri", label: "Industri", full: true },
        { name: "nama_siswa", label: "Nama Siswa" },
        { name: "nisn", label: "NISN" },
        { name: "kelas", label: "Kelas" },
        { name: "jurusan", label: "Kompetensi Keahlian" },
        { name: "status", label: "Status" },
      ];

      if (detailMode === "approve") return approveFieldsIndividu;
      if (detailMode === "reject") return rejectFieldsIndividu;
      
      const currentStatus = detailData?.application?.status;
      
      if (currentStatus === "Pending" || currentStatus === "pending") {
        return [
          ...baseViewFields,
          { name: "tanggal_permohonan", label: "Tanggal Permohonan" },
        ];
      } else {
        return [
          ...baseViewFields,
          { name: "tanggal_permohonan", label: "Tanggal Permohonan" },
          { name: "namaPembimbing", label: "Nama Pembimbing" },
          { name: "kaprog", label: "Diproses Oleh" },
          { name: "catatan", label: "Catatan", type: "textarea" },
          { name: "dokumen_urls", label: "Bukti Dokumen Diterima PKL", type: "images" },
        ];
      }
    } else {
      // Untuk kelompok
      if (detailMode === "approve") return approveFieldsKelompok;
      if (detailMode === "reject") return rejectFieldsKelompok;
      
      const baseGroupFields = [
        { name: "industri_nama", label: "Nama Industri", full: true },
        { name: "alamat_industri", label: "Alamat Industri", full: true },
        { name: "leader_nama", label: "Ketua Kelompok" },
        { name: "leader_nisn", label: "NISN Ketua" },
        { name: "leader_kelas", label: "Kelas Ketua" },
        { name: "member_count", label: "Jumlah Anggota" },
        { name: "status", label: "Status" },
      ];

      const memberFields = detailData?.members?.map((member, index) => ({
        name: `member_${index}_nama`,
        label: `Anggota ${index + 1}`,
        value: `${member.siswa.nama} (${member.siswa.nisn}) - ${member.siswa.kelas} ${member.is_leader ? '(Ketua)' : ''}`,
        type: "text",
        full: true
      })) || [];

      if (detailData?.status === "submitted") {
        return [
          ...baseGroupFields,
          { name: "tanggal_mulai", label: "Tanggal Mulai" },
          { name: "tanggal_selesai", label: "Tanggal Selesai" },
          { name: "created_at", label: "Tanggal Dibuat" },
          { name: "submitted_at", label: "Tanggal Pengajuan" },
          ...memberFields
        ];
      } else {
        return [
          ...baseGroupFields,
          { name: "tanggal_mulai", label: "Tanggal Mulai" },
          { name: "tanggal_selesai", label: "Tanggal Selesai" },
          { name: "created_at", label: "Tanggal Dibuat" },
          { name: "submitted_at", label: "Tanggal Pengajuan" },
          { name: "pembimbing_nama", label: "Nama Pembimbing" },
          { name: "approved_at", label: "Tanggal Diproses" },
          { name: "catatan", label: "Catatan", type: "textarea" },
          ...memberFields
        ];
      }
    }
  };

  const getInitialData = () => {
    if (activeTab === "individu") {
      return {
        nama_industri: detailData?.industri_nama || "",
        nama_siswa: detailData?.siswa_username || "",
        nisn: detailData?.siswa_nisn || "",
        kelas: detailData?.kelas_nama || "",
        jurusan: detailData?.jurusan_nama || "",
        status: StatusPKL[detailData?.application?.status || ""] || detailData?.application?.status || "-",
        tanggal_permohonan: detailData?.application?.tanggal_permohonan 
          ? dayjs(detailData.application.tanggal_permohonan).format("DD MMM YYYY HH:mm") 
          : "-",
        namaPembimbing: detailData?.application?.pembimbing_guru_id 
          ? getGuruName(detailData.application.pembimbing_guru_id) 
          : "-",
        kaprog: detailData?.application?.processed_by 
          ? getGuruName(detailData.application.processed_by) 
          : "-",
        catatan: detailData?.application?.kaprog_note || "-",
        dokumen_urls: detailData?.application?.dokumen_urls || []
      };
    } else {
      const memberData = {};
      detailData?.members?.forEach((member, index) => {
        memberData[`member_${index}_nama`] = `${member.siswa.nama} (${member.siswa.nisn}) - ${member.siswa.kelas} ${member.is_leader ? '(Ketua)' : ''}`;
      });

      return {
        industri_nama: detailData?.industri?.nama || "",
        alamat_industri: detailData?.industri?.alamat || "",
        leader_nama: detailData?.leader?.nama || "",
        leader_nisn: detailData?.leader?.nisn || "",
        leader_kelas: detailData?.leader?.kelas || "",
        member_count: detailData?.member_count || 0,
        status: StatusPKL[detailData?.status || ""] || detailData?.status || "-",
        tanggal_mulai: detailData?.tanggal_mulai ? dayjs(detailData.tanggal_mulai).format("DD MMM YYYY") : "-",
        tanggal_selesai: detailData?.tanggal_selesai ? dayjs(detailData.tanggal_selesai).format("DD MMM YYYY") : "-",
        created_at: detailData?.created_at ? dayjs(detailData.created_at).format("DD MMM YYYY HH:mm") : "-",
        submitted_at: detailData?.submitted_at ? dayjs(detailData.submitted_at).format("DD MMM YYYY HH:mm") : "-",
        pembimbing_nama: detailData?.pembimbing?.nama || "-",
        approved_at: detailData?.approved_at ? dayjs(detailData.approved_at).format("DD MMM YYYY HH:mm") : "-",
        catatan: detailData?.catatan || "-",
        ...memberData
      };
    }
  };

  return (
    <div className="bg-white min-h-screen w-full">
      <Header query={query} setQuery={setQuery} user={user} />
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 bg-[#641E21] rounded-none md:rounded-l-3xl shadow-inner">

          <div className="flex items-center mb-4 sm:mb-6 gap-1 w-full relative">
            <h2 className="text-white font-bold text-base sm:text-lg">
              Data Pengajuan PKL
            </h2>

            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setOpenExport(!openExport)}
                className="flex items-center gap-2 px-3 py-2 text-white !bg-transparent hover:bg-white/10 rounded-full"
              >
                <Download size={18} />
              </button>

              {openExport && (
                <div className="absolute left-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-md p-2 z-50">
                  <button
                    onClick={() => {
                      handleExportExcel();
                      setOpenExport(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 !bg-transparent hover:!bg-gray-100 text-sm w-full"
                  >
                    <FileSpreadsheet size={16} className="text-green-600" />
                    Excel
                  </button>

                  <button
                    onClick={() => {
                      handleExportPDF();
                      setOpenExport(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 !bg-transparent hover:!bg-gray-100 text-sm w-full"
                  >
                    <FileText size={16} className="text-red-600" />
                    PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setActiveTab("individu")}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                activeTab === "individu"
                  ? "!bg-[#EC933A] text-white" 
                  : "!bg-white text-black hover:bg-white/10"
              }`}
            >
              Individu
            </button>
            
            <button
              onClick={() => setActiveTab("kelompok")}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                activeTab === "kelompok"
                  ? "!bg-[#EC933A] text-white" 
                  : "!bg-white text-black hover:bg-white/10"
              }`}
            >
              Kelompok
            </button>
          </div>

          {/* Info Banner untuk Individu */}
          {activeTab === "individu" && siswaDalamKelompokPending.size > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <span className="font-bold">ℹ️ Info:</span> {siswaDalamKelompokPending.size} siswa memiliki pengajuan kelompok yang sedang diproses dan tidak ditampilkan di tab Individu. Silakan cek di tab Kelompok.
              </p>
            </div>
          )}

          <SearchBar
            query={query}
            setQuery={setQuery}
            placeholder="Pencarian"
            filters={[{
              label: "Status",
              value: statusFilter,
              options: ["Menunggu", "Disetujui", "Ditolak"],
              onChange: (val) => setStatusFilter(val)
            }]}
          />

          <div className="mt-6 space-y-3">
            {isLoading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                <p className="text-white mt-2">Memuat data...</p>
              </div>
            ) : (
              <>
                {renderSubmissionGroup('Menunggu Persetujuan', 'submit', true)}
                {renderCombinedGroup('Pengajuan Terima & Tolak', ['approved', 'rejected'])}

                {filteredSubmissions.length === 0 && activeTab === "individu" && (
                  <div className="bg-white rounded-lg p-8 text-center">
                    <p className="text-gray-500">
                      {siswaDalamKelompokPending.size > 0 
                        ? "Semua pengajuan individu yang pending sudah masuk dalam kelompok."
                        : "Tidak ada data pengajuan PKL individu"}
                    </p>
                  </div>
                )}

                {filteredGroupSubmissions.length === 0 && activeTab === "kelompok" && (
                  <div className="bg-white rounded-lg p-8 text-center">
                    <p className="text-gray-500">Tidak ada data pengajuan PKL kelompok</p>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 text-white">
                    <p className="text-sm sm:text-base">
                      Halaman {currentPage} dari {totalPages} halaman
                    </p>
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
      
      {openDetail && detailData &&
        createPortal(
          <Detail
            mode={detailMode}
            onChangeMode={setDetailMode}
            onSubmit={handleSubmitDetail}
            onClose={() => {
              setOpenDetail(false);
              setDetailMode("view");
              setDetailData(null);
            }}
            size="half"
            title={activeTab === "individu" ? "Detail Pengajuan PKL" : "Detail Pengajuan Kelompok PKL"}
            initialData={getInitialData()}
            fields={getFieldsByMode()}
          />,
          document.body
        )}
    </div>
  );
};

export default DataPengajuanPKL;