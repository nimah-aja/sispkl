import React from "react";
import { AlertCircle } from "lucide-react";



export default function FloatingField({ label, value, onChange, type = "text", options = [], required = true,
  error, }) {
  
  return (
    <div className="relative">
      {/* SELECT */}
      {type === "select" ? (
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={`
            peer
            w-full
            rounded-xl
            px-4
            pt-2
            pb-1
            text-sm
            focus:outline-none
            focus:border-orange-400
            bg-white

            ${error
              ? " focus:border-red-500"
              : " focus:border-orange-400"}
          `}
        >

          className={`
            peer w-full rounded-xl px-4 pt-4 pb-2 text-sm bg-white
            focus:outline-none
            ${error
              ? " focus:border-red-500"
              : "focus:border-orange-400"}
          `}
          <option value="">-- Pilih --</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=" "
          className={`
            peer
            w-full
            rounded-xl
            px-4
            pt-2
            pb-1
            text-sm
            focus:outline-none
            focus:border-orange-400

            ${error
              ? "focus:border-red-500"
              : "focus:border-orange-400"}
          `}
        />
      )}

      <label
        className={`
          absolute
          left-4
          top-1/2
          -translate-y-4/2
          text-gray-400
          bg-white 
          text-md
          transition-all
          peer-placeholder-shown:top-3/2
          peer-placeholder-shown:text-md
          peer-focus:top-2
          peer-focus:text-xs
          peer-focus:text-orange-500
          peer-not-placeholder-shown:top-2
          peer-not-placeholder-shown:text-xs

           ${error ? "text-red-500" : "peer-focus:text-red-500"}
        `}
      >
        {label}
      </label>

      {/* TEKS ERROR */}
      {error && (
        <div className="absolute  top-13 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
