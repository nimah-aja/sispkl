// utils/services/guru/exportPenilaianWali.js
import axiosInstance from "../../axiosInstance";

/**
 * Export Rekap Nilai Final Siswa (Wali Kelas)
 * GET /api/penilaian/wali/export
 */
export const exportPenilaianWali = async () => {
  try {
    const response = await axiosInstance.get("/api/penilaian/wali/export", {
      responseType: "blob", // penting untuk file download
    });

    // Membuat file download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", "rekap-nilai-wali.xlsx"); // nama file
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Error export penilaian wali:", error);
    throw error;
  }
};