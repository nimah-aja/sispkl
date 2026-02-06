import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from "react-dom";
import { FilePlus, CheckCircle, XCircle, Download, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Detail from "./components/Detail"; 
import SearchBar from "./components/Search";
import toast from "react-hot-toast";
import Pagination from "./components/Pagination";


import { getPKLApplications, approvePKLApplication, rejectPKLApplication } from "../utils/services/kapro/pengajuanPKL";
import { getGuru } from "../utils/services/admin/get_guru";
import { getPembimbingPKL } from "../utils/services/kapro/pembimbing";

const DataPengajuanPKL = () => {
  const [openDetail, setOpenDetail] = useState(false);
    const [detailMode, setDetailMode] = useState("view"); 
    const [detailData, setDetailData] = useState(null);
  const [active, setActive] = useState("Pengajuan");
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState("Status");
  const [openExport, setOpenExport] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const exportRef = useRef(null);
  const [guruOptions, setGuruOptions] = useState([]);
  const [pembimbingOptions, setPembimbingOptions] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;




  const user = JSON.parse(localStorage.getItem("user")) || { name: "Pengguna", role: "Admin" };

  const fetchSubmissions = async () => {
    try {
      const res = await getPKLApplications();
    //   const allGuru = await getGuru();

      const mapped = res.data.map((item, index) => {
        let type = "submit";
        if (item.application.status === "Approved") type = "approved";
        else if (item.application.status === "Rejected") type = "rejected";

        return {
          id: item.application.id,
          name: item.siswa_username,
          description: `${type === "submit" ? "Mengajukan PKL" : type === "approved" ? "Disetujui PKL" : "Ditolak PKL"} di ${item.industri_nama}`,
          time: item.application.tanggal_permohonan,
          type,
          hasActions: type === "submit", // hanya yang belum diproses bisa approve/reject
          raw: item,
        };
      });

      setSubmissions(mapped);
    } catch (err) {
      console.error("Gagal ambil data pengajuan PKL", err);
      toast.error("Gagal memuat data pengajuan PKL");
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  

  const handleOpenDetail = (item) => {
    setDetailData({
        ...item,
        namaPembimbing: getGuruName(item.application?.pembimbing_guru_id),
        namaKaprog: getGuruName(item.application?.processed_by),
    });

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

  const sortedSubmissions = submissions.sort((a,b) => new Date(b.time) - new Date(a.time));

  const filteredSubmissions = sortedSubmissions.filter(sub => {
    const lowerQuery = query.toLowerCase();

    const matchesQuery =
      sub.name.toLowerCase().includes(lowerQuery) ||
      sub.description.toLowerCase().includes(lowerQuery) ||
      String(sub.raw?.kelas_nama || "").toLowerCase().includes(lowerQuery) ||
      dayjs(sub.time)
        .format('YYYY-MM-DD HH:mm')
        .toLowerCase()
        .includes(lowerQuery);


    let matchesStatus = true;
    if (statusFilter === "Menunggu") matchesStatus = sub.type === "submit";
    if (statusFilter === "Disetujui") matchesStatus = sub.type === "approved";
    if (statusFilter === "Ditolak") matchesStatus = sub.type === "rejected";

    return matchesQuery && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);

  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  const exportData = filteredSubmissions.map((sub, i) => ({
    No: i + 1,
    Nama: sub.name,
    Deskripsi: sub.description,
    Waktu: dayjs(sub.time).format('DD/MM/YYYY HH:mm'),
    Status: sub.type,
  }));

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PengajuanPKL");
    XLSX.writeFile(workbook, "DataPengajuanPKL.xlsx");
    setOpenExport(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Data Pengajuan PKL", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['No','Nama','Deskripsi','Waktu','Status']],
      body: exportData.map(r => [r.No,r.Nama,r.Deskripsi,r.Waktu,r.Status]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [100, 30, 33] },
    });
    doc.save("DataPengajuanPKL.pdf");
    setOpenExport(false);
  };

  const handleSubmitDetail = async (mode, payload) => {
    try {
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

        setOpenDetail(false);
        setDetailMode("view");
        setDetailData(null);

        fetchSubmissions();

    } catch (err) {
        console.error(err);
        toast.error("Gagal memproses pengajuan");
    }
    };


  const renderDayLabel = (current, index) => {
    const currentDate = dayjs(current.time).format('YYYY-MM-DD');
    const prevDate = index > 0 ? dayjs(filteredSubmissions[index-1].time).format('YYYY-MM-DD') : null;

    if (currentDate !== prevDate) {
      const today = dayjs().format('YYYY-MM-DD');
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

      if (currentDate === today) return "Hari Ini";
      if (currentDate === yesterday) return "Kemarin";
      return dayjs(current.time).format('DD MMM YYYY');
    }
    return null;
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
        const res = await getPembimbingPKL();
        setPembimbingOptions(res); 
      };

      fetchPembimbing();
    }, []);

    useEffect(() => {
      setCurrentPage(1);
    }, [query, statusFilter]);


  const baseFields = [
    { name: "nama_industri", label: "Industri", full: true },
    { name: "nama_siswa", label: "Nama Siswa" },
    { name: "nisn", label: "NISN" },
    { name: "kelas", label: "Kelas" },
    { name: "jurusan", label: "Konsentrasi Keahlian" },
    { name: "status", label: "Status" },
    ];

    const viewFields = [
    ...baseFields,
    { name: "tanggal_permohonan", label: "Tanggal Permohonan" },
    { name: "namaPembimbing", label: "Nama Pembimbing" },
    { name: "kaprog", label: "Diproses Oleh" },
    ];

    const approveFields = [
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

    const rejectFields = [
    {
        name: "catatan",
        label: "Catatan Penolakan",
        type: "textarea",
        full: true,
    },
 ];

    const getFieldsByMode = () => {
        if (detailMode === "approve") return approveFields;
        if (detailMode === "reject") return rejectFields;
        return viewFields;
    };

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




  return (
    <div className="bg-white min-h-screen w-full">
      <Header  user={user} />
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
                                  <div className="absolute  left-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-md p-2 z-50">
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

          <SearchBar
            query={query}
            setQuery={setQuery}
            placeholder="Pencarian"
            filters={[{
              label: "Status",
              value: statusFilter,
              options: ["Menunggu","Disetujui","Ditolak"],
              onChange: val => setStatusFilter(val)
            }]}
          />

          <div className="mt-6 space-y-3">
            {paginatedSubmissions.map((sub, index) => (
              <div key={sub.id}>
                {renderDayLabel(sub, index) && (
                  <div className="text-white font-semibold mb-2">{renderDayLabel(sub, index)}</div>
                )}
                <div className="bg-white rounded-lg p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => handleOpenDetail(sub.raw)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-full">
                        {getSubmissionIcon(sub.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                          {sub.name}
                          <span className="text-sm font-medium text-gray-500">
                            • {sub.raw.kelas_nama}
                          </span>
                        </h3>

                        <p className="text-sm text-gray-600 mt-0.5">{sub.description}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 flex-shrink-0">{dayjs(sub.time).format('HH:mm')}</span>
                  </div>

                </div>
              </div>
            ))}

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

          </div>

        </main>
      </div>
      {openDetail && detailData &&
        createPortal(
            <Detail
            mode="view"
            onChangeMode={setDetailMode}
            onSubmit={handleSubmitDetail}
            onClose={() => {
                setOpenDetail(false);
                setDetailMode("view");
                setDetailData(null);
            }}
            size="half"
            title="Detail Pengajuan PKL"
            initialData={{
                nama_industri: detailData.industri_nama || "",
                nama_siswa: detailData.siswa_username || "",
                nisn: detailData.siswa_nisn || "",
                kelas: detailData.kelas_nama || "",
                jurusan: detailData.jurusan_nama || "",
                status: detailData.application?.status || "",
                tanggal_permohonan: dayjs(
                detailData.application?.tanggal_permohonan
                ).format("DD MMM YYYY HH:mm"),
                namaPembimbing: detailData.namaPembimbing || "-",
                kaprog: detailData.namaKaprog || "-",
                catatan: "",
            }}
            fields={getFieldsByMode()}
            />,
            document.body
        )}

    </div>
    
  );
};

export default DataPengajuanPKL;
