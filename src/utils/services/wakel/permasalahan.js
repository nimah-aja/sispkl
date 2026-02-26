import axios from "../../axiosInstance";

/**
 * GET - List student issues for wali kelas
 */
export const getStudentIssuesWaliKelas = async () => {
  try {
    const res = await axios.get("/api/student-issues/wali-kelas");
    return res.data;
  } catch (error) {
    console.error("Error fetching student issues (wali kelas):", error);
    throw error?.response?.data || error;
  }
};