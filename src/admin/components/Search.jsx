import React, { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";

// import assets
import arrow from "../../assets/arrow.svg"; 
import add from "../../assets/add.svg";     

export default function SearchBar({
  query,
  setQuery,
  placeholder = "Pencarian",
  filters = [],              
  onAddClick,               
  className = "",            
}) {
  const [openIndex, setOpenIndex] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpenIndex(null); // tutup dropdown
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <div ref={wrapperRef}  className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Input Search */}
      <div className="relative flex-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="
            pl-10 pr-10 py-2 
            rounded-full 
            bg-white text-black text-sm 
            border-2 border-[#E1D6C4] 
            focus:outline-none focus:ring-2 focus:ring-[#E1D6C4]
            w-full
          "
        />
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-black" />
      </div>

      {/* Filter dropdowns */}
      {filters.map((f, i) => (
        <div key={i} className="relative">
          {/* Trigger */}
          <div
            tabIndex={0}
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="
              inline-flex items-center justify-between
              rounded-full 
              px-4 py-2
              bg-white text-black text-sm 
              border-2 border-[#E1D6C4] 
              focus:outline-none focus:ring-2 focus:ring-[#E1D6C4]
              w-auto min-w-[100px] max-w-[200px] truncate
            "
          >
            <span className="truncate">{f.value || f.label}</span>
            <img
              src={arrow}
              alt="arrow"
              className={`w-4 h-4 ml-2 transition-transform ${openIndex === i ? "rotate-180" : ""}`}
            />
          </div>


          {/* Dropdown */}
          {openIndex === i && (
            <div className="absolute left-0 mt-3 w-40 z-50">
              {/* Segitiga */}
              <div className="absolute -top-2 left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-white" />

              {/* Dropdown scrollable */}
              <div className="bg-white border-2 border-[#E1D6C4] rounded-lg shadow-md max-h-60 overflow-y-auto pt-2">
                <div className="flex flex-col p-2 space-y-1">
                  <label className="flex items-center gap-1 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name={`filter-${i}`}
                      value=""
                      checked={!f.value}
                      onChange={() => {
                        f.onChange("");
                        setOpenIndex(null);
                      }}
                      className="accent-[#641E21]"
                    />
                    Semua
                  </label>

                  {f.options.map((opt, idx) => (
                    <label key={idx} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name={`filter-${i}`}
                        value={opt}
                        checked={f.value === opt}
                        onChange={() => {
                          f.onChange(opt);
                          setOpenIndex(null);
                        }}
                        className="accent-[#641E21]"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      ))}

      {/* Tombol Add */}
      {onAddClick && (
        <div
          onClick={onAddClick}
          className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-full border-1 border-[#E1D6C4] active:border-[#E1D6C4] active:border-2">
          <img src={add} alt="add" />
        </div>
      )}
    </div>
  );
}
