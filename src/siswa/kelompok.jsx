// src/pages/siswa/KelolaKelompok.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Mail, Plus, Clock, CheckCircle, XCircle, UserPlus, Calendar, Trash2, Send, X,Ban, Edit2, Building, UploadCloud } from "lucide-react";
import orang from "../assets/orangUtan.svg"
import undanganIcon from "../assets/undangan.svg"
import hapusIcon from "../assets/deleteGrafik.svg" // Anda perlu menambahkan icon ini

// Components
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import BuatKelompokModal from "./components/addKelompok";
import UbahKelompokModal from "./components/editKelompok";
import HapusKelompokModal from "./components/hapusKelompok";
import HapusAnggotaModal from "./components/hapusAnggota"; // Import modal hapus anggota

// Services
import { 
  getMyPklGroups, 
  getMyGroupInvitations, 
  acceptGroupInvitation,
  removeGroupMember,
  withdrawGroupPKL 
} from "../utils/services/siswa/group";

export default function KelolaKelompok() {
  const navigate = useNavigate();
  const [active, setActive] = useState("kelompok");
  const [activeTab, setActiveTab] = useState("kelompok");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUbahModalOpen, setIsUbahModalOpen] = useState(false);
  const [isHapusModalOpen, setIsHapusModalOpen] = useState(false);
  const [isHapusAnggotaModalOpen, setIsHapusAnggotaModalOpen] = useState(false); // State untuk modal hapus anggota
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null); // State untuk anggota yang akan dihapus
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUndangan, setIsLoadingUndangan] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
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

  // Fungsi untuk mendapatkan jumlah anggota (tanpa leader)
  const getJumlahAnggota = (group) => {
    if (!group || !group.members) return 0;
    return group.members.filter(m => !m.is_leader).length;
  };

  // Fungsi untuk mengecek apakah semua anggota sudah accepted
  const areAllMembersAccepted = (group) => {
    if (!group || !group.members) return false;
    
    // Filter anggota yang bukan leader
    const nonLeaderMembers = group.members.filter(m => !m.is_leader);
    
    // Jika tidak ada anggota selain leader, return false
    if (nonLeaderMembers.length === 0) return false;
    
    // Cek apakah semua anggota non-leader statusnya accepted
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
    
    // Cari anggota yang is_leader = true
    const leaderMember = group.members.find(m => m.is_leader === true);
    console.log("Leader Member:", leaderMember);
    
    // Jika ketemu leader, bandingkan NAMA-nya dengan current user name
    if (leaderMember) {
      const isLeader = leaderMember.siswa.nama === currentUserName;
      console.log("Is Current User Leader?", isLeader);
      return isLeader;
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
      // Tambahkan status default "pending" jika belum ada
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
    await fetchMyGroups(); // Refresh data setelah update
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
      await fetchMyGroups(); // Refresh data setelah hapus
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
      
      // Panggil API untuk menghapus anggota
      await removeGroupMember(selectedGroup.id, selectedMember.siswa.id);
      
      // Tutup modal
      setIsHapusAnggotaModalOpen(false);
      
      // Refresh data setelah hapus
      await fetchMyGroups();
      
      // Reset state
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
    try {
      // Implementasi logika kirim kelompok
      console.log("Kirim kelompok:", groupId);
      // Panggil API untuk mengirim kelompok
      // await submitGroupPKL(groupId, {});
      
      // Navigasi ke halaman pengajuan PKL
      navigate('/siswa/pengajuan_pkl');
      
      // Tampilkan notifikasi sukses
      // alert("Kelompok berhasil dikirim!");
    } catch (error) {
      console.error("Gagal mengirim kelompok:", error);
      alert("Gagal mengirim kelompok");
    }
  };

  // Handler untuk membatalkan pengajuan kelompok
    const handleBatalkanPengajuan = async (groupId) => {
    try {
        // Tampilkan konfirmasi sebelum membatalkan
        if (window.confirm("Apakah Anda yakin ingin membatalkan pengajuan kelompok ini?")) {
        console.log("Membatalkan pengajuan kelompok:", groupId);
        
        // Panggil API untuk membatalkan pengajuan
        const response = await withdrawGroupPKL(groupId);
        console.log("Response withdraw:", response);
        
        // Refresh data setelah pembatalan
        await fetchMyGroups();
        
        // Tampilkan notifikasi sukses
        alert("Pengajuan kelompok berhasil dibatalkan!");
        }
    } catch (error) {
        console.error("Gagal membatalkan pengajuan:", error);
        
        // Tampilkan pesan error yang lebih informatif
        const errorMessage = error.response?.data?.message || error.message || "Gagal membatalkan pengajuan";
        alert(errorMessage);
    }
    };

  // Handler untuk terima undangan
  const handleTerimaUndangan = async (id) => {
    try {
      // Panggil API terima undangan dengan payload { accept: true }
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
      // Panggil API tolak undangan dengan payload { accept: false }
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
    fetchMyGroups(); // Refresh data setelah membuat kelompok
  };

  const undanganPending = undangan.filter(u => u.status === "pending").length;

  // Group by tanggal untuk tampilan kelompok
  const groupedByDate = kelompokSaya.reduce((groups, group) => {
    const date = formatDate(group.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(group);
    return groups;
  }, {});

  // Group by tanggal untuk tampilan undangan
  const groupedUndanganByDate = undangan.reduce((groups, inv) => {
    const date = formatDate(inv.invited_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(inv);
    return groups;
  }, {});

  // Debug: Cek status leader untuk setiap kelompok
  useEffect(() => {
    if (kelompokSaya.length > 0) {
      kelompokSaya.forEach((group, index) => {
        console.log(`Group ${index}:`, {
          groupId: group.id,
          isLeader: isCurrentUserLeader(group),
          jumlahAnggota: getJumlahAnggota(group),
          allMembersAccepted: areAllMembersAccepted(group)
        });
      });
    }
  }, [kelompokSaya]);

  return (
    <div className="bg-white min-h-screen w-full">
      <Header user={user} />

      <div className="flex flex-col md:flex-row">
        <div className="md:block hidden">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 bg-[#F6F7FC] rounded-none md:rounded-l-3xl shadow-inner">
          <div className="max-w-7xl mx-auto">
            {/* Tabs - di tengah */}
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
                {/* Header Kelompok - di luar kotak */}
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Daftar Kelompok PKL
                    </h2>
                    {/* Tombol Buat Kelompok hanya muncul jika belum ada kelompok */}
                    {kelompokSaya.length === 0 && (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 !bg-[#EC933A] hover:bg-[#d67d2a] text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Plus size={18} />
                        Buat Kelompok
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Kelola kelompok anda dan undang anggota
                  </p>
                </div>

                {/* Konten Kelompok - di dalam kotak */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  {isLoading ? (
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
                            {/* Hanya tampilkan tombol aksi untuk grup pertama jika user adalah leader */}
                            {groups.length > 0 && isCurrentUserLeader(groups[0]) && (
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
                            
                            return (
                              <div key={group.id} className="border border-gray-200 rounded-lg p-6 mb-6">
                                {/* Header Group dengan icon status di samping kiri */}
                                <div className="flex items-start gap-4 mb-4">
                                  {/* Icon status di samping kiri sendiri */}
                                  <div className="flex-shrink-0 mt-1">
                                    {leader && getStatusIcon(group.status)}
                                  </div>
                                  
                                  {/* Nama ketua dan info */}
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
                                  </div>
                                  
                                  {/* Badge Draf selalu tampil jika status pending */}
                                  <div className="flex items-center gap-2">
                                    {group.status === "pending" && (
                                      <span className="text-xs font-medium px-5 py-1 bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
                                        <Clock size={14} />
                                        Draf
                                      </span>
                                    )}
                                    
                                    {group.status === "submitted" && (
                                      <span className="text-xs font-medium px-5 py-1 bg-blue-100 text-blue-600 rounded-full flex items-center gap-1">
                                        <Send size={14} />
                                        Terkirim
                                      </span>
                                    )}
                                    
                                    {group.status === "approved" && (
                                      <span className="text-xs font-medium px-5 py-1 bg-green-100 text-green-600 rounded-full flex items-center gap-1">
                                        <CheckCircle size={14} />
                                        Disetujui
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Tabel Anggota (hanya menampilkan anggota selain ketua) */}
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
                                            {/* Kolom Hapus hanya ditampilkan jika user adalah leader */}
                                            {isLeader && (
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
                                              {/* Tombol Hapus hanya ditampilkan jika user adalah leader */}
                                              {isLeader && (
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
                                    
                                    
                                    {/* Tombol Kirim/Batal ditempatkan di bawah tabel - hanya untuk leader */}
                                    {isLeader && group.status === "pending" && allAccepted && (
                                    <div className="mt-6 flex justify-end">
                                        <button
                                        onClick={() => handleKirimKelompok(group.id)}
                                        className="flex items-center gap-2 !bg-[#EC933A] hover:bg-[#d67d2a] text-white px-6 py-3 rounded-lg transition-colors font-medium"
                                        >
                                        <UploadCloud size={20} />
                                        <span>Kirim Kelompok</span>
                                        </button>
                                    </div>
                                    )}

                                    {isLeader && group.status === "submitted" && (
                                    <div className="mt-6 flex justify-end">
                                        <button
                                        onClick={() => handleBatalkanPengajuan(group.id)}
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
                {/* Header Undangan - di luar kotak */}
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">
                    Undangan
                  </h2>
                  <p className="text-sm text-gray-500">
                    Terima / tolak undangan dari teman anda
                  </p>
                </div>

                {/* Konten Undangan - di dalam kotak */}
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

      {/* Modal Buat Kelompok */}
      <BuatKelompokModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleBuatKelompok}
      />

      {/* Modal Ubah Kelompok */}
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

      {/* Modal Hapus Kelompok */}
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

      {/* Modal Hapus Anggota */}
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
    </div>
  );
}   