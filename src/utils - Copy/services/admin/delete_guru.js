import axios from "../../axiosInstance";

// delete guru berdasarkan ID
export const deleteGuru = async (id) => {
  const res = await axios.delete(`/api/guru/${id}`);
  return res.data;
};
