import axios from "../../axiosInstance";

export const getIndustriPreview = async () => {
  const res = await axios.get("/api/pkl/industri/preview");
  return res.data.data;
};

// Total industri PKL
export const getTotalIndustri = async () => {
  const list = await getIndustriPreview();
  return list.length;
};

export const updateIndustriQuota = (industriId, kuota) => {
  return axios.put(`/api/pkl/industri/${industriId}/quota`, {
    kuota_siswa: kuota,
  });
};
