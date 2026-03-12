import axiosInstance from "../../axiosInstance";

export const getIzinWaliKelas = async () => {
  try {
    const res = await axiosInstance.get("/api/izin/wali-kelas");
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};
