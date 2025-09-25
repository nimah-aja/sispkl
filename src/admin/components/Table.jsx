import React, { useState,  useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";

//import asset
import trash from "../../assets/trash.svg";
import edit from "../../assets/edit.svg";

export default function Table({
  columns,
  data,
  showMore = false,
  showEdit = false,
  showDelete = false,
  onMoreClick = () => {},
  onEdit = () => {},
  onDelete = () => {},
  className = "",
  emptyText = "Data tidak ditemukan",
}) {
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const menuRef = useRef(null);

  // tutup menu saat klik di luar
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`rounded-xl mt-5 border-2 border-[#E1D6C4] ${className}`}
      style={{ maxHeight: "400px", overflowY: "auto" }}
    >
      <table className="min-w-full border-collapse">
        {/* table header */}
        <thead className="bg-white text-black border-b sticky top-0 z-10">
          <tr>
            {showMore && <th className="py-3 px-0 text-center bg-white"></th>}

            {columns.map((col, idx) => (
              <th key={idx} className="py-3 px-4 text-center bg-white">
                {col.label}
              </th>
            ))}
            {showEdit && (
              <th className="py-3 px-4 text-center bg-white">Edit</th>
            )}
            {showDelete && (
              <th className="py-3 px-4 text-center bg-white">Hapus</th>
            )}
          </tr>
        </thead>
        
        {/* table body */}
        <tbody>
          {data.length > 0 ? (
            data.map((row, i) => (
              <tr
                key={row.id || i}
                className="bg-white border-b hover:bg-orange-50 transition"
              >
                {/* Titik tiga */}
                {showMore && (
                  <td className="py-3 px-0 text-center relative">
                    <div
                      onClick={() =>
                        setOpenMenuIndex(openMenuIndex === i ? null : i)
                      }
                      className="cursor-pointer hover:opacity-70 inline-flex items-center justify-center"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-700" />
                    </div>

                    {/* Dropdown */}
                    {openMenuIndex === i && (
                      <div 
                        ref={menuRef}
                        className="absolute left-8 top-4 bg-white shadow-md rounded-md border border-[#E1D6C4] z-20 min-w-[150px]">
                        {/* segitiga pointer */}
                        <div className="absolute top-1 -left-2 w-0 h-0 
                          border-t-4 border-b-4 border-r-4 
                          border-t-transparent border-b-transparent border-r-[#E1D6C4]" />
                                        
                        <div
                          className="flex items-center gap-2 px-3 py-2 hover:bg-orange-50 cursor-pointer border-b-1 border-[#E1D6C4]"
                          onClick={() => {
                            onEdit(row);
                            setOpenMenuIndex(null);
                          }}
                        >
                          <img src={edit} alt="" className="w-4 h-4" />
                          <span className="text-sm">Edit data</span>
                        </div>
                        <div
                          className="flex items-center gap-2 px-3 py-2 hover:bg-orange-50 cursor-pointer"
                          onClick={() => {
                            onDelete(row);
                            setOpenMenuIndex(null);
                          }}
                        >
                          <img src={trash} alt="" className="w-4 h-4" />
                          <span className="text-sm">Hapus data</span>
                        </div>
                      </div>
                    )}
                  </td>
                )}

                {/* Isi kolom lainnya */}
                {columns.map((col, idx) => (
                  <td key={idx} className="py-3 px-4 text-center">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}

                {/* kolom edit dan hapus */}
                {showEdit && (
                  <td className="py-3 px-4 text-center">
                    <div
                      onClick={() => onEdit(row)}
                      className="hover:opacity-70"
                    >
                      <img src={edit} alt="Edit" className="w-6 h-6 mx-auto" />
                    </div>
                  </td>
                )}

                {showDelete && (
                  <td className="py-3 px-4 text-center">
                    <div
                      onClick={() => onDelete(row)}
                      className="hover:opacity-70"
                    >
                      <img src={trash} alt="Hapus" className="w-6 h-6 mx-auto" />
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={
                  columns.length +
                  (showMore ? 1 : 0) +
                  (showEdit ? 1 : 0) +
                  (showDelete ? 1 : 0)
                }
                className="text-center py-4 text-gray-500"
              >
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
