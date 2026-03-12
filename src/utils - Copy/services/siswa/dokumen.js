import axios from "../../axiosInstance";

/**
 * Upload dokumen bukti diterima untuk PKL
 * @param {number} applicationId - ID aplikasi PKL (application_id dari active/me atau id dari pengajuanMe)
 * @param {File[]} files - Array of file objects (max 3, max 5MB each)
 * @returns {Promise}
 */
export const uploadDokumenPKL = async (applicationId, files) => {
  try {
    const formData = new FormData();
    
    // Append each file with field name "files"
    files.forEach(file => {
      formData.append("files", file);
    });

    console.log(`Uploading to /api/pkl/${applicationId}/dokumen with ${files.length} files`);
    
    const response = await axios.post(`/api/pkl/${applicationId}/dokumen`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return response.data;
  } catch (error) {
    console.error("❌ uploadDokumenPKL error:", error);
    throw error?.response?.data || error;
  }
};

/**
 * Get dokumen URLs for a PKL application
 * @param {number} applicationId - ID aplikasi PKL
 * @returns {Promise}
 */
export const getDokumenPKL = async (applicationId) => {
  try {
    const response = await axios.get(`/api/pkl/${applicationId}/dokumen`);
    return response.data;
  } catch (error) {
    console.error("❌ getDokumenPKL error:", error);
    throw error?.response?.data || error;
  }
};