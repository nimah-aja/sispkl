// src/pages/siswa/KelolaKelompok.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Mail, Plus, Clock, CheckCircle, XCircle, UserPlus, Calendar, Trash2, Send, X, Ban, Edit2, Building, UploadCloud } from "lucide-react";
import dayjs from "dayjs";
import orang from "../assets/orangUtan.svg"
import undanganIcon from "../assets/undangan.svg"
import hapusIcon from "../assets/deleteGrafik.svg"

// Components
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import BuatKelompokModal from "./components/addKelompok";
import UbahKelompokModal from "./components/editKelompok";
import HapusKelompokModal from "./components/hapusKelompok";
import HapusAnggotaModal from "./components/hapusAnggota";
import BatalkanPengajuanModal from "./components/batalkanPengajuan";

// Services
import { 
  getMyPklGroups, 
  getMyGroupInvitations, 
  acceptGroupInvitation,
  removeGroupMember,
  withdrawGroupPKL 
} from "../utils/services/siswa/group";
import { getActivePKL } from "../utils/services/siswa/active";
import { getPengajuanMe } from "../utils/services/siswa/pengajuan_pkl";

export default function KelolaKelompok() {
  const navigate = useNavigate();
  const [active, setActive] = useState("kelompok");
  const [activeTab, setActiveTab] = useState("kelompok");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUbahModalOpen, setIsUbahModalOpen] = useState(false);
  const [isHapusModalOpen, setIsHapusModalOpen] = useState(false);
  const [isHapusAnggotaModalOpen, setIsHapusAnggotaModalOpen] = useState(false);
  const [isBatalkanModalOpen, setIsBatalkanModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedGroupForCancellation, setSelectedGroupForCancellation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUndangan, setIsLoadingUndangan] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  
  // STATE UNTUK VALIDASI PKL
  const [hasActivePKL, setHasActivePKL] = useState(false);
  const [pengajuanPKLStatus, setPengajuanPKLStatus] = useState(null);
  const [loadingPKLStatus, setLoadingPKLStatus] = useState(true);
  
  const [user] = useState(
    JSON.parse(localStorage.getItem("user")) || { 
      name: "John Doe", 
      role: "Siswa" 
    }
  );

  // State untuk kelompok
  const [kelompokSaya, setKelompokSaya] = useState([]);

  // State untuk undangan
  const [undangan, setUndangan] = useState([]);

  // CEK STATUS PKL
  useEffect(() => {
    const fetchPKLStatus = async () => {
      setLoadingPKLStatus(true);
      try {
        // STEP 1: Cek PKL aktif
        let activePKLExists = false;
        try {
          const activeRes = await getActivePKL();
          console.log("Active PKL Response:", activeRes);
          
          if (activeRes) {
            if (activeRes.status === "Approved") {
              activePKLExists = true;
            } else if (activeRes.data && activeRes.data.status === "Approved") {
              activePKLExists = true;
            }
          }
          setHasActivePKL(activePKLExists);
        } catch (activeError) {
          console.log("Tidak ada PKL aktif (error):", activeError.message);
          setHasActivePKL(false);
        }

        // STEP 2: Cek pengajuan pending
        try {
          const pengajuanRes = await getPengajuanMe();
          console.log("Pengajuan Response:", pengajuanRes);
          
          let list = [];
          if (pengajuanRes?.data && Array.isArray(pengajuanRes.data)) {
            list = pengajuanRes.data;
          } else if (Array.isArray(pengajuanRes)) {
            list = pengajuanRes;
          } else if (pengajuanRes?.data?.data && Array.isArray(pengajuanRes.data.data)) {
            list = pengajuanRes.data.data;
          }

          const hasPending = list.some(
            (item) => item.status?.toLowerCase() === "pending"
          );
          setPengajuanPKLStatus(hasPending ? "pending" : null);
        } catch (pengajuanError) {
          console.error("Gagal mengambil pengajuan:", pengajuanError);
          setPengajuanPKLStatus(null);
        }

      } catch (error) {
        console.error("Error in fetchPKLStatus:", error);
        setHasActivePKL(false);
        setPengajuanPKLStatus(null);
      } finally {
        setLoadingPKLStatus(false);
      }
    };

    fetchPKLStatus();
  }, []);

  // Fungsi untuk mendapatkan jumlah anggota (tanpa leader)
  const getJumlahAnggota = (group) => {
    if (!group || !group.members) return 0;
    return group.members.filter(m => !m.is_leader).length;
  };

  // Fungsi untuk mengecek apakah semua anggota sudah accepted
  const areAllMembersAccepted = (group) => {
    if (!group || !group.members) return false;
    
    const nonLeaderMembers = group.members.filter(m => !m.is_leader);
    if (nonLeaderMembers.length === 0) return false;
    
    const allAccepted = nonLeaderMembers.every(member => 
      member.invitation_status === "accepted"
    );
    
    return allAccepted;
  };

  // Fungsi untuk mengecek apakah user saat ini adalah leader dari kelompok berdasarkan NAMA
  const isCurrentUserLeader = (group) => {
    if (!group || !group.members) return false;
    
    const currentUserName = user.name;
    console.log("Current User Name:", currentUserName);
    console.log("Group Members:", group.members);
    
    const leaderMember = group.members.find(m => m.is_leader === true);
    console.log("Leader Member:", leaderMember);
    
    if (leaderMember) {
      const isLeader = leaderMember.siswa.nama === currentUserName;
      console.log("Is Current User Leader?", isLeader);
      return isLeader;
    }
    
    return false;
  };

  // Fungsi untuk mengecek apakah PKL sudah selesai (tanggal selesai sudah lewat) atau ditolak
  const isGroupFinished = (group) => {
    if (!group) return false;
    
    // Cek status rejected
    if (group.status === "rejected") {
      return true;
    }
    
    // Cek tanggal selesai (untuk approved)
    if (group.status === "approved" && group.tanggal_selesai) {
      const today = dayjs().startOf('day');
      const endDate = dayjs(group.tanggal_selesai).startOf('day');
      return endDate.isBefore(today);
    }
    
    return false;
  };

  // Fungsi untuk mengecek apakah kelompok masih aktif (pending/submitted/approved dengan tanggal belum selesai)
  const isGroupActive = (group) => {
    if (!group) return false;
    
    // Status pending/submitted dianggap aktif
    if (group.status === "pending" || group.status === "submitted") {
      return true;
    }
    
    // Status approved dengan tanggal belum selesai
    if (group.status === "approved" && group.tanggal_selesai) {
      const today = dayjs().startOf('day');
      const endDate = dayjs(group.tanggal_selesai).startOf('day');
      return !endDate.isBefore(today); // Belum selesai
    }
    
    return false;
  };

  // Fetch kelompok saat komponen mount dan tab kelompok aktif
  useEffect(() => {
    if (activeTab === "kelompok") {
      fetchMyGroups();
    }
  }, [activeTab]);

  // Fetch undangan saat tab undangan aktif
  useEffect(() => {
    if (activeTab === "undangan") {
      fetchInvitations();
    }
  }, [activeTab]);

  const fetchMyGroups = async () => {
    setIsLoading(true);
    try {
      const response = await getMyPklGroups();
      console.log("Response from getMyPklGroups:", response);
      setKelompokSaya(response);
    } catch (error) {
      console.error("Gagal mengambil data kelompok:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvitations = async () => {
    setIsLoadingUndangan(true);
    try {
      const response = await getMyGroupInvitations();
      const invitationsWithStatus = response.map(inv => ({
        ...inv,
        status: inv.status || "pending"
      }));
      setUndangan(invitationsWithStatus);
    } catch (error) {
      console.error("Gagal mengambil undangan:", error);
    } finally {
      setIsLoadingUndangan(false);
    }
  };

  // Handler untuk membuka modal ubah kelompok
  const handleOpenUbahModal = (group) => {
    setSelectedGroup(group);
    setIsUbahModalOpen(true);
  };

  // Handler untuk update kelompok
  const handleUpdateKelompok = async (updatedMembers) => {
    await fetchMyGroups();
    setIsUbahModalOpen(false);
    setSelectedGroup(null);
  };

  // Handler untuk membuka modal hapus kelompok
  const handleOpenHapusModal = (group) => {
    setSelectedGroup(group);
    setIsHapusModalOpen(true);
  };

  // Handler untuk konfirmasi hapus kelompok
  const handleConfirmHapus = async (groupId) => {
    try {
      await fetchMyGroups();
      setIsHapusModalOpen(false);
      setSelectedGroup(null);
    } catch (error) {
      console.error("Gagal refresh data setelah hapus:", error);
    }
  };

  // Handler untuk membuka modal hapus anggota
  const handleOpenHapusAnggotaModal = (group, member) => {
    setSelectedGroup(group);
    setSelectedMember(member);
    setIsHapusAnggotaModalOpen(true);
  };

  // Handler untuk konfirmasi hapus anggota
  const handleConfirmHapusAnggota = async () => {
    if (!selectedGroup || !selectedMember) return;
    
    setIsRemoving(true);
    try {
      console.log("Menghapus anggota:", { 
        groupId: selectedGroup.id, 
        memberId: selectedMember.siswa.id,
        memberName: selectedMember.siswa.nama 
      });
      
      await removeGroupMember(selectedGroup.id, selectedMember.siswa.id);
      
      setIsHapusAnggotaModalOpen(false);
      await fetchMyGroups();
      setSelectedGroup(null);
      setSelectedMember(null);
    } catch (error) {
      console.error("Gagal menghapus anggota:", error);
      alert(error?.response?.data?.message || error?.message || "Gagal menghapus anggota");
    } finally {
      setIsRemoving(false);
    }
  };

  // Handler untuk kirim kelompok
  const handleKirimKelompok = async (groupId) => {
    // VALIDASI: Cek apakah ada PKL aktif atau pengajuan pending
    if (hasActivePKL) {
      alert("Anda sedang dalam masa PKL aktif. Tidak dapat mengirim kelompok baru.");
      return;
    }
    
    if (pengajuanPKLStatus === 'pending') {
      alert("Anda memiliki pengajuan PKL yang sedang diproses. Tidak dapat mengirim kelompok baru.");
      return;
    }
    
    try {
      console.log("Kirim kelompok:", groupId);
      // Panggil API untuk mengirim kelompok
      // await submitGroupPKL(groupId, {});
      
      // Navigasi ke halaman pengajuan PKL
      navigate('/siswa/pengajuan_pkl');
    } catch (error) {
      console.error("Gagal mengirim kelompok:", error);
      alert("Gagal mengirim kelompok");
    }
  };

  // Handler untuk membuka modal batalkan pengajuan
  const handleOpenBatalkanModal = (group) => {
    setSelectedGroupForCancellation(group);
    setIsBatalkanModalOpen(true);
  };

  // Handler untuk konfirmasi batalkan pengajuan
  const handleConfirmBatalkan = async () => {
    if (!selectedGroupForCancellation) return;
    
    try {
      console.log("Membatalkan pengajuan kelompok:", selectedGroupForCancellation.id);
      
      const response = await withdrawGroupPKL(selectedGroupForCancellation.id);
      console.log("Response withdraw:", response);
      
      setIsBatalkanModalOpen(false);
      await fetchMyGroups();
      setSelectedGroupForCancellation(null);
      
      alert("Pengajuan kelompok berhasil dibatalkan!");
    } catch (error) {
      console.error("Gagal membatalkan pengajuan:", error);
      const errorMessage = error.response?.data?.message || error.message || "Gagal membatalkan pengajuan";
      alert(errorMessage);
    }
  };

  // Handler untuk terima undangan
  const handleTerimaUndangan = async (id) => {
    try {
      await acceptGroupInvitation(id, { accept: true });
      setUndangan(prev => 
        prev.map(u => u.id === id ? { ...u, status: "accepted" } : u)
      );
    } catch (error) {
      console.error("Gagal menerima undangan:", error);
      alert(error?.response?.data?.message || error?.message || "Gagal menerima undangan");
    }
  };

  // Handler untuk tolak undangan
  const handleTolakUndangan = async (id) => {
    try {
      await acceptGroupInvitation(id, { accept: false });
      setUndangan(prev => 
        prev.map(u => u.id === id ? { ...u, status: "rejected" } : u)
      );
    } catch (error) {
      console.error("Gagal menolak undangan:", error);
      alert(error?.response?.data?.message || error?.message || "Gagal menolak undangan");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "accepted":
        return <CheckCircle size={28} className="text-green-500" />;
      case "rejected":
        return <XCircle size={28} className="text-red-500" />;
      case "pending":
        return <Clock size={28} className="text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case "accepted":
        return (
          <span className="text-green-600 bg-green-100 px-3 py-1 rounded-full text-xs font-medium">
            Disetujui
          </span>
        );
      case "rejected":
        return (
          <span className="text-red-600 bg-red-100 px-3 py-1 rounded-full text-xs font-medium">
            Ditolak
          </span>
        );
      case "pending":
        return (
          <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">
            Menunggu
          </span>
        );
      default:
        return (
          <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  const handleBuatKelompok = (anggotaTerpilih) => {
    console.log("Membuat kelompok dengan anggota:", anggotaTerpilih);
    fetchMyGroups();
  };

  const undanganPending = undangan.filter(u => u.status === "pending").length;

  const groupedByDate = kelompokSaya.reduce((groups, group) => {
    const date = formatDate(group.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(group);
    return groups;
  }, {});

  const groupedUndanganByDate = undangan.reduce((groups, inv) => {
    const date = formatDate(inv.invited_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(inv);
    return groups;
  }, {});

  // Debug
  useEffect(() => {
    if (kelompokSaya.length > 0) {
      kelompokSaya.forEach((group, index) => {
        console.log(`Group ${index}:`, {
          groupId: group.id,
          isLeader: isCurrentUserLeader(group),
          jumlahAnggota: getJumlahAnggota(group),
          allMembersAccepted: areAllMembersAccepted(group),
          isFinished: isGroupFinished(group),
          isActive: isGroupActive(group)
        });
      });
    }
  }, [kelompokSaya]);

  // LOGIC DISABLE KIRIM KELOMPOK
  const canSendGroup = 
    !hasActivePKL && // TIDAK ADA PKL AKTIF
    pengajuanPKLStatus !== 'pending'; // TIDAK ADA PENGAJUAN PENDING

  // PERBAIKAN: Cek apakah ADA kelompok yang masih aktif (pending/submitted/approved dengan tanggal belum selesai)
  const hasActiveGroup = kelompokSaya.some(group => isGroupActive(group));

  // Cek apakah semua kelompok sudah selesai (tanggal selesai sudah lewat) ATAU ditolak
  const allGroupsFinished = kelompokSaya.length > 0 && kelompokSaya.every(group => isGroupFinished(group));

  return (
    <div className="bg-white min-h-screen w-full">
      <Header user={user} />

      <div className="flex flex-col md:flex-row">
        <div className="md:block hidden">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 bg-[#F6F7FC] rounded-none md:rounded-l-3xl shadow-inner">
          <div className="max-w-7xl mx-auto">
            {/* Tabs */}
            <div className="flex justify-center mb-8">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("kelompok")}
                  className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors relative ${
                    activeTab === "kelompok"
                      ? "!bg-[#EC933A] text-white border-b-2 border-[#EC933A]"
                      : "!bg-[#E1D6C4] text-[#3A3D3D] hover:text-gray-700"
                  }`}
                >
                  <Users size={18} />
                  Kelompok
                </button>
                <button
                  onClick={() => setActiveTab("undangan")}
                  className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors relative ${
                    activeTab === "undangan"
                      ? "!bg-[#EC933A] text-white border-b-2 border-[#EC933A]"
                      : "!bg-[#E1D6C4] text-[#3A3D3D] hover:text-gray-700"
                  }`}
                >
                  <Mail size={18} />
                  Undangan
                  {undanganPending > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {undanganPending}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === "kelompok" ? (
              <>
                {/* Header Kelompok */}
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Daftar Kelompok PKL
                    </h2>
                    
                    {/* TOMBOL BUAT KELOMPOK BARU - TAMPIL JIKA:
                        1. SEMUA kelompok sudah selesai (tanggal lewat) ATAU ditolak, ATAU
                        2. TIDAK ADA kelompok yang aktif
                    */}
                    {(allGroupsFinished || !hasActiveGroup) && kelompokSaya.length > 0 && (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 !bg-[#EC933A] hover:bg-[#d67d2a] text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Plus size={18} />
                        Buat Kelompok Baru
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Kelola kelompok anda dan undang anggota
                  </p>
                  
                  {/* Info Banner untuk status PKL */}
                  {hasActivePKL && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700 flex items-center gap-2">
                        <span className="font-bold">ℹ️</span>
                        Anda sedang dalam masa PKL aktif. Tidak dapat mengirim kelompok baru.
                      </p>
                    </div>
                  )}
                  
                  {pengajuanPKLStatus === 'pending' && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-700 flex items-center gap-2">
                        <span className="font-bold">⏳</span>
                        Anda memiliki pengajuan PKL yang sedang diproses. Tidak dapat mengirim kelompok baru.
                      </p>
                    </div>
                  )}

                  {/* Info Banner jika semua kelompok sudah selesai atau ditolak */}
                  {kelompokSaya.length > 0 && allGroupsFinished && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 flex items-center gap-2">
                        <span className="font-bold">✅</span>
                        Semua kelompok Anda telah selesai atau ditolak. Anda dapat membuat kelompok baru.
                      </p>
                    </div>
                  )}
                </div>

                {/* Konten Kelompok */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  {isLoading || loadingPKLStatus ? (
                    <div className="flex justify-center items-center py-16">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC933A]"></div>
                    </div>
                  ) : kelompokSaya.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                      <div className="w-32 h-32 rounded-full flex items-center justify-center mb-4">
                        <img src={orang} alt="" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-700 mb-2">
                        Belum ada kelompok
                      </h2>
                      <p className="text-gray-500 text-center mb-6 max-w-md">
                        Anda belum tergabung dalam kelompok manapun. 
                        Yuk buat kelompok baru sekarang!
                      </p>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 !bg-[#EC933A] hover:bg-[#d67d2a] text-white px-6 py-3 rounded-lg transition-colors font-medium"
                      >
                        <Plus size={20} />
                        Buat Kelompok baru
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {Object.entries(groupedByDate).map(([date, groups]) => (
                        <div key={date}>
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">
                              {date}
                            </h3>
                            {groups.length > 0 && isCurrentUserLeader(groups[0]) && !isGroupFinished(groups[0]) && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleOpenUbahModal(groups[0])}
                                  className="flex items-center gap-2 !bg-blue-500 !text-white hover:bg-blue-600 transition-colors px-3 py-2 rounded"
                                >
                                  <Edit2 size={18} />
                                  <span>Ubah Kelompok</span>
                                </button>

                                <button 
                                  onClick={() => handleOpenHapusModal(groups[0])}
                                  className="flex items-center gap-2 !bg-red-500 !text-white hover:bg-red-600 transition-colors px-3 py-2 rounded"
                                >
                                  <Trash2 size={18} />
                                  <span>Hapus Kelompok</span>
                                </button>
                              </div>
                            )}
                          </div>
                          {groups.map((group) => {
                            const leader = group.members.find(m => m.is_leader)?.siswa;
                            const otherMembers = group.members.filter(m => !m.is_leader);
                            const isLeader = isCurrentUserLeader(group);
                            const allAccepted = areAllMembersAccepted(group);
                            const jumlahAnggota = getJumlahAnggota(group);
                            const isFinished = isGroupFinished(group);
                            
                            // LOGIC DISABLE KIRIM KELOMPOK
                            const isSendDisabled = 
                              !canSendGroup || // Ada PKL aktif atau pengajuan pending
                              !isLeader || // Bukan leader
                              group.status !== "pending" || // Bukan status pending
                              !allAccepted || // Belum semua anggota accepted
                              isFinished; // PKL sudah selesai atau ditolak

                            // Pesan tooltip untuk disabled
                            let disabledMessage = "";
                            if (isFinished) {
                              disabledMessage = group.status === "rejected" 
                                ? "Kelompok ditolak" 
                                : "Masa PKL telah selesai";
                            } else if (!canSendGroup) {
                              disabledMessage = hasActivePKL 
                                ? "Anda sedang dalam masa PKL aktif" 
                                : "Anda memiliki pengajuan PKL yang sedang diproses";
                            } else if (!isLeader) {
                              disabledMessage = "Hanya ketua yang dapat mengirim kelompok";
                            } else if (group.status !== "pending") {
                              disabledMessage = "Kelompok sudah dikirim";
                            } else if (!allAccepted) {
                              disabledMessage = "Tunggu semua anggota menerima undangan";
                            }
                            
                            return (
                              <div key={group.id} className={`border rounded-lg p-6 mb-6 ${isFinished ? 'border-gray-300 bg-gray-50' : 'border-gray-200'}`}>
                                {/* Header Group */}
                                <div className="flex items-start gap-4 mb-4">
                                  <div className="flex-shrink-0 mt-1">
                                    {leader && getStatusIcon(group.status)}
                                  </div>
                                  
                                  <div className="flex-1">
                                    <h4 className="text-xl font-semibold text-gray-800">
                                      {leader?.nama || "Unknown"} | {leader?.kelas || "-"}
                                    </h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {jumlahAnggota} Anggota
                                      {isLeader && (
                                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                          Anda Ketua
                                        </span>
                                      )}
                                    </p>
                                    
                                    {/* Info tanggal PKL */}
                                    <div className="mt-2 flex items-center gap-4 text-xs">
                                      {group.tanggal_mulai && (
                                        <span className="text-gray-500">
                                          📅 Mulai: {formatDate(group.tanggal_mulai)}
                                        </span>
                                      )}
                                      {group.tanggal_selesai && (
                                        <span className="text-gray-500">
                                          🏁 Selesai: {formatDate(group.tanggal_selesai)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {/* Badge Selesai jika PKL sudah selesai atau ditolak */}
                                    {isFinished && (
                                      <span className={`text-xs font-medium px-5 py-1 rounded-full flex items-center gap-1 ${
                                        group.status === "rejected" 
                                          ? 'bg-red-100 text-red-600' 
                                          : 'bg-purple-100 text-purple-600'
                                      }`}>
                                        {group.status === "rejected" ? (
                                          <>
                                            <XCircle size={14} />
                                            Ditolak
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle size={14} />
                                            Selesai
                                          </>
                                        )}
                                      </span>
                                    )}
                                    
                                    {group.status === "pending" && !isFinished && (
                                      <span className="text-xs font-medium px-5 py-1 bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
                                        <Clock size={14} />
                                        Draf
                                      </span>
                                    )}
                                    
                                    {group.status === "submitted" && !isFinished && (
                                      <span className="text-xs font-medium px-5 py-1 bg-blue-100 text-blue-600 rounded-full flex items-center gap-1">
                                        <Send size={14} />
                                        Terkirim
                                      </span>
                                    )}
                                    
                                    {group.status === "approved" && !isFinished && (
                                      <span className="text-xs font-medium px-5 py-1 bg-green-100 text-green-600 rounded-full flex items-center gap-1">
                                        <CheckCircle size={14} />
                                        Disetujui
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Tabel Anggota */}
                                {otherMembers.length > 0 && (
                                  <div className="mt-4">
                                    <h5 className="text-md font-semibold text-gray-700 mb-3">
                                      Anggota terpilih
                                    </h5>
                                    <div className="overflow-x-auto">
                                      <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                          <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NISN</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            {isLeader && !isFinished && (
                                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hapus</th>
                                            )}
                                          </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                          {otherMembers.map((member, index) => (
                                            <tr key={member.siswa.id} className="hover:bg-gray-50">
                                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {index + 1}
                                              </td>
                                              <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                  {member.siswa.nama}
                                                </div>
                                              </td>
                                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {member.siswa.nisn}
                                              </td>
                                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {member.siswa.kelas}
                                              </td>
                                              <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(member.invitation_status)}
                                              </td>
                                              {isLeader && !isFinished && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                  <button 
                                                    onClick={() => handleOpenHapusAnggotaModal(group, member)}
                                                    disabled={isRemoving}
                                                    className={`!bg-transparent ${isRemoving ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:text-red-700'} transition-colors`}
                                                    title="Hapus dari kelompok"
                                                  >
                                                    <X size={18} />
                                                  </button>
                                                </td>
                                              )}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                    
                                    {/* Tombol Kirim - HANYA TAMPIL JIKA KELOMPOK BELUM SELESAI/DITOLAK */}
                                    {isLeader && group.status === "pending" && !isFinished && (
                                      <div className="mt-6 flex flex-col items-end gap-2">
                                        {/* Tombol Kirim dengan disabled state */}
                                        <button
                                          onClick={() => {
                                            if (isSendDisabled) {
                                              alert(disabledMessage);
                                              return;
                                            }
                                            handleKirimKelompok(group.id);
                                          }}
                                          disabled={isSendDisabled}
                                          className={`
                                            flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium
                                            ${isSendDisabled 
                                              ? '!bg-gray-400 cursor-not-allowed opacity-60' 
                                              : '!bg-[#EC933A] hover:bg-[#d67d2a] text-white'
                                            }
                                          `}
                                          title={disabledMessage}
                                        >
                                          <UploadCloud size={20} />
                                          <span>Kirim Kelompok</span>
                                        </button>
                                        
                                        {/* Info message jika disabled */}
                                        {isSendDisabled && (
                                          <p className="text-xs text-gray-500 text-right">
                                            ⚠️ {disabledMessage}
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {/* Tombol Batalkan Pengajuan - HANYA TAMPIL JIKA KELOMPOK BELUM SELESAI/DITOLAK */}
                                    {isLeader && group.status === "submitted" && !isFinished && (
                                      <div className="mt-6 flex justify-end">
                                        <button
                                          onClick={() => handleOpenBatalkanModal(group)}
                                          className="flex items-center gap-2 !bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                                        >
                                          <Ban size={20} />
                                          <span>Batalkan Pengajuan</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Header Undangan */}
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">
                    Undangan
                  </h2>
                  <p className="text-sm text-gray-500">
                    Terima / tolak undangan dari teman anda
                  </p>
                </div>

                {/* Konten Undangan */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  {isLoadingUndangan ? (
                    <div className="flex justify-center items-center py-16">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC933A]"></div>
                    </div>
                  ) : undangan.length > 0 ? (
                    <div className="space-y-6">
                      {Object.entries(groupedUndanganByDate).map(([date, invitations]) => (
                        <div key={date}>
                          <h3 className="text-lg font-semibold text-gray-700 mb-3">
                            {date}
                          </h3>
                          <div className="space-y-4">
                            {invitations.map((item) => (
                              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    {item.status === "pending" && (
                                      <Clock size={32} className="text-yellow-500" />
                                    )}
                                    {item.status === "rejected" && (
                                      <XCircle size={32} className="text-red-500" />
                                    )}
                                    {item.status === "accepted" && (
                                      <CheckCircle size={32} className="text-green-500" />
                                    )}
                                    
                                    <div>
                                      <h3 className="font-semibold text-gray-800">
                                        {item.leader.nama} | {item.leader.kelas}
                                      </h3>
                                      <p className="text-sm text-gray-600">
                                        {item.member_count} Anggota
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    {item.status === "pending" && (
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleTerimaUndangan(item.id)}
                                          className="px-4 py-2 !bg-[#EC933A] hover:bg-[#d67d2a] text-white text-sm rounded-lg transition-colors min-w-[100px]"
                                        >
                                          Terima
                                        </button>
                                        <button
                                          onClick={() => handleTolakUndangan(item.id)}
                                          className="px-4 py-2 !bg-[#BC2424] hover:bg-[#a01f1f] text-white text-sm rounded-lg transition-colors min-w-[100px]"
                                        >
                                          Tolak
                                        </button>
                                      </div>
                                    )}

                                    {item.status === "rejected" && (
                                      <span className="text-sm text-red-500 font-medium">Ditolak</span>
                                    )}

                                    {item.status === "accepted" && (
                                      <span className="text-sm text-green-500 font-medium">Diterima</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                      <div className="w-32 h-32 rounded-full flex items-center justify-center mb-4">
                        <img src={undanganIcon} alt="" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-700 mb-2">
                        Belum ada undangan
                      </h3>
                      <p className="text-gray-500 text-center max-w-md">
                        Anda belum diundang dalam kelompok manapun.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <BuatKelompokModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleBuatKelompok}
      />

      {selectedGroup && (
        <UbahKelompokModal
          isOpen={isUbahModalOpen}
          onClose={() => {
            setIsUbahModalOpen(false);
            setSelectedGroup(null);
          }}
          onUpdate={handleUpdateKelompok}
          groupId={selectedGroup.id}
          currentMembers={selectedGroup.members || []}
        />
      )}

      {selectedGroup && (
        <HapusKelompokModal
          isOpen={isHapusModalOpen}
          onClose={() => {
            setIsHapusModalOpen(false);
            setSelectedGroup(null);
          }}
          onConfirm={handleConfirmHapus}
          groupId={selectedGroup.id}
          groupName={selectedGroup.members?.find(m => m.is_leader)?.siswa?.nama || "Kelompok"}
        />
      )}

      {selectedGroup && selectedMember && (
        <HapusAnggotaModal
          isOpen={isHapusAnggotaModalOpen}
          onClose={() => {
            setIsHapusAnggotaModalOpen(false);
            setSelectedGroup(null);
            setSelectedMember(null);
          }}
          onConfirm={handleConfirmHapusAnggota}
          imageSrc={hapusIcon}
          anggotaNama={selectedMember.siswa.nama}
        />
      )}

      {selectedGroupForCancellation && (
        <BatalkanPengajuanModal
          isOpen={isBatalkanModalOpen}
          onClose={() => {
            setIsBatalkanModalOpen(false);
            setSelectedGroupForCancellation(null);
          }}
          onConfirm={handleConfirmBatalkan}
          groupName={`${selectedGroupForCancellation.members?.find(m => m.is_leader)?.siswa?.nama || "Kelompok"} | ${selectedGroupForCancellation.members?.find(m => m.is_leader)?.siswa?.kelas || "-"}`}
        />
      )}
    </div>
  );
}