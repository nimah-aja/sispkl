import axios from "../../axiosInstance";

export const createSiswa = async (siswaData) => {
  const res = await axios.post("/api/siswa", siswaData);
  return res.data; 
};