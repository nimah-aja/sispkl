import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";

// Components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

// Assets
import userIcon  from "../assets/sidebarUsers.svg";
import timeIcon  from "../assets/timewalkel.png";
import surrelIcon from "../assets/envelope.png";
import bellIcon from "../assets/bell-notification-social-media 1.png";

export default function DataSiswaPKL() {
  const [active, setActive] = useState("sidebarDashboard");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [industriFilter, setIndustriFilter] = useState("");
  const [dataSiswa, setDataSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();
  const user =
    JSON.parse(localStorage.getItem("user")) || { name: "Pem", role: "Guru" };

  // Data dummy siswa PKL
  const dummyDataSiswa = [
    {
      nisn: "1234567890",
      nama: "Firli Zulfa Azzahra",
      industri: "Emran Digital",
      guru: "Nimah Hidayah S.Pd",
      status: "Aktif",
      tanggalLahir: "01 Juli 2008",
      kelas: "XI RPL 2",
      alamat: "Sigura-gura",
      noTelp: "0882-8298-298"
    },
    {
      nisn: "1234567890",
      nama: "Firli Zulfa Azzahra",
      industri: "Emran Digital",
      guru: "Nimah Hidayah S.Pd",
      status: "Aktif",
      tanggalLahir: "01 Juli 2008",
      kelas: "XI RPL 2",
      alamat: "Sigura-gura",
      noTelp: "0882-8298-298"
    },
    {
      nisn: "1234567890",
      nama: "Firli Zulfa Azzahra",
      industri: "Emran Digital",
      guru: "Nimah Hidayah S.Pd",
      status: "Aktif",
      tanggalLahir: "01 Juli 2008",
      kelas: "XI RPL 2",
      alamat: "Sigura-gura",
      noTelp: "0882-8298-298"
    },
    {
      nisn: "1234567890",
      nama: "Firli Zulfa Azzahra",
      industri: "Emran Digital",
      guru: "Nimah Hidayah S.Pd",
      status: "Selesai",
      tanggalLahir: "01 Juli 2008",
      kelas: "XI RPL 2",
      alamat: "Sigura-gura",
      noTelp: "0882-8298-298"
    },
    {
      nisn: "1234567890",
      nama: "Firli Zulfa Azzahra",
      industri: "Emran Digital",
      guru: "Nimah Hidayah S.Pd",
      status: "Selesai",
      tanggalLahir: "01 Juli 2008",
      kelas: "XI RPL 2",
      alamat: "Sigura-gura",
      noTelp: "0882-8298-298"
    },
    {
      nisn: "1234567890",
      nama: "Firli Zulfa Azzahra",
      industri: "Emran Digital",
      guru: "Nimah Hidayah S.Pd",
      status: "Selesai",
      tanggalLahir: "01 Juli 2008",
      kelas: "XI RPL 2",
      alamat: "Sigura-gura",
      noTelp: "0882-8298-298"
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        // Ganti dengan endpoint API yang sesuai untuk data siswa PKL
        // const res = await axios.get("/api/siswa-pkl");
        // setDataSiswa(res.data.data);
        
        // Sementara gunakan dummy data
        setTimeout(() => {
          setDataSiswa(dummyDataSiswa);
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

  // Filter data siswa
  const filteredSiswa = dataSiswa.filter((siswa) => {
    const matchQuery = siswa.nama.toLowerCase().includes(query.toLowerCase()) ||
                       siswa.nisn.includes(query) ||
                       siswa.industri.toLowerCase().includes(query.toLowerCase());
    const matchStatus = !statusFilter || siswa.status === statusFilter;
    const matchIndustri = !industriFilter || siswa.industri === industriFilter;
    
    return matchQuery && matchStatus && matchIndustri;
  });

  // Get unique values for filters
  const uniqueStatus = [...new Set(dataSiswa.map(s => s.status))];
  const uniqueIndustri = [...new Set(dataSiswa.map(s => s.industri))];

  // Handle row click
  const handleRowClick = (siswa) => {
    setSelectedSiswa(siswa);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedSiswa(null);
  };

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
                <h1 className="text-white text-3xl font-bold mb-8">Data Siswa PKL</h1>
                
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
                        {uniqueIndustri.map(industri => (
                          <option key={industri} value={industri}>{industri}</option>
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
                  </div>
                </div>
              </div>

              {/* Table Section */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white border-b-2 border-gray-200">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">NISN</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Nama</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Industri</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Guru</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {filteredSiswa.length > 0 ? (
                        filteredSiswa.map((siswa, index) => (
                          <tr 
                            key={index} 
                            className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => handleRowClick(siswa)}
                          >
                            <td className="px-6 py-4 text-sm text-gray-700">{siswa.nisn}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{siswa.nama}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{siswa.industri}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{siswa.guru}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{siswa.status}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-gray-500 text-base">
                            Data tidak ditemukan
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Detail Siswa */}
              {showModal && selectedSiswa && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-3xl p-8 max-w-md w-full relative shadow-2xl">
                    {/* Close Button */}
                    <button
                      onClick={closeModal}
                      className="absolute top-6 right-6 w-10 h-10 bg-red-900 rounded-full flex items-center justify-center hover:bg-red-800 transition-colors"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Icon User */}
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 bg-red-900 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                        </svg>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Data Siswa</h2>

                    {/* Data Details */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Nama Siswa:</p>
                        <p className="text-base font-semibold text-gray-900">{selectedSiswa.nama}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1">NISN:</p>
                        <p className="text-base font-semibold text-gray-900">{selectedSiswa.nisn}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1">Tanggal Lahir:</p>
                        <p className="text-base font-semibold text-gray-900">{selectedSiswa.tanggalLahir}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1">Kelas:</p>
                        <p className="text-base font-semibold text-gray-900">{selectedSiswa.kelas}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1">Alamat:</p>
                        <p className="text-base font-semibold text-gray-900">{selectedSiswa.alamat}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1">No. Telp:</p>
                        <p className="text-base font-semibold text-gray-900">{selectedSiswa.noTelp}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}