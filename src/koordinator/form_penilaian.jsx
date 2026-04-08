import React, { useState, useEffect, useRef } from "react";
import { Edit, Check, Download, FileSpreadsheet, FileText, Plus } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";

// Services
import { getFormsPenilaian, createFormPenilaian, updateFormPenilaian, activateFormPenilaian } from "../utils/services/koordinator/form";

// Components
import Header from "./components/HeaderBiasa";
import Sidebar from "./components/SidebarBiasa";
import Table from "./components/Table";
import SearchBar from "./components/Search";
import Add from "./components/Add";
import SaveConfirmationModal from "./components/Save";
import Pagination from "./components/Pagination";

// Assets
import emptyStateImg from "../assets/addGrafik.svg";
import formImage from "../assets/addGrafik.svg";
import editGrafik from "../assets/editGrafik.svg";
import saveImg from "../assets/save.svg";

export default function DaftarFormPenilaian() {
  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef(null);
  const [forms, setForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [activatingId, setActivatingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [active, setActive] = useState("form");
  const [mode, setMode] = useState("list");
  const [selectedForm, setSelectedForm] = useState(null);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const MAX_TP = 4; // Batas maksimal TP

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "Koordinator",
  };

  // Fungsi untuk validasi nomor sertifikat dengan format yang ditentukan
  const validateNomorSertifikat = (nomorSertifikat) => {
    if (!nomorSertifikat || nomorSertifikat.trim() === '') {
      return { isValid: true }; // Opsional, tidak wajib diisi
    }

    // Format: 420/XXXX/101.6.9.19/YYYY
    // - 420 harus tetap (prefix)
    // - XXXX adalah nomor urut (bisa diubah, harus angka)
    // - 101.6.9.19 harus tetap (kode sekolah) - TIDAK BOLEH DIUBAH
    // - YYYY adalah tahun (bisa diubah, harus angka 4 digit)
    
    // Regex yang memastikan 101.6.9.19 tetap dan tidak bisa diubah
    const regex = /^420\/(\d{1,4})\/101\.6\.9\.19\/(\d{4})$/;
    
    if (!regex.test(nomorSertifikat)) {
      return { 
        isValid: false, 
        error: 'Format nomor sertifikat harus: 420/[nomor_urut]/101.6.9.19/[tahun]\nContoh: 420/1013/101.6.9.19/2026\nBagian 101.6.9.19 tidak boleh diubah!' 
      };
    }

    const matches = nomorSertifikat.match(regex);
    const nomorUrut = matches[1];
    const tahun = matches[2];

    // Validasi nomor urut (sudah pasti angka 1-4 digit dari regex)
    // Validasi tahun (1900-2099)
    const tahunInt = parseInt(tahun);
    if (tahunInt < 1900 || tahunInt > 2099) {
      return { 
        isValid: false, 
        error: 'Tahun harus antara 1900 - 2099' 
      };
    }

    return { isValid: true };
  };

  // Fungsi untuk menyimpan nomor sertifikat ke localStorage
  const saveNomorSertifikatToLocal = (formId, nomorSertifikat) => {
    try {
      // Ambil data existing dari localStorage
      const existingData = localStorage.getItem('nomorSertifikatForms');
      let nomorSertifikatData = existingData ? JSON.parse(existingData) : {};
      
      // Tambah atau update data untuk formId ini
      nomorSertifikatData[formId] = {
        nomorSertifikat,
        updatedAt: dayjs().toISOString()
      };
      
      // Simpan kembali ke localStorage
      localStorage.setItem('nomorSertifikatForms', JSON.stringify(nomorSertifikatData));
      
      return true;
    } catch (error) {
      console.error('Gagal menyimpan nomor sertifikat ke localStorage:', error);
      return false;
    }
  };

  // Fungsi untuk mendapatkan nomor sertifikat dari localStorage
  const getNomorSertifikatFromLocal = (formId) => {
    try {
      const existingData = localStorage.getItem('nomorSertifikatForms');
      if (!existingData) return null;
      
      const nomorSertifikatData = JSON.parse(existingData);
      return nomorSertifikatData[formId]?.nomorSertifikat || null;
    } catch (error) {
      console.error('Gagal membaca nomor sertifikat dari localStorage:', error);
      return null;
    }
  };

  // Fungsi untuk menghapus nomor sertifikat dari localStorage
  const removeNomorSertifikatFromLocal = (formId) => {
    try {
      const existingData = localStorage.getItem('nomorSertifikatForms');
      if (!existingData) return;
      
      const nomorSertifikatData = JSON.parse(existingData);
      delete nomorSertifikatData[formId];
      
      localStorage.setItem('nomorSertifikatForms', JSON.stringify(nomorSertifikatData));
    } catch (error) {
      console.error('Gagal menghapus nomor sertifikat dari localStorage:', error);
    }
  };

  // Fetch data form penilaian
  useEffect(() => {
    fetchForms();
  }, []);

  // Reset halaman saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // Filter forms berdasarkan search dan status
  useEffect(() => {
    let filtered = forms;

    // Filter by search term
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(form => 
        form.nama?.toLowerCase().includes(term) ||
        form.items?.some(item => 
          item.tujuan_pembelajaran?.toLowerCase().includes(term)
        ) ||
        // Tambahkan pencarian berdasarkan nomor sertifikat
        getNomorSertifikatFromLocal(form.id)?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter(form => 
        filterStatus === "Aktif" ? form.is_active === true : form.is_active === false
      );
    }

    // Filter berdasarkan jumlah item (tidak lebih dari MAX_TP)
    filtered = filtered.filter(form => 
      form.items?.length <= MAX_TP
    );

    setFilteredForms(filtered);
  }, [searchTerm, filterStatus, forms]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await getFormsPenilaian();
      const formsData = response.data || [];
      setForms(formsData);
      
      // Filter awal juga diterapkan di sini
      const filteredData = formsData.filter(form => form.items?.length <= MAX_TP);
      setFilteredForms(filteredData);
    } catch (error) {
      console.error("Gagal fetch forms:", error);
      toast.error("Gagal memuat data formulir penilaian");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (form) => {
    setSelectedForm(form);
    setMode("edit");
  };

  const handleActivate = async (form) => {
    try {
      setActivatingId(form.id);
      const toastId = toast.loading("Mengaktifkan form...");
      
      await activateFormPenilaian(form.id);
      
      // Update status di state
      const updatedForms = forms.map(f => ({
        ...f,
        is_active: f.id === form.id ? true : false
      }));
      setForms(updatedForms);
      
      toast.success(`Form "${form.nama}" berhasil diaktifkan!`, { id: toastId });
    } catch (error) {
      console.error("Gagal aktivasi:", error);
      toast.error(error.message || "Gagal mengaktifkan form");
    } finally {
      setActivatingId(null);
    }
  };

  const handleCreateNew = () => {
    setMode("add");
  };

  const handleCancel = () => {
    setMode("list");
    setSelectedForm(null);
    setSubmitting(false);
  };

  // Submit handler untuk create
  const handleCreateSubmit = async (formData, setFieldErrors) => {
    try {
      setSubmitting(true);
      
      // Ambil nilai dari formData
      const nama = formData.get("nama");
      const nomorSertifikat = formData.get("nomor_sertifikat");
      
      // Validasi nomor sertifikat dengan format baru
      if (nomorSertifikat && nomorSertifikat.trim() !== '') {
        const validation = validateNomorSertifikat(nomorSertifikat);
        if (!validation.isValid) {
          setFieldErrors({
            nomor_sertifikat: validation.error
          });
          return;
        }
      }
      
      // Kumpulkan tujuan pembelajaran yang tidak kosong
      const items = [];
      for (let i = 1; i <= MAX_TP; i++) {
        const tp = formData.get(`tujuan_pembelajaran_${i}`);
        if (tp && tp.trim() !== "") {
          items.push({
            tujuan_pembelajaran: tp,
            urutan: i
          });
        }
      }

      // Validasi minimal 1 item
      if (items.length === 0) {
        setFieldErrors({
          tujuan_pembelajaran_1: "Minimal 1 tujuan pembelajaran harus diisi"
        });
        return;
      }

      // Validasi maksimal item
      if (items.length > MAX_TP) {
        toast.error(`Maksimal ${MAX_TP} tujuan pembelajaran`);
        return;
      }

      const payload = {
        nama,
        items
      };

      // Simpan data sementara termasuk nomor sertifikat
      setPendingData({
        ...payload,
        nomorSertifikat: nomorSertifikat || null
      });
      setIsConfirmSaveOpen(true);
      
    } catch (error) {
      console.error("Gagal create form:", error);
      toast.error(error.message || "Gagal membuat form penilaian");
      
      // Handle validation errors dari backend
      if (error.errors) {
        const errors = {};
        error.errors.forEach(err => {
          if (err.path === "nama") {
            errors.nama = err.msg;
          } else if (err.path.includes("tujuan_pembelajaran")) {
            const index = err.path.match(/\d+/)?.[0];
            if (index) {
              errors[`tujuan_pembelajaran_${index}`] = err.msg;
            }
          }
        });
        setFieldErrors(errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Submit handler untuk edit
  const handleEditSubmit = async (formData, setFieldErrors) => {
    try {
      setSubmitting(true);
      
      // Ambil nilai dari formData
      const nama = formData.get("nama");
      const nomorSertifikat = formData.get("nomor_sertifikat");
      
      // Validasi nomor sertifikat dengan format baru
      if (nomorSertifikat && nomorSertifikat.trim() !== '') {
        const validation = validateNomorSertifikat(nomorSertifikat);
        if (!validation.isValid) {
          setFieldErrors({
            nomor_sertifikat: validation.error
          });
          return;
        }
      }
      
      // Kumpulkan tujuan pembelajaran yang tidak kosong
      const items = [];
      for (let i = 1; i <= MAX_TP; i++) {
        const tp = formData.get(`tujuan_pembelajaran_${i}`);
        if (tp && tp.trim() !== "") {
          items.push({
            tujuan_pembelajaran: tp,
            urutan: i
          });
        }
      }

      // Validasi minimal 1 item
      if (items.length === 0) {
        setFieldErrors({
          tujuan_pembelajaran_1: "Minimal 1 tujuan pembelajaran harus diisi"
        });
        return;
      }

      // Validasi maksimal item
      if (items.length > MAX_TP) {
        toast.error(`Maksimal ${MAX_TP} tujuan pembelajaran`);
        return;
      }

      const payload = {
        nama,
        items
      };

      // Simpan data sementara termasuk nomor sertifikat
      setPendingData({
        ...payload,
        nomorSertifikat: nomorSertifikat || null
      });
      setIsConfirmSaveOpen(true);
      
    } catch (error) {
      console.error("Gagal update form:", error);
      toast.error(error.message || "Gagal memperbarui form penilaian");
      
      // Handle validation errors dari backend
      if (error.errors) {
        const errors = {};
        error.errors.forEach(err => {
          if (err.path === "nama") {
            errors.nama = err.msg;
          } else if (err.path.includes("tujuan_pembelajaran")) {
            const index = err.path.match(/\d+/)?.[0];
            if (index) {
              errors[`tujuan_pembelajaran_${index}`] = err.msg;
            }
          }
        });
        setFieldErrors(errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveConfirm = async () => {
    try {
      if (mode === "add") {
        const response = await createFormPenilaian(pendingData);
        
        // Simpan nomor sertifikat ke localStorage setelah form berhasil dibuat
        if (response.data && response.data.id && pendingData.nomorSertifikat) {
          saveNomorSertifikatToLocal(response.data.id, pendingData.nomorSertifikat);
        }
        
        toast.success("Form penilaian berhasil dibuat!");
      } else if (mode === "edit" && selectedForm) {
        await updateFormPenilaian(selectedForm.id, pendingData);
        
        // Update nomor sertifikat di localStorage
        if (pendingData.nomorSertifikat) {
          saveNomorSertifikatToLocal(selectedForm.id, pendingData.nomorSertifikat);
        } else {
          // Jika nomor sertifikat dikosongkan, hapus dari localStorage
          removeNomorSertifikatFromLocal(selectedForm.id);
        }
        
        toast.success("Form penilaian berhasil diperbarui!");
      }
      
      await fetchForms();
      setIsConfirmSaveOpen(false);
      setMode("list");
      setSelectedForm(null);
      setPendingData(null);
      
    } catch (error) {
      console.error("Gagal menyimpan form:", error);
      toast.error(error.message || "Gagal menyimpan form penilaian");
    }
  };

  // Prepare initial data untuk edit
  const getEditInitialData = () => {
    if (!selectedForm) return {};
    
    // Ambil nomor sertifikat dari localStorage
    const nomorSertifikat = getNomorSertifikatFromLocal(selectedForm.id);
    
    // Data dasar dengan menyertakan items array
    const data = {
      id: selectedForm.id,
      nama: selectedForm.nama || "",
      nomor_sertifikat: nomorSertifikat || "",
      // Simpan items untuk digunakan di Add component
      items: selectedForm.items || []
    };

    // Map items ke field tujuan_pembelajaran_1..MAX_TP berdasarkan urutan
    if (selectedForm.items && selectedForm.items.length > 0) {
      // Urutkan items berdasarkan urutan
      const sortedItems = [...selectedForm.items].sort((a, b) => a.urutan - b.urutan);
      
      sortedItems.forEach((item, index) => {
        // Gunakan index+1 sebagai nomor urut field
        data[`tujuan_pembelajaran_${index + 1}`] = item.tujuan_pembelajaran;
      });
    }

    return data;
  };

  // Fields untuk form (sama untuk create dan edit) - dinamis berdasarkan MAX_TP
  const formFields = [
    {
      name: "nama",
      label: "Nama Form Penilaian",
      type: "text",
      placeholder: "Masukkan nama formulir penilaian",
      width: "full",
      required: true,
      minLength: 3
    },
    // {
    //   name: "nomor_sertifikat",
    //   label: "Nomor Sertifikat",
    //   type: "text",
    //   placeholder: "420/1013/101.6.9.19/2026",
    //   width: "full",
    //   required: false,
    //   helpText: "Format: 420/[nomor_urut]/101.6.9.19/[tahun]. Contoh: 420/1013/101.6.9.19/2026\nBagian 101.6.9.19 tidak boleh diubah!"
    // }
  ];

  // Tambahkan field TP dinamis berdasarkan MAX_TP
  for (let i = 1; i <= MAX_TP; i++) {
    formFields.push({
      name: `tujuan_pembelajaran_${i}`,
      label: `Tujuan Pembelajaran ${i}`,
      type: "textarea",
      rows: 3,
      placeholder: `Masukkan tujuan pembelajaran ${i}${i === 1 ? '' : ' (opsional)'}`,
      width: "full",
      required: i === 1 // Hanya TP pertama yang required
    });
  }

  // Table columns - tambahkan kolom Nomor Sertifikat
  const columns = [
    { label: "Nama Form", key: "nama" },
    // { label: "Nomor Sertifikat", key: "nomorSertifikat", sortable: false },
    { label: "Jumlah Item", key: "itemCount", sortable: false },
    { 
      label: "Status", 
      key: "status",
      render: (value) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          value === 'Aktif' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    { label: "Dibuat Pada", key: "created_at", sortable: false },
    { label: "Diperbarui", key: "updated_at", sortable: false },
  ];

  // Prepare data for table with proper formatting - tambahkan nomor sertifikat
  const tableData = filteredForms.map((form, index) => {
    const itemCount = form.items?.length || 0;
    const nomorSertifikat = getNomorSertifikatFromLocal(form.id) || '-';
    
    return {
      id: form.id,
      no: index + 1,
      nama: form.nama || '-',
      nomorSertifikat: nomorSertifikat,
      itemCount: `${itemCount} item${itemCount > 1 ? '' : ''}`,
      status: form.is_active === true ? 'Aktif' : 'Tidak Aktif',
      created_at: dayjs(form.created_at).format("DD/MM/YYYY"),
      updated_at: form.updated_at ? dayjs(form.updated_at).format("DD/MM/YYYY") : '-',
      original: form
    };
  });

  // Pagination
  const totalPages = Math.ceil(tableData.length / itemsPerPage);
  const paginatedData = tableData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Status filter options
  const statusOptions = [
    "Aktif",
    "Tidak Aktif"
  ];

  // Loading state
  if (loading && mode === "list") {
    return (
      <div className="bg-white min-h-screen w-full">
        <Header user={user} />
        <div className="flex flex-col md:flex-row">
          <div className="md:block hidden">
            <Sidebar active={active} setActive={setActive} />
          </div>
          <main className="flex-1 p-4 sm:p-6 md:p-10 rounded-none md:rounded-l-3xl bg-[#641E21] shadow-inner">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white font-semibold">Memuat data form penilaian...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Form Add Mode
  if (mode === "add") {
    return (
      <>
        <Add
          title="Buat Formulir Penilaian Baru"
          fields={formFields}
          image={formImage}
          onSubmit={handleCreateSubmit}
          onCancel={handleCancel}
          containerStyle={{ maxHeight: "600px" }}
          backgroundStyle={{ backgroundColor: "#641E21" }}
          maxTP={MAX_TP}
        />

        <SaveConfirmationModal
          isOpen={isConfirmSaveOpen}
          title="Konfirmasi Simpan"
          message="Apakah kamu yakin ingin menyimpan formulir penilaian ini?"
          onClose={() => setIsConfirmSaveOpen(false)}
          onSave={handleSaveConfirm}
          imageSrc={saveImg}
        />
      </>
    );
  }

  // Form Edit Mode
  if (mode === "edit" && selectedForm) {
    return (
      <>
        <Add
          title="Ubah Berkas Penilaian"
          fields={formFields}
          initialData={getEditInitialData()}
          image={editGrafik}
          onSubmit={handleEditSubmit}
          onCancel={handleCancel}
          containerStyle={{ maxHeight: "600px" }}
          backgroundStyle={{ backgroundColor: "#641E21" }}
          maxTP={MAX_TP}
        />

        <SaveConfirmationModal
          isOpen={isConfirmSaveOpen}
          title="Konfirmasi Simpan Perubahan"
          message="Apakah kamu yakin ingin menyimpan perubahan formulir ini?"
          onClose={() => setIsConfirmSaveOpen(false)}
          onSave={handleSaveConfirm}
          imageSrc={saveImg}
        />
      </>
    );
  }

  // Main List View
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar active={active} setActive={setActive} />

      <div className="flex flex-col flex-1">
        <Header user={user} />

        <main className="flex-1 p-6 bg-[#641E21] rounded-tl-3xl">
          {/* Header with Title and Export Button */}
          <div className="flex items-center mb-4 sm:mb-6 gap-1 w-full relative">
            <h2 className="text-white font-bold text-base sm:text-lg">
              Berkas Penilaian
            </h2>

            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setOpenExport(!openExport)}
                className="flex items-center gap-2 px-3 py-2 text-white !bg-transparent hover:bg-white/10 rounded-full"
              >
                <Download size={18} />
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <SearchBar
            query={searchTerm}
            setQuery={setSearchTerm}
            placeholder="Cari Berkas penilaian atau nomor sertifikat..."
            filters={[
              {
                label: "Status",
                value: filterStatus,
                options: statusOptions,
                onChange: setFilterStatus,
              },
            ]}
            onAddClick={handleCreateNew}
            className="mb-4 w-[100%]"
            addButtonText="Buat Berkas Baru"
          />

          {/* Table Section */}
          <div className="mt-10">
            {tableData.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <div className="flex flex-col items-center">
                  <img src={emptyStateImg} alt="Tidak ada data" className="w-48 h-48 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || filterStatus ? "Form tidak ditemukan" : "Belum ada form penilaian"}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterStatus 
                      ? "Coba gunakan kata kunci atau filter lain" 
                      : "Buat form penilaian pertama Anda"}
                  </p>
                  {!searchTerm && !filterStatus && (
                    <button
                      onClick={handleCreateNew}
                      className="inline-flex items-center px-4 py-2 bg-[#EC933A] text-white rounded-lg hover:bg-[#d67d2a]"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Buat Form Baru
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={paginatedData}
                  showEdit={false} 
                  showDelete={false}
                  renderActions={(row) => (
                    <div className="ml-10 -mr-15 flex items-center gap-2">
                      {/* Tombol Edit */}
                      <button
                        onClick={() => handleEdit(row.original)}
                        className="!bg-transparent p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Edit form"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {/* Tombol Aktifkan/Gunakan */}
                      <button
                        onClick={() => handleActivate(row.original)}
                        disabled={activatingId === row.id || row.original.is_active === true}
                        className={`inline-flex items-center px-3 py-1.5 rounded-md transition-colors border ${
                          row.original.is_active === true
                            ? '!bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : '!bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                        }`}
                        title={row.original.is_active === true ? "Form sedang aktif" : "Gunakan form ini"}
                      >
                        {activatingId === row.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-1"></div>
                            <span className="text-xs font-medium">Memproses...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            <span className="text-xs font-medium">
                              {row.original.is_active === true ? 'Aktif' : 'Gunakan'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                />

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
    </div>
  );
}