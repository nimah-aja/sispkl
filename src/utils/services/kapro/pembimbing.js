import axios from "../../axiosInstance";

export const getPembimbingPKL = async () => {
  const res = await axios.get("/api/pkl/pembimbing");

  const data =
    res.data?.data ||
    res.data ||
    [];

  // FORMAT FINAL UNTUK DROPDOWN
  return data.map((p) => ({
    label: p.nama,
    value: p.id, 
  }));
};

// Total guru pembimbing PKL
export const getTotalPembimbing = async () => {
  const list = await getPembimbingPKL();
  return list.length;
};

// Ambil list pembimbing PKL 
export const getPembimbingList = async () => {
  const res = await axios.get("/api/pkl/pembimbing");

  return res.data?.data || res.data || [];
};
