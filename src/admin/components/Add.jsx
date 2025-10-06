import React, { useState, useRef, useMemo, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff, Calendar, X } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { id } from "date-fns/locale";
import { format } from "date-fns";

import addSidebar from "../../assets/addSidebar.svg";
import arrow from "../../assets/arrow.svg"; 

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
}) {

  const [fieldErrors, setFieldErrors] = useState({});
  const [focusedIdx, setFocusedIdx] = useState(null);
  const inputRefs = useRef([]);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedValues, setSelectedValues] = useState(initialData?.roles || [])
  const [searchQuery, setSearchQuery] = useState("");


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

  const toggleOption = (fieldName, value) => {
    setSelectedValues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const errors = {};

    // validasi tiap field
    fields.forEach((field) => {
      let value;
      if (field.type === "multiselect") {
        value = formData.getAll(field.name);
      } else {
        value = formData.get(field.name) || "";
      }

      if (!value || (Array.isArray(value) && value.length === 0)) {
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

  // state untuk custom select
const [open, setOpen] = useState(false);
// cari field select
const selectField = fields.find((f) => f.type === "select");

// cari label berdasarkan initialData
const initialSelectLabel = selectField
  ? selectField.options.find((opt) => opt.value === initialData[selectField.name])?.label || ""
  : "";

// state label untuk select
const [selectedLabel, setSelectedLabel] = useState(initialSelectLabel);


const handleChange = (name, value) => {
  // update ke FormData saat submit
  const hiddenInput = document.querySelector(`input[name="${name}"]`);
  if (hiddenInput) {
    hiddenInput.value = value;
  } else {
    // bikin hidden input kalau belum ada
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    document.getElementById("addForm").appendChild(input);
  }
};

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
            onClick={onCancel}
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
                        onClick={() => setOpen(!open)}
                        className="cursor-pointer border border-[#C9CFCF] rounded-lg px-4 py-4 bg-white text-sm flex justify-between items-center"
                      >
                        {selectedLabel || `Pilih ${field.label}`}
                        <img
                          src={arrow}
                          alt="arrow"
                          className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                            open ? "rotate-180" : "rotate-0"
                          }`}
                        />
                      </div>


                      {open && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border-2 border-[#C9CFCF] rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                          {/* 🔍 Input Search */}
                          <input
                            type="text"
                            placeholder={`Cari ${field.label}...`}
                            className="w-full px-3 py-2 border-b text-sm focus:outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />

                          <ul className="max-h-48 overflow-y-auto">
                            {field.options
                              .filter((opt) =>
                                opt.label.toLowerCase().includes(searchQuery.toLowerCase())
                              )
                              .map((opt) => (
                                <li
                                  key={opt.value}
                                  onClick={() => {
                                    handleChange(field.name, opt.value);
                                    setSelectedLabel(opt.label);
                                    setOpen(false);
                                    setSearchQuery(""); // reset setelah pilih
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
                              className="flex items-center bg-[#E1D6C4] font-bold text-[#641E20] px-1 rounded-full text-sm"
                            >
                              {val}
                              <button
                                type="button"
                                className="circle text-white font-bold hover:text-gray-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleOption(field.name, val);
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400">
                            {field.placeholder || `Pilih ${field.label}`}
                          </span>
                        )}
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
                                  className="accent-[#641E20] "
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
                  ): field.type === "date" ? (
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
                              tether: false, // biar popper bisa lepas dari container
                            },
                          },
                          {
                            name: "offset",
                            options: {
                              offset: [0, 10], // jarak dari input
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
                              focus:outline-none focus:ring-0 focus:ring-transparent hover:ring-0 text-orange-500 hover:text-orange-700">
                              ◀
                            </button>
                            <span className="font-bold text-black">
                              {format(monthDate, "MMMM yyyy", { locale: id })}
                            </span>
                            <button onClick={increaseMonth} type="button" className="border-none outline-none 
                              focus:outline-none focus:ring-0 focus:ring-transparent hover:ring-0 text-orange-500 hover:text-orange-700">
                              ▶
                            </button>
                          </div>
                        )}
                      />
                      {/* hidden input supaya ikut ke FormData */}
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
            onClick={onCancel}
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
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
