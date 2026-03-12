// utils/services/admin/tahunAjaran.js
import axios from "../../axiosInstance";

/*  CREATE  */
export const createTahunAjaran = async (tahunData) => {
  const res = await axios.post("/api/tahun-ajaran", tahunData);
  return res.data;
};

/*  LIST ALL  */
export const getTahunAjaran = async () => {
  const res = await axios.get("/api/tahun-ajaran");
  return res.data;
};

/*  GET ACTIVE  */
export const getActiveTahunAjaran = async () => {
  const res = await axios.get("/api/tahun-ajaran/active");
  return res.data;
};

/*  GET BY ID  */
export const getTahunAjaranById = async (id) => {
  const res = await axios.get(`/api/tahun-ajaran/${id}`);
  return res.data;
};

/*  UPDATE  */
export const updateTahunAjaran = async (id, updatedData) => {
  const res = await axios.put(`/api/tahun-ajaran/${id}`, updatedData);
  return res.data;
};

/*  DELETE  */
export const deleteTahunAjaran = async (id) => {
  const res = await axios.delete(`/api/tahun-ajaran/${id}`);
  return res.data;
};

/*  ACTIVATE  */
export const activateTahunAjaran = async (id) => {
  const res = await axios.put(`/api/tahun-ajaran/${id}/activate`);
  return res.data;
};
