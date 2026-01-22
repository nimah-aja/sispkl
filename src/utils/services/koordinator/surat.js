import axios from 'axios';
import { API_URL } from '../config';

export const lettersApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Generate Lembar Persetujuan PKL PDF dan langsung download
 * POST /api/v1/letters/lembar-persetujuan
 */
export const generateAndDownloadLembarPersetujuan = async (payload) => {
  try {
    console.log("📤 Mengirim ke API /api/v1/letters/lembar-persetujuan");
    console.log("Payload:", JSON.stringify(payload, null, 2));
    
    // 1. Generate PDF
    const generateResponse = await lettersApi.post(
      "/api/v1/letters/lembar-persetujuan",
      payload
    );
    
    console.log("✅ Response generate:", generateResponse.data);
    
    // 2. Download PDF
    const filename = generateResponse.data.filename;
    if (!filename) {
      throw new Error("Filename tidak ditemukan di response");
    }
    
    console.log("📥 Filename untuk download:", filename);
    
    const downloadResponse = await lettersApi.get(
      `/api/v1/letters/download/${filename}`,
      { responseType: "blob" }
    );
    
    // 3. Download file ke browser
    const blob = new Blob([downloadResponse.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // 4. Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
    
    return filename;
    
  } catch (error) {
    console.error("❌ Error generateAndDownloadLembarPersetujuan:", error);
    
    // Tampilkan error detail
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      
      // Jika error validasi dari FastAPI
      if (error.response.data && error.response.data.detail) {
        const errorDetail = error.response.data.detail;
        if (Array.isArray(errorDetail)) {
          const errorMessages = errorDetail.map(err => 
            `${err.loc?.join('.')}: ${err.msg}`
          ).join('\n');
          throw new Error(`Validasi gagal:\n${errorMessages}`);
        } else if (typeof errorDetail === 'string') {
          throw new Error(errorDetail);
        }
      }
    }
    
    throw error;
  }
};

/**
 * Generate Surat Tugas PDF dan langsung download
 * POST /api/v1/letters/surat-tugas
 */
export const generateAndDownloadSuratTugas = async (payload) => {
  try {
    console.log("📤 Mengirim ke API /api/v1/letters/surat-tugas");
    console.log("Payload:", JSON.stringify(payload, null, 2));
    
    // 1. Generate PDF
    const generateResponse = await lettersApi.post(
      "/api/v1/letters/surat-tugas",
      payload
    );
    
    console.log("✅ Response generate:", generateResponse.data);
    
    // 2. Download PDF
    const filename = generateResponse.data.filename;
    if (!filename) {
      throw new Error("Filename tidak ditemukan di response");
    }
    
    const downloadResponse = await lettersApi.get(
      `/api/v1/letters/download/${filename}`,
      { responseType: "blob" }
    );
    
    // 3. Download file ke browser
    const blob = new Blob([downloadResponse.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // 4. Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
    
    return filename;
    
  } catch (error) {
    console.error("❌ Error generateAndDownloadSuratTugas:", error);
    
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    
    throw error;
  }
};