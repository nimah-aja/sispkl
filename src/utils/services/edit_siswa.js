import axios from "../axiosInstance";

// update siswa berdasarkan ID
export const updateSiswa = async (id, data) => {
  const res = await axios.put(`/api/siswa/${id}`, data);
  return res.data;
};
