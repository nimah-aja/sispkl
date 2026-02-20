import React, { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

import { getGuruTasks } from "../utils/services/pembimbing/guru";

import Add from "./components/Add";
import Detail from "./components/Detail"; // ✅ DETAIL DIPANGGIL
import Sidebar from "./components/SidebarBiasa";
import Header from "./components/HeaderBiasa";
import SearchBar from "./components/Search";
import Pagination from "./components/Pagination";

import editGrafik from "../assets/editGrafik.svg";

const STORAGE_KEY = "data_permasalahan_siswa";

export default function DataPermasalahanSiswa() {
  const exportRef = useRef(null);

  const [openExport, setOpenExport] = useState(false);
  const [active, setActive] = useState("permasalahan");
  const [search, setSearch] = useState("");

  const [dataPermasalahan, setDataPermasalahan] = useState([]);
  const [mode, setMode] = useState("list"); // list | add | edit | detail
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailMode, setDetailMode] = useState("view"); // ✅ WAJIB
  const [currentPage, setCurrentPage] = useState(1);

  const [siswaOptions, setSiswaOptions] = useState([]);
  const [industriOptions, setIndustriOptions] = useState([]);

  const itemsPerPage = 10;

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Pembimbing",
  };

  /* =====================
     LOAD STORAGE
  ===================== */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setDataPermasalahan(JSON.parse(saved));
  }, []);

  const saveToStorage = (data) => {
    setDataPermasalahan(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  /* =====================
     LOAD SISWA & INDUSTRI
  ===================== */
  useEffect(() => {
    const fetchGuruTasks = async () => {
      try {
        const res = await getGuruTasks();

        const industri = res.data.map((i) => ({
          label: i.industri.nama,
          value: i.industri.nama,
        }));

        const siswa = res.data
          .flatMap((i) => i.siswa)
          .reduce((acc, s) => {
            if (!acc.find((x) => x.value === s.nama)) {
              acc.push({
                label: `${s.nama} (${s.kelas})`,
                value: s.nama,
              });
            }
            return acc;
          }, []);

        setIndustriOptions(industri);
        setSiswaOptions(siswa);
      } catch (e) {
        console.error(e);
      }
    };

    fetchGuruTasks();
  }, []);

  /* =====================
     FILTER & PAGINATION
  ===================== */
  const filteredData = dataPermasalahan.filter((i) => {
    const q = search.toLowerCase();
    return (
      i.nama.toLowerCase().includes(q) ||
      i.masalah.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* =====================
     ACTIONS
  ===================== */
  const handleDelete = (item) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) return;
    saveToStorage(dataPermasalahan.filter((i) => i !== item));
    setSelectedItem(null);
    setMode("list");
  };

  const handleEditSubmit = (payload) => {
    const updated = dataPermasalahan.map((i) =>
      i === selectedItem ? { ...i, ...payload } : i
    );

    saveToStorage(updated);
    setSelectedItem(null);
    setMode("list");
    setDetailMode("view");
  };

  /* =====================
     ADD MODE
  ===================== */
  if (mode === "add") {
    return (
      <Add
        title="Tambah Permasalahan Siswa"
        image={editGrafik}
        fields={[
          {
            label: "Nama Siswa",
            name: "nama",
            type: "select",
            options: siswaOptions,
            width: "full",
          },
          {
            label: "Industri",
            name: "industri",
            type: "select",
            options: industriOptions,
            width: "full",
          },
          {
            label: "Permasalahan Siswa",
            name: "masalah",
            type: "textarea",
            rows: 4,
            width: "full",
          },
        ]}
        onSubmit={(formData) => {
          const raw = Object.fromEntries(formData);

          saveToStorage([
            {
              pelapor: "Pembimbing",
              tanggal: new Date().toLocaleDateString("id-ID"),
              status: "Proses",
              ...raw,
            },
            ...dataPermasalahan,
          ]);

          setMode("list");
        }}
        onCancel={() => setMode("list")}
      />
    );
  }

  /* =====================
     EDIT MODE
  ===================== */
  if (mode === "edit" && selectedItem) {
    return (
      <Add
        title="Edit Permasalahan Siswa"
        image={editGrafik}
        initialData={selectedItem}
        fields={[
          {
            label: "Nama Siswa",
            name: "nama",
            type: "select",
            options: siswaOptions,
            width: "full",
          },
          {
            label: "Industri",
            name: "industri",
            type: "select",
            options: industriOptions,
            width: "full",
          },
          {
            label: "Permasalahan Siswa",
            name: "masalah",
            type: "textarea",
            rows: 4,
            width: "full",
          },
        ]}
        onSubmit={(formData) => {
          const raw = Object.fromEntries(formData);
          handleEditSubmit(raw);
        }}
        onCancel={() => {
          setSelectedItem(null);
          setMode("list");
        }}
      />
    );
  }

  /* =====================
     DETAIL MODE (INI DOANG YANG NGERENDER DETAIL)
  ===================== */
  if (mode === "detail" && selectedItem) {
    return (
      <Detail
        title="Detail Permasalahan Siswa"
        mode={detailMode}
        initialData={selectedItem}
        onClose={() => {
          setSelectedItem(null);
          setMode("list");
        }}
        onChangeMode={setDetailMode}
        onSubmit={handleEditSubmit}
        onDelete={() => handleDelete(selectedItem)}
        fields={[
          { name: "nama", label: "Nama Siswa" },
          { name: "industri", label: "Nama Industri" },
          {
            name: "masalah",
            label: "Permasalahan Siswa",
          },
          { name: "tanggal", label: "Tanggal" },
        ]}
      />
    );
  }

  /* =====================
     LIST VIEW
  ===================== */
  return (
    <div className="bg-white min-h-screen">
      <Header user={user} />

      <div className="flex">
        <Sidebar active={active} setActive={setActive} />

        <main className="flex-1 p-6 bg-[#641E21] rounded-l-3xl">
          <h2 className="text-white font-bold text-lg mb-4">
            Data Permasalahan Siswa
          </h2>

          <SearchBar
            onAddClick={() => setMode("add")}
            query={search}
            setQuery={setSearch}
            placeholder="Cari nama / masalah"
          />

          <div className="mt-6 space-y-4">
            {paginatedData.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedItem(item);
                  setDetailMode("view");
                  setMode("detail");
                }}
                className="bg-white rounded-xl p-4 hover:shadow-md flex justify-between cursor-pointer"
              >
                <div>
                  <h3 className="font-bold text-sm">{item.nama}</h3>
                  <p className="text-xs text-gray-600">
                    Industri : {item.industri}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Permasalahan : {item.masalah}
                  </p>
                </div>

                <div
                  className="flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setMode("edit");
                    }}
                    className="px-3 py-1 h-10 text-sm rounded !bg-orange-500 text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="px-3 py-1 h-10 text-sm rounded !bg-red-600 text-white"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 text-white flex justify-between">
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
