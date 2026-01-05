import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";

// Components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

export default function DataPerizinanSiswa() {
  const [active, setActive] = useState("sidebarPerizinan");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [industriFilter, setIndustriFilter] = useState("");
  const [dataPerizinan, setDataPerizinan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const user =
    JSON.parse(localStorage.getItem("user")) || { name: "Wali Kelas", role: "Guru" };

  // Data dummy perizinan siswa
  const dummyDataPerizinan = [
    {
      nama: "Firli Zulfa Azzahra",
      kelas: "XII",
      tanggal: "01/05/2025",
      alasan: "SAKIT",
      lampiran: "ada",
      status: "Proses"
    },
    {
      nama: "Andi Pratama",
      kelas: "XI RPL 2",
      tanggal: "15/11/2025",
      alasan: "SAKIT",
      lampiran: "ada",
      status: "Proses"
    },
    {
      nama: "Siti Nurhaliza",
      kelas: "XII",
      tanggal: "18/11/2025",
      alasan: "SAKIT",
      lampiran: "ada",
      status: "Disetujui"
    },
    {
      nama: "Budi Santoso",
      kelas: "XI RPL 1",
      tanggal: "20/11/2025",
      alasan: "Keperluan Keluarga",
      lampiran: "ada",
      status: "Disetujui"
    },
    {
      nama: "Dewi Lestari",
      kelas: "XII",
      tanggal: "22/11/2025",
      alasan: "Urusan Pribadi",
      lampiran: "ada",
      status: "Ditolak"
    },
    {
      nama: "Rizki Ramadhan",
      kelas: "XI RPL 2",
      tanggal: "25/11/2025",
      alasan: "SAKIT",
      lampiran: "ada",
      status: "Ditolak"
    },
    {
      nama: "Maya Anggraini",
      kelas: "XII",
      tanggal: "28/11/2025",
      alasan: "Acara Keluarga",
      lampiran: "ada",
      status: "Proses"
    },
    {
      nama: "Farhan Maulana",
      kelas: "XI RPL 1",
      tanggal: "01/12/2025",
      alasan: "SAKIT",
      lampiran: "ada",
      status: "Disetujui"
    },
    {
      nama: "Linda Wijaya",
      kelas: "XII",
      tanggal: "03/12/2025",
      alasan: "Keperluan Mendesak",
      lampiran: "ada",
      status: "Proses"
    },
    {
      nama: "Putri Maharani",
      kelas: "XI RPL 2",
      tanggal: "05/12/2025",
      alasan: "SAKIT",
      lampiran: "ada",
      status: "Ditolak"
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        // Ganti dengan endpoint API yang sesuai untuk data perizinan siswa
        // const res = await axios.get("/api/perizinan-siswa");
        // setDataPerizinan(res.data.data);
        
        // Sementara gunakan dummy data
        setTimeout(() => {
          setDataPerizinan(dummyDataPerizinan);
          setLoading(false);
        }, 500);
      } catch (err) {
        console.error("Fetch data error:", err);
        setError("Gagal mengambil data dari server.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data perizinan
  const filteredPerizinan = dataPerizinan.filter((item) => {
    const matchQuery = item.nama.toLowerCase().includes(query.toLowerCase()) ||
                       item.kelas.toLowerCase().includes(query.toLowerCase()) ||
                       item.alasan.toLowerCase().includes(query.toLowerCase());
    const matchStatus = !statusFilter || item.status === statusFilter;
    
    return matchQuery && matchStatus;
  });

  // Get unique values for filters
  const uniqueStatus = [...new Set(dataPerizinan.map(s => s.status))];

  return (
    <div className="bg-white min-h-screen w-full">
      {/* Header */}
      <Header query={query} setQuery={setQuery} user={user} />

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="hidden md:block">
          <Sidebar active={active} setActive={setActive} />
        </div>

        {/* Main content */}
        <main className="flex-1 p-6 md:p-10 rounded-none bg-[#6B2E3E] min-h-screen">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-white font-semibold">Loading data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center bg-red-100 rounded-xl p-6 shadow-md">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : (
            <>
              {/* Header Section */}
              <div className="mb-8">
                <h1 className="text-white text-3xl font-bold mb-8">Data Perizinan Siswa</h1>
                
                {/* Search and Filter Row */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-8">
                  {/* Search Bar */}
                  <div className="relative flex-1 max-w-2xl">
                    <input
                      type="text"
                      placeholder="Pencarian"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full px-5 py-3 pl-12 rounded-full bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-md"
                    />
                    <svg 
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-3">
                    {/* Status Filter */}
                    <div className="relative">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appearance-none px-6 py-3 pr-10 rounded-full bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer shadow-md"
                      >
                        <option value="">Status</option>
                        {uniqueStatus.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <div className="w-6 h-6 rounded-full bg-orange-400 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Industri Filter */}
                    <div className="relative">
                      <select
                        value={industriFilter}
                        onChange={(e) => setIndustriFilter(e.target.value)}
                        className="appearance-none px-6 py-3 pr-10 rounded-full bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer shadow-md"
                      >
                        <option value="">Industri</option>
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <div className="w-6 h-6 rounded-full bg-orange-400 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Add Button */}
                    <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors shadow-md">
                      <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Section */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white border-b-2 border-gray-200">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Nama</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Kelas</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Tanggal</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Alasan</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Lampiran</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {filteredPerizinan.length > 0 ? (
                        filteredPerizinan.map((item, index) => (
                          <tr 
                            key={index} 
                            className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm text-gray-700">{item.nama}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{item.kelas}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{item.tanggal}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`font-semibold ${item.alasan === 'SAKIT' ? 'text-red-600' : 'text-gray-700'}`}>
                                {item.alasan}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex items-center justify-center w-8 h-8">
                                <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{item.status}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-gray-500 text-base">
                            Data tidak ditemukan
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}