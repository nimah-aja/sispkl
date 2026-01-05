import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Download, FileSpreadsheet, FileText } from "lucide-react";



import Add from "./components/Add";
import SaveConfirmationModal from "./components/Save";
import Pagination from "./components/Pagination";


import editGrafik from "../assets/editGrafik.svg";
import saveImg from "../assets/save.svg";

import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import { getIndustriPreview, updateIndustriQuota, } from "../utils/services/kapro/industri";

export default function DataIndustriKaprog() {
  const exportRef = useRef(null);
  const [openExport, setOpenExport] = useState(false);
  const [active, setActive] = useState("industri");
  const [query, setQuery] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("list");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;





  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "KAPROG",
  };


 const columns = [
  { label: "Nama Industri", key: "nama" },
  { label: "Kuota Siswa", key: "kuota_siswa" },
  { label: "Pengajuan Pending", key: "pending_applications" },
  { label: "Pengajuan Disetujui", key: "approved_applications" },
  { label: "Siswa Aktif", key: "active_students" },
  { label: "Sisa Kuota", key: "remaining_slots" },
];

  const inputFieldsKuota = [
    {
      label: "Kuota Siswa",
      name: "kuota_siswa",
      type: "number",
      width: "full",
      min: 0,
    },
  ];



  // const data = [
  //   {
  //     id: 1,
  //     nama_industri: "PT Nusantara",
  //     alamat: "Surabaya Barat",
  //     bidang: "Ekonomi Bisnis",
  //     email: "wokokw@gmail.com",
  //     no_telp: "08123456785",
  //     pembimbing: "Jeno",
  //     no_telp_pembimbing: "08654324345",
  //     jurusan: "Teknik Geomatika",
  //   },
  //   {
  //     id: 2,
  //     nama_industri: "PT Sejahtera",
  //     alamat: "Jakarta Barat",
  //     bidang: "IT",
  //     email: "abc@gmail.com",
  //     no_telp: "0898787685",
  //     pembimbing: "Bambang",
  //     no_telp_pembimbing: "08363746345",
  //     jurusan: "Teknik Jaringan Telekomunikasi dan Digital",
  //   },
  // ];

    useEffect(() => {
      const fetchIndustri = async () => {
        try {
          setLoading(true);
          const res = await getIndustriPreview();

          const normalized = (res || []).map((item) => ({
            ...item,
            kuota_siswa: item.kuota_siswa ?? "-",
            remaining_slots: item.remaining_slots ?? "-",
          }));

          setData(normalized);
        } catch (error) {
          console.error("Gagal mengambil data industri:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchIndustri();
    }, []);

    useEffect(() => {
      function handleClickOutside(e) {
        if (exportRef.current && !exportRef.current.contains(e.target)) {
          setOpenExport(false);
        }
      }

      if (openExport) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [openExport]);

    useEffect(() => {
      setCurrentPage(1);
    }, [query]);




    const filteredData = data.filter((item) =>
      Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const paginatedData = filteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );


    if (mode === "edit" && selectedRow) {
      return (
        <>
          <Add
            title={`Edit Kuota Siswa`}
            fields={inputFieldsKuota}
            image={editGrafik}
            initialData={{
              kuota_siswa: selectedRow.kuota_siswa,
            }}
            onSubmit={async (formData, setFieldErrors) => {
              const raw = Object.fromEntries(formData);

              // validasi sederhana
              if (raw.kuota_siswa === "" || raw.kuota_siswa < 0) {
                setFieldErrors({
                  kuota_siswa: "Kuota tidak boleh kosong atau negatif",
                });
                return;
              }

              try {
                setPendingData({
                  industri_id: selectedRow.industri_id,
                  kuota_siswa: Number(raw.kuota_siswa),
                });
                setIsConfirmSaveOpen(true);
              } catch (err) {
                console.error(err);
              }
            }}
            onCancel={() => setMode("list")}
            containerStyle={{ maxHeight: "400px" }}
            backgroundStyle={{ backgroundColor: "#641E21" }}
          />

          <SaveConfirmationModal
            isOpen={isConfirmSaveOpen}
            title="Konfirmasi Simpan"
            message="Apakah kamu yakin ingin mengubah kuota industri ini?"
            onClose={() => setIsConfirmSaveOpen(false)}
            onSave={async () => {
              try {
                await updateIndustriQuota(
                  pendingData.industri_id,
                  pendingData.kuota_siswa
                );

                const res = await getIndustriPreview();
                setData(res);

                setIsConfirmSaveOpen(false);
                setMode("list");
              } catch (err) {
                console.error(err);
              }
            }}
            imageSrc={saveImg}
          />
        </>
      );
    }

  const exportData = filteredData.map((item, i) => ({
    No: i + 1,
    "Nama Industri": item.nama,
    "Kuota Siswa": item.kuota_siswa,
    "Pengajuan Pending": item.pending_applications,
    "Pengajuan Disetujui": item.approved_applications,
    "Siswa Aktif": item.active_students,
    "Sisa Kuota": item.remaining_slots,
  }));

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Industri");
    XLSX.writeFile(workbook, "data-industri.xlsx");
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.text("Data Industri", 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [[
        "No",
        "Nama Industri",
        "Kuota",
        "Pending",
        "Disetujui",
        "Aktif",
        "Sisa",
      ]],
      body: exportData.map((row) => [
        row.No,
        row["Nama Industri"],
        row["Kuota Siswa"],
        row["Pengajuan Pending"],
        row["Pengajuan Disetujui"],
        row["Siswa Aktif"],
        row["Sisa Kuota"],
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [100, 30, 33] },
    });

    doc.save("data-industri.pdf");
  };






  return (
    <div className="bg-white min-h-screen w-full">
      {/* HEADER */}
      <Header query={query} setQuery={setQuery} user={user} />

      <div className="flex">
        {/* SIDEBAR */}
        <div className="hidden md:block">
          <Sidebar active={active} setActive={setActive} />
        </div>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-4 sm:p-6 md:p-10 bg-[#641E21] rounded-none md:rounded-l-3xl shadow-inner">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-2xl font-bold">
              Data Industri
            </h2>

            {/* EXPORT */}
            <div className="relative -left-293" ref={exportRef}>
              <button
                onClick={() => setOpenExport(!openExport)}
                className="
                  flex items-center gap-2
                  px-4 py-2 !bg-transparent
                  text-white
                  rounded-full
                  font-semibold text-sm
                  hover:bg-gray-100
                "
              >
                <Download size={20} className="!font-bold"/>
              </button>

              {openExport && (
                <div className="absolute -right-25 -mt-5 p-2 !bg-white !border !border-[#E1D6C4] rounded-lg !shadow-md overflow-hidden z-50">
                  <button
                    onClick={() => {
                      handleExportExcel();
                      setOpenExport(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 hover:!bg-gray-100 text-sm w-full !bg-transparent"
                  >
                    <FileSpreadsheet size={16} className="!text-green-500"/>
                    Excel
                  </button>

                  <button
                    onClick={() => {
                      handleExportPdf();
                      setOpenExport(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 !bg-transparent hover:!bg-gray-100 text-sm w-full"
                  >
                    <FileText size={16} className="!text-red-500" />
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
          />

          <div className=" rounded-2xl p-4">
            <Table
              columns={columns}
              data={paginatedData}
              showEdit
              onEdit={(row) => {
                setSelectedRow(row);
                setMode("edit");
              }}
            />
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-2 text-white">
                <p className="text-sm">
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
    </div>
  );
}
