import axios from "../../axiosInstance";

export const createJurusan = async (jurusanData) => {
  const res = await axios.post("/api/jurusan", jurusanData);
  return res.data; 
};