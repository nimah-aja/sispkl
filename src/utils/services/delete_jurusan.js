import axios from "../axiosInstance";

// delete jurusan berdasarkan ID
export const deleteJurusan = async (id) => {
  const res = await axios.delete(`/api/jurusan/${id}`);
  return res.data;
};
