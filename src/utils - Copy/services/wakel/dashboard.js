import axios from "../../axiosInstance";

/**
 * GET Dashboard Wali Kelas
 */
export const getDashboardWaliKelas = async () => {
  try {
    const response = await axios.get(
      "/api/guru/dashboard/wali-kelas"
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching dashboard wali kelas:",
      error?.response || error
    );
    throw error;
  }
};
