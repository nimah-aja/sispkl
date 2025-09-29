import axios from "../axiosInstance";

// update jurusan berdasarkan ID
export const updateIndustri = async (id, data) => {
  const res = await axios.put(`/api/industri/${id}`, data);
  return res.data;
};
