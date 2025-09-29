import axios from "../axiosInstance";

export const createIndustri = async (industriData) => {
  const res = await axios.post("/api/industri", industriData);
  return res.data; 
};