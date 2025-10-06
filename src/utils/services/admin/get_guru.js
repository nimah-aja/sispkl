import axios from "../../axiosInstance";

export const getGuru = async () => {
  const res = await axios.get("/api/guru", {
    params: { page: 1, limit: 100 } 
  });

  const guruList = res.data.data.data;
  guruList.sort((a, b) => a.nama.localeCompare(b.nama));   //sort A-Z

  return guruList;
};
