// utils/api/lettersApi.js
import axios from "axios";

export const lettersApi = axios.create({
  baseURL: import.meta.env.VITE_SERTIF_API_URL,
  timeout: 90000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Generate Surat Tugas PDF
 * POST /api/v1/letters/surat-tugas
 */
export const generateSuratTugas = async (payload) => {
  const response = await lettersApi.post(
    "/api/v1/letters/surat-tugas",
    payload
  );
  return response.data;
};

/**
 * Generate Lembar Persetujuan PKL PDF
 * POST /api/v1/letters/lembar-persetujuan
 */
export const generateLembarPersetujuan = async (payload) => {
  const response = await lettersApi.post(
    "/api/v1/letters/lembar-persetujuan",
    payload
  );
  return response.data;
};

/**
 * Download generated PDF
 * GET /api/v1/letters/download/{filename}
 */
export const downloadGeneratedPDF = async (filename) => {
  const response = await lettersApi.get(
    `/api/v1/letters/download/${filename}`,
    { responseType: "blob" }
  );
  return response.data;
};

/**
 * Generate dan langsung download Surat Tugas
 */
export const generateAndDownloadSuratTugas = async (payload) => {
  try {
    // 1. Generate PDF
    const generateRes = await generateSuratTugas(payload);
    const { filename } = generateRes;
    
    if (!filename) throw new Error("Filename tidak ditemukan di response");
    
    // 2. Download PDF
    const blob = await downloadGeneratedPDF(filename);
    
    // 3. Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return filename;
  } catch (error) {
    console.error("Error generating/downloading PDF:", error);
    throw error;
  }
};

/**
 * Generate dan langsung download Lembar Persetujuan
 */
export const generateAndDownloadLembarPersetujuan = async (payload) => {
  try {
    // 1. Generate PDF
    const generateRes = await generateLembarPersetujuan(payload);
    const { filename } = generateRes;
    
    if (!filename) throw new Error("Filename tidak ditemukan di response");
    
    // 2. Download PDF
    const blob = await downloadGeneratedPDF(filename);
    
    // 3. Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return filename;
  } catch (error) {
    console.error("Error generating/downloading PDF:", error);
    throw error;
  }
};