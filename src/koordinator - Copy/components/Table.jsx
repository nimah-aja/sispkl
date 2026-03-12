import React, { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react"; 

// import assets
import trash from "../../assets/trash.svg";
import edit from "../../assets/edit.svg";
import arrow from "../../assets/arrow.svg";

export default function Table({
  columns,
  data,
  showMore = false,
  showEdit = false,
  showDelete = false,
  onEdit = () => {},
  onDelete = () => {},
  className = "",
  emptyText = "Data tidak ditemukan",
}) {
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [openMultiIndex, setOpenMultiIndex] = useState(null);
  const [multiPos, setMultiPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);
  const multiRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // tutup menu saat klik di luar
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuIndex(null);
      }
      if (multiRef.current && !multiRef.current.contains(event.target)) {
        setOpenMultiIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuClick = (e, i) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ x: rect.right + 8, y: rect.top });
    setOpenMenuIndex(openMenuIndex === i ? null : i);
  };

  const handleMultiClick = (e, i, idx) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMultiPos({ x: rect.left, y: rect.bottom + 4 });
    setOpenMultiIndex(openMultiIndex === `${i}-${idx}` ? null : `${i}-${idx}`);
  };

  // handle klik header untuk sorting
  const handleSort = (key, isNumeric) => {
    if (isNumeric) return; // skip kolom angka
    setSortConfig((prev) => {
      if (prev.key === key && prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      return { key, direction: "asc" };
    });
  };

  // fungsi sorting data
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      // Dorong "-" atau kosong ke bawah
      if ((aVal === "-" || aVal === "" || aVal == null) && (bVal !== "-" && bVal !== "" && bVal != null))
        return 1;
      if ((bVal === "-" || bVal === "" || bVal == null) && (aVal !== "-" && aVal !== "" && aVal != null))
        return -1;

      // Sorting angka
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      // Sorting string biasa
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data, sortConfig]);

  const isNumericColumn = (key, data) => typeof data?.[0]?.[key] === "number";

  // main
  return (
    <div
      className={`rounded-xl mt-5 border-2 border-[#E1D6C4] ${className}`}
      style={{ maxHeight: "400px", overflowY: "auto" }}
    >
      <table className="min-w-full border-collapse">
        {/* header */}
        <thead className="bg-white text-black border-b sticky top-0 z-10">
          <tr>
            {showMore && <th className="py-3 px-0 text-center bg-white"></th>}
            {columns.map((col, idx) => {
              const numeric = isNumericColumn(col.key, data);
              const isActive = sortConfig.key === col.key;
              const direction = sortConfig.direction;

              return (
                <th
                  key={idx}
                  onClick={() =>
                    col.sortable !== false && !numeric && handleSort(col.key, numeric)
                  } // hanya bisa sort kalau sortable !== false
                  className={`py-3 px-4 text-center bg-white ${
                    col.sortable === false ? "cursor-default" : "cursor-pointer select-none"
                  }`}
                >

                  <div className="flex items-center justify-center gap-1">
                    <span>{col.label}</span>
                    {!numeric && (
                      <>
                        {isActive && direction === "asc" && (
                          <ArrowUp size={14} />
                        )}
                        {isActive && direction === "desc" && (
                          <ArrowDown size={14} />
                        )}
                      </>
                    )}
                  </div>
                </th>
              );
            })}
            {showEdit && <th className="py-3 px-4 text-center bg-white">Ubah</th>}
            {showDelete && (
              <th className="py-3 px-4 text-center bg-white">Hapus</th>
            )}
          </tr>
        </thead>

        {/* body */}
        <tbody>
          {sortedData.length > 0 ? (
            sortedData.map((row, i) => (
              <tr
                key={row.id || i}
                className="bg-white border-b hover:bg-orange-50 transition"
              >
                {/* titik tiga */}
                {showMore && (
                  <td className="py-3 px-0 text-center relative">
                    <div
                      onClick={(e) => handleMenuClick(e, i)}
                      className="cursor-pointer hover:opacity-70 inline-flex items-center justify-center"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-700" />
                    </div>
                  </td>
                )}

                {/* isi kolom */}
                {columns.map((col, idx) => (
                  <td
                    key={idx}
                    className={`py-3 px-4 ${
                      col.align === "left"
                        ? "text-left"
                        : col.align === "right"
                        ? "text-right"
                        : "text-center"
                    }`}
                  >

                    {Array.isArray(row[col.key]) ? (
                      <div
                        onClick={(e) => handleMultiClick(e, i, idx)}
                        className="cursor-pointer inline-flex items-center justify-between
                          rounded-full border-2 border-[#E1D6C4]
                          px-4 py-2 text-sm bg-white
                          focus:outline-none focus:ring-2 focus:ring-[#E1D6C4]"
                      >
                        <span className="truncate">{row[col.key][0]}</span>
                        <img
                          src={arrow}
                          alt=""
                          className={`w-3 h-3 ml-2 transition-transform ${
                            openMultiIndex === `${i}-${idx}` ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    ) : col.render ? (
                      col.render(row[col.key], row)
                    ) : (
                      row[col.key]
                    )}
                  </td>
                ))}

                {showEdit && (
                  <td className="py-3 px-4 text-center">
                    <div onClick={() => onEdit(row)} className="hover:opacity-70">
                      <img src={edit} alt="Edit" className="w-6 h-6 mx-auto" />
                    </div>
                  </td>
                )}
                {showDelete && (
                  <td className="py-3 px-4 text-center">
                    <div onClick={() => onDelete(row)} className="hover:opacity-70">
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

      {/* dropdown titik tiga */}
      {openMenuIndex !== null && (
        <div
          ref={menuRef}
          className="fixed bg-white shadow-md rounded-md border border-[#E1D6C4] z-50 min-w-[150px]"
          style={{ top: menuPos.y, left: menuPos.x }}
        >
          <div
            className="absolute top-3 -left-2 w-0 h-0 
              border-t-4 border-b-4 border-r-4 
              border-t-transparent border-b-transparent border-r-[#E1D6C4]"
          />
          <div
            className="flex items-center gap-2 px-3 py-2 hover:bg-orange-50 cursor-pointer border-b border-[#E1D6C4]"
            onClick={() => {
              onEdit(data[openMenuIndex]);
              setOpenMenuIndex(null);
            }}
          >
            <img src={edit} alt="" className="w-4 h-4" />
            <span className="text-sm">Ubah data</span>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 hover:bg-orange-50 cursor-pointer"
            onClick={() => {
              onDelete(data[openMenuIndex]);
              setOpenMenuIndex(null);
            }}
          >
            <img src={trash} alt="" className="w-4 h-4" />
            <span className="text-sm">Hapus data</span>
          </div>
        </div>
      )}

      {/* dropdown multi select */}
      {openMultiIndex !== null && (
        <div
          ref={multiRef}
          className="fixed bg-white border-2 border-[#E1D6C4] rounded-lg shadow-md z-50 max-h-48 overflow-y-auto min-w-[160px]"
          style={{ top: multiPos.y, left: multiPos.x }}
        >
          <div
            className="absolute -top-2 left-4 w-0 h-0
              border-l-4 border-r-4 border-b-4
              border-l-transparent border-r-transparent border-b-[#E1D6C4]"
          />
          <div className="flex flex-col p-2 space-y-1 text-left">
            {data
              .flatMap((row, i) =>
                `${i}-${columns.findIndex((c) => Array.isArray(row[c.key]))}` ===
                openMultiIndex
                  ? row[columns.find((c) => Array.isArray(row[c.key])).key]
                  : []
              )
              .map((item, idx) => (
                <span
                  key={idx}
                  className="text-sm px-2 py-1 hover:bg-orange-50 rounded"
                >
                  {item}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
