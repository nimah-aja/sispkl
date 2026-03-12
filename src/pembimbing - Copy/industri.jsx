import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// import components
import Header from "./components/HeaderBiasa";
import Sidebar from "./components/SidebarBiasa";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Add from "./components/Add";
import DeleteConfirmationModal from "./components/Delete";
import SaveConfirmationModal from "./components/Save";
import Pagination from "./components/Pagination"; 

// import assets
import guruImg from "../assets/addSidebar.svg";
import editGrafik from "../assets/editGrafik.svg";
import deleteImg from "../assets/deleteGrafik.svg";
import saveImg from "../assets/save.svg";

// services
import { getGuruIndustri } from "../utils/services/pembimbing/guru";
import { getIndustri } from "../utils/services/admin/get_industri"; // Import getIndustri dari admin

export default function GuruPage() {
  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef(null);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("industri");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [industriData, setIndustriData] = useState([]);
  const [selectedIndustri, setSelectedIndustri] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Pembimbing",
  };

  // Fungsi untuk menampilkan detail industri
  const handleRowClick = (item) => {
    setSelectedIndustri(item);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedIndustri(null);
  };

  // DATA INDUSTRI (gabungan dari getGuruIndustri dan getIndustri admin)
  useEffect(() => {
    const fetchIndustri = async () => {
      setLoading(true);
      try {
        // Ambil data industri bimbingan dari getGuruIndustri
        const guruIndustriRes = await getGuruIndustri();
        console.log("Guru Industri response:", guruIndustriRes);
        
        // Ambil data detail industri dari getIndustri admin
        const allIndustriRes = await getIndustri();
        console.log("All Industri response:", allIndustriRes);
        
        // GuruIndustriRes memiliki struktur { data: [{ industri_id, industri_nama, jumlah_siswa }], total }
        const guruIndustriData = guruIndustriRes.data || [];
        
        // Buat map untuk memudahkan pencarian detail industri berdasarkan id
        const industriDetailMap = new Map();
        allIndustriRes.forEach((industri) => {
          industriDetailMap.set(industri.id, industri);
        });
        
        // Gabungkan data dari kedua sumber
        const mappedIndustri = guruIndustriData.map((item, index) => {
          // Cari detail industri dari map berdasarkan industri_id
          const detailIndustri = industriDetailMap.get(item.industri_id);
          
          return {
            no: index + 1,
            industri_id: item.industri_id,
            nama_industri: item.industri_nama,
            jumlah_siswa: item.jumlah_siswa || 0,
            // Tambahkan field dari detail industri
            bidang: detailIndustri?.bidang || "-",
            alamat: detailIndustri?.alamat || "-",
            no_telp: detailIndustri?.no_telp || "-",
            email: detailIndustri?.email || "-",
            pic: detailIndustri?.pic || "-",
            pic_telp: detailIndustri?.pic_telp || "-",
            is_active: detailIndustri?.is_active || false,
            created_at: detailIndustri?.created_at,
            updated_at: detailIndustri?.updated_at,
          };
        });
        
        console.log("Mapped industri data with details:", mappedIndustri);
        setIndustriData(mappedIndustri);
        
      } catch (err) {
        console.error("Gagal fetch industri:", err);
        
        // Fallback: coba ambil dari getGuruIndustri saja
        try {
          console.log("Fallback: fetching hanya dari getGuruIndustri...");
          const guruIndustriRes = await getGuruIndustri();
          const guruIndustriData = guruIndustriRes.data || [];
          
          const fallbackIndustri = guruIndustriData.map((item, index) => ({
            no: index + 1,
            industri_id: item.industri_id,
            nama_industri: item.industri_nama,
            jumlah_siswa: item.jumlah_siswa || 0,
            bidang: "-",
            alamat: "-",
            no_telp: "-",
            email: "-",
            pic: "-",
            pic_telp: "-",
            is_active: true,
          }));
          
          setIndustriData(fallbackIndustri);
          toast.success("Data industri berhasil dimuat (tanpa detail)");
        } catch (fallbackErr) {
          console.error("Fallback fetch juga gagal:", fallbackErr);
          toast.error("Gagal memuat data industri");
          setIndustriData([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchIndustri();
  }, []);

  // FILTER SEARCH
  const filteredData = industriData.filter((item) =>
    item.nama_industri.toLowerCase().includes(search.toLowerCase())
  );

  // PAGINATION
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // KOLOM TABEL - Menambahkan kolom baru sesuai kebutuhan
  const columns = [
    // { label: "No", key: "no", sortable: false },
    { label: "Nama Industri", key: "nama_industri" },
    { label: "Bidang", key: "bidang" },
    { label: "Alamat", key: "alamat" },
    { label: "No. Telepon", key: "no_telp" },
    { label: "Email", key: "email" },
    { label: "PIC", key: "pic" },
    { label: "No. PIC", key: "pic_telp" },
    { label: "Jumlah Siswa", key: "jumlah_siswa", sortable: false },
  ];

  // EXPORT DATA - dengan field lengkap
  const exportData = filteredData.map((item) => ({
    // No: item.no,
    "Nama Industri": item.nama_industri,
    "Bidang": item.bidang,
    "Alamat": item.alamat,
    "No. Telepon": item.no_telp,
    "Email": item.email,
    "PIC": item.pic,
    "No. Telepon PIC": item.pic_telp,
    "Jumlah Siswa": item.jumlah_siswa,
  }));

  const handleExportPdf = () => {
    if (!exportData.length) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    
    const doc = new jsPDF({
      orientation: 'landscape' // Landscape karena tabel lebih lebar
    });
    
    doc.text("Data Industri", 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map((item) => Object.values(item)),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [100, 30, 33] },
      columnStyles: {
        2: { cellWidth: 40 }, // Kolom Alamat lebih lebar
        3: { cellWidth: 30 }, // Kolom No. Telepon
      }
    });

    doc.save("data_industri.pdf");
    toast.success("PDF berhasil diekspor");
  };

  const handleExportExcel = () => {
    if (!exportData.length) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Industri");
    XLSX.writeFile(workbook, "data_industri.xlsx");
    toast.success("Excel berhasil diekspor");
  };

  // MODAL DETAIL INDUSTRI
  const DetailModal = () => {
    if (!selectedIndustri) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-[#641E21] text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
            <h3 className="text-lg font-semibold">Detail Industri</h3>
            <button 
              onClick={closeDetailModal}
              className="text-white hover:text-gray-200 text-xl"
            >
              &times;
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <h4 className="font-semibold text-gray-700 mb-2">Informasi Dasar</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <DetailRow label="Nama Industri" value={selectedIndustri.nama_industri} />
                  <DetailRow label="Bidang" value={selectedIndustri.bidang} />
                  <DetailRow label="Jumlah Siswa" value={selectedIndustri.jumlah_siswa} />
                  <DetailRow label="Status" value={selectedIndustri.is_active ? "Aktif" : "Tidak Aktif"} />
                </div>
              </div>
              
              <div className="col-span-2">
                <h4 className="font-semibold text-gray-700 mb-2 mt-2">Kontak & Alamat</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <DetailRow label="Alamat" value={selectedIndustri.alamat} />
                  <DetailRow label="No. Telepon" value={selectedIndustri.no_telp} />
                  <DetailRow label="Email" value={selectedIndustri.email} />
                </div>
              </div>
              
              <div className="col-span-2">
                <h4 className="font-semibold text-gray-700 mb-2 mt-2">Person In Charge (PIC)</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <DetailRow label="Nama PIC" value={selectedIndustri.pic} />
                  <DetailRow label="No. Telepon PIC" value={selectedIndustri.pic_telp} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-100 px-6 py-3 rounded-b-lg flex justify-end">
            <button
              onClick={closeDetailModal}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Komponen helper untuk menampilkan detail row
  const DetailRow = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:items-center">
      <span className="text-sm font-medium text-gray-600 w-32">{label}:</span>
      <span className="text-sm text-gray-900 break-words">{value || "-"}</span>
    </div>
  );

  // RENDER
  return (
    <div className="bg-white min-h-screen w-full">
      <Header user={user} />

      <div className="flex flex-col md:flex-row">
        <div className="md:block hidden">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 rounded-none md:rounded-l-3xl bg-[#641E21] shadow-inner">
          <div className="flex items-center mb-4 gap-1 w-full relative">
            <h2 className="text-white font-bold text-base sm:text-lg">
              Data Industri
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
                      handleExportPdf();
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

          <SearchBar
            query={search}
            setQuery={setSearch}
            placeholder="Cari industri..."
            className="mb-4 w-[100%]"
          />

          <div className="mt-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                <p className="text-white mt-2">Memuat data industri...</p>
              </div>
            ) : industriData.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <p className="text-gray-500">Tidak ada data industri</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg shadow">
                  <Table 
                    columns={columns} 
                    data={paginatedData} 
                    onRowClick={handleRowClick} // Menambahkan handler klik row
                  />
                </div>

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

      {/* Modal Detail Industri */}
      {showDetailModal && <DetailModal />}
    </div>
  );
}