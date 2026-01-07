import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Pagination from "./components/Pagination";

// components
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Table from "./components/Table";

// assets
import unduh from "../assets/unduh.svg";
import editGrafik from "../assets/edit.svg";
import deleteImg from "../assets/trash.svg";

export default function DataPeserta() {
  const exportRef = useRef(null);
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [openExport, setOpenExport] = useState(false);
  const [active, setActive] = useState("Pembimbing");
  const [query, setQuery] = useState("");
  const [kelas, setKelas] = useState("");
  const [peserta, setPeserta] = useState([]);

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Koordinator",
  };

  // FILTER OPTIONS
  const filters = [
    {
      label: "Kelas",
      value: kelas,
      options: ["X RPL 1", "X RPL 2", "XI TKJ 1", "XI TKJ 2"],
      onChange: setKelas,
    },
  ];

  // DUMMY DATA
  useEffect(() => {
    setPeserta([
      {
        nip: "19820101",
        namaPembimbing: "Firli Zulfa",
        industri: "Emran Digital",
        noTelp: "081234567890",
        namaSiswa: "Aulia Rahmawati",
        kelas: "X RPL 1",
      },
      {
        nip: "19820102",
        namaPembimbing: "Rama Yuda",
        industri: "Telkom Indonesia",
        noTelp: "082233445566",
        namaSiswa: "Fajar Wicaksono",
        kelas: "XI TKJ 1",
      },
      {
        nip: "19820103",
        namaPembimbing: "Nimah Hidayah",
        industri: "UBIG",
        noTelp: "083344556677",
        namaSiswa: "Siti Aisyah",
        kelas: "X RPL 2",
      },
      {
        nip: "19820104",
        namaPembimbing: "Budi Santoso",
        industri: "Dinas Kominfo",
        noTelp: "085566778899",
        namaSiswa: "Andi Pratama",
        kelas: "XI TKJ 2",
      },
    ]);
  }, []);

  // FILTER
  const filteredPeserta = peserta.filter(
    (item) =>
      item.namaPembimbing.toLowerCase().includes(query.toLowerCase()) &&
      (kelas ? item.kelas === kelas : true)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [query, kelas]);

  // PAGINATION
  const totalPages = Math.ceil(filteredPeserta.length / itemsPerPage);

  const paginatedData = filteredPeserta.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // COLUMNS
  const columns = [
    { label: "NIP", key: "nip" },
    { label: "Nama Pembimbing", key: "namaPembimbing" },
    { label: "Industri", key: "industri" },
    { label: "No. Telp", key: "noTelp" },
    { label: "Kelas", key: "kelas" },
    { label: "Nama Siswa", key: "namaSiswa" },
    {
      label: "Unggah",
      render: () => (
        <button className="!bg-transparent">
          <img src={unduh} />
        </button>
      ),
    },
  ];

  // EXPORT DATA
  const exportData = filteredPeserta.map((item, i) => ({
    No: i + 1,
    NIP: item.nip,
    Pembimbing: item.namaPembimbing,
    Industri: item.industri,
    Siswa: item.namaSiswa,
    Kelas: item.kelas,
    Telp: item.noTelp,
  }));

  const handleExportExcel = () => {
    if (!exportData.length) return;
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pembimbing");
    XLSX.writeFile(wb, "data_pembimbing.xlsx");
  };

  const handleExportPdf = () => {
    if (!exportData.length) return;
    const doc = new jsPDF();
    doc.text("Data Pembimbing PKL", 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [Object.keys(exportData[0])],
      body: exportData.map((d) => Object.values(d)),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [100, 30, 33] },
    });

    doc.save("data_pembimbing.pdf");
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar active={active} setActive={setActive} />

      <div className="flex flex-col flex-1">
        <Header query={query} setQuery={setQuery} user={user} />

        <main className="flex-1 p-6 bg-[#641E21] rounded-tl-3xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-2xl font-bold">Pembimbing</h2>

            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setOpenExport(!openExport)}
                className="text-white"
              >
                <Download />
              </button>

              {openExport && (
                <div className="absolute right-0 mt-2 bg-white rounded shadow">
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-4 py-2"
                  >
                    <FileSpreadsheet size={16} /> Excel
                  </button>
                  <button
                    onClick={handleExportPdf}
                    className="flex items-center gap-2 px-4 py-2"
                  >
                    <FileText size={16} /> PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          <SearchBar
            query={query}
            setQuery={setQuery}
            filters={filters}
            placeholder="Cari pembimbing..."
          />

          <Table 
          columns={columns} 
          data={paginatedData}
          showEdit
          showDelete />

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 text-white">
              <span>
                Halaman {currentPage} dari {totalPages}
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
