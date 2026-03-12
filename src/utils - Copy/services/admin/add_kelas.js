import axios from "../../axiosInstance";

export const createKelas = async (kelasData) => {
  const res = await axios.post("/api/kelas", kelasData);
  return res.data; 
};