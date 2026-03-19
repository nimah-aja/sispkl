import "react-datepicker/dist/react-datepicker.css";
import React, { useState, useRef, useMemo, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff, Calendar, X } from "lucide-react";
import DatePicker from "react-datepicker";
import { id } from "date-fns/locale";
import { format } from "date-fns";
import toast from "react-hot-toast";

// import assets
import addSidebar from "../../assets/addSidebar.svg";
import arrow from "../../assets/arrow.svg"; 
import cancelImg from "../../assets/cancel.svg";
import confirmSave from "../../assets/cancel.svg"; 
import silang from "../../assets/silang.svg"

// import components
import DeleteConfirmationModal from "../components/Cancel"; 
import SaveConfirmationModal from "../components/Save";

export default function Add({
  title,
  fields = [],
  onCancel,
  onSubmit,
  image,
  existingData = [],
  backgroundStyle = { backgroundColor: "#E1D6C4" },
  initialData = {},
  containerClassName = "w-full md:w-[1300px] max-h-screen bg-white",
  containerStyle = {},
  
  // Props khusus untuk penilaian
  isPenilaianForm = false,
  selectedItem = null,
  nilaiForm = {},
  onNilaiFormChange = null,
}) {
  const [modalText, setModalText] = useState({
    title: "Apakah Anda yakin untuk kembali?",
    subtitle: "Data yang sudah diisi akan terhapus."
  });

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isChanged, setIsChanged] = useState(false); 
  const isEditMode = Object.keys(initialData).length > 0; 
  const [fieldErrors, setFieldErrors] = useState({});
  const [focusedIdx, setFocusedIdx] = useState(null);
  const inputRefs = useRef([]);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedValues, setSelectedValues] = useState(initialData?.roles || [])
  const [dropdownState, setDropdownState] = useState({});
  const [searchQueries, setSearchQueries] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Date
  const DateInput = React.forwardRef(
    ({ value, onClick, onChange, placeholder, clearValue }, ref) => {
      const handleInputChange = (e) => {
        let input = e.target.value.replace(/\D/g, ""); 

        if (input.length > 8) input = input.slice(0, 8);

        let formatted = input;
        if (input.length > 4) {
          formatted =
            input.slice(0, 2) + "/" + input.slice(2, 4) + "/" + input.slice(4);
        } else if (input.length > 2) {
          formatted = input.slice(0, 2) + "/" + input.slice(2);
        }
        
        e.target.value = formatted;
        onChange(e); 
      };

      return (
        <div className="relative w-full">
          <input
            ref={ref}
            value={value}
            onChange={handleInputChange}
            onInvalid={(e) =>
              e.target.setCustomValidity("Gunakan format dd/MM/yyyy (contoh: 25/12/2025)")
            }
            onInput={(e) => e.target.setCustomValidity("")}
            placeholder={placeholder || "dd/MM/yyyy"}
            pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{4}$"
            title="Gunakan format dd/MM/yyyy (contoh: 25/12/2025)"
            className="min-w-[250px] w-full p-3 border rounded-lg focus:ring-2 focus:outline-none border-gray-300 focus:ring-orange-500 invalid:border-red-500"
          />

          {value ? (
            <X
              onClick={(e) => {
                e.preventDefault();
                clearValue();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 cursor-pointer"
            />
          ) : (
            <Calendar
              className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 cursor-pointer"
              onClick={onClick} 
            />
          )}
        </div>
      );
    }
  );

  // Fungsi untuk mendapatkan predikat berdasarkan nilai
  const getPredikat = (nilai) => {
    if (!nilai && nilai !== 0) return "";
    const skor = parseInt(nilai);
    if (skor < 75) return "Kurang";
    if (skor >= 75 && skor <= 85) return "Baik";
    if (skor >= 86 && skor <= 100) return "Sangat Baik";
    return "";
  };

  // Fungsi untuk mendapatkan status berdasarkan nilai
  const getStatus = (nilai) => {
    if (!nilai && nilai !== 0) return "";
    const skor = parseInt(nilai);
    if (skor < 75) return "Kurang";
    if (skor >= 75 && skor <= 85) return "Baik";
    if (skor >= 86 && skor <= 100) return "Sangat Baik";
    return "";
  };

  // Fungsi untuk mendapatkan deskripsi berdasarkan nilai dan aspek
  const getDeskripsiByNilai = (nilai, aspek) => {
    if (!nilai && nilai !== 0) return "";
    const skor = parseInt(nilai);
    
    const deskripsiAspek = {
      1: {
        kurang: "Peserta didik mampu menerapkan soft skill yang dimiliki dengan menunjukkan integritas (jujur, disiplin, komitmen, dan tanggung jawab), memiliki etos kerja, menunjukkan kemandirian, menunjukkan kerja sama, dan menunjukkan kepedulian sosial dan lingkungan dengan predikat kurang.",
        baik: "Peserta didik mampu menerapkan soft skill yang dimiliki dengan menunjukkan integritas (jujur, disiplin, komitmen, dan tanggung jawab), memiliki etos kerja, menunjukkan kemandirian, menunjukkan kerja sama, dan menunjukkan kepedulian sosial dan lingkungan dengan predikat baik.",
        sangatBaik: "Peserta didik mampu menerapkan soft skill yang dimiliki dengan menunjukkan integritas (jujur, disiplin, komitmen, dan tanggung jawab), memiliki etos kerja, menunjukkan kemandirian, menunjukkan kerja sama, dan menunjukkan kepedulian sosial dan lingkungan dengan predikat sangat baik."
      },
      2: {
        kurang: "Peserta didik mampu menerapkan norma, Prosedur Operasional Standar (POS), dan Kesehatan, Keselamatan Kerja, dan Lingkungan Hidup (K3LH) yang ditunjukkan dengan menggunakan APD dengan tertib dan benar, serta melaksanakan pekerjaan sesui POS dengan predikat kurang.",
        baik: "Peserta didik mampu menerapkan norma, Prosedur Operasional Standar (POS), dan Kesehatan, Keselamatan Kerja, dan Lingkungan Hidup (K3LH) yang ditunjukkan dengan menggunakan APD dengan tertib dan benar, serta melaksanakan pekerjaan sesui POS dengan predikat baik.",
        sangatBaik: "Peserta didik mampu menerapkan norma, Prosedur Operasional Standar (POS), dan Kesehatan, Keselamatan Kerja, dan Lingkungan Hidup (K3LH) yang ditunjukkan dengan menggunakan APD dengan tertib dan benar, serta melaksanakan pekerjaan sesui POS dengan predikat sangat baik."
      },
      3: {
        kurang: "Peserta didik mampu menerapkan kompetensi teknis yang sudah dipelajari di sekolah dan/atau baru dipelajari di dunia kerja (tempat PKL) dengan predikat kurang.",
        baik: "Peserta didik mampu menerapkan kompetensi teknis yang sudah dipelajari di sekolah dan/atau baru dipelajari di dunia kerja (tempat PKL) dengan predikat baik.",
        sangatBaik: "Peserta didik mampu menerapkan kompetensi teknis yang sudah dipelajari di sekolah dan/atau baru dipelajari di dunia kerja (tempat PKL) dengan predikat sangat baik."
      },
      4: {
        kurang: "Peserta didik mampu memahami alur bisnis dunia kerja tempat PKL dan wawasan wirausaha dengan predikat kurang.",
        baik: "Peserta didik mampu memahami alur bisnis dunia kerja tempat PKL dan wawasan wirausaha dengan predikat baik.",
        sangatBaik: "Peserta didik mampu memahami alur bisnis dunia kerja tempat PKL dan wawasan wirausaha dengan predikat sangat baik."
      }
    };
    
    if (skor < 75) return deskripsiAspek[aspek].kurang;
    if (skor >= 75 && skor <= 85) return deskripsiAspek[aspek].baik;
    if (skor >= 86 && skor <= 100) return deskripsiAspek[aspek].sangatBaik;
    return "";
  };

  // switch
  const initialSwitches = useMemo(() => {
    const obj = {};
    fields.forEach((f) => {
      if (f.type === "switch") {
        obj[f.name] = initialData[f.name] === "true" || false;
      }
    });
    return obj;
  }, [fields, initialData]);

  const [switchValues, setSwitchValues] = useState(initialSwitches);

  // refs untuk multiselect
  const multiRefs = useRef({});

  // update selectedValues saat initialData berubah (misal edit row)
  useEffect(() => {
    if (initialData?.roles) {
      setSelectedValues(initialData.roles);
    }
  }, [initialData]);

  // detect klik di luar multiselect
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        focusedIdx !== null &&
        multiRefs.current[focusedIdx] &&
        !multiRefs.current[focusedIdx].contains(event.target)
      ) {
        setFocusedIdx(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [focusedIdx]);

  const handleToggle = (name) => {
    setSwitchValues((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const toggleDropdown = (name) => {
    setDropdownState((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleSearchChange = (name, value) => {
    setSearchQueries((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleOption = (fieldName, value) => {
    setSelectedValues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Untuk penilaian form, kita perlu mengirim formData ke onSubmit
    if (isPenilaianForm && onSubmit) {
      const formData = new FormData(e.target);
      onSubmit(formData);
      return;
    }
    
    const formData = new FormData(e.target);
    const errors = {};

    fields.forEach((field) => {
      let value;
      if (field.type === "multiselect") {
        value = formData.getAll(field.name);
      } else {
        value = formData.get(field.name) || "";
      }

      const initialValue = initialData[field.name];
      if (
        (!value || (Array.isArray(value) && value.length === 0)) &&
        (initialValue === undefined || initialValue === "" || initialValue === null)
      ) {
        errors[field.name] = `Kolom ${field.label} harus diisi.`;
        return;
      }

      if (field.minLength && value.length < field.minLength) {
        errors[field.name] = `Kolom ${field.label} minimal ${field.minLength} karakter. Kurang ${
          field.minLength - value.length
        } karakter.`;
      }

      if (field.pattern && !field.pattern.test(value)) {
        errors[field.name] =
          field.errorMessage || `Format ${field.label} tidak sesuai.`;
      }

      if (
        field.unique &&
        existingData.some(
          (item) =>
            item[field.name] === value &&
            (!initialData || item.id !== initialData.id)
        )
      ) {
        errors[field.name] = `Kolom ${field.label} dengan nilai "${value}" sudah ada.`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (onSubmit) onSubmit(formData, setFieldErrors);
    setFieldErrors({});
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextInput = inputRefs.current[idx + 1];
      if (nextInput) {
        nextInput.focus();
      } else {
        document.getElementById("addForm").requestSubmit();
      }
    }
  };

  // state untuk date fields
  const [dateValues, setDateValues] = useState(
    fields.reduce((acc, f) => {
      if (f.type === "date") {
        acc[f.name] = initialData[f.name] ? new Date(initialData[f.name]) : null;
      }
      return acc;
    }, {})
  );

  // simpan label terpilih per field
  const [selectedLabels, setSelectedLabels] = useState(() => {
    const labels = {};
    fields.forEach((f) => {
      if (f.type === "select") {
        const initialLabel =
          f.options.find((opt) => opt.value === initialData[f.name])?.label || "";
        labels[f.name] = initialLabel;
      }
    });
    return labels;
  });

  const handleChange = (name, value) => {
    // update ke FormData saat submit
    const hiddenInput = document.querySelector(`input[name="${name}"]`);
    if (hiddenInput) {
      hiddenInput.value = value;
    } else {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      document.getElementById("addForm").appendChild(input);
    }
  };

  useEffect(() => {
    const form = document.getElementById("addForm");
    if (!form) return;

    const handleInput = () => {
      setIsChanged(true);
    };

    form.addEventListener("input", handleInput);
    return () => form.removeEventListener("input", handleInput);
  }, []);

  const handleCancelClick = () => {
    let title = "Apakah Anda yakin untuk kembali?";
    let subtitle = "Data yang sudah diisi akan terhapus.";

    if (!isEditMode && !isChanged) {
      title = "Kembali tanpa menambah data?";
      subtitle = "Anda belum mengisi data apapun.";
    } else if (!isEditMode && isChanged) {
      title = "Apakah Anda yakin ingin membatalkan penambahan data?";
      subtitle = "Data yang telah diisi akan hilang.";
    } else if (isEditMode && !isChanged) {
      title = "Kembali tanpa mengubah data?";
      subtitle = "Tidak ada perubahan yang akan disimpan.";
    } else if (isEditMode && isChanged) {
      title = "Apakah Anda yakin ingin membatalkan perubahan?";
      subtitle = "Perubahan yang telah Anda buat tidak akan disimpan.";
    }

    setModalText({ title, subtitle });
    setIsModalOpen(true);
  };

  const handleResetClick = () => {
    const form = document.getElementById("addForm");
    if (form) {
      form.reset();
    }

    setFieldErrors({});
    setSelectedValues(initialData?.roles || []);
    setSelectedLabels({});
    setDateValues(
      fields.reduce((acc, f) => {
        if (f.type === "date") acc[f.name] = null;
        return acc;
      }, {})
    );
    setSwitchValues(initialSwitches);
    setIsChanged(false);
  };

  // Fungsi untuk merender aspek penilaian secara dinamis
  const renderAspekPenilaian = () => {
    if (!selectedItem?.form_items || selectedItem.form_items.length === 0) {
      return null;
    }

    return selectedItem.form_items.map((item, index) => {
      const aspekNumber = index + 1;
      const fieldName = `skor_${aspekNumber}`;
      
      return (
        <div key={item.id} className="col-span-1 rounded-lg p-4">
          <h3 className="font-bold mb-3">
            Aspek Penilaian {aspekNumber}: {item.tujuan_pembelajaran}
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Nilai (0-100)</label>
                <input
                  type="number"
                  name={fieldName}
                  min="0"
                  max="100"
                  value={nilaiForm[fieldName] || ""}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '' || (Number(inputValue) >= 0 && Number(inputValue) <= 100)) {
                      onNilaiFormChange(fieldName, inputValue);
                      setIsChanged(true);
                    } else {
                      toast.error('Nilai harus antara 0 - 100');
                    }
                  }}
                  onBlur={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue !== '' && (Number(inputValue) < 0 || Number(inputValue) > 100)) {
                      toast.error('Nilai harus antara 0 - 100');
                      e.target.value = '';
                      onNilaiFormChange(fieldName, '');
                    }
                  }}
                  className="w-full p-3 !border !border-gray-300 rounded-lg !focus:ring-2 !focus:ring-[#641E21] focus:border-transparent"
                  placeholder="Masukkan nilai"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Predikat</label>
                <input
                  type="text"
                  value={nilaiForm[fieldName] ? getPredikat(nilaiForm[fieldName]) : ""}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                  placeholder="Otomatis"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Deskripsi</label>
              <textarea
                rows="3"
                value={nilaiForm[fieldName] ? getDeskripsiByNilai(nilaiForm[fieldName], aspekNumber) : ""}
                disabled
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                placeholder="Deskripsi akan terisi otomatis"
              />
            </div>
          </div>
        </div>
      );
    });
  };

  // Fungsi untuk merender field dari array fields
  const renderFieldFromArray = (field, idx) => {
    // Jika field adalah untuk industri, kita render sesuai dengan nilaiForm
    if (field.name === 'nama_pimpinan' || 
        field.name === 'jabatan_pimpinan' || 
        field.name === 'nip_pimpinan' || 
        field.name === 'jenis_nomor_pimpinan' || 
        field.name === 'jabatan_pembimbing' || 
        field.name === 'nip_pembimbing' || 
        field.name === 'jenis_nomor_pembimbing') {
      
      // Untuk field jenis nomor (pimpinan dan pembimbing) - UBAH JADI INPUT TEXT
      if (field.name === 'jenis_nomor_pimpinan' || field.name === 'jenis_nomor_pembimbing') {
        return (
          <div className="col-span-1">
            <label className="block mb-1 text-sm font-bold text-gray-700">
              {field.label}
            </label>
            <input
              type="text"
              name={field.name}
              value={nilaiForm[field.name] || ""}
              onChange={(e) => {
                onNilaiFormChange(field.name, e.target.value);
                setIsChanged(true);
              }}
              placeholder={field.placeholder || `Masukkan ${field.label}`}
              className="w-full p-3 !border !border-gray-300 rounded-lg !focus:ring-2 !focus:ring-[#641E21] focus:border-transparent"
            />
          </div>
        );
      }
      
      // Untuk field select lainnya (jika ada)
      if (field.type === "select") {
        return (
          <div className="col-span-1 relative">
            <label className="block mb-1 text-sm font-bold text-gray-700">
              {field.label}
            </label>
            <div className="relative w-full max-w-[600px]">
              {/* Trigger */}
              <div
                onClick={() => toggleDropdown(field.name)}
                className="cursor-pointer border border-[#C9CFCF] rounded-lg px-4 py-4 bg-white text-sm flex justify-between items-center"
              >
                {selectedLabels[field.name] || nilaiForm[field.name] || field.placeholder || `Pilih ${field.label}`}
                <img
                  src={arrow}
                  alt="arrow"
                  className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                    dropdownState[field.name] ? "rotate-180" : "rotate-0"
                  }`}
                />
              </div>

              {dropdownState[field.name] && (
                <div className="absolute left-0 right-0 mt-1 bg-white border-2 border-[#C9CFCF] rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                  {/* Input Search */}
                  <input
                    type="text"
                    placeholder={`Cari ${field.label}...`}
                    className="w-full px-3 py-2 border-b text-sm focus:outline-none"
                    value={searchQueries[field.name] || ""}
                    onChange={(e) => handleSearchChange(field.name, e.target.value)}
                  />

                  <ul className="max-h-48 overflow-y-auto">
                    {field.options
                      .filter((opt) =>
                        opt.label
                          .toLowerCase()
                          .includes((searchQueries[field.name] || "").toLowerCase())
                      )
                      .map((opt) => (
                        <li
                          key={opt.value}
                          onClick={() => {
                            onNilaiFormChange(field.name, opt.value);
                            setSelectedLabels((prev) => ({ ...prev, [field.name]: opt.label }));
                            setDropdownState((prev) => ({
                              ...prev,
                              [field.name]: false,
                            }));
                            handleSearchChange(field.name, "");
                          }}
                          className="px-4 py-2 cursor-pointer hover:bg-orange-50"
                        >
                          {opt.label}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      }
      
      // Untuk field text biasa (selain jenis nomor)
      return (
        <div className="col-span-1">
          <label className="block mb-1 text-sm font-bold text-gray-700">
            {field.label}
          </label>
          <input
            type={field.type || "text"}
            name={field.name}
            value={nilaiForm[field.name] || ""}
            onChange={(e) => {
              onNilaiFormChange(field.name, e.target.value);
              setIsChanged(true);
            }}
            placeholder={field.placeholder || ""}
            className="w-full p-3 !border !border-gray-300 rounded-lg !focus:ring-2 !focus:ring-[#641E21] focus:border-transparent"
          />
        </div>
      );
    }
    
    // Untuk field lain (jika ada)
    return null;
  };

  // Jika ini adalah form penilaian, render tampilan khusus
  if (isPenilaianForm && selectedItem && onNilaiFormChange) {
    const formItems = selectedItem.form_items || [];
    const itemCount = formItems.length;

    return (
      <div
        className="flex h-screen w-screen justify-center items-center p-4"
        style={backgroundStyle}
      >
        <div
          className={`flex flex-col rounded-2xl shadow-lg overflow-hidden ${containerClassName}`}
          style={containerStyle}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b flex-shrink-0">
            <div
              onClick={handleCancelClick}
              className="p-2 rounded-full bg-[#EC933A] hover:bg-orange-600 text-white cursor-pointer"
            >
              <ArrowLeft size={20} />
            </div>
            <h1 className="!text-2xl font-bold">{title}</h1>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Side - Image */}
            <div className="hidden md:flex w-1/2 items-center justify-center border-r p-4">
              <img
                src={image || addSidebar}
                alt="addSidebar"
                className="max-w-xs w-full h-auto object-contain"
              />
            </div>

            {/* Right Side - Form */}
            <div className="flex w-full md:w-1/2 p-5 pr-8 overflow-hidden">
              <form
                id="addForm"
                onSubmit={handleSubmit}
                className="w-full max-w-lg grid grid-cols-1 p-1 gap-4 overflow-y-auto"
                style={{ maxHeight: "100%" }}
              >
                {/* Informasi Form Penilaian */}
                <div className="col-span-1 p-3 bg-blue-50 rounded-lg mb-2">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">Form: </span>
                    {selectedItem?.form_nama || "Form Penilaian"}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Terdapat {itemCount} aspek penilaian yang harus diisi
                  </p>
                </div>

                {/* Informasi Siswa (Read-only) */}
                <div className="col-span-1 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-sm font-bold text-gray-700">Nama Siswa</label>
                      <input
                        type="text"
                        value={selectedItem?.nama || ""}
                        disabled
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-bold text-gray-700">NISN</label>
                      <input
                        type="text"
                        value={selectedItem?.nisn || ""}
                        disabled
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block mb-1 text-sm font-bold text-gray-700">Industri</label>
                    <input
                      type="text"
                      value={selectedItem?.industri || ""}
                      disabled
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                </div>

                {/* Render Aspek Penilaian Dinamis */}
                {renderAspekPenilaian()}

                {/* Catatan Akhir */}
                <div className="col-span-1 rounded-lg p-4">
                  <label className="block mb-1 text-sm font-medium text-gray-700">Catatan Akhir</label>
                  <textarea
                    name="catatan_akhir"
                    rows="4"
                    value={nilaiForm.catatan_akhir || ""}
                    onChange={(e) => {
                      onNilaiFormChange('catatan_akhir', e.target.value);
                      setIsChanged(true);
                    }}
                    className="w-full p-3 !border !border-gray-300 rounded-lg !focus:ring-2 !focus:ring-[#641E21] focus:border-transparent"
                    placeholder="Masukkan catatan akhir penilaian..."
                  />
                </div>

                {/* Separator Data Industri */}
                <div className="col-span-1 mt-2 mb-2">
                  <div className="border-t-2 border-gray-300 pt-4">
                    <h3 className="font-bold text-lg text-gray-800">DATA PIMPINAN DAN PEMBIMBING INDUSTRI</h3>
                  </div>
                </div>

                {/* Render field-field dari array fields */}
                {fields.map((field, idx) => renderFieldFromArray(field, idx))}
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4 flex justify-end gap-4 flex-shrink-0">
            <button
              type="button"
              onClick={handleCancelClick}
              className="button-radius"
              style={{
                "--btn-bg": "#3A3D3D",
                "--btn-active": "#5d6464ff",
                "--btn-text": "white",
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              form="addForm"
              className="button-radius"
              style={{
                "--btn-bg": "#EC933A",
                "--btn-active": "#f4d0adff",
                "--btn-text": "white",
              }}
            >
              {selectedItem?.hasItems ? 'Ubah' : 'Simpan'}
            </button>
          </div>

          {/* Modal Konfirmasi Kembali */}
          <DeleteConfirmationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onDelete={() => {
              setIsModalOpen(false);
              if (onCancel) onCancel();
            }}
            imageSrc={cancelImg}
            title={modalText.title}
            subtitle={modalText.subtitle}
          />
        </div>
      </div>
    );
  }

  // Render form biasa (existing code)
  return (
    <div
      className="flex h-screen w-screen justify-center items-center p-4"
      style={backgroundStyle}
    >
      <div
        className={`flex flex-col rounded-2xl shadow-lg overflow-hidden ${containerClassName}`}
        style={containerStyle}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b flex-shrink-0">
          <div
            onClick={handleCancelClick}
            className="p-2 rounded-full bg-[#EC933A] hover:bg-orange-600 text-white cursor-pointer"
          >
            <ArrowLeft size={20} />
          </div>
          <h1 className="!text-2xl font-bold">{title}</h1>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* kiri */}
          <div className="hidden md:flex w-1/2 items-center justify-center border-r p-4">
            <img
              src={image || addSidebar}
              alt="addSidebar"
              className="max-w-xs w-full h-auto object-contain"
            />
          </div>

          {/* kanan */}
          <div className="flex w-full md:w-1/2 p-15 overflow-hidden">
            <form
              id="addForm"
              onSubmit={handleSubmit}
              className="w-full max-w-lg grid grid-cols-1 md:grid-cols-2 p-1 gap-4 overflow-y-auto"
              style={{ maxHeight: "100%" }}
            >
              {fields.map((field, idx) => (
                <div
                  key={field.name}
                  className={field.width === "full" ? "col-span-2 relative" : "relative"}
                >
                  <label className="block mb-1 text-sm font-bold text-gray-700">
                    {field.label}
                  </label>

                  {field.type === "select" ? (
                    <div className="relative w-full max-w-[600px]">
                      {/* Trigger */}
                      <div
                        onClick={() => toggleDropdown(field.name)}
                        className="cursor-pointer border border-[#C9CFCF] rounded-lg px-4 py-4 bg-white text-sm flex justify-between items-center"
                      >
                        {selectedLabels[field.name] || `Pilih ${field.label}`}
                        <img
                          src={arrow}
                          alt="arrow"
                          className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                            dropdownState[field.name] ? "rotate-180" : "rotate-0"
                          }`}
                        />
                      </div>

                      {dropdownState[field.name] && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border-2 border-[#C9CFCF] rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                          {/* Input Search */}
                          <input
                            type="text"
                            placeholder={`Cari ${field.label}...`}
                            className="w-full px-3 py-2 border-b text-sm focus:outline-none"
                            value={searchQueries[field.name] || ""}
                            onChange={(e) => handleSearchChange(field.name, e.target.value)}
                          />

                          <ul className="max-h-48 overflow-y-auto">
                            {field.options
                              .filter((opt) =>
                                opt.label
                                  .toLowerCase()
                                  .includes((searchQueries[field.name] || "").toLowerCase())
                              )
                              .map((opt) => (
                                <li
                                  key={opt.value}
                                  onClick={() => {
                                    handleChange(field.name, opt.value);
                                    setSelectedLabels((prev) => ({ ...prev, [field.name]: opt.label }));
                                    setDropdownState((prev) => ({
                                      ...prev,
                                      [field.name]: false,
                                    }));
                                    handleSearchChange(field.name, "");
                                  }}
                                  className="px-4 py-2 cursor-pointer hover:bg-orange-50"
                                >
                                  {opt.label}
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : field.type === "switch" ? (
                    <div
                      onClick={() => handleToggle(field.name)}
                      className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition ${
                        switchValues[field.name] ? "bg-[#641E20]" : "bg-[#E1D6C4]"
                      }`}
                    >
                      <div
                        className={`bg-white w-6 h-6 rounded-full shadow-md transform transition ${
                          switchValues[field.name] ? "translate-x-6" : ""
                        }`}
                      />
                      <input
                        type="hidden"
                        name={field.name}
                        value={switchValues[field.name] ? "true" : "false"}
                      />
                    </div>
                  ) : field.type === "multiselect" ? (
                    <div className="relative" ref={(el) => (multiRefs.current[idx] = el)}>
                      <div
                        tabIndex={0}
                        className={`w-full p-3 border rounded-lg cursor-pointer bg-white flex flex-wrap gap-1 items-center ${
                          fieldErrors[field.name]
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-orange-500"
                        }`}
                        onClick={() => setFocusedIdx(focusedIdx === idx ? null : idx)}
                      >
                        {selectedValues.length > 0 ? (
                          selectedValues.map((val, i) => (
                            <div
                              key={i}
                              className=" pl-2 pb-1 flex items-center bg-[#651C23] text-white px-1 rounded-full text-sm"
                            >
                              {val}
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleOption(field.name, val);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.stopPropagation();
                                    toggleOption(field.name, val);
                                  }
                                }}
                                className="h-8 text-white font-bold hover:text-gray-700 flex items-center gap-2 cursor-pointer select-none pl-1 pr-1"
                              >
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-[#651C23] font-bold hover:text-gray-700 relative top-[2px]"> 
                                  <img src={silang} alt="hapus"/>
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400">
                            {field.placeholder || `Pilih ${field.label}`}
                          </span>
                        )}
                        
                        <img
                          src={arrow}
                          alt="arrow"
                          className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-transform duration-200 ${
                            focusedIdx === idx ? "rotate-180" : "rotate-0"
                          }`}
                        />
                      </div>

                      {selectedValues.map((val, i) => (
                        <input key={i} type="hidden" name={field.name} value={val} />
                      ))}

                      {focusedIdx === idx && (
                        <div className="absolute z-50 bg-white border-[#641E20] rounded-lg shadow-md mt-1 max-h-40 overflow-y-auto w-full">
                          {field.options?.map((opt, i) => {
                            const val = opt.value || opt;
                            const isChecked = selectedValues.includes(val);
                            return (
                              <label
                                key={i}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => toggleOption(field.name, val)}
                              >
                                <input
                                  className="accent-[#641E20]"
                                  type="checkbox"
                                  checked={isChecked}
                                  readOnly
                                />
                                {opt.label || opt}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : field.type === "textarea" ? (
                    <textarea
                      name={field.name}
                      rows={field.rows || 3}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      defaultValue={initialData[field.name] || ""}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:outline-none ${
                        fieldErrors[field.name]
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-orange-500"
                      }`}
                    />
                  ) : field.type === "password" ? (
                    <div className="relative w-full">
                      <input
                        name={field.name}
                        type={showPassword ? "text" : "password"}
                        ref={(el) => (inputRefs.current[idx] = el)}
                        defaultValue={initialData[field.name] || ""}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:outline-none ${
                          fieldErrors[field.name]
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-orange-500"
                        }`}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>
                  ) : field.type === "date" ? (
                    <div>
                      <DatePicker
                        selected={dateValues[field.name]}
                        onChange={(date) =>
                          setDateValues((prev) => ({ ...prev, [field.name]: date }))
                        }
                        className="min-w-[250px] w-full p-3 border rounded-lg focus:ring-2 focus:outline-none border-gray-300 focus:ring-orange-500"
                        calendarClassName=" w-[450px] !bg-white !text-black rounded-lg shadow-lg p-2"
                        dayClassName={() =>
                          "hover:!bg-[#EC933A] hover:!text-white rounded-full"
                        }
                        dateFormat="dd/MM/yyyy"
                        popperModifiers={[
                          {
                            name: "preventOverflow",
                            options: {
                              altAxis: true,
                              tether: false, 
                            },
                          },
                          {
                            name: "offset",
                            options: {
                              offset: [0, 10], 
                            },
                          },
                        ]}
                        withPortal
                        locale={id} 
                        placeholderText={field.placeholder || `Pilih ${field.label}`}
                        customInput={
                          <DateInput
                            clearValue={() =>
                              setDateValues((prev) => ({ ...prev, [field.name]: null }))
                            }
                          />
                        }
                        todayButton="Hari Ini"
                        popperPlacement="bottom-start"
                        renderCustomHeader={({ monthDate, decreaseMonth, increaseMonth }) => (
                          <div className="flex justify-between items-center px-4 py-2 bg-transparent border-b">
                            <button onClick={decreaseMonth} type="button" className="border-none outline-none 
                              focus:outline-none focus:ring-0 focus:ring-transparent hover:ring-0 text-orange-500 hover:text-orange-700 !bg-transparent">
                              ◀
                            </button>
                            <span className="font-bold text-black">
                              {format(monthDate, "MMMM yyyy", { locale: id })}
                            </span>
                            <button onClick={increaseMonth} type="button" className="border-none outline-none 
                              focus:outline-none focus:ring-0 focus:ring-transparent hover:ring-0 text-orange-500 hover:text-orange-700 !bg-transparent">
                              ▶
                            </button>
                          </div>
                        )}
                      />
                      {/* hidden input */}
                      <input
                        type="hidden"
                        name={field.name}
                        value={
                          dateValues[field.name]
                            ? dateValues[field.name].toISOString().split("T")[0]
                            : ""
                        }
                      />
                    </div>
                  ) : (
                    <input
                      name={field.name}
                      type={field.type || "text"}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      defaultValue={initialData[field.name] || ""}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:outline-none ${
                        fieldErrors[field.name]
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-orange-500"
                      }`}
                    />
                  )}

                  {fieldErrors[field.name] && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors[field.name]}</p>
                  )}
                </div>
              ))}
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-4 flex-shrink-0">
          <button
            type="button"
            onClick={handleResetClick} 
            className="button-radius"
            style={{
              "--btn-bg": "#3A3D3D",
              "--btn-active": "#5d6464ff",
              "--btn-text": "white",
            }}
          >
            Atur Ulang
          </button>

          <button
            type="button"
            onClick={() => {
              const form = document.getElementById("addForm");
              if (form) form.requestSubmit(); 
            }}
            className="button-radius"
            style={{
              "--btn-bg": "#EC933A",
              "--btn-active": "#f4d0adff",
              "--btn-text": "white",
            }}
          >
            Simpan
          </button>
        </div>

        <DeleteConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onDelete={() => {
            setIsModalOpen(false);
            if (onCancel) onCancel();
          }}
          imageSrc={cancelImg}
          title={modalText.title}
          subtitle={modalText.subtitle}
        />

        <SaveConfirmationModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onConfirm={() => {
            setIsSaveModalOpen(false);
            const form = document.getElementById("addForm");
            if (form) form.requestSubmit(); 
          }}
          imageSrc={confirmSave}
          title="Apakah Anda yakin ingin menyimpan data ini?"
          subtitle="Pastikan semua data sudah benar sebelum disimpan."
        />
      </div>
    </div>
  );
}