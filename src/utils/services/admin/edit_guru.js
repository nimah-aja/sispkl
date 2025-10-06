import axios from "../../axiosInstance";

// update guru berdasarkan ID
export const updateGuru = async (id, data) => {
  const res = await axios.put(`/api/guru/${id}`, data);
  return res.data;
};
