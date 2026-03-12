import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (
      (i === currentPage - 2 && currentPage > 3) ||
      (i === currentPage + 2 && currentPage < totalPages - 2)
    ) {
      pages.push("...");
    }
  }

  return (
    <div className="flex justify-center items-center py-3">
      <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-[#EBEDF0] shadow-sm">
        {/* Tombol kiri */}
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`button_default p-2 bg-white text-gray-700 hover:text-black transition ${
            currentPage === 1 ? "opacity-40 cursor-default" : ""
          }`}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Angka */}
        {pages.map((num, idx) =>
          num === "..." ? (
            <span key={idx} className="px-2 text-gray-400 select-none">
              ...
            </span>
          ) : (
            <button
              key={idx}
              onClick={() => onPageChange(num)}
              className={` button_default w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition
                ${
                  num === currentPage
                    ? "text-black font-bold"
                    : "text-[#E1E3E7] hover:text-black"
                }`}
            >
              {num}
            </button>
          )
        )}

        {/* Tombol kanan */}
        <button
          onClick={() =>
            currentPage < totalPages && onPageChange(currentPage + 1)
          }
          disabled={currentPage === totalPages}
          className={`button_default p-2 rounded-full text-gray-700 hover:text-black transition ${
            currentPage === totalPages ? "opacity-40 cursor-default" : ""
          }`}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
