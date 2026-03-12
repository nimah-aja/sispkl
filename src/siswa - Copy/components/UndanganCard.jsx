// src/pages/siswa/components/UndanganCard.jsx
import React from "react";
import { Clock, CheckCircle, XCircle, UserPlus, Building } from "lucide-react";

export default function UndanganCard({ undangan, onTerima, onTolak }) {
  const getStatusBadge = (status) => {
    switch(status) {
      case "accepted":
        return (
          <span className="text-green-600 bg-green-100 px-3 py-1 rounded-full text-xs font-medium">
            Diterima
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
          <span className="text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full text-xs font-medium">
            Menunggu
          </span>
        );
      default:
        return null;
    }
  };

  const formatWaktu = (waktu) => {
    const date = new Date(waktu);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="font-semibold text-gray-800">
              {undangan.leader.nama} | {undangan.leader.kelas}
            </h3>
            {getStatusBadge(undangan.status)}
          </div>
          
          <div className="space-y-1 mb-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <UserPlus size={14} className="text-gray-400" />
              <span className="font-medium">Jumlah Anggota:</span> {undangan.member_count} Orang
            </p>
            
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Building size={14} className="text-gray-400" />
              <span className="font-medium">Industri:</span> {undangan.industri.nama}
            </p>
          </div>
          
          <p className="text-xs text-gray-400">
            Diundang {formatWaktu(undangan.invited_at)}
          </p>
        </div>

        {undangan.status === "pending" && (
          <div className="flex sm:flex-col gap-2">
            <button
              onClick={() => onTerima(undangan.id)}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors min-w-[100px]"
            >
              Terima
            </button>
            <button
              onClick={() => onTolak(undangan.id)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors min-w-[100px]"
            >
              Tolak
            </button>
          </div>
        )}

        {undangan.status === "rejected" && (
          <div className="flex items-center gap-2 text-red-500">
            <XCircle size={20} />
            <span className="text-sm">Anda menolak undangan kelompok</span>
          </div>
        )}

        {undangan.status === "accepted" && (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle size={20} />
            <span className="text-sm">Anda menerima undangan kelompok</span>
          </div>
        )}
      </div>
    </div>
  );
}