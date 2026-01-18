import axios from "../../axiosInstance";

/* ================= LIST INDUSTRI BIMBINGAN GURU ================= */
export const getGuruIndustri = async () => {
  try {
    const res = await axios.get("/api/pkl/guru/industri");
    return res.data;
  } catch (error) {
    console.error("Error fetching guru industri:", error);
    throw error;
  }
};

/* ================= LIST SISWA BIMBINGAN GURU ================= */
export const getGuruSiswa = async () => {
  try {
    const res = await axios.get("/api/pkl/guru/siswa");
    return res.data;
  } catch (error) {
    console.error("Error fetching guru siswa:", error);
    throw error;
  }
};

/* ================= LIST TASK GURU ================= */
export const getGuruTasks = async () => {
  try {
    const res = await axios.get("/api/pkl/guru/tasks");
    return res.data;
  } catch (error) {
    console.error("Error fetching guru tasks:", error);
    throw error;
  }
};
