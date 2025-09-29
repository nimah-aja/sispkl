import axios from "../axiosInstance";

export const createGuru = async (guruData) => {
  const res = await axios.post("/api/guru", guruData);
  return res.data; 
};